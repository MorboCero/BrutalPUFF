import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  const { pubg_id, player_name } = req.query;

  if (!pubg_id || !player_name) {
    return res.status(400).json({ error: 'PUBG Match ID and Player Name are required' });
  }

  try {
    // ### CAMBIO CLAVE: Forzamos que los campos JSON se traten como texto ###
    const { data, error } = await supabase
      .from('matches')
      .select('*, teammates::text, encounters::text, kills_list::text, online_streamers::text')
      .eq('pubg_match_id', pubg_id)
      .eq('player_name', player_name)
      .single();

    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }

    if (data) {
      // Parseamos el texto de vuelta a JSON antes de enviarlo
      data.teammates = JSON.parse(data.teammates || '[]');
      data.encounters = JSON.parse(data.encounters || '[]');
      data.kills_list = JSON.parse(data.kills_list || '[]');
      data.online_streamers = JSON.parse(data.online_streamers || '[]');
      return res.status(200).json(data);
    } else {
      return res.status(404).json({ error: 'Match not found for this player' });
    }
  } catch (error) {
    console.error('Handler error:', error);
    return res.status(500).json({ error: error.message });
  }
}
