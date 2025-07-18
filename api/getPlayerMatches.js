import { createClient } from '@supabase/supabase-js';

// Cliente público para leer datos
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Cliente de ADMIN para poder escribir en la base de datos
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export default async function handler(req, res) {
  const { player } = req.query;

  if (!player) {
    return res.status(400).json({ error: 'Player name is required' });
  }

  try {
    // 1. Intentamos obtener los datos de nuestra base de datos (caché)
    const { data: cachedMatches, error: cacheError } = await supabase
      .from('matches')
      .select('*')
      .eq('player_name', player)
      .order('created_at', { ascending: false });

    if (cacheError) throw cacheError;

    // 2. Si encontramos datos, los devolvemos directamente
    if (cachedMatches && cachedMatches.length > 0) {
      console.log(`Cache hit for player: ${player}. Returning ${cachedMatches.length} matches.`);
      return res.status(200).json(cachedMatches);
    }

    // 3. Si no hay datos, vamos a la API de PUBG
    console.log(`Cache miss for player: ${player}. Fetching from PUBG API...`);
    
    // Esta parte es una simplificación. En un proyecto real, aquí replicarías
    // la lógica de tu bot de Python para obtener las últimas 5 partidas,
    // procesar la telemetría, y guardarlas en Supabase usando 'supabaseAdmin'.
    // Como eso es muy complejo de replicar aquí, devolvemos un array vacío
    // para indicar a la web que los datos se están procesando en segundo plano.
    
    // El bot de monitoreo se encargará de rellenar los datos eventualmente.
    
    return res.status(200).json([]);

  } catch (error) {
    console.error('Handler error:', error);
    return res.status(500).json({ error: error.message });
  }
}
