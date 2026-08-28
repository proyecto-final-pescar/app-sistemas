import Veterinaria from '../models/Veterinaria.js';
import Turno from "../models/Turno.js";
import Mascota from "../models/Mascota.js";
import User from "../models/User.js";

// Estados de Turno que habilitan a considerar a una mascota "paciente" de la veterinaria.
// Se excluye 'pendiente' (todavía no confirmado, no hay relación real) y
// 'cancelado' (la relación no se concretó).
const ESTADOS_TURNO_PACIENTE = ["confirmado", "atendido"];

// Paginación de /mia/pacientes
const PACIENTES_LIMITE_DEFAULT = 12;
const PACIENTES_LIMITE_MAXIMO = 50;

const CAMPOS_EDITABLES_MI_VETERINARIA = [
  "nombre",
  "direccion",
  "telefono",
  "email",
  "sitioWeb",
  "horarios",
  "servicios",
  "profesionales",
  "urgencias24hs",
];


const REGEX_SOLO_LETRAS = /^[a-zA-ZÀ-ÖØ-öø-ÿ\u00f1\u00d1\s'.-]+$/;
const esTextoValido = (texto) => REGEX_SOLO_LETRAS.test((texto || "").trim());

// Valida nombre y especialidad de cada profesional del arreglo.

const validarProfesionales = (profesionales) => {
  if (!Array.isArray(profesionales)) return null;

  for (const profesional of profesionales) {
    const nombre = (profesional?.nombre || "").trim();
    const especialidad = (profesional?.especialidad || "").trim();

    if (!nombre || !especialidad) {
      return "El nombre y la especialidad del profesional son obligatorios.";
    }
    if (!esTextoValido(nombre)) {
      return `El nombre "${nombre}" solo puede contener letras.`;
    }
    if (!esTextoValido(especialidad)) {
      return `La especialidad "${especialidad}" solo puede contener letras.`;
    }
  }

  return null;
};

const normalizarServicios = (servicios, veterinaria) => {
  if (!Array.isArray(servicios)) return servicios;

  return servicios.map((servicio) => {
    const servicioExistente = servicio?._id
      ? veterinaria.servicios.id(servicio._id)
      : null;
    const normalizado = servicioExistente
      ? servicioExistente.toObject()
      : {};

    for (const campo of ["categoria", "nombre", "precio"]) {
      if (servicio?.[campo] !== undefined) normalizado[campo] = servicio[campo];
    }

    if (servicioExistente) normalizado._id = servicioExistente._id;

    return normalizado;
  });
};

const normalizarProfesionales = (profesionales, veterinaria) => {
  if (!Array.isArray(profesionales)) return profesionales;

  return profesionales.map((profesional) => {
    const profesionalExistente = profesional?._id
      ? veterinaria.profesionales.id(profesional._id)
      : null;
    const normalizado = profesionalExistente
      ? profesionalExistente.toObject()
      : {};

    for (const campo of ["nombre", "especialidad", "email"]) {
      if (profesional?.[campo] !== undefined) normalizado[campo] = profesional[campo];
    }

    // Las asociaciones solo se reemplazan cuando el cliente las envía
    // expresamente. En cualquier actualización parcial se conservan intactas.
    if (profesional?.serviciosIds !== undefined) {
      normalizado.serviciosIds = profesional.serviciosIds;
    }

    if (profesionalExistente) normalizado._id = profesionalExistente._id;

    return normalizado;
  });
};

// Escapa caracteres especiales de regex para poder usar el texto de búsqueda
// del usuario de forma segura en un $regex (evita romper la query o abrir
// una puerta a ReDoS con patrones maliciosos).
const escaparRegex = (texto) => texto.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

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

    if (lat < -90 || lat > 90) {
      return res.status(400).json({ message: 'La latitud debe estar entre -90 y 90' });
    }

    if (lng < -180 || lng > 180) {
      return res.status(400).json({ message: 'La longitud debe estar entre -180 y 180' });
    }

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

        const veterinaria = await Veterinaria.findOne({ usuarioId });

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

// PUT /veterinarias/mia: edita la veterinaria del usuario autenticado
export const actualizarMiVeterinaria = async (req, res) => {
  try {
    if (!req.body || typeof req.body !== "object" || Array.isArray(req.body)) {
      return res.status(400).json({ message: 'Datos inválidos' });
    }

    for (const campo of ["servicios", "profesionales"]) {
      if (req.body[campo] !== undefined && !Array.isArray(req.body[campo])) {
        return res.status(400).json({ message: `${campo} debe ser un arreglo` });
      }
    }

    if (req.body.profesionales !== undefined) {
      const errorProfesionales = validarProfesionales(req.body.profesionales);
      if (errorProfesionales) {
        return res.status(400).json({ message: errorProfesionales });
      }
    }

    const veterinaria = await Veterinaria.findOne({ usuarioId: req.user.id });

    if (!veterinaria) {
      return res.status(404).json({ message: 'No tenés una veterinaria registrada.' });
    }

    for (const campo of CAMPOS_EDITABLES_MI_VETERINARIA) {
      if (req.body[campo] === undefined) continue;

      if (campo === "servicios") {
        veterinaria.servicios = normalizarServicios(req.body.servicios, veterinaria);
      } else if (campo === "profesionales") {
        veterinaria.profesionales = normalizarProfesionales(
          req.body.profesionales,
          veterinaria
        );
      } else {
        veterinaria[campo] = req.body[campo];
      }
    }

    const veterinariaActualizada = await veterinaria.save();

    return res.status(200).json({
      success: true,
      data: veterinariaActualizada,
    });
  } catch (error) {
    if (error.name === 'CastError' || error.name === 'ValidationError') {
      // TEMPORAL: exponer detalle de validación para debug — revertir antes de commitear
      console.error('Detalle de validación PUT /veterinarias/mia:', error.errors || error);
      return res.status(400).json({
        message: 'Datos inválidos',
        detalle: error.errors,
      });
    }

    console.error('Error en PUT /veterinarias/mia:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// POST /veterinarias: crea el perfil de una veterinaria (solo rol 'veterinaria')
export const crearVeterinaria = async (req, res) => {
    try {
        const usuarioId = req.user.id;

        const veterinariaPorUsuario = await Veterinaria.findOne({ usuarioId });
        if (veterinariaPorUsuario) {
            return res.status(409).json({ 
                message: 'Ya tienes una veterinaria registrada con este usuario.' 
            });
        }

        const {
            nombre,
            direccion,
            razonSocial,
            cuit,
            telefono,
            email,
            sitioWeb,
            coordenadas,
            servicios,
            profesionales,
            horarios,
            urgencias24hs
        } = req.body;

        if (profesionales !== undefined) {
            const errorProfesionales = validarProfesionales(profesionales);
            if (errorProfesionales) {
                return res.status(400).json({ message: errorProfesionales });
            }
        }

        const veterinariaPorCuit = await Veterinaria.findOne({ cuit });
        if (veterinariaPorCuit) {
            return res.status(409).json({ 
                message: 'Ya existe una clínica registrada con este CUIT.' 
            });
        }

        const nuevaVeterinaria = new Veterinaria({
            nombre,
            direccion,
            razonSocial,
            cuit,
            telefono,
            email,
            sitioWeb,
            coordenadas,
            servicios,
            profesionales,
            horarios,
            urgencias24hs,
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

// PUT /veterinarias/:id: edita una veterinaria activa (dueño o admin)
export const actualizarVeterinaria = async (req, res) => {
    try {
        const { id } = req.params;
        const usuarioId = req.user.id;
        const esAdmin = req.user.role === 'administrador' ;

        const veterinaria = await Veterinaria.findOne({ _id: id, estado: 'activa' });

        if (!veterinaria) {
            return res.status(404).json({ message: 'El recurso no existe.' });
        }

        if (veterinaria.usuarioId.toString() !== usuarioId && !esAdmin) {
            return res.status(403).json({ message: 'No tenés permisos para realizar esta acción.' });
        }

        const {
            nombre,
            direccion,
            razonSocial,
            cuit,
            telefono,
            email,
            sitioWeb,
            coordenadas,
            servicios,
            profesionales,
            horarios,
            urgencias24hs
        } = req.body;

        if (profesionales !== undefined) {
            const errorProfesionales = validarProfesionales(profesionales);
            if (errorProfesionales) {
                return res.status(400).json({ message: errorProfesionales });
            }
        }

        if (nombre !== undefined) veterinaria.nombre = nombre;
        if (direccion !== undefined) veterinaria.direccion = direccion;
        if (razonSocial !== undefined) veterinaria.razonSocial = razonSocial;
        if (cuit !== undefined) veterinaria.cuit = cuit;
        if (telefono !== undefined) veterinaria.telefono = telefono;
        if (email !== undefined) veterinaria.email = email;
        if (sitioWeb !== undefined) veterinaria.sitioWeb = sitioWeb;
        if (coordenadas !== undefined) veterinaria.coordenadas = coordenadas;
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
      estado: { $in: ESTADOS_TURNO_PACIENTE },
    });

    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(
      Math.max(parseInt(req.query.limit, 10) || PACIENTES_LIMITE_DEFAULT, 1),
      PACIENTES_LIMITE_MAXIMO
    );
    const skip = (page - 1) * limit;

    const busqueda = (req.query.busqueda || "").trim();

    let filtro = { _id: { $in: mascotaIds } };

    if (busqueda) {
      const regex = new RegExp(escaparRegex(busqueda), "i");

      const dueñoIds = await User.find({ name: regex }).distinct("_id");

      filtro = {
        ...filtro,
        $or: [{ nombre: regex }, { dueñoId: { $in: dueñoIds } }],
      };
    }

    const [pacientes, total] = await Promise.all([
      Mascota.find(filtro)
        .select("nombre especie raza fechaNacimiento foto dueñoId")
        .populate("dueñoId", "name")
        .sort({ nombre: 1 })
        .skip(skip)
        .limit(limit),
      Mascota.countDocuments(filtro),
    ]);

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
      data,
      paginacion: {
        total,
        page,
        limit,
        totalPaginas: Math.max(Math.ceil(total / limit), 1),
      },
    });
  } catch (error) {
    console.error("Error al obtener pacientes:", error);

    return res.status(500).json({
      success: false,
      message: "No se pudieron obtener los pacientes.",
    });
  }
};