import { createClient } from '@supabase/supabase-js';

// --- INICIALIZACIÓN DE CLIENTES ---
// Cliente público (anon) para leer datos respetando RLS
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Cliente de Admin (service_role) para escribir en la BD, ignorando RLS
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// --- CONSTANTES Y HELPERS ---
const PUBG_API_KEY = process.env.PUBG_API_KEY;
const PUBG_HEADERS = {
  "Authorization": `Bearer ${PUBG_API_KEY}`,
  "Accept": "application/vnd.api+json"
};
const MAP_NAMES = {"Baltic_Main":"Erangel", "Chimera_Main":"Paramo", "Desert_Main":"Miramar", "DihorOtok_Main":"Vikendi", "Erangel_Main":"Erangel", "Heaven_Main":"Haven", "Kiki_Main":"Deston", "Range_Main":"Camp Jackal", "Savage_Main":"Sanhok", "Summerland_Main":"Karakin", "Tiger_Main":"Taego", "Neon_Main":"Rondo"};

// --- FUNCIÓN PRINCIPAL DE LA API ---
export default async function handler(req, res) {
  const { player } = req.query;

  if (!player) {
    return res.status(400).json({ error: 'Player name is required' });
  }

  try {
    // 1. INTENTAMOS OBTENER DATOS DE NUESTRA BASE DE DATOS (CACHÉ)
    const { data: cachedMatches, error: cacheError } = await supabase
      .from('matches')
      .select('*, teammates::text, encounters::text, kills_list::text, online_streamers::text')
      .eq('player_name', player)
      .order('created_at', { ascending: false });

    if (cacheError) throw cacheError;

    // 2. SI ENCONTRAMOS DATOS, LOS DEVOLVEMOS DIRECTAMENTE
    if (cachedMatches && cachedMatches.length > 0) {
      console.log(`Cache hit for player: ${player}. Returning ${cachedMatches.length} matches.`);
      return res.status(200).json(cachedMatches);
    }

    // 3. SI NO HAY DATOS, VAMOS A LA API DE PUBG
    console.log(`Cache miss for player: ${player}. Fetching from PUBG API...`);

    // 3.1 Obtener ID del jugador y sus últimas 5 partidas
    const playerResponse = await fetch(`https://api.pubg.com/shards/steam/players?filter[playerNames]=${player}`, { headers: PUBG_HEADERS });
    if (!playerResponse.ok) throw new Error(`Could not find player ${player} in PUBG API.`);
    
    const playerData = await playerResponse.json();
    if (!playerData.data || playerData.data.length === 0) {
        return res.status(200).json([]); // Devuelve vacío si el jugador no existe en PUBG
    }

    const playerAccount = playerData.data[0];
    const matchIds = playerAccount.relationships.matches.data.slice(0, 5).map(m => m.id);

    // 3.2 Obtener detalles de cada partida
    const matchDetailPromises = matchIds.map(id => 
        fetch(`https://api.pubg.com/shards/steam/matches/${id}`, { headers: PUBG_HEADERS }).then(res => res.json())
    );
    const matchDetailsList = await Promise.all(matchDetailPromises);

    // 3.3 Procesar y formatear los datos para nuestra base
    const matchesToInsert = [];
    for (const matchDetail of matchDetailsList) {
        const participant = matchDetail.included.find(
            item => item.type === 'participant' && item.attributes.stats.name === playerAccount.attributes.name
        );
        if (!participant) continue;

        const stats = participant.attributes.stats;
        const matchDate = new Date(matchDetail.data.attributes.createdAt).toLocaleString('es-ES', { timeZone: 'Europe/Madrid' });

        const payload = {
            pubg_match_id: matchDetail.data.id,
            player_name: playerAccount.attributes.name,
            player_rank_name: 'Unranked', // La API no da el rango en el objeto de partida
            player_rank_points: 0,
            match_date: matchDate,
            match_type: matchDetail.data.attributes.matchType,
            match_map: MAP_NAMES[matchDetail.data.attributes.mapName] || matchDetail.data.attributes.mapName,
            position: stats.winPlace,
            kills: stats.kills,
            assists: stats.assists,
            damage: Math.round(stats.damageDealt),
            // Dejamos estos campos vacíos porque requerirían un análisis de telemetría muy lento
            killed_by: null, 
            teammates: [],
            encounters: [],
            kills_list: [],
            online_streamers: [],
            offline_streamers_count: 0
        };
        matchesToInsert.push(payload);
    }

    // 4. GUARDAMOS LOS NUEVOS DATOS EN NUESTRA BASE DE DATOS
    if (matchesToInsert.length > 0) {
        const { error: insertError } = await supabaseAdmin.from('matches').insert(matchesToInsert);
        if (insertError) {
            console.error("Error saving new matches to Supabase:", insertError);
            // No lanzamos un error, simplemente devolvemos lo que tenemos
        } else {
            console.log(`Successfully inserted ${matchesToInsert.length} new matches for ${player}.`);
        }
    }
    
    // 5. DEVOLVEMOS LOS DATOS RECIÉN OBTENIDOS
    return res.status(200).json(matchesToInsert);

  } catch (error) {
    console.error('Handler error:', error.message);
    return res.status(500).json({ error: error.message });
  }
}
