import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch'; // Asegúrate de tener node-fetch si usas una versión de Node < 18

// --- INICIALIZACIÓN DE CLIENTES ---
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
const supabaseAdmin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

// --- CONSTANTES Y DICCIONARIOS ---
const PUBG_API_KEY = process.env.PUBG_API_KEY;
const TWITCH_CLIENT_ID = process.env.TWITCH_CLIENT_ID;
const TWITCH_CLIENT_SECRET = process.env.TWITCH_CLIENT_SECRET;
const PLATFORM = "steam";
const PUBG_HEADERS = { "Authorization": `Bearer ${PUBG_API_KEY}`, "Accept": "application/vnd.api+json" };
const MAP_NAMES = {"Baltic_Main":"Erangel", "Chimera_Main":"Paramo", "Desert_Main":"Miramar", "DihorOtok_Main":"Vikendi", "Erangel_Main":"Erangel", "Heaven_Main":"Haven", "Kiki_Main":"Deston", "Range_Main":"Camp Jackal", "Savage_Main":"Sanhok", "Summerland_Main":"Karakin", "Tiger_Main":"Taego", "Neon_Main":"Rondo"};
const GAME_MODES = {"squad":"Squad", "squad-fpp":"Squad FPP", "duo":"Duo", "duo-fpp":"Duo FPP", "solo":"Solo", "solo-fpp":"Solo FPP"};
const MATCH_TYPES = {"ranked":"RANKED", "normal":"NORMAL", "competitive": "Ranked"};

// --- CACHÉ SIMPLE EN MEMORIA ---
let twitchToken = null;
let streamerMap = null;

// --- FUNCIONES HELPERS (Lógica de Twitch y PUBG replicada) ---

async function getTwitchToken() {
    if (twitchToken && twitchToken.expires_at > Date.now()) return twitchToken.access_token;
    const url = `https://id.twitch.tv/oauth2/token?client_id=${TWITCH_CLIENT_ID}&client_secret=${TWITCH_CLIENT_SECRET}&grant_type=client_credentials`;
    const response = await fetch(url, { method: 'POST' });
    const data = await response.json();
    twitchToken = { access_token: data.access_token, expires_at: Date.now() + (data.expires_in * 1000) };
    return twitchToken.access_token;
}

async function getStreamerMap() {
    if (streamerMap) return streamerMap;
    // Esta es una simplificación. En un caso real, esto vendría de una base de datos o un archivo de config.
    // Por ahora, asumimos que no hay un mapa de streamers dinámico en la API.
    streamerMap = {}; 
    return streamerMap;
}

async function getPlayerRankedStats(accountId, seasonId) {
    if (!accountId || !seasonId) return {};
    const url = `https://api.pubg.com/shards/${PLATFORM}/players/${accountId}/seasons/${seasonId}/ranked`;
    try {
        const response = await fetch(url, { headers: PUBG_HEADERS });
        if (!response.ok) return {};
        const data = await response.json();
        return data.data?.attributes?.rankedGameModeStats || {};
    } catch (e) { return {}; }
}

function formatRank(rankInfo, mode) {
    if (!rankInfo) return { rankName: "Unranked", rankPoints: 0 };
    const modeKey = mode.toLowerCase().replace(" ", "-");
    let rankedModeKey = "squad"; // default
    if (modeKey.includes("squad")) rankedModeKey = modeKey.includes("fpp") ? "squad-fpp" : "squad";
    else if (modeKey.includes("duo")) rankedModeKey = modeKey.includes("fpp") ? "duo-fpp" : "duo";
    else if (modeKey.includes("solo")) rankedModeKey = modeKey.includes("fpp") ? "solo-fpp" : "solo";
    
    const stats = rankInfo[rankedModeKey];
    if (stats && stats.currentTier?.tier) {
        return { rankName: `${stats.currentTier.tier} ${stats.currentTier.subTier}`, rankPoints: stats.currentRankPoint || 0 };
    }
    return { rankName: "Unranked", rankPoints: 0 };
}

// --- FUNCIÓN DE PROCESAMIENTO DE PARTIDA (El corazón de la lógica) ---

async function processSingleMatch(matchId, playerName, playerAccountId) {
    console.log(`[Processor] Starting full processing for match ${matchId} for player ${playerName}`);
    
    // 1. Obtener detalles de la partida
    const matchUrl = `https://api.pubg.com/shards/${PLATFORM}/matches/${matchId}`;
    const matchResponse = await fetch(matchUrl, { headers: PUBG_HEADERS });
    if (!matchResponse.ok) throw new Error(`Failed to fetch match details for ${matchId}`);
    const matchDetails = await matchResponse.json();

    const { data: matchData, included: matchIncluded } = matchDetails;
    const matchAttributes = matchData.attributes;

    // 2. Obtener Telemetría
    const telemetryAsset = matchIncluded.find(item => item.type === 'asset');
    if (!telemetryAsset) throw new Error("Telemetry not found");
    const telemetryResponse = await fetch(telemetryAsset.attributes.URL);
    const telemetryData = await telemetryResponse.json();

    // 3. Obtener Temporada Actual
    const seasonsResponse = await fetch(`https://api.pubg.com/shards/${PLATFORM}/seasons`, { headers: PUBG_HEADERS });
    const seasonsData = await seasonsResponse.json();
    const currentSeason = seasonsData.data.find(s => s.attributes.isCurrentSeason);
    const seasonId = currentSeason.id;

    // 4. Analizar Telemetría y Rosters
    let killerName = null, killerAccountId = null;
    const killsInfoRaw = [];
    const teammatesInfoRaw = [];

    const mainPlayerParticipant = matchIncluded.find(p => p.type === 'participant' && p.attributes.stats.name === playerName);
    if (!mainPlayerParticipant) throw new Error("Player not found in match participants");

    const mainPlayerRoster = matchIncluded.find(r => r.type === 'roster' && r.relationships.participants.data.some(p => p.id === mainPlayerParticipant.id));
    if (mainPlayerRoster) {
        const teammateParticipants = mainPlayerRoster.relationships.participants.data
            .map(p_ref => matchIncluded.find(p => p.type === 'participant' && p.id === p_ref.id))
            .filter(p => p && p.attributes.stats.name !== playerName);
        
        teammateParticipants.forEach(p => {
            teammatesInfoRaw.push({ name: p.attributes.stats.name, accountId: p.attributes.stats.playerId });
        });
    }

    for (const event of telemetryData) {
        if (event._T === 'LogPlayerKillV2' && event.killer && event.victim) {
            if (event.killer.name === playerName) {
                killsInfoRaw.push({ name: event.victim.name, accountId: event.victim.accountId });
            }
            if (event.victim.name === playerName) {
                killerName = event.killer.name;
                killerAccountId = event.killer.accountId;
            }
        }
    }

    // 5. Obtener todos los rangos en paralelo
    const accountsToGetRanks = [
        { type: 'player', data: { accountId: playerAccountId } },
        { type: 'killer', data: { accountId: killerAccountId } },
        ...teammatesInfoRaw.map(t => ({ type: 'teammate', data: t })),
        ...killsInfoRaw.map(k => ({ type: 'kill', data: k }))
    ];
    
    const rankPromises = accountsToGetRanks.map(item => item.data.accountId ? getPlayerRankedStats(item.data.accountId, seasonId) : Promise.resolve({}));
    const rankResults = await Promise.all(rankPromises);

    const playerRankInfo = rankResults[0];
    const killerRankInfo = rankResults[1];
    const teammatesRanks = rankResults.slice(2, 2 + teammatesInfoRaw.length);
    const killsRanks = rankResults.slice(2 + teammatesInfoRaw.length);

    // 6. Formatear el payload final para la BD
    const gameMode = GAME_MODES[matchAttributes.gameMode] || matchAttributes.gameMode;
    const playerRank = formatRank(playerRankInfo, gameMode);
    const killerRank = formatRank(killerRankInfo, gameMode);

    const teammates = teammatesInfoRaw.map((t, i) => ({ ...t, ...formatRank(teammatesRanks[i], gameMode) }));
    const kills_list = killsInfoRaw.map((k, i) => ({ ...k, ...formatRank(killsRanks[i], gameMode) }));

    const myStats = mainPlayerParticipant.attributes.stats;
    const matchDate = new Date(matchAttributes.createdAt).toLocaleString('es-ES', { timeZone: 'Europe/Madrid' });
    const matchType = MATCH_TYPES[matchAttributes.matchType] || matchAttributes.matchType;

    const finalPayload = {
        pubg_match_id: matchId,
        player_name: playerName,
        player_rank_name: playerRank.rankName,
        player_rank_points: playerRank.rankPoints,
        match_date: matchDate,
        match_type: `${matchType} - ${gameMode}`,
        match_map: MAP_NAMES[matchAttributes.mapName] || matchAttributes.mapName,
        killed_by: killerName,
        killer_rank_name: killerRank.rankName,
        killer_rank_points: killerRank.rankPoints,
        position: myStats.winPlace,
        kills: myStats.kills,
        assists: my_stats.assists,
        damage: Math.round(myStats.damageDealt),
        teammates: teammates,
        encounters: [], // La lógica de VODs de Twitch es demasiado compleja para replicarla aquí de forma segura.
        kills_list: kills_list,
        online_streamers: [], // Se omite por simplicidad y rendimiento.
        offline_streamers_count: 0
    };

    // 7. Guardar en la base de datos
    const { error: insertError } = await supabaseAdmin.from('matches').insert(finalPayload);
    if (insertError) {
        console.error("Error saving fully processed match to Supabase:", insertError);
        throw insertError;
    }
    
    console.log(`[Processor] Successfully processed and saved match ${matchId} for ${playerName}`);
    return finalPayload;
}


// --- FUNCIÓN PRINCIPAL DE LA API (Handler) ---
export default async function handler(req, res) {
  const { player } = req.query;

  if (!player) {
    return res.status(400).json({ error: 'Player name is required' });
  }

  try {
    // 1. INTENTAR OBTENER DATOS DE LA BASE DE DATOS (CACHÉ)
    const { data: cachedMatches, error: cacheError } = await supabase
      .from('matches')
      .select('*') // Seleccionamos todo
      .eq('player_name', player)
      .order('created_at', { ascending: false })
      .limit(10);

    if (cacheError) throw cacheError;

    // Si encontramos suficientes partidas (ej. 5), las devolvemos.
    if (cachedMatches && cachedMatches.length >= 5) {
      console.log(`[API] Cache hit for player: ${player}. Returning ${cachedMatches.length} matches.`);
      // Parsear campos JSON antes de devolver
      cachedMatches.forEach(m => {
          m.teammates = typeof m.teammates === 'string' ? JSON.parse(m.teammates) : m.teammates;
          m.encounters = typeof m.encounters === 'string' ? JSON.parse(m.encounters) : m.encounters;
          m.kills_list = typeof m.kills_list === 'string' ? JSON.parse(m.kills_list) : m.kills_list;
          m.online_streamers = typeof m.online_streamers === 'string' ? JSON.parse(m.online_streamers) : m.online_streamers;
      });
      return res.status(200).json(cachedMatches);
    }

    // 2. SI NO HAY DATOS (O MUY POCOS), VAMOS A LA API DE PUBG PARA PROCESAMIENTO COMPLETO
    console.log(`[API] Cache miss or insufficient data for ${player}. Fetching from PUBG API...`);

    const playerResponse = await fetch(`https://api.pubg.com/shards/steam/players?filter[playerNames]=${player}`, { headers: PUBG_HEADERS });
    if (!playerResponse.ok) throw new Error(`Could not find player ${player} in PUBG API.`);
    
    const playerData = await playerResponse.json();
    if (!playerData.data || playerData.data.length === 0) {
        return res.status(200).json([]);
    }

    const playerAccount = playerData.data[0];
    const playerAccountId = playerAccount.id;
    const matchIds = playerAccount.relationships.matches.data.slice(0, 5).map(m => m.id);

    // Procesar cada partida que no esté ya en nuestra caché
    const existingMatchIds = new Set(cachedMatches.map(m => m.pubg_match_id));
    const matchesToProcessIds = matchIds.filter(id => !existingMatchIds.has(id));

    console.log(`[API] Found ${matchIds.length} recent matches. Need to process ${matchesToProcessIds.length} new ones.`);

    const processingPromises = matchesToProcessIds.map(matchId => 
        processSingleMatch(matchId, player, playerAccountId).catch(e => {
            console.error(`[API] Failed to process match ${matchId}:`, e.message);
            return null; // Devolver null si una partida falla para no romper todo
        })
    );

    const newlyProcessedMatches = (await Promise.all(processingPromises)).filter(Boolean); // Filtra los nulos

    // Combinar partidas de la caché con las recién procesadas
    const allMatches = [...cachedMatches, ...newlyProcessedMatches].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    return res.status(200).json(allMatches);

  } catch (error) {
    console.error('[API] Handler error:', error.message);
    return res.status(500).json({ error: "An internal server error occurred." });
  }
}
