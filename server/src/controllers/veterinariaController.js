import Veterinaria from '../models/Veterinaria.js';

export const buscarVeterinarias = async (req, res) => {
  try {
    if (req.query.lat === undefined || req.query.lng === undefined) {
      return res.status(400).json({ message: 'lat y lng son requeridos' });
    }

    const lat = Number(req.query.lat);
    const lng = Number(req.query.lng);
    const radio = req.query.radio === undefined ? 5000 : Number(req.query.radio);

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

    return res.status(200).json({ success: true, data: veterinarias });
  } catch (error) {
    console.error('Error en GET /veterinarias/buscar:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};
// GET /veterinarias: devuelve todas las veterinarias activas (público)
export const obtenerVeterinarias = async (req, res) => {
    try {
        const veterinarias = await Veterinaria.find({ estado: 'activa' });

        res.status(200).json({
            success: true,
            data: veterinarias
        });

    } catch (error) {
        console.error('Error en GET /veterinarias:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
};

// GET /veterinarias/:id: devuelve el detalle completo de una veterinaria (público)
export const obtenerVeterinariaPorId = async (req, res) => {
    try {
        const { id } = req.params;

        const veterinaria = await Veterinaria.findById(id);

        if (!veterinaria) {
            return res.status(404).json({ message: 'El recurso no existe.' });
        }

        res.status(200).json({
            success: true,
            data: veterinaria
        });

    } catch (error) {
        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'El id de la veterinaria no es válido' });
        }
        console.error('Error en GET /veterinarias/:id:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
};

// POST /veterinarias: crea el perfil de una veterinaria (solo rol 'veterinaria')
export const crearVeterinaria = async (req, res) => {
    try {
        const usuarioId = req.user.id;

        const nuevaVeterinaria = new Veterinaria({
            ...req.body,
            usuarioId
        });

        const veterinariaGuardada = await nuevaVeterinaria.save();

        res.status(201).json({
            success: true,
            data: veterinariaGuardada
        });

    } catch (error) {
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: 'Datos inválidos' });
        }
        console.error('Error en POST /veterinarias:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
};

// PUT /veterinarias/:id: edita una veterinaria (dueño o admin)
export const actualizarVeterinaria = async (req, res) => {
    try {
        const { id } = req.params;
        const usuarioId = req.user.id;
        const esAdmin = req.user.rol === 'administrador';

        const veterinaria = await Veterinaria.findById(id);

        if (!veterinaria) {
            return res.status(404).json({ message: 'El recurso no existe.' });
        }

        if (veterinaria.usuarioId.toString() !== usuarioId && !esAdmin) {
            return res.status(403).json({ message: 'No tenés permisos para realizar esta acción.' });
        }

        Object.assign(veterinaria, req.body);
        const veterinariaActualizada = await veterinaria.save();

        res.status(200).json({
            success: true,
            data: veterinariaActualizada
        });

    } catch (error) {
        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'El id de la veterinaria no es válido' });
        }
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: 'Datos inválidos' });
        }
        console.error('Error en PUT /veterinarias/:id:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
};