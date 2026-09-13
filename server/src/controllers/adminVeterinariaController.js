import prisma from '../../prisma/client.js';
import { enviarEmail } from '../utils/mailer.js';
import { armarEmailRechazoVeterinaria } from '../templates/emailRechazoVeterinaria.js';

const CODIGO_A_ESTADO = {
  PEN: 'pendiente',
  ACT: 'activa',
  SUS: 'suspendida'
};

const ESTADO_A_CODIGO = Object.fromEntries(
  Object.entries(CODIGO_A_ESTADO).map(([codigo, estado]) => [estado, codigo])
);

const NOMBRE_ESTADO_TURNO_CONFIRMADO = 'confirmado';

const ORDEN_DIA_SEMANA = ['LUN', 'MAR', 'MIE', 'JUE', 'VIE', 'SAB', 'DOM'];

const INCLUDE_SERVICIOS_ACTIVOS = {
  servicio: {
    where: { active: true },
    select: { servicio_id: true, nombre: true }
  }
};

const INCLUDE_DETALLE = {
  servicio: {
    select: {
      servicio_id: true,
      nombre: true,
      precio: true,
      active: true,
      categoria_servicio: { select: { nombre: true } }
    }
  },
  horario_veterinaria: {
    include: { dia_semana: true }
  },
  profesional: {
    include: { especialidad: true }
  }
};

const obtenerRatingsPorId = async (veterinariaIds) => {
  if (veterinariaIds.length === 0) return {};

  const filas = await prisma.$queryRaw`
    SELECT veterinaria_id, rating, cantidad_resenias
    FROM vw_rating_veterinaria
    WHERE veterinaria_id = ANY(${veterinariaIds}::uuid[])
  `;

  return filas.reduce((acc, fila) => {
    acc[fila.veterinaria_id] = {
      rating: fila.rating !== null ? Number(fila.rating) : null,
      cantidadResenias: Number(fila.cantidad_resenias)
    };
    return acc;
  }, {});
};

const mapearVeterinariaAdmin = (veterinaria, ratingsPorId) => {
  const rating = ratingsPorId[veterinaria.veterinaria_id];

  return {
    _id: veterinaria.veterinaria_id,
    nombre: veterinaria.nombre,
    direccion: veterinaria.direccion,
    cuit: veterinaria.cuit,
    telefono: veterinaria.telefono,
    email: veterinaria.email,
    estado: CODIGO_A_ESTADO[veterinaria.estado_veterinaria_id] || veterinaria.estado_veterinaria_id,
    servicios: (veterinaria.servicio || []).map((s) => ({
      _id: s.servicio_id,
      nombre: s.nombre
    })),
    rating: rating?.rating ?? null,
    cantidadResenias: rating?.cantidadResenias ?? 0,
    createdAt: veterinaria.created_at
  };
};

const formatearHora = (fecha) => {
  if (!fecha) return null;
  const horas = String(fecha.getUTCHours()).padStart(2, '0');
  const minutos = String(fecha.getUTCMinutes()).padStart(2, '0');
  return `${horas}:${minutos}`;
};

const mapearHorarios = (horarios = []) => {
  return [...horarios]
    .sort((a, b) => {
      const posA = ORDEN_DIA_SEMANA.indexOf(a.dia_semana_id);
      const posB = ORDEN_DIA_SEMANA.indexOf(b.dia_semana_id);
      return posA - posB;
    })
    .map((h) => ({
      _id: h.horario_veterinaria_id,
      diaSemanaId: h.dia_semana_id,
      diaSemana: h.dia_semana?.nombre || h.dia_semana_id,
      horaDesde: formatearHora(h.hora_desde),
      horaHasta: formatearHora(h.hora_hasta)
    }));
};

const mapearProfesionales = (profesionales = []) => {
  return profesionales.map((p) => ({
    _id: p.profesional_id,
    nombre: p.nombre,
    apellido: p.apellido,
    especialidad: p.especialidad?.nombre || p.especialidad_id,
    email: p.email,
    active: p.active
  }));
};

const mapearVeterinariaAdminDetalle = (veterinaria, ratingsPorId) => {
  const base = mapearVeterinariaAdmin(veterinaria, ratingsPorId);

  return {
    ...base,
    razonSocial: veterinaria.razon_social,
    sitioWeb: veterinaria.sitio_web,
    urgencias: veterinaria.urgencias,
    latitud: veterinaria.latitud !== null ? Number(veterinaria.latitud) : null,
    longitud: veterinaria.longitud !== null ? Number(veterinaria.longitud) : null,
    servicios: (veterinaria.servicio || []).map((s) => ({
      _id: s.servicio_id,
      nombre: s.nombre,
      precio: s.precio !== null ? Number(s.precio) : null,
      active: s.active,
      categoria: s.categoria_servicio?.nombre || null
    })),
    horarios: mapearHorarios(veterinaria.horario_veterinaria),
    profesionales: mapearProfesionales(veterinaria.profesional)
  };
};

// GET /admin/veterinarias — MIGRADO
export const obtenerVeterinariasAdmin = async (req, res) => {
    try {
        const pagina = parseInt(req.query.pagina) || 1;
        const limite = parseInt(req.query.limite) || 10;
        const saltar = (pagina - 1) * limite;

        const filtro = {};

        if (req.query.estado) {
            const codigoEstado = ESTADO_A_CODIGO[req.query.estado];
            if (!codigoEstado) {
                return res.status(400).json({
                    message: `El estado debe ser uno de los siguientes: ${Object.keys(ESTADO_A_CODIGO).join(', ')}.`
                });
            }
            filtro.estado_veterinaria_id = codigoEstado;
        }

        if (req.query.nombre) {
            filtro.nombre = { contains: req.query.nombre, mode: 'insensitive' };
        }

        const [veterinarias, total] = await Promise.all([
            prisma.veterinaria.findMany({
                where: filtro,
                skip: saltar,
                take: limite,
                orderBy: { created_at: 'desc' },
                include: INCLUDE_SERVICIOS_ACTIVOS
            }),
            prisma.veterinaria.count({ where: filtro })
        ]);

        const ratingsPorId = await obtenerRatingsPorId(veterinarias.map((v) => v.veterinaria_id));

        return res.status(200).json({
            success: true,
            data: veterinarias.map((v) => mapearVeterinariaAdmin(v, ratingsPorId)),
            paginacion: {
                total,
                pagina,
                limite,
                totalPaginas: Math.ceil(total / limite)
            }
        });

    } catch (error) {
        console.error('Error en GET /admin/veterinarias:', error);
        return res.status(500).json({
            message: 'Error interno del servidor'
        });
    }
};

// GET /admin/veterinarias/:id — MIGRADO
// Devuelve el detalle completo (servicios, horarios y profesionales) para
// que el admin pueda revisar todo lo cargado en el registro
export const obtenerVeterinariaAdminPorId = async (req, res) => {
    try {
        const { id } = req.params;

        const veterinaria = await prisma.veterinaria.findUnique({
            where: { veterinaria_id: id },
            include: INCLUDE_DETALLE
        });

        if (!veterinaria) {
            return res.status(404).json({
                message: 'La veterinaria no existe.'
            });
        }

        const ratingsPorId = await obtenerRatingsPorId([veterinaria.veterinaria_id]);

        return res.status(200).json({
            success: true,
            data: mapearVeterinariaAdminDetalle(veterinaria, ratingsPorId)
        });

    } catch (error) {
        if (error.code === 'P2023') {
            return res.status(400).json({
                message: 'El id de la veterinaria no es válido'
            });
        }

        console.error('Error en GET /admin/veterinarias/:id:', error);
        return res.status(500).json({
            message: 'Error interno del servidor'
        });
    }
};

// PUT /admin/veterinarias/:id — MIGRADO
// cambio de estado de las vet
export const actualizarVeterinariaAdmin = async (req, res) => {
    try {
        const { id } = req.params;
        const { estado } = req.body;

        const codigoEstado = ESTADO_A_CODIGO[estado];
        if (!codigoEstado) {
            return res.status(400).json({
                message: `El estado debe ser uno de los siguientes: ${Object.keys(ESTADO_A_CODIGO).join(', ')}.`
            });
        }

        const veterinaria = await prisma.veterinaria.findUnique({ where: { veterinaria_id: id } });

        if (!veterinaria) {
            return res.status(404).json({
                message: 'La veterinaria no existe.'
            });
        }

        const veterinariaActualizada = await prisma.veterinaria.update({
            where: { veterinaria_id: id },
            data: { estado_veterinaria_id: codigoEstado },
            include: INCLUDE_SERVICIOS_ACTIVOS
        });

        const ratingsPorId = await obtenerRatingsPorId([id]);

        return res.status(200).json({
            success: true,
            data: mapearVeterinariaAdmin(veterinariaActualizada, ratingsPorId)
        });

    } catch (error) {
        if (error.code === 'P2023') {
            return res.status(400).json({
                message: 'El id de la veterinaria no es válido'
            });
        }

        console.error('Error en PUT /admin/veterinarias/:id:', error);
        return res.status(500).json({
            message: 'Error interno del servidor'
        });
    }
};

// DELETE /admin/veterinarias/:id — MIGRADO
export const eliminarVeterinariaAdmin = async (req, res) => {
    try {
        const { id } = req.params;

        const veterinaria = await prisma.veterinaria.findUnique({ where: { veterinaria_id: id } });

        if (!veterinaria) {
            return res.status(404).json({
                message: 'La veterinaria no existe.'
            });
        }

        const turnosConfirmados = await prisma.turno.findMany({
            where: {
                veterinaria_id: id,
                estado_turno: { nombre: NOMBRE_ESTADO_TURNO_CONFIRMADO }
            },
            select: { fecha: true, hora_inicio: true }
        });

        const ahora = new Date();

        const tieneTurnosFuturos = turnosConfirmados.some((turno) => {
            const fechaTurno = new Date(turno.fecha);
            const horaInicio = new Date(turno.hora_inicio);

            fechaTurno.setHours(horaInicio.getUTCHours(), horaInicio.getUTCMinutes(), 0, 0);

            return fechaTurno > ahora;
        });

        if (tieneTurnosFuturos) {
            return res.status(409).json({
                message:
                    'No se puede eliminar la veterinaria porque tiene turnos futuros confirmados.'
            });
        }

        await prisma.veterinaria.delete({ where: { veterinaria_id: id } });

        return res.status(200).json({
            success: true,
            message: 'Veterinaria eliminada correctamente.'
        });

    } catch (error) {
        if (error.code === 'P2023') {
            return res.status(400).json({
                message: 'El id de la veterinaria no es válido'
            });
        }
        if (error.code === 'P2025') {
            return res.status(404).json({
                message: 'La veterinaria no existe.'
            });
        }

        console.error('Error en DELETE /admin/veterinarias/:id:', error);
        return res.status(500).json({
            message: 'Error interno del servidor'
        });
    }
};

// PATCH /admin/veterinarias/:id/aprobar — MIGRADO
export const aprobarVeterinaria = async (req, res) => {
    try {
        const { id } = req.params;

        const veterinaria = await prisma.veterinaria.findUnique({ where: { veterinaria_id: id } });

        if (!veterinaria) {
            return res.status(404).json({ message: 'La veterinaria no existe.' });
        }

        const veterinariaActualizada = await prisma.veterinaria.update({
            where: { veterinaria_id: id },
            data: { estado_veterinaria_id: ESTADO_A_CODIGO.activa },
            include: INCLUDE_SERVICIOS_ACTIVOS
        });

        const ratingsPorId = await obtenerRatingsPorId([id]);

        return res.status(200).json({
            success: true,
            data: mapearVeterinariaAdmin(veterinariaActualizada, ratingsPorId)
        });

    } catch (error) {
        if (error.code === 'P2023') {
            return res.status(400).json({ message: 'El id de la veterinaria no es válido' });
        }

        console.error('Error en PATCH /admin/veterinarias/:id/aprobar:', error);
        return res.status(500).json({ message: 'Error interno del servidor' });
    }
};

// PATCH /admin/veterinarias/:id/rechazar — MIGRADO
// se le manda un mail a la veterinaria con el motivo de rechazo (no se guarda en bd)
export const rechazarVeterinaria = async (req, res) => {
    try {
        const { id } = req.params;
        const motivo = typeof req.body.motivo === 'string' ? req.body.motivo.trim() : '';

        if (!motivo) {
            return res.status(400).json({ message: 'El motivo del rechazo es obligatorio.' });
        }

        const veterinaria = await prisma.veterinaria.findUnique({ where: { veterinaria_id: id } });

        if (!veterinaria) {
            return res.status(404).json({ message: 'La veterinaria no existe.' });
        }

        const veterinariaActualizada = await prisma.veterinaria.update({
            where: { veterinaria_id: id },
            data: { estado_veterinaria_id: ESTADO_A_CODIGO.suspendida },
            include: INCLUDE_SERVICIOS_ACTIVOS
        });

        try {
            const { subject, html } = armarEmailRechazoVeterinaria(veterinariaActualizada.nombre, motivo);
            await enviarEmail({ to: veterinariaActualizada.email, subject, html });
        } catch (emailError) {
            console.error('Error al enviar email de rechazo de veterinaria:', emailError);
        }

        const ratingsPorId = await obtenerRatingsPorId([id]);

        return res.status(200).json({
            success: true,
            data: mapearVeterinariaAdmin(veterinariaActualizada, ratingsPorId)
        });

    } catch (error) {
        if (error.code === 'P2023') {
            return res.status(400).json({ message: 'El id de la veterinaria no es válido' });
        }

        console.error('Error en PATCH /admin/veterinarias/:id/rechazar:', error);
        return res.status(500).json({ message: 'Error interno del servidor' });
    }
};