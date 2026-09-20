// server/src/controllers/veterinariaController.js
import prisma from '../../prisma/client.js';

import {
  resolverEspecialidadId,
  resolverCategoriaServicioId,
  resolverDiaSemanaId
} from '../utils/catalogos.js';

// Paginación de /mia/pacientes
const PACIENTES_LIMITE_DEFAULT = 12;
const PACIENTES_LIMITE_MAXIMO = 50;

const DIAS_SEMANA = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];
const REGEX_SOLO_LETRAS = /^[a-zA-ZÀ-ÖØ-öø-ÿ\u00f1\u00d1\s'.-]+$/;
const REGEX_CUIT = /^\d{2}-?\d{8}-?\d$/;
const REGEX_TELEFONO = /^[0-9+\s()-]{6,20}$/;
const REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DURACIONES_SERVICIO = new Set([15, 30, 60, 120]);
const esTextoValido = (texto) => REGEX_SOLO_LETRAS.test((texto || "").trim());

const relacionesVeterinaria = {
  profesional: {
    where: { active: true },
    include: {
      especialidad: { select: { nombre: true } },
      profesional_servicio: {
        where: { servicio: { active: true } },
        select: { servicio_id: true }
      }
    }
  },
  servicio: {
    where: { active: true },
    include: { categoria_servicio: { select: { nombre: true } } }
  },
  horario_veterinaria: {
    include: { dia_semana: { select: { nombre: true } } }
  }
};

// Convierte "09:00" a un datetime ISO válido. La fecha es un valor fijo arbitrario:
// Postgres solo persiste la parte de hora (@db.Time), así que no importa cuál se use.
const horaADateTime = (hora) => new Date(`1970-01-01T${hora}:00.000Z`);

const separarNombreApellido = (nombreCompleto) => {
  const partes = (nombreCompleto || '').trim().split(/\s+/);
  const nombre = partes.shift() || '';
  const apellido = partes.join(' ');
  return { nombre, apellido };
};

// Traduce la respuesta cruda de Prisma (con catálogos anidados) al shape
// legible que espera el frontend, compatible con lo que devolvía Mongo.
const mapearVeterinariaLegible = (veterinaria) => {
  if (!veterinaria) return veterinaria;

  const horarios = {};
  for (const horario of veterinaria.horario_veterinaria || []) {
    const dia = horario.dia_semana?.nombre;
    if (!dia) continue;
    horarios[dia] = {
      desde: new Date(horario.hora_desde).toISOString().slice(11, 16),
      hasta: new Date(horario.hora_hasta).toISOString().slice(11, 16)
    };
  }

  return {
    _id: veterinaria.veterinaria_id,
    usuarioId: veterinaria.usuario_id,
    nombre: veterinaria.nombre,
    direccion: veterinaria.direccion,
    razonSocial: veterinaria.razon_social,
    cuit: veterinaria.cuit,
    telefono: veterinaria.telefono,
    email: veterinaria.email,
    sitioWeb: veterinaria.sitio_web,
    coordenadas: {
      type: 'Point',
      coordinates: [Number(veterinaria.longitud), Number(veterinaria.latitud)]
    },
    urgencias24hs: veterinaria.urgencias,
    estado: veterinaria.estado_veterinaria_id,
    servicios: (veterinaria.servicio || []).map((s) => ({
      _id: s.servicio_id,
      categoria: s.categoria_servicio?.nombre,
      nombre: s.nombre,
      descripcion: s.descripcion,
      precio: Number(s.precio),
      duracionMinutos: s.duracion_minutos
    })),
    profesionales: (veterinaria.profesional || []).map((p) => ({
      _id: p.profesional_id,
      nombre: [p.nombre, p.apellido].filter(Boolean).join(' '),
      especialidad: p.especialidad?.nombre,
      email: p.email,
      serviciosIds: (p.profesional_servicio || []).map((relacion) => relacion.servicio_id)
    })),
    horarios
  };
};

// --- Helpers de sincronización 
const sincronizarProfesionales = async (tx, veterinariaId, profesionalesBody) => {
  const existentes = await tx.profesional.findMany({
    where: { veterinaria_id: veterinariaId, active: true },
    select: { profesional_id: true }
  });
  const idsExistentes = new Set(existentes.map((p) => p.profesional_id));
  const idsEnviados = new Set(
    profesionalesBody.filter((p) => p.profesional_id).map((p) => p.profesional_id)
  );

  const idsAjenos = [...idsEnviados].filter((id) => !idsExistentes.has(id));
  if (idsAjenos.length > 0) {
    throw { status: 400, message: 'Uno o más profesionales no pertenecen a tu veterinaria.' };
  }

  const serviciosActivos = await tx.servicio.findMany({
    where: { veterinaria_id: veterinariaId, active: true },
    select: { servicio_id: true }
  });
  const idsServiciosActivos = new Set(serviciosActivos.map((servicio) => servicio.servicio_id));

  for (const profesional of profesionalesBody) {
    const { nombre, apellido } = separarNombreApellido(profesional.nombre);
    const especialidadId = await resolverEspecialidadId(profesional.especialidad);
    if (!especialidadId) {
      throw { status: 400, message: `Especialidad "${profesional.especialidad}" no reconocida.` };
    }

    let profesionalGuardado;
    if (profesional.profesional_id) {
      profesionalGuardado = await tx.profesional.update({
        where: { profesional_id: profesional.profesional_id },
        data: { nombre, apellido, especialidad_id: especialidadId, email: profesional.email }
      });
    } else {
      profesionalGuardado = await tx.profesional.create({
        data: {
          veterinaria_id: veterinariaId,
          nombre,
          apellido,
          especialidad_id: especialidadId,
          email: profesional.email
        }
      });
    }

    if (profesional.serviciosIds !== undefined) {
      const serviciosIds = [...new Set(profesional.serviciosIds)];
      const servicioAjeno = serviciosIds.find((id) => !idsServiciosActivos.has(id));
      if (servicioAjeno) {
        throw { status: 400, message: 'Uno o más servicios no pertenecen a tu veterinaria.' };
      }

      await tx.profesional_servicio.deleteMany({
        where: { profesional_id: profesionalGuardado.profesional_id }
      });
      if (serviciosIds.length > 0) {
        await tx.profesional_servicio.createMany({
          data: serviciosIds.map((servicioId) => ({
            profesional_id: profesionalGuardado.profesional_id,
            servicio_id: servicioId
          }))
        });
      }
    }
  }

  const idsABorrar = [...idsExistentes].filter((id) => !idsEnviados.has(id));
  if (idsABorrar.length > 0) {
    await tx.profesional.updateMany({
      where: { profesional_id: { in: idsABorrar } },
      data: { active: false }
    });
  }
};

const sincronizarServicios = async (tx, veterinariaId, serviciosBody) => {
  const existentes = await tx.servicio.findMany({
    where: { veterinaria_id: veterinariaId, active: true },
    select: { servicio_id: true }
  });
  const idsExistentes = new Set(existentes.map((s) => s.servicio_id));
  const idsEnviados = new Set(
    serviciosBody.filter((s) => s.servicio_id).map((s) => s.servicio_id)
  );

  const idsAjenos = [...idsEnviados].filter((id) => !idsExistentes.has(id));
  if (idsAjenos.length > 0) {
    throw { status: 400, message: 'Uno o más servicios no pertenecen a tu veterinaria.' };
  }

  for (const servicio of serviciosBody) {
    const categoriaId = await resolverCategoriaServicioId(servicio.categoria);
    if (!categoriaId) {
      throw { status: 400, message: `Categoría de servicio "${servicio.categoria}" no reconocida.` };
    }

    if (servicio.servicio_id) {
      await tx.servicio.update({
        where: { servicio_id: servicio.servicio_id },
        data: {
          nombre: servicio.nombre,
          descripcion: servicio.descripcion,
          precio: servicio.precio,
          duracion_minutos: servicio.duracionMinutos,
          categoria_servicio_id: categoriaId
        }
      });
    } else {
      await tx.servicio.create({
        data: {
          veterinaria_id: veterinariaId,
          nombre: servicio.nombre,
          descripcion: servicio.descripcion,
          precio: servicio.precio,
          duracion_minutos: servicio.duracionMinutos,
          categoria_servicio_id: categoriaId
        }
      });
    }
  }

  const idsABorrar = [...idsExistentes].filter((id) => !idsEnviados.has(id));
  if (idsABorrar.length > 0) {
    await tx.servicio.updateMany({
      where: { servicio_id: { in: idsABorrar } },
      data: { active: false }
    });
  }
};

const sincronizarHorarios = async (tx, veterinariaId, horariosBody) => {
  await tx.horario_veterinaria.deleteMany({ where: { veterinaria_id: veterinariaId } });

  const horariosResueltos = [];
  for (const dia of DIAS_SEMANA) {
    const franja = horariosBody[dia];
    if (!franja?.desde || !franja?.hasta) continue;

    const diaSemanaId = await resolverDiaSemanaId(dia);
    if (!diaSemanaId) {
      throw { status: 400, message: `Día "${dia}" no reconocido en el catálogo.` };
    }
    horariosResueltos.push({
      veterinaria_id: veterinariaId,
      dia_semana_id: diaSemanaId,
      hora_desde: horaADateTime(franja.desde),
      hora_hasta: horaADateTime(franja.hasta)
    });
  }

  if (horariosResueltos.length > 0) {
    await tx.horario_veterinaria.createMany({ data: horariosResueltos });
  }
};

const aplicarActualizacionVeterinaria = async (veterinariaId, body) => {
  const {
    nombre,
    direccion,
    razonSocial,
    cuit,
    telefono,
    email,
    sitioWeb,
    coordenadas,
    latitud: latitudDirecta,
    longitud: longitudDirecta,
    servicios,
    profesionales,
    horarios,
    urgencias24hs
  } = body;

  const latitud = latitudDirecta ?? coordenadas?.coordinates?.[1];
  const longitud = longitudDirecta ?? coordenadas?.coordinates?.[0];

  const profesionalesNormalizados = profesionales?.map((p) => ({
    ...p,
    profesional_id: p.profesional_id || p._id
  }));
  const serviciosNormalizados = servicios?.map((s) => ({
    ...s,
    servicio_id: s.servicio_id || s._id
  }));

  if (profesionalesNormalizados !== undefined) {
    const errorProfesionales = validarProfesionales(profesionalesNormalizados);
    if (errorProfesionales) throw { status: 400, message: errorProfesionales };
  }

  if (serviciosNormalizados !== undefined) {
    const errorServicios = validarServicios(serviciosNormalizados);
    if (errorServicios) throw { status: 400, message: errorServicios };
  }

  return prisma.$transaction(async (tx) => {
    const dataVeterinaria = {};
    if (nombre !== undefined) dataVeterinaria.nombre = nombre;
    if (direccion !== undefined) dataVeterinaria.direccion = direccion;
    if (razonSocial !== undefined) dataVeterinaria.razon_social = razonSocial;
    if (cuit !== undefined) dataVeterinaria.cuit = cuit;
    if (telefono !== undefined) dataVeterinaria.telefono = telefono;
    if (email !== undefined) dataVeterinaria.email = email;
    if (sitioWeb !== undefined) dataVeterinaria.sitio_web = sitioWeb;
    if (latitud !== undefined) dataVeterinaria.latitud = latitud;
    if (longitud !== undefined) dataVeterinaria.longitud = longitud;
    if (urgencias24hs !== undefined) dataVeterinaria.urgencias = urgencias24hs;

    if (Object.keys(dataVeterinaria).length > 0) {
      await tx.veterinaria.update({ where: { veterinaria_id: veterinariaId }, data: dataVeterinaria });
    }

    if (profesionalesNormalizados !== undefined) await sincronizarProfesionales(tx, veterinariaId, profesionalesNormalizados);
    if (serviciosNormalizados !== undefined) await sincronizarServicios(tx, veterinariaId, serviciosNormalizados);
    if (horarios !== undefined) await sincronizarHorarios(tx, veterinariaId, horarios);

    return tx.veterinaria.findUnique({
      where: { veterinaria_id: veterinariaId },
      include: relacionesVeterinaria
    });
  });
};

const validarDatosGenerales = (body) => {
  const obligatorios = ['nombre', 'direccion', 'telefono', 'email'];
  for (const campo of obligatorios) {
    if (body[campo] !== undefined && !String(body[campo]).trim()) {
      return `El campo ${campo} es obligatorio.`;
    }
  }
  if (body.telefono !== undefined && !REGEX_TELEFONO.test(String(body.telefono).trim())) {
    return 'Ingresá un teléfono válido.';
  }
  if (body.email !== undefined && !REGEX_EMAIL.test(String(body.email).trim())) {
    return 'Ingresá un email institucional válido.';
  }
  if (body.cuit !== undefined && !REGEX_CUIT.test(String(body.cuit).trim())) {
    return 'Ingresá un CUIT válido.';
  }
  if (body.sitioWeb) {
    try {
      const url = new URL(body.sitioWeb);
      if (!['http:', 'https:'].includes(url.protocol)) return 'Ingresá un sitio web válido.';
    } catch {
      return 'Ingresá un sitio web válido, incluyendo http:// o https://.';
    }
  }
  return '';
};

// Valida nombre y especialidad de cada profesional del arreglo.
const validarProfesionales = (profesionales) => {
  if (!Array.isArray(profesionales)) return null;

  for (const profesional of profesionales) {
    const { nombre, apellido } = separarNombreApellido(profesional?.nombre);
    const especialidad = (profesional?.especialidad || "").trim();

    if (!nombre || !apellido || !especialidad) {
      return 'El nombre completo (nombre y apellido) y la especialidad del profesional son obligatorios.';
    }
    if (!esTextoValido(nombre) || !esTextoValido(apellido)) {
      return `El nombre "${profesional.nombre}" solo puede contener letras.`;
    }
    if (!esTextoValido(especialidad)) {
      return `La especialidad "${especialidad}" solo puede contener letras.`;
    }
    if (profesional.serviciosIds !== undefined && !Array.isArray(profesional.serviciosIds)) {
      return `Los servicios del profesional "${profesional.nombre}" deben enviarse como una lista.`;
    }
  }

  return null;
};

// Valida nombre, categoría y precio de cada servicio del arreglo.
const validarServicios = (servicios) => {
  if (!Array.isArray(servicios)) return null;

  for (const servicio of servicios) {
    const nombre = (servicio?.nombre || '').trim();
    const categoria = (servicio?.categoria || '').trim();
    const descripcion = (servicio?.descripcion || '').trim();

    if (!nombre || !categoria || !descripcion || servicio?.precio === undefined || servicio?.precio === null || servicio?.precio === '') {
      return 'El nombre, la categoría, la descripción y el precio de cada servicio son obligatorios.';
    }

    if (descripcion.length > 500) return 'La descripción del servicio no puede superar los 500 caracteres.';

    const precio = Number(servicio.precio);
    if (Number.isNaN(precio) || precio <= 0) {
      return `El precio "${servicio.precio}" del servicio "${nombre}" debe ser un número mayor a 0.`;
    }

    const duracion = Number(servicio.duracionMinutos);
    if (!DURACIONES_SERVICIO.has(duracion)) {
      return `La duración del servicio "${nombre}" debe ser de 15, 30, 60 o 120 minutos.`;
    }
  }

  return null;
};

// GET /veterinarias/buscar: búsqueda geoespacial
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

    const veterinarias = await prisma.$queryRaw`
      SELECT
        veterinaria_id,
        nombre,
        direccion,
        telefono,
        email,
        latitud,
        longitud,
        urgencias,
        ST_Distance(
          ST_MakePoint(longitud::float, latitud::float)::geography,
          ST_MakePoint(${lng}, ${lat})::geography
        ) AS distancia_metros
      FROM veterinaria
      WHERE
        estado_veterinaria_id = 'ACT'
        AND ST_DWithin(
          ST_MakePoint(longitud::float, latitud::float)::geography,
          ST_MakePoint(${lng}, ${lat})::geography,
          ${radio}
        )
      ORDER BY distancia_metros ASC
    `;

    const data = veterinarias.map((v) => ({
      _id: v.veterinaria_id,
      nombre: v.nombre,
      direccion: v.direccion,
      telefono: v.telefono,
      email: v.email,
      urgencias24hs: v.urgencias,
      coordenadas: {
        type: 'Point',
        coordinates: [Number(v.longitud), Number(v.latitud)]
      },
      distanciaMetros: Number(v.distancia_metros)
    }));

    return res.status(200).json({ success: true, data });

    //return res.status(200).json({ success: true, data: veterinarias });
  } catch (error) {
    console.error('Error en GET /veterinarias/buscar:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// GET /veterinarias: devuelve todas las veterinarias activas
export const obtenerVeterinarias = async (req, res) => {
  try {
    const veterinarias = await prisma.veterinaria.findMany({
      where: { estado_veterinaria_id: 'ACT' },
      include: relacionesVeterinaria
    });

    res.status(200).json({ success: true, data: veterinarias.map(mapearVeterinariaLegible) });
  } catch (error) {
    console.error('Error en GET /veterinarias:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// GET /veterinarias/:id: devuelve el detalle de una veterinaria activa
export const obtenerVeterinariaPorId = async (req, res) => {
  try {
    const { id } = req.params;

    const veterinaria = await prisma.veterinaria.findFirst({
      where: { veterinaria_id: id, estado_veterinaria_id: 'ACT' },
      include: relacionesVeterinaria
    });

    if (!veterinaria) {
      return res.status(404).json({ message: 'El recurso no existe.' });
    }

    res.status(200).json({ success: true, data: mapearVeterinariaLegible(veterinaria) });
  } catch (error) {
    console.error('Error en GET /veterinarias/:id:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// GET /veterinarias/mia: devuelve la veterinaria del usuario logueado
export const obtenerMiVeterinaria = async (req, res) => {
  try {
    const usuarioId = req.user.id;

    const veterinaria = await prisma.veterinaria.findUnique({
      where: { usuario_id: usuarioId },
      include: relacionesVeterinaria
    });

    if (!veterinaria) {
      return res.status(404).json({ message: 'No tenés una veterinaria registrada.' });
    }

    res.status(200).json({ success: true, data: mapearVeterinariaLegible(veterinaria) });
  } catch (error) {
    console.error('Error en GET /veterinarias/mia:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// PUT /veterinarias/mia: edita la veterinaria del usuario autenticado
export const actualizarMiVeterinaria = async (req, res) => {
  try {
    if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
      return res.status(400).json({ message: 'Datos inválidos' });
    }

    const veterinaria = await prisma.veterinaria.findUnique({ where: { usuario_id: req.user.id } });
    if (!veterinaria) {
      return res.status(404).json({ message: 'No tenés una veterinaria registrada.' });
    }

    const veterinariaActualizada = await aplicarActualizacionVeterinaria(veterinaria.veterinaria_id, req.body);

    return res.status(200).json({ success: true, data: mapearVeterinariaLegible(veterinariaActualizada) });
  } catch (error) {
    if (error.status === 400) return res.status(400).json({ message: error.message });
    console.error('Error en PUT /veterinarias/mia:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

const actualizarSeccionPropia = async (req, res, camposPermitidos) => {
  try {
    if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
      return res.status(400).json({ message: 'Datos inválidos' });
    }

    const veterinaria = await prisma.veterinaria.findUnique({
      where: { usuario_id: req.user.id },
      select: { veterinaria_id: true }
    });
    if (!veterinaria) {
      return res.status(404).json({ message: 'No tenés una veterinaria registrada.' });
    }

    const body = Object.fromEntries(
      camposPermitidos
        .filter((campo) => req.body[campo] !== undefined)
        .map((campo) => [campo, req.body[campo]])
    );

    const veterinariaActualizada = await aplicarActualizacionVeterinaria(
      veterinaria.veterinaria_id,
      body
    );
    return res.status(200).json({
      success: true,
      data: mapearVeterinariaLegible(veterinariaActualizada)
    });
  } catch (error) {
    if (error.status === 400) return res.status(400).json({ message: error.message });
    if (error.code === 'P2002') {
      return res.status(409).json({ message: 'El CUIT ingresado ya pertenece a otra veterinaria.' });
    }
    console.error('Error al actualizar una sección de Mi Veterinaria:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

export const actualizarMisDatosGenerales = async (req, res) => {
  const error = validarDatosGenerales(req.body || {});
  if (error) return res.status(400).json({ message: error });
  return actualizarSeccionPropia(req, res, [
    'nombre', 'direccion', 'razonSocial', 'cuit', 'telefono', 'email', 'sitioWeb'
  ]);
};

export const actualizarMisServicios = (req, res) =>
  Array.isArray(req.body?.servicios)
    ? actualizarSeccionPropia(req, res, ['servicios'])
    : res.status(400).json({ message: 'Los servicios deben enviarse como una lista.' });

export const actualizarMisProfesionales = (req, res) =>
  Array.isArray(req.body?.profesionales)
    ? actualizarSeccionPropia(req, res, ['profesionales'])
    : res.status(400).json({ message: 'Los profesionales deben enviarse como una lista.' });

export const actualizarMisHorarios = (req, res) => {
  if (!req.body?.horarios || typeof req.body.horarios !== 'object' || Array.isArray(req.body.horarios)) {
    return res.status(400).json({ message: 'Los horarios tienen un formato inválido.' });
  }
  for (const [dia, franja] of Object.entries(req.body.horarios)) {
    if (!DIAS_SEMANA.includes(dia)) {
      return res.status(400).json({ message: `El día "${dia}" no es válido.` });
    }
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(franja?.desde)
      || !/^([01]\d|2[0-3]):[0-5]\d$/.test(franja?.hasta)
      || franja.desde >= franja.hasta) {
      return res.status(400).json({ message: `El horario de "${dia}" no es válido.` });
    }
  }
  if (Object.keys(req.body.horarios).length === 0) {
    return res.status(400).json({ message: 'Seleccioná al menos un día de atención.' });
  }
  return actualizarSeccionPropia(req, res, ['horarios', 'urgencias24hs']);
};

// POST /veterinarias: crea el perfil de una veterinaria (solo rol 'veterinaria')
export const crearVeterinaria = async (req, res) => {
  try {
    const usuarioId = req.user.id;

    const {
      nombre,
      direccion,
      razonSocial,
      cuit,
      telefono,
      email,
      sitioWeb,
      coordenadas,
      latitud: latitudDirecta,
      longitud: longitudDirecta,
      servicios = [],
      profesionales = [],
      horarios = {},
      urgencias24hs
    } = req.body;

    const latitud = latitudDirecta ?? coordenadas?.coordinates?.[1];
    const longitud = longitudDirecta ?? coordenadas?.coordinates?.[0];

    if (latitud === undefined || longitud === undefined) {
      return res.status(400).json({ message: 'Las coordenadas son requeridas' });
    }

    if (profesionales.length > 0) {
      const errorProfesionales = validarProfesionales(profesionales);
      if (errorProfesionales) {
        return res.status(400).json({ message: errorProfesionales });
      }
    }

    if (servicios.length > 0) {
      const errorServicios = validarServicios(servicios);
      if (errorServicios) {
        return res.status(400).json({ message: errorServicios });
      }
    }

    const profesionalesResueltos = [];
    for (const profesional of profesionales) {
      const { nombre: nombreProf, apellido } = separarNombreApellido(profesional.nombre);
      const especialidadId = await resolverEspecialidadId(profesional.especialidad);
      if (!especialidadId) {
        return res.status(400).json({
          message: `Especialidad "${profesional.especialidad}" no reconocida. Debe existir en el catálogo antes de asignarla.`
        });
      }
      profesionalesResueltos.push({
        nombre: nombreProf,
        apellido,
        especialidad_id: especialidadId,
        email: profesional.email,
        serviciosIds: [...new Set(profesional.serviciosIds || [])]
      });
    }

    const serviciosResueltos = [];
    const idsLocalesServicios = new Set();
    for (const servicio of servicios) {
      const idLocal = typeof servicio.idLocal === 'string' ? servicio.idLocal.trim() : '';
      if (!idLocal) {
        return res.status(400).json({ message: 'Cada servicio debe incluir un identificador local válido.' });
      }
      if (idsLocalesServicios.has(idLocal)) {
        return res.status(400).json({ message: 'Los identificadores locales de los servicios deben ser únicos.' });
      }
      idsLocalesServicios.add(idLocal);

      const categoriaId = await resolverCategoriaServicioId(servicio.categoria);
      if (!categoriaId) {
        return res.status(400).json({
          message: `Categoría de servicio "${servicio.categoria}" no reconocida. Debe existir en el catálogo antes de asignarla.`
        });
      }
      serviciosResueltos.push({
        idLocal,
        nombre: servicio.nombre,
        descripcion: servicio.descripcion,
        precio: servicio.precio,
        duracion_minutos: servicio.duracionMinutos,
        categoria_servicio_id: categoriaId
      });
    }

    for (const profesional of profesionalesResueltos) {
      const referenciaDesconocida = profesional.serviciosIds.find(
        (idLocal) => !idsLocalesServicios.has(idLocal)
      );
      if (referenciaDesconocida) {
        return res.status(400).json({
          message: `El profesional referencia un servicio desconocido: ${referenciaDesconocida}.`
        });
      }
    }

    const horariosResueltos = [];
    for (const dia of DIAS_SEMANA) {
      const franja = horarios[dia];
      if (!franja?.desde || !franja?.hasta) continue;

      const diaSemanaId = await resolverDiaSemanaId(dia);
      if (!diaSemanaId) {
        return res.status(400).json({ message: `Día "${dia}" no reconocido en el catálogo.` });
      }
      horariosResueltos.push({
        dia_semana_id: diaSemanaId,
        hora_desde: horaADateTime(franja.desde),
        hora_hasta: horaADateTime(franja.hasta)
      });
    }

    const veterinariaCreada = await prisma.$transaction(async (tx) => {
      const nuevaVeterinaria = await tx.veterinaria.create({
        data: {
          usuario_id: usuarioId,
          nombre,
          direccion,
          razon_social: razonSocial,
          cuit,
          telefono,
          email,
          sitio_web: sitioWeb,
          latitud,
          longitud,
          urgencias: urgencias24hs ?? false,
          horario_veterinaria: { create: horariosResueltos }
        }
      });

      const serviciosPorIdLocal = new Map();
      for (const { idLocal, ...datosServicio } of serviciosResueltos) {
        const servicioCreado = await tx.servicio.create({
          data: { ...datosServicio, veterinaria_id: nuevaVeterinaria.veterinaria_id }
        });
        serviciosPorIdLocal.set(idLocal, servicioCreado.servicio_id);
      }

      for (const profesional of profesionalesResueltos) {
        const profesionalCreado = await tx.profesional.create({
          data: {
            veterinaria_id: nuevaVeterinaria.veterinaria_id,
            nombre: profesional.nombre,
            apellido: profesional.apellido,
            especialidad_id: profesional.especialidad_id,
            email: profesional.email
          }
        });

        if (profesional.serviciosIds.length > 0) {
          await tx.profesional_servicio.createMany({
            data: profesional.serviciosIds.map((idLocal) => ({
              profesional_id: profesionalCreado.profesional_id,
              servicio_id: serviciosPorIdLocal.get(idLocal)
            }))
          });
        }
      }

      return tx.veterinaria.findUnique({
        where: { veterinaria_id: nuevaVeterinaria.veterinaria_id },
        include: relacionesVeterinaria
      });
    });

    return res.status(201).json({ success: true, data: mapearVeterinariaLegible(veterinariaCreada) });
  } catch (error) {
    // Violación de constraint único: usuario_id (1 vet por usuario) o cuit
    if (error.code === 'P2002') {
      const campo = error.meta?.target?.[0];
      if (campo === 'usuario_id') {
        return res.status(409).json({ message: 'Ya tenés una veterinaria registrada con este usuario.' });
      }
      if (campo === 'cuit') {
        return res.status(409).json({ message: 'Ya existe una clínica registrada con este CUIT.' });
      }
      return res.status(409).json({ message: 'Dato duplicado.' });
    }

    console.error('Error en POST /veterinarias:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// PUT /veterinarias/:id 
export const actualizarVeterinaria = async (req, res) => {
  try {
    const { id } = req.params;
    const usuarioId = req.user.id;
    const esAdmin = req.user.rol === 'administrador';

    const veterinaria = await prisma.veterinaria.findFirst({
      where: { veterinaria_id: id, estado_veterinaria_id: 'ACT' }
    });
    if (!veterinaria) {
      return res.status(404).json({ message: 'El recurso no existe.' });
    }

    if (veterinaria.usuario_id !== usuarioId && !esAdmin) {
      return res.status(403).json({ message: 'No tenés permisos para realizar esta acción.' });
    }

    const veterinariaActualizada = await aplicarActualizacionVeterinaria(id, req.body);

    return res.status(200).json({ success: true, data: mapearVeterinariaLegible(veterinariaActualizada) });
  } catch (error) {
    if (error.status === 400) return res.status(400).json({ message: error.message });
    if (error.code === 'P2025') return res.status(404).json({ message: 'El recurso no existe.' });
    console.error('Error en PUT /veterinarias/:id:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// GET /veterinarias/mia/pacientes
export const obtenerPacientesVeterinaria = async (req, res) => {
  try {
    const usuarioId = req.user.id;

    const veterinaria = await prisma.veterinaria.findFirst({
      where: { usuario_id: usuarioId, estado_veterinaria_id: 'ACT' }
    });

    if (!veterinaria) {
      return res.status(404).json({
        success: false,
        message: 'No tenés una veterinaria registrada.'
      });
    }

    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(
      Math.max(parseInt(req.query.limit, 10) || PACIENTES_LIMITE_DEFAULT, 1),
      PACIENTES_LIMITE_MAXIMO
    );
    const skip = (page - 1) * limit;

    const busqueda = (req.query.busqueda || '').trim();

    // IDs de mascotas que tuvieron al menos un turno confirmado/atendido con esta veterinaria
    const mascotaIdsConTurno = await prisma.turno.findMany({
      where: {
        veterinaria_id: veterinaria.veterinaria_id,
        estado_turno: { nombre: { in: ['confirmado', 'atendido'] } },
        mascota_id: { not: null }
      },
      distinct: ['mascota_id'],
      select: { mascota_id: true }
    });
    const idsUnicos = mascotaIdsConTurno.map((t) => t.mascota_id);

    const filtroBase = {
      mascota_id: { in: idsUnicos },
      ...(busqueda
        ? {
          OR: [
            { nombre: { contains: busqueda, mode: 'insensitive' } },
            { usuario: { nombre: { contains: busqueda, mode: 'insensitive' } } },
            { usuario: { apellido: { contains: busqueda, mode: 'insensitive' } } }
          ]
        }
        : {})
    };

    const [pacientes, total] = await Promise.all([
      prisma.mascota.findMany({
        where: filtroBase,
        select: {
          mascota_id: true,
          nombre: true,
          fecha_nacimiento: true,
          foto: true,
            raza: {
           select: {
             nombre: true,
             especie: { select: { nombre: true } }
            }
           },
          usuario: { select: { usuario_id: true, nombre: true, apellido: true } }
        },
        orderBy: { nombre: 'asc' },
        skip,
        take: limit
      }),
      prisma.mascota.count({ where: filtroBase })
    ]);

    const data = pacientes.map((mascota) => ({
      id: mascota.mascota_id,
      nombre: mascota.nombre,
      raza: mascota.raza?.nombre || 'Sin especificar',
       especie: mascota.raza?.especie?.nombre || null,
      fecha_nacimiento: mascota.fecha_nacimiento,
      foto: mascota.foto || null,
      dueño: {
        id: mascota.usuario?.usuario_id,
        nombre: mascota.usuario
          ? `${mascota.usuario.nombre} ${mascota.usuario.apellido}`
          : 'Sin información'
      }
    }));

    return res.status(200).json({
      success: true,
      data,
      paginacion: {
        total,
        page,
        limit,
        totalPaginas: Math.max(Math.ceil(total / limit), 1)
      }
    });
  } catch (error) {
    console.error('Error al obtener pacientes:', error);
    return res.status(500).json({
      success: false,
      message: 'No se pudieron obtener los pacientes.'
    });
  }
};
