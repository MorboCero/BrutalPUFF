import { createClient } from '@supabase/supabase-js';

// Inicializa el cliente de Supabase.
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  // 1. Obtiene la ID de la partida desde la URL (ej: /api/getMatch?id=123)
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'Match ID is required' });
  }

  try {
    // 2. Consulta la tabla 'matches' en Supabase buscando la fila con esa ID.
    const { data, error } = await supabase
      .from('matches')
      .select('*') // Selecciona todas las columnas
      .eq('id', id)  // Donde la columna 'id' sea igual a la ID recibida
      .single(); // Esperamos solo un resultado

    if (error) {
      throw error;
    }

    if (data) {
      // 3. Si se encuentran datos, los devuelve como JSON.
      return res.status(200).json(data);
    } else {
      return res.status(404).json({ error: 'Match not found' });
    }
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
