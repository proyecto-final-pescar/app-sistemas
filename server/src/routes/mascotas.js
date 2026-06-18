const express = require('express'); // Importé el framework Express para manejar el servidor
const router = express.Router(); // Creé un enrutador para las rutas de mascotas

// 1. Importar el middleware de autenticación
const authMiddleware = require('../middleware/auth');

// 2. Importar el modelo de Mascota
const Mascota = require('../models/Mascota');

// GET /mascotas: devuelve las mascotas del usuario logueado
router.get('/', authMiddleware, async (req, res) => {
    try {
        const usuarioId = req.user.id;
        const mascotas = await Mascota.find({ dueñoId: usuarioId });
        res.json(mascotas);
    } catch (error) {
        console.error('Error en GET /mascotas:', error);
        res.status(500).json({ mensaje: 'Error al obtener las mascotas'});
    }
});

module.exports = router;