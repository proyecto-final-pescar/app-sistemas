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
const REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const REGEX_HORA = /^([01]\d|2[0-3]):[0-5]\d$/;
const esTextoValido = (texto) => REGEX_SOLO_LETRAS.test((texto || "").trim());


const PREFIJOS_CUIT_VALIDOS = ['20', '23', '24', '27', '30', '33', '34'];

const soloDigitos = (valor) => String(valor ?? '').replace(/\D/g, '');

// CUIT/CUIL: 11 dígitos, prefijo válido y dígito verificador (módulo 11).
const validarCUITCompleto = (cuit) => {
  const d = soloDigitos(cuit);
  if (d.length !== 11) return false;
  if (!PREFIJOS_CUIT_VALIDOS.includes(d.slice(0, 2))) return false;
  const pesos = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
  const suma = pesos.reduce((acc, peso, i) => acc + peso * Number(d[i]), 0);
  let verificador = 11 - (suma % 11);
  if (verificador === 11) verificador = 0;
  if (verificador === 10) return false;
  return verificador === Number(d[10]);
};

// se persiste: XX-XXXXXXXX-X
const normalizarCUIT = (cuit) => {
  const d = soloDigitos(cuit);
  if (d.length !== 11) return String(cuit ?? '').trim();
  return `${d.slice(0, 2)}-${d.slice(2, 10)}-${d.slice(10)}`;
};


const normalizarTelefonoAR = (telefono) => {
  let d = soloDigitos(telefono);
  if (d.startsWith('54')) {
    d = d.slice(2);
    if (d.startsWith('9')) d = d.slice(1);
  }
  if (d.startsWith('0')) d = d.slice(1);
  if (d.startsWith('1115') && d.length === 12) d = '11' + d.slice(4);
  return d;
};
const validarTelefonoAR = (telefono) => /^11[2-9]\d{7}$/.test(normalizarTelefonoAR(telefono));

const normalizarSitioWeb = (sitio) => {
  const s = String(sitio ?? '').trim();
  if (!s) return '';
  return /^https?:\/\//i.test(s) ? s : `https://${s}`;
};
const validarSitioWeb = (sitio) => {
  const s = normalizarSitioWeb(sitio);
  if (!s) return true;
  if (/\s/.test(s)) return false;
  try {
    const url = new URL(s);
    return ['http:', 'https:'].includes(url.protocol) && url.hostname.includes('.');
  } catch {
    return false;
  }
};

// Limpia y normaliza los datos generales antes de validarlos y guardarlos.
const normalizarDatosGenerales = (body) => {
  const limpio = { ...body };
  for (const campo of ['nombre', 'direccion', 'razonSocial', 'cuit', 'telefono', 'email', 'sitioWeb']) {
    if (typeof limpio[campo] === 'string') limpio[campo] = limpio[campo].trim();
  }
  if (typeof limpio.cuit === 'string') limpio.cuit = normalizarCUIT(limpio.cuit);
  if (typeof limpio.telefono === 'string') limpio.telefono = normalizarTelefonoAR(limpio.telefono);
  if (typeof limpio.sitioWeb === 'string') limpio.sitioWeb = normalizarSitioWeb(limpio.sitioWeb);
  return limpio;
};

// Devuelve '' si está todo bien, o el mensaje de error.
const validarHorariosBody = (horarios) => {
  if (!horarios || typeof horarios !== 'object' || Array.isArray(horarios)) {
    return 'Los horarios tienen un formato inválido.';
  }
  const dias = Object.entries(horarios);
  if (dias.length === 0) return 'Seleccioná al menos un día de atención.';
  for (const [dia, franja] of dias) {
    if (!DIAS_SEMANA.includes(dia)) return `El día "${dia}" no es válido.`;
    if (!REGEX_HORA.test(franja?.desde) || !REGEX_HORA.test(franja?.hasta) || franja.desde >= franja.hasta) {
      return `El horario de "${dia}" no es válido.`;
    }
  }
  return '';
};


const CABA_LAT_MIN = -34.7051;
const CABA_LAT_MAX = -34.5265;
const CABA_LNG_MIN = -58.5314;
const CABA_LNG_MAX = -58.3357;

const estaEnCABA = (lat, lng) =>
  Number.isFinite(lat) && Number.isFinite(lng) &&
  lat >= CABA_LAT_MIN && lat <= CABA_LAT_MAX &&
  lng >= CABA_LNG_MIN && lng <= CABA_LNG_MAX;

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


const horaADateTime = (hora) => new Date(`1970-01-01T${hora}:00.000Z`);

const separarNombreApellido = (nombreCompleto) => {
  const partes = (nombreCompleto || '').trim().split(/\s+/);
  const nombre = partes.shift() || '';
  const apellido = partes.join(' ');
  return { nombre, apellido };
};

const obtenerNombreApellido = (profesional) => {
  const apellidoExplicito =
    typeof profesional?.apellido === 'string' ? profesional.apellido.trim() : '';
  if (apellidoExplicito) {
    return { nombre: (profesional?.nombre || '').trim(), apellido: apellidoExplicito };
  }
  return separarNombreApellido(profesional?.nombre);
};


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
      precio: Number(s.precio)
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
    const { nombre, apellido } = obtenerNombreApellido(profesional);
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
          precio: servicio.precio,
          categoria_servicio_id: categoriaId
        }
      });
    } else {
      await tx.servicio.create({
        data: {
          veterinaria_id: veterinariaId,
          nombre: servicio.nombre,
          precio: servicio.precio,
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

  const datosGenerales = normalizarDatosGenerales({
    nombre, direccion, razonSocial, cuit, telefono, email, sitioWeb
  });
  const errorGenerales = validarDatosGenerales(datosGenerales);
  if (errorGenerales) throw { status: 400, message: errorGenerales };

  if (horarios !== undefined) {
    const errorHorarios = validarHorariosBody(horarios);
    if (errorHorarios) throw { status: 400, message: errorHorarios };
  }

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
    if (nombre !== undefined) dataVeterinaria.nombre = datosGenerales.nombre;
    if (direccion !== undefined) dataVeterinaria.direccion = datosGenerales.direccion;
    if (razonSocial !== undefined) dataVeterinaria.razon_social = datosGenerales.razonSocial;
    if (cuit !== undefined) dataVeterinaria.cuit = datosGenerales.cuit;
    if (telefono !== undefined) dataVeterinaria.telefono = datosGenerales.telefono;
    if (email !== undefined) dataVeterinaria.email = datosGenerales.email;
    if (sitioWeb !== undefined) dataVeterinaria.sitio_web = datosGenerales.sitioWeb;
    if (latitud !== undefined) dataVeterinaria.latitud = latitud;
    if (longitud !== undefined) dataVeterinaria.longitud = longitud;
    if (urgencias24hs !== undefined) dataVeterinaria.urgencias = urgencias24hs;

    if (Object.keys(dataVeterinaria).length > 0) {
      await tx.veterinaria.update({ where: { veterinaria_id: veterinariaId }, data: dataVeterinaria });
    }

    if (profesionalesNormalizados !== undefined) await sincronizarProfesionales(tx, veterinariaId, profesionalesNormalizados);
    if (serviciosNormalizados !== undefined) await sincronizarServicios(tx, veterinariaId, serviciosNormalizados);
    if (horarios !== undefined) await sincronizarHorarios(tx, veterinariaId, horarios);

    // Regla de negocio: ningún profesional activo puede quedar sin servicios
    // activos (por ejemplo, al borrar un servicio que era el único que brindaba).
    if (profesionalesNormalizados !== undefined || serviciosNormalizados !== undefined) {
      const sinServicios = await tx.profesional.findMany({
        where: {
          veterinaria_id: veterinariaId,
          active: true,
          profesional_servicio: { none: { servicio: { active: true } } }
        },
        select: { nombre: true, apellido: true }
      });
      if (sinServicios.length > 0) {
        const { nombre: n, apellido: a } = sinServicios[0];
        throw {
          status: 400,
          message: `El profesional "${[n, a].filter(Boolean).join(' ')}" debe tener al menos un servicio asociado.`
        };
      }
    }

    return tx.veterinaria.findUnique({
      where: { veterinaria_id: veterinariaId },
      include: relacionesVeterinaria
    });
  }, { maxWait: 10000, timeout: 30000 });
};

// Valida los datos generales. En creación los campos obligatorios deben venir
// completos; en edición solo se validan los que vienen en el body.
const validarDatosGenerales = (body, { creacion = false } = {}) => {
  const obligatorios = creacion
    ? ['nombre', 'direccion', 'cuit', 'telefono', 'email']
    : ['nombre', 'direccion', 'telefono', 'email'];
  for (const campo of obligatorios) {
    const valor = body[campo];
    if ((creacion && valor === undefined) || (valor !== undefined && !String(valor).trim())) {
      return `El campo ${campo} es obligatorio.`;
    }
  }

  const maximos = { nombre: 80, razonSocial: 80, direccion: 200, email: 60, sitioWeb: 100 };
  for (const [campo, maximo] of Object.entries(maximos)) {
    if (body[campo] !== undefined && String(body[campo]).length > maximo) {
      return `El campo ${campo} no puede superar los ${maximo} caracteres.`;
    }
  }

  if (body.telefono !== undefined && !validarTelefonoAR(body.telefono)) {
    return 'Ingresá un teléfono válido de Buenos Aires: código de área 11 más el número (10 dígitos en total).';
  }
  if (body.email !== undefined && !REGEX_EMAIL.test(String(body.email).trim())) {
    return 'Ingresá un email institucional válido.';
  }
  if (body.cuit !== undefined && !validarCUITCompleto(body.cuit)) {
    return 'Ingresá un CUIT/CUIL válido.';
  }
  if (body.sitioWeb && !validarSitioWeb(body.sitioWeb)) {
    return 'Ingresá un sitio web válido.';
  }
  return '';
};

// Valida nombre, apellido, email, especialidad y servicios de cada profesional.
// Regla de negocio: todo profesional debe tener al menos un servicio asociado.
const validarProfesionales = (profesionales) => {
  if (!Array.isArray(profesionales)) return null;

  const emailsVistos = new Set();

  for (const profesional of profesionales) {
    const { nombre, apellido } = obtenerNombreApellido(profesional);
    const especialidad = (profesional?.especialidad || '').trim();
    const nombreCompleto = `${nombre} ${apellido}`.trim();
    const esNuevo = !profesional?.profesional_id;

    if (!nombre || !apellido || !especialidad) {
      return 'El nombre completo (nombre y apellido) y la especialidad del profesional son obligatorios.';
    }
    if (nombre.length > 60 || apellido.length > 60) {
      return `El nombre "${nombreCompleto}" es demasiado largo.`;
    }
    if (!esTextoValido(nombre) || !esTextoValido(apellido)) {
      return `El nombre "${nombreCompleto}" solo puede contener letras.`;
    }
    if (!esTextoValido(especialidad)) {
      return `La especialidad "${especialidad}" solo puede contener letras.`;
    }

    // El email es obligatorio para profesionales nuevos; en los existentes
    // solo se valida el formato si viene.
    const email = String(profesional?.email || '').trim();
    if (!email && esNuevo) {
      return `El email del profesional "${nombreCompleto}" es obligatorio.`;
    }
    if (email) {
      if (!REGEX_EMAIL.test(email)) {
        return `El email "${email}" del profesional "${nombreCompleto}" no es válido.`;
      }
      const clave = email.toLowerCase();
      if (emailsVistos.has(clave)) {
        return `El email "${email}" está repetido entre los profesionales.`;
      }
      emailsVistos.add(clave);
    }

    if (profesional.serviciosIds !== undefined && !Array.isArray(profesional.serviciosIds)) {
      return `Los servicios del profesional "${nombreCompleto}" deben enviarse como una lista.`;
    }
    // Un profesional nuevo debe traer servicios; uno existente puede omitir
    // el campo (se conservan los actuales) pero no enviarlo vacío.
    const sinServicios = Array.isArray(profesional.serviciosIds)
      ? profesional.serviciosIds.length === 0
      : esNuevo;
    if (sinServicios) {
      return `El profesional "${nombreCompleto}" debe tener al menos un servicio asociado.`;
    }
  }

  return null;
};

// Valida nombre, categoría y precio de cada servicio del arreglo.
// Un servicio NO necesita tener profesionales asignados.
const validarServicios = (servicios) => {
  if (!Array.isArray(servicios)) return null;

  const vistos = new Set();

  for (const servicio of servicios) {
    const nombre = (servicio?.nombre || '').trim();
    const categoria = (servicio?.categoria || '').trim();

    if (!nombre || !categoria || servicio?.precio === undefined || servicio?.precio === null || servicio?.precio === '') {
      return 'El nombre, la categoría y el precio de cada servicio son obligatorios.';
    }
    if (nombre.length > 80) {
      return `El nombre del servicio "${nombre}" no puede superar los 80 caracteres.`;
    }

    const precio = Number(servicio.precio);
    if (
      !Number.isFinite(precio) ||
      precio <= 0 ||
      !/^\d+(\.\d{1,2})?$/.test(String(servicio.precio).trim())
    ) {
      return `El precio "${servicio.precio}" del servicio "${nombre}" debe ser mayor a 0 y tener hasta 2 decimales.`;
    }

    const clave = `${categoria.toLowerCase()}|${nombre.toLowerCase()}`;
    if (vistos.has(clave)) {
      return `El servicio "${nombre}" está repetido en la misma categoría.`;
    }
    vistos.add(clave);
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

    const ids = veterinarias.map((v) => v.veterinaria_id);

    // Un solo query para todos los ratings del batch, en vez de N+1 contra la vista.
    const ratings = ids.length > 0
      ? await prisma.$queryRaw`
          SELECT veterinaria_id, rating, cantidad_resenias
          FROM vw_rating_veterinaria
          WHERE veterinaria_id = ANY(${ids}::uuid[])
        `
      : [];

    const ratingsPorId = new Map(
      ratings.map((r) => [
        r.veterinaria_id,
        { rating: Number(r.rating), cantidadResenias: Number(r.cantidad_resenias) }
      ])
    );

    const data = veterinarias.map((v) => ({
      ...mapearVeterinariaLegible(v),
      rating: ratingsPorId.get(v.veterinaria_id)?.rating ?? null,
      cantidadResenias: ratingsPorId.get(v.veterinaria_id)?.cantidadResenias ?? 0
    }));

    res.status(200).json({ success: true, data });
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

    const [agregado] = await prisma.$queryRaw`
      SELECT rating, cantidad_resenias
      FROM vw_rating_veterinaria
      WHERE veterinaria_id = ${id}::uuid
    `;

    const data = {
      ...mapearVeterinariaLegible(veterinaria),
      rating: agregado ? Number(agregado.rating) : null,
      cantidadResenias: agregado ? Number(agregado.cantidad_resenias) : 0
    };

    res.status(200).json({ success: true, data });
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

    const [agregado] = await prisma.$queryRaw`
      SELECT rating, cantidad_resenias
      FROM vw_rating_veterinaria
      WHERE veterinaria_id = ${veterinaria.veterinaria_id}::uuid
    `;

    const data = {
      ...mapearVeterinariaLegible(veterinaria),
      rating: agregado ? Number(agregado.rating) : null,
      cantidadResenias: agregado ? Number(agregado.cantidad_resenias) : 0
    };

    res.status(200).json({ success: true, data });
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
    if (error.code === 'P2002') {
      return res.status(409).json({ message: 'El CUIT ingresado ya pertenece a otra veterinaria.' });
    }
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

// La validación y normalización de los datos generales (CUIT, teléfono de
// Buenos Aires, email, sitio web) vive en aplicarActualizacionVeterinaria, así
// que aplica igual en el registro y en todas las rutas de edición.
export const actualizarMisDatosGenerales = (req, res) =>
  actualizarSeccionPropia(req, res, [
    'nombre', 'direccion', 'razonSocial', 'cuit', 'telefono', 'email', 'sitioWeb'
  ]);

export const actualizarMisServicios = (req, res) =>
  Array.isArray(req.body?.servicios)
    ? actualizarSeccionPropia(req, res, ['servicios'])
    : res.status(400).json({ message: 'Los servicios deben enviarse como una lista.' });

export const actualizarMisProfesionales = (req, res) =>
  Array.isArray(req.body?.profesionales)
    ? actualizarSeccionPropia(req, res, ['profesionales'])
    : res.status(400).json({ message: 'Los profesionales deben enviarse como una lista.' });

export const actualizarMisHorarios = (req, res) => {
  const errorHorarios = validarHorariosBody(req.body?.horarios);
  if (errorHorarios) return res.status(400).json({ message: errorHorarios });
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

    // Datos generales: mismas reglas que la edición, pero con los campos
    // obligatorios exigidos. El front valida lo mismo, pero solo como feedback.
    const datos = normalizarDatosGenerales({
      nombre, direccion, razonSocial, cuit, telefono, email, sitioWeb
    });
    const errorGenerales = validarDatosGenerales(datos, { creacion: true });
    if (errorGenerales) {
      return res.status(400).json({ message: errorGenerales });
    }

    if (!Array.isArray(servicios) || servicios.length === 0) {
      return res.status(400).json({ message: 'Registrá al menos un servicio.' });
    }
    if (!Array.isArray(profesionales) || profesionales.length === 0) {
      return res.status(400).json({ message: 'Registrá al menos un profesional.' });
    }

    const errorHorarios = validarHorariosBody(horarios);
    if (errorHorarios) {
      return res.status(400).json({ message: errorHorarios });
    }

    const latitud = latitudDirecta ?? coordenadas?.coordinates?.[1];
    const longitud = longitudDirecta ?? coordenadas?.coordinates?.[0];

    if (latitud === undefined || longitud === undefined) {
      return res.status(400).json({ message: 'Las coordenadas son requeridas' });
    }

    const latitudNum = Number(latitud);
    const longitudNum = Number(longitud);
    if (!Number.isFinite(latitudNum) || !Number.isFinite(longitudNum)) {
      return res.status(400).json({ message: 'Las coordenadas deben ser números válidos.' });
    }

    // Cobertura geográfica: por ahora MyPet solo opera en CABA. Esta es la
    // validación que efectivamente protege el dato — la del frontend es
    // solo feedback inmediato para el usuario.
    if (!estaEnCABA(latitudNum, longitudNum)) {
      return res.status(400).json({
        message: 'Por el momento MyPet solo está disponible para veterinarias ubicadas en la Ciudad Autónoma de Buenos Aires (CABA).'
      });
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
      const { nombre: nombreProf, apellido } = obtenerNombreApellido(profesional);
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
        precio: servicio.precio,
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
          nombre: datos.nombre,
          direccion: datos.direccion,
          razon_social: datos.razonSocial,
          cuit: datos.cuit,
          telefono: datos.telefono,
          email: datos.email,
          sitio_web: datos.sitioWeb,
          latitud: latitudNum,
          longitud: longitudNum,
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
    if (error.code === 'P2002') return res.status(409).json({ message: 'El CUIT ingresado ya pertenece a otra veterinaria.' });
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
      mascota_id: mascota.mascota_id,
      nombre: mascota.nombre,
      raza: mascota.raza?.nombre || 'Sin especificar',
      especie: mascota.raza?.especie?.nombre || null,
      fecha_nacimiento: mascota.fecha_nacimiento,
      foto: mascota.foto || null,
      dueño: {
        usuario_id: mascota.usuario?.usuario_id,
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