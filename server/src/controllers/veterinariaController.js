import Veterinaria from '../models/Veterinaria.js';

export const buscarVeterinarias = async (req, res) => {
  try {
    const lat = Number(req.query.lat);
    const lng = Number(req.query.lng);
    const radio = req.query.radio === undefined ? 5000 : Number(req.query.radio);

    if (req.query.lat === undefined || req.query.lng === undefined) {
      return res.status(400).json({ message: 'lat y lng son requeridos' });
    }

    if (!Number.isFinite(lat) || !Number.isFinite(lng) || !Number.isFinite(radio)) {
      return res.status(400).json({ message: 'lat, lng y radio deben ser números válidos' });
    }

    if (radio <= 0) {
      return res.status(400).json({ message: 'radio debe ser mayor a 0' });
    }

    const veterinarias = await Veterinaria.find({
      estado: 'activa',
      coordenadas: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [lng, lat],
          },
          $maxDistance: radio,
        },
      },
    });

    return res.status(200).json(veterinarias);
  } catch (error) {
    console.error('Error en GET /veterinarias/buscar:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};
