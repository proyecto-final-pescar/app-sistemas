import Veterinaria from "../models/Veterinaria.js";
import Turno from "../models/Turno.js";
import prisma from "../../prisma/client.js";

// GET /api/admin/veterinarias
export const obtenerVeterinariasAdmin = async (req, res) => {
  try {
    const pagina = Math.max(1, parseInt(req.query.pagina) || 1);
    const limite = Math.max(1, parseInt(req.query.limite) || 10);
    const saltar = (pagina - 1) * limite;

    // Filtros para PostgreSQL con Prisma
    const where = {};

    if (req.query.estado) {
      where.estado_veterinaria = {
        nombre: {
          equals: req.query.estado,
          mode: "insensitive",
        },
      };
    }

    if (req.query.nombre) {
      where.nombre = {
        contains: req.query.nombre,
        mode: "insensitive", // Equivalente a $options: 'i'
      };
    }

    // Consulta en paralelo
    const [registros, total] = await Promise.all([
      prisma.veterinaria.findMany({
        where,
        skip: saltar,
        take: limite,
        orderBy: { created_at: "desc" },
        include: {
          estado_veterinaria: true, // Para leer el nombre del estado ('activa', 'pendiente', etc.)
          servicio: true, // Trae los servicios asociados
        },
      }),
      prisma.veterinaria.count({ where }),
    ]);

    // Adaptamos los nombres para que el frontend no se rompa (mapeo DTO)
    const dataAdaptada = registros.map((vet) => ({
      ...vet,
      _id: vet.veterinaria_id, // Mantiene compatibilidad con vet._id del JSX
      estado: vet.estado_veterinaria?.nombre?.toLowerCase() || "pendiente",
      servicios: vet.servicio || [],
      createdAt: vet.created_at,
    }));

    return res.status(200).json({
      success: true,
      data: dataAdaptada,
      paginacion: {
        total,
        pagina,
        limite,
        totalPaginas: Math.ceil(total / limite),
      },
    });
  } catch (error) {
    console.error("Error al obtener veterinarias:", error);
    return res.status(500).json({
      message: "Error interno del servidor",
    });
  }
};

// GET /api/admin/veterinarias/:id
export const obtenerVeterinariaAdminPorId = async (req, res) => {
  try {
    const { id } = req.params;

    const veterinaria = await Veterinaria.findById(id);

    if (!veterinaria) {
      return res.status(404).json({
        message: "La veterinaria no existe.",
      });
    }

    return res.status(200).json({
      success: true,
      data: veterinaria,
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        message: "El id de la veterinaria no es válido",
      });
    }

    return res.status(500).json({
      message: "Error interno del servidor",
    });
  }
};

// POST /api/admin/veterinarias
/* export const crearVeterinariaAdmin = async (req, res) => {
    try {
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
            urgencias24hs,
            usuarioId,
            estado
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
            usuarioId,
            estado
        });

        const veterinariaGuardada = await nuevaVeterinaria.save();

        return res.status(201).json({
            success: true,
            data: veterinariaGuardada
        });

    } catch (error) {
        if (error.name === 'ValidationError') {
            return res.status(400).json({
                message: 'Datos inválidos'
            });
        }

        console.error('Error en POST /api/admin/veterinarias:', error);

        return res.status(500).json({
            message: 'Error interno del servidor'
        });
    }
}; */

// PUT /api/admin/veterinarias/:id
export const actualizarVeterinariaAdmin = async (req, res) => {
  try {
    const { id } = req.params;

    const veterinaria = await Veterinaria.findById(id);

    if (!veterinaria) {
      return res.status(404).json({
        message: "La veterinaria no existe.",
      });
    }

    const camposPermitidos = [
      "nombre",
      "direccion",
      "razonSocial",
      "cuit",
      "telefono",
      "email",
      "sitioWeb",
      "coordenadas",
      "especialidades",
      "servicios",
      "profesionales",
      "horarios",
      "urgencias24hs",
      "usuarioId",
      "estado",
    ];

    camposPermitidos.forEach((campo) => {
      if (req.body[campo] !== undefined) {
        veterinaria[campo] = req.body[campo];
      }
    });

    const veterinariaActualizada = await veterinaria.save({
      validateModifiedOnly: true,
    });

    return res.status(200).json({
      success: true,
      data: veterinariaActualizada,
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        message: "El id de la veterinaria no es válido",
      });
    }

    if (error.name === "ValidationError") {
      console.error("Detalle de validación:", error.errors);
      return res.status(400).json({
        message: "Datos inválidos",
        detalles: Object.keys(error.errors).map((campo) => ({
          campo,
          mensaje: error.errors[campo].message,
        })),
      });
    }

    return res.status(500).json({
      message: "Error interno del servidor",
    });
  }
};

// DELETE /api/admin/veterinarias/:id
export const eliminarVeterinariaAdmin = async (req, res) => {
  try {
    const { id } = req.params;

    const veterinaria = await Veterinaria.findById(id);

    if (!veterinaria) {
      return res.status(404).json({
        message: "La veterinaria no existe.",
      });
    }

    const turnosConfirmados = await Turno.find({
      veterinariaId: id,
      estado: "confirmado",
    });

    const ahora = new Date();

    const tieneTurnosFuturos = turnosConfirmados.some((turno) => {
      const fechaTurno = new Date(turno.fecha);

      const [horas, minutos] = turno.hora.split(":").map(Number);

      fechaTurno.setHours(horas, minutos, 0, 0);

      return fechaTurno > ahora;
    });

    if (tieneTurnosFuturos) {
      return res.status(409).json({
        message:
          "No se puede eliminar la veterinaria porque tiene turnos futuros confirmados.",
      });
    }

    await Veterinaria.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Veterinaria eliminada correctamente.",
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        message: "El id de la veterinaria no es válido",
      });
    }

    return res.status(500).json({
      message: "Error interno del servidor",
    });
  }
};

export const aprobarVeterinaria = async (req, res) => {
  try {
    const { id } = req.params;

    const veterinaria = await Veterinaria.findById(id);

    if (!veterinaria) {
      return res.status(404).json({ message: "La veterinaria no existe." });
    }

    veterinaria.estado = "activa";
    await veterinaria.save({ validateModifiedOnly: true });

    return res.status(200).json({
      success: true,
      data: veterinaria,
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res
        .status(400)
        .json({ message: "El id de la veterinaria no es válido" });
    }

    return res.status(500).json({ message: "Error interno del servidor" });
  }
};

export const rechazarVeterinaria = async (req, res) => {
  try {
    const { id } = req.params;

    const veterinaria = await Veterinaria.findById(id);

    if (!veterinaria) {
      return res.status(404).json({ message: "La veterinaria no existe." });
    }

    veterinaria.estado = "suspendida";
    await veterinaria.save({ validateModifiedOnly: true });

    return res.status(200).json({
      success: true,
      data: veterinaria,
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res
        .status(400)
        .json({ message: "El id de la veterinaria no es válido" });
    }

    return res.status(500).json({ message: "Error interno del servidor" });
  }
};
