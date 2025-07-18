import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  // Leemos el nombre del jugador desde la URL
  const { player } = req.query;

  if (!player) {
    return res.status(400).json({ error: 'Player name is required' });
  }

  try {
    // Buscamos TODAS las partidas de ese jugador
    const { data, error } = await supabase
      .from('matches')
      .select('*')
      .eq('player_name', player)
      .order('created_at', { ascending: false }); // Ordenamos por fecha, la más nueva primero

    if (error) {
      throw error;
    }

    return res.status(200).json(data);

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
