import User from '../models/User.js';
import Mascota from '../models/Mascota.js';

// GET /usuarios/:id: devuelve el perfil de un usuario junto con sus mascotas
export const obtenerPerfilUsuario = async (req, res) => {
    try {
        const { id } = req.params; // El ID del usuario que viene en la URL

        // Control de acceso: solo el propio usuario o un admin pueden ver el perfil
        const esElMismoUsuario = req.user.id === id;
        const esAdmin = req.user.rol === 'administrador';

        if (!esElMismoUsuario && !esAdmin) {
            return res.status(403).json({
                message: 'No tenés permisos para realizar esta acción.'
            });
        }

        // Buscar el usuario por ID
        const usuario = await User.findById(id);

        if (!usuario) {
            return res.status(404).json({
                message: 'El recurso no existe.'
            });
        }

        // Buscar las mascotas de ese usuario
        const mascotas = await Mascota.find({ dueñoId: id });

        // Armar la respuesta con los datos pedidos
        res.status(200).json({
            success: true,
            data: {
                nombre: usuario.name,
                email: usuario.email,
                rol: usuario.role,
                fechaRegistro: usuario.createdAt,
                mascotas: mascotas
            }
        });

    } catch (error) {
        if (error.name === 'CastError') {
            return res.status(400).json({
                message: 'El id del usuario no es válido'
            });
        }
        console.error('Error en GET /usuarios/:id:', error);
        res.status(500).json({
            message: 'Error interno del servidor'
        });
    }
};