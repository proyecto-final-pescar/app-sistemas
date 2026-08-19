import Veterinaria from '../models/Veterinaria.js';
import Turno from "../models/Turno.js";
import Mascota from "../models/Mascota.js";

// GET /veterinarias/buscar: búsqueda geoespacial (requiere autenticación)
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

    // Validación de rangos geoespaciales
    if (lat < -90 || lat > 90) {
      return res.status(400).json({ message: 'La latitud debe estar entre -90 y 90' });
    }

    if (lng < -180 || lng > 180) {
      return res.status(400).json({ message: 'La longitud debe estar entre -180 y 180' });
    }

    // Límite máximo de radio: 50km
    const RADIO_MAXIMO = 50000;
    if (radio > RADIO_MAXIMO) {
      return res.status(400).json({ message: 'El radio máximo permitido es 50000 metros (50km)' });
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

// GET /veterinarias: devuelve todas las veterinarias activas
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

// GET /veterinarias/:id: devuelve el detalle de una veterinaria activa
export const obtenerVeterinariaPorId = async (req, res) => {
    try {
        const { id } = req.params;

        // Filtramos por id Y por estado activa
        const veterinaria = await Veterinaria.findOne({ _id: id, estado: 'activa' });

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

// GET /veterinarias/mia: devuelve la veterinaria del usuario logueado
export const obtenerMiVeterinaria = async (req, res) => {
    try {
        const usuarioId = req.user.id;

        const veterinaria = await Veterinaria.findOne({ usuarioId, estado: 'activa' });

        if (!veterinaria) {
            return res.status(404).json({ message: 'No tenés una veterinaria registrada.' });
        }

        res.status(200).json({
            success: true,
            data: veterinaria
        });

    } catch (error) {
        console.error('Error en GET /veterinarias/mia:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
};

// POST /veterinarias: crea el perfil de una veterinaria (solo rol 'veterinaria')
export const crearVeterinaria = async (req, res) => {
    try {
        const usuarioId = req.user.id;

        // Solo se permiten estos campos, ignoramos cualquier otro que venga en el body
        const {
            nombre,
            direccion,
            razonSocial,
            cuit,
            telefono,
            email,
            sitioWeb,
            coordenadas,
            especialidades,
            servicios,
            profesionales,
            horarios,
            urgencias24hs
        } = req.body;

        const nuevaVeterinaria = new Veterinaria({
            nombre,
            direccion,
            razonSocial,
            cuit,
            telefono,
            email,
            sitioWeb,
            coordenadas,
            especialidades,
            servicios,
            profesionales,
            horarios,
            urgencias24hs,
            usuarioId
            // estado no se permite, siempre arranca como 'activa' por defecto
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

// PUT /veterinarias/:id: edita una veterinaria activa (dueño o admin)
export const actualizarVeterinaria = async (req, res) => {
    try {
        const { id } = req.params;
        const usuarioId = req.user.id;
        const esAdmin = req.user.role === 'administrador' ;

        // Buscamos solo si está activa
        const veterinaria = await Veterinaria.findOne({ _id: id, estado: 'activa' });

        if (!veterinaria) {
            return res.status(404).json({ message: 'El recurso no existe.' });
        }

        if (veterinaria.usuarioId.toString() !== usuarioId && !esAdmin) {
            return res.status(403).json({ message: 'No tenés permisos para realizar esta acción.' });
        }

        // Solo se permiten estos campos, el cliente no puede cambiar estado ni usuarioId
        const {
            nombre,
            direccion,
            razonSocial,
            cuit,
            telefono,
            email,
            sitioWeb,
            coordenadas,
            especialidades,
            servicios,
            profesionales,
            horarios,
            urgencias24hs
        } = req.body;

        // Solo actualizamos los campos que vinieron en el body (si no vienen, quedan igual)
        if (nombre !== undefined) veterinaria.nombre = nombre;
        if (direccion !== undefined) veterinaria.direccion = direccion;
        if (razonSocial !== undefined) veterinaria.razonSocial = razonSocial;
        if (cuit !== undefined) veterinaria.cuit = cuit;
        if (telefono !== undefined) veterinaria.telefono = telefono;
        if (email !== undefined) veterinaria.email = email;
        if (sitioWeb !== undefined) veterinaria.sitioWeb = sitioWeb;
        if (coordenadas !== undefined) veterinaria.coordenadas = coordenadas;
        if (especialidades !== undefined) veterinaria.especialidades = especialidades;
        if (servicios !== undefined) veterinaria.servicios = servicios;
        if (profesionales !== undefined) veterinaria.profesionales = profesionales;
        if (horarios !== undefined) veterinaria.horarios = horarios;
        if (urgencias24hs !== undefined) veterinaria.urgencias24hs = urgencias24hs;

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
       
// GET /veterinarias/mia/pacientes
export const obtenerPacientesVeterinaria = async (req, res) => {
  try {
    const usuarioId = req.user.id;

    const veterinaria = await Veterinaria.findOne({
      usuarioId,
      estado: "activa",
    });

    if (!veterinaria) {
      return res.status(404).json({
        success: false,
        message: "No tenés una veterinaria registrada.",
      });
    }

    const mascotaIds = await Turno.distinct("mascotaId", {
      veterinariaId: veterinaria._id,
    });

    const pacientes = await Mascota.find({
      _id: { $in: mascotaIds },
    })
      .populate("dueñoId", "name")
      .sort({ nombre: 1 });

    const data = pacientes.map((mascota) => ({
      id: mascota._id,
      nombre: mascota.nombre,
      especie: mascota.especie,
      raza: mascota.raza || "Sin especificar",
      fechaNacimiento: mascota.fechaNacimiento,
      foto: mascota.foto || null,
      dueño: {
        id: mascota.dueñoId?._id,
        nombre: mascota.dueñoId?.name || "Sin información",
      },
    }));

    return res.status(200).json({
      success: true,
      total: data.length,
      data,
    });
  } catch (error) {
    console.error("Error al obtener pacientes:", error);

    return res.status(500).json({
      success: false,
      message: "No se pudieron obtener los pacientes.",
    });
  }
};   