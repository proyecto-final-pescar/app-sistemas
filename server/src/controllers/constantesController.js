import { CATEGORIAS_SERVICIO } from '../constants/categoriasServicio.js';


// Devuelve la lista de categorias válidas para servicios 
export const obtenerCategoriasServicio = async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      data: CATEGORIAS_SERVICIO
    });
  } catch (error) {
    console.error('Error en GET /constantes/categorias-servicio:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};