import Mascota from '../models/Mascota.js'; // Importo el modelo de Mascota para interactuar con la base de datos

// GET /mascotas: devuelve las mascotas del usuario logueado
export const obtenerMascotas = async (req, res) => {
    try {
        const dueñoId = req.user.id; // Obtengo el ID del dueño desde el token de autenticación

        const mascotas = await Mascota.find({ dueñoId: dueñoId }); // Busco en la base de datos del usuario logueado
        res.json(mascotas);
    } catch (error) {
        console.error('Error en GET /mascotas:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
};

// POST /mascotas: Crea una nueva mascota
export const crearMascota = async (req, res) => {
    try {
        const dueñoId = req.user.id; // Obtengo el ID del dueño desde el token de autenticación

        const { nombre, especie, raza, sexo, fechaNacimiento, foto, esCastrado, peso } = req.body; // Extraigo las propiedades que necesito del body

        // Validación de campos obligatorios
        if (!nombre || !especie) {
            return res.status(400).json({ message: 'Nombre y especie son requeridos' });
        }

        // Instancio una nueva mascota tomando los datos del body y el dueñoId
        const nuevaMascota = new Mascota({
            nombre,
            especie,
            raza,
            sexo,
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
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: 'Datos inválidos', error: error.message });
        }
        console.error("Error en POST /mascotas:", error);
        // Error general del servidor
        res.status(500).json({ message: "Hubo un error al crear la mascota" });
    }
};

// PUT /mascotas: Actualiza una mascota existente
export const actualizarMascota = async (req, res) => {
    try {
        const mascotaId = req.params.id; // El ID de la mascota que viene en la URL
        const dueñoId = req.user.id; // Obtengo el ID del dueño desde el token de autenticación

        const mascota = await Mascota.findById(mascotaId); // Busco la mascota en la base de datos por ID

        // Si la mascota no existe o no es encontrada:
        if (!mascota) {
            return res.status(404).json({ message: 'Mascota no encontrada' });
        }

        // Si la mascota solicitada no pertenece al usuario:
        if (mascota.dueñoId.toString() !== dueñoId) {
            return res.status(403).json({ message: 'No tenés permiso para editar esta mascota' });
        }

        // Actualización de datos
        const camposPermitidos = ['nombre', 'especie', 'raza', 'sexo', 'fechaNacimiento', 'foto', 'esCastrado', 'peso']; // Lista de los campos que el cliente puede modificar; evitando la posibilidad de que modifique algo 'peligroso' como dueñoId

        camposPermitidos.forEach((campo) => {
            if (req.body[campo] !== undefined) {
                mascota[campo] = req.body[campo];
            }
        }); // Recorro los campos de la lista para encontrar aquel que el usuario quiera modificar y lo actualizo al nuevo valor.

        const mascotaActualizada = await mascota.save(); // Guardo los cambios en la base de datos
        res.json(mascotaActualizada); // Devuelvo al cliente la mascota ya actualizada.

    } catch (error) {
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: 'Datos inválidos', error: error.message });
        }
        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'El id de la mascota no es válido' });
        }
        console.error('Error en PUT /mascotas', error);
        res.status(500).json({ message: 'Error al actualizar la mascota' });
    }
};

// DELETE /mascotas: elimina una mascota
export const eliminarMascota = async (req, res) => {
    try {
        const mascotaId = req.params.id; // El ID de la mascota que viene en la URL
        const dueñoId = req.user.id; // Obtengo el ID del dueño desde el token de autenticación

        const mascota = await Mascota.findById(mascotaId);

        // Si la mascota no existe o no es encontrada:
        if (!mascota) {
            return res.status(404).json({ message: 'Mascota no encontrada' });
        }

        // Si la mascota solicitada no pertenece al usuario:
        if (mascota.dueñoId.toString() !== dueñoId) {
            return res.status(403).json({ message: 'No tenés permiso para eliminar esta mascota' });
        }

        await mascota.deleteOne();
        res.json({ message: 'Mascota eliminada correctamente' });

    } catch (error) {
        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'El id de la mascota no es válido' });
        }
        console.error('Error en DELETE /mascotas', error);
        res.status(500).json({ message: 'Error al eliminar la mascota' });
    }
};