const express = require('express'); // Importé el framework Express para manejar el servidor
const router = express.Router(); // Creé un enrutador para las rutas de mascotas

// 1. Importar el middleware de autenticación
const authMiddleware = require('../middleware/auth');

// 2. Importar el modelo de Mascota
const Mascota = require('../models/Mascota');

// GET /mascotas: devuelve las mascotas del usuario logueado
router.get('/', authMiddleware, async (req, res) => {
    try {
        const usuarioId = req.user.id; // Obtengo el ID del dueño desde el token de autenticación

        const mascotas = await Mascota.find({ dueñoId: usuarioId }); // Busco en la base de datos del usuario logueado
        res.json(mascotas);
    } catch (error) {
        console.error('Error en GET /mascotas:', error);
        res.status(500).json({ mensaje: 'Error al obtener las mascotas'});
    }
});

// POST /mascotas: Crea una nueva mascota
router.post('/', authMiddleware, async (req, res) => {
    try {
        const dueñoId = req.user.id; // Obtenemos el ID del dueño desde el token de autenticación

        const { nombre, especie, raza, fechaNacimiento, foto, esCastrado, peso } = req.body; // Extraigo las propiedades que necesito del body

        // Instancio una nueva mascota tomando los datos del body y el dueñoId
        const nuevaMascota = new Mascota({
            nombre,
            especie,
            raza,
            fechaNacimiento,
            foto,
            esCastrado,
            peso,
            dueñoId
        });

        // Guardo la mascota en la base de datos
        const mascotaGuardada = await nuevaMascota.save();

        // Devuelvo la mascota recién creada con un status 201 (creado)
        res.status(201).json(mascotaGuardada);

    } catch (error) {
        // Si falta algún campo obligatorio:
        if (error.name === 'ValidationError') {
            return res.status(400).json({ mensaje: 'Datos inválidos', error: error.message });
        }
        console.error("Error en POST /mascotas:", error);
        // Error general del servidor
        res.status(500).json({ mensaje: "Hubo un error al crear la mascota" });
    }
});

module.exports = router;