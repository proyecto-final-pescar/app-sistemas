import mongoose from 'mongoose';
import Resenia from '../models/Resenia.js';
import Veterinaria from '../models/Veterinaria.js';

// POST /veterinarias/:id/resenas  { valor: 1..5 }
// Crea o actualiza la reseña del usuario logueado para esa veterinaria,
// y recalcula rating/cantidadResenias en el documento de la veterinaria.
export const calificarVeterinaria = async (req, res) => {
  try {
    const { id } = req.params;
    const usuarioId = req.user.id;
    const valor = Number(req.body.valor);

    if (!Number.isFinite(valor) || valor < 1 || valor > 5) {
      return res.status(400).json({ message: 'valor debe ser un número entre 1 y 5' });
    }

    const veterinaria = await Veterinaria.findOne({ _id: id, estado: 'activa' });
    if (!veterinaria) {
      return res.status(404).json({ message: 'El recurso no existe.' });
    }

    await Resenia.findOneAndUpdate(
      { veterinariaId: id, usuarioId },
      { valor },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    const [agregado] = await Resenia.aggregate([
      { $match: { veterinariaId: new mongoose.Types.ObjectId(id) } },
      { $group: { _id: '$veterinariaId', promedio: { $avg: '$valor' }, cantidad: { $sum: 1 } } },
    ]);

    const promedio = agregado?.promedio ?? 0;
    const cantidad = agregado?.cantidad ?? 0;

    veterinaria.rating = Math.round(promedio * 10) / 10; // 1 decimal
    veterinaria.cantidadResenias = cantidad;
    await veterinaria.save();

    return res.status(200).json({
      success: true,
      data: {
        miCalificacion: valor,
        rating: veterinaria.rating,
        cantidadResenias: veterinaria.cantidadResenias,
      },
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'El id de la veterinaria no es válido' });
    }
    console.error('Error en POST /veterinarias/:id/resenas:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// GET /veterinarias/:id/mi-resena
// Devuelve el valor que el usuario logueado le puso a esta veterinaria (o null si no calificó).
export const obtenerMiResena = async (req, res) => {
  try {
    const { id } = req.params;
    const usuarioId = req.user.id;

    const resenia = await Resenia.findOne({ veterinariaId: id, usuarioId });

    return res.status(200).json({
      success: true,
      data: resenia ? resenia.valor : null,
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'El id de la veterinaria no es válido' });
    }
    console.error('Error en GET /veterinarias/:id/mi-resena:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};