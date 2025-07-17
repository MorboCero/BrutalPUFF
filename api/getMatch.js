// Forzando un redespliegue para recargar las variables de entorno.
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  const { pubg_id } = req.query;

  if (!pubg_id) {
    return res.status(400).json({ error: 'PUBG Match ID is required' });
  }

  try {
    const { data, error } = await supabase
      .from('matches')
      .select('*')
      .eq('pubg_match_id', pubg_id)
      .single();

    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }

    if (data) {
      return res.status(200).json(data);
    } else {
      return res.status(404).json({ error: 'Match not found' });
    }
  } catch (error) {
    console.error('Handler error:', error);
    return res.status(500).json({ error: error.message });
  }
}
