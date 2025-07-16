import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'Match ID is required' });
  }

  try {
    const { data, error } = await supabase
      .from('matches')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      // Si Supabase devuelve un error (ej. RLS), lo registramos
      console.error('Supabase error:', error);
      throw error;
    }

    if (data) {
      return res.status(200).json(data);
    } else {
      return res.status(404).json({ error: 'Match not found' });
    }
  } catch (error) {
    // Si hay un error general en la función, lo registramos
    console.error('Handler error:', error);
    return res.status(500).json({ error: error.message });
  }
}
