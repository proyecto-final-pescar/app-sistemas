// server/src/controllers/placesController.js

const GOOGLE_PLACES_BASE_URL = 'https://maps.googleapis.com/maps/api/place';

// GET /api/places/autocomplete?input=...
// Devuelve sugerencias de direcciones a medida que el usuario escribe.
export const autocomplete = async (req, res) => {
  try {
    const { input } = req.query;

    if (!input || !input.trim()) {
      return res.status(400).json({ message: 'El parámetro input es requerido' });
    }

    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      console.error('GOOGLE_MAPS_API_KEY no está configurada en el servidor');
      return res.status(500).json({ message: 'Error de configuración del servidor' });
    }

    const url = `${GOOGLE_PLACES_BASE_URL}/autocomplete/json?input=${encodeURIComponent(input)}&key=${apiKey}&language=es&components=country:ar`;

    const googleRes = await fetch(url);
    const data = await googleRes.json();

    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      console.error('Error de Google Places (autocomplete):', data.status, data.error_message);
      return res.status(502).json({ message: 'Error al consultar Google Places', detalle: data.status });
    }

    return res.status(200).json({ predictions: data.predictions || [] });
  } catch (error) {
    console.error('Error en GET /api/places/autocomplete:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// GET /api/places/details?place_id=...
// Devuelve el detalle de un lugar puntual, incluyendo lat/lng.
export const details = async (req, res) => {
  try {
    const { place_id } = req.query;

    if (!place_id || !place_id.trim()) {
      return res.status(400).json({ message: 'El parámetro place_id es requerido' });
    }

    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      console.error('GOOGLE_MAPS_API_KEY no está configurada en el servidor');
      return res.status(500).json({ message: 'Error de configuración del servidor' });
    }

    const url = `${GOOGLE_PLACES_BASE_URL}/details/json?place_id=${encodeURIComponent(place_id)}&key=${apiKey}&language=es&fields=geometry,formatted_address`;

    const googleRes = await fetch(url);
    const data = await googleRes.json();

    if (data.status !== 'OK') {
      console.error('Error de Google Places (details):', data.status, data.error_message);
      return res.status(502).json({ message: 'Error al consultar Google Places', detalle: data.status });
    }

    return res.status(200).json({ result: data.result });
  } catch (error) {
    console.error('Error en GET /api/places/details:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};