// server/src/utils/catalogos.js
import prisma from '../../prisma/client.js';

// Los catálogos casi no cambian (se cargan por seed/admin directo en DB),
// así que se cachean en memoria con TTL de 5 minutos. Las requests
// concurrentes comparten una sola carga en vuelo en vez de pegarle N veces
// a la DB (ej. un registro con varios servicios/profesionales).
const TTL_MS = 5 * 60 * 1000;

// clave -> { datos: Map|null, expiraEn: number, promesa: Promise<Map>|null }
const caches = new Map();

const normalizarClave = (texto) => (texto || '').trim().toLowerCase();

const obtenerMapaCatalogo = (claveCache, modelo, campoId, claveCompuesta = null) => {
  const ahora = Date.now();
  const entrada = caches.get(claveCache);

  if (entrada?.datos && entrada.expiraEn > ahora) {
    return Promise.resolve(entrada.datos);
  }
  // Hay una carga en vuelo: compartirla en vez de duplicarla
  if (entrada?.promesa) {
    return entrada.promesa;
  }

  const promesa = (async () => {
    const filas = await prisma[modelo].findMany({
      select: { [campoId]: true, nombre: true, ...(claveCompuesta ? { [claveCompuesta]: true } : {}) },
    });
    const mapa = new Map();
    for (const fila of filas) {
      const clave = claveCompuesta
        ? `${fila[claveCompuesta]}|${normalizarClave(fila.nombre)}`
        : normalizarClave(fila.nombre);
      mapa.set(clave, fila[campoId]);
    }
    caches.set(claveCache, { datos: mapa, expiraEn: Date.now() + TTL_MS, promesa: null });
    return mapa;
  })();

  caches.set(claveCache, {
    datos: entrada?.datos ?? null,
    expiraEn: entrada?.expiraEn ?? 0,
    promesa,
  });
  // Si la carga falla, se limpia para reintentar en el próximo llamado.
  // El error se propaga igual que antes (sin caché no se tragaba).
  promesa.catch(() => {
    if (caches.get(claveCache)?.promesa === promesa) {
      caches.delete(claveCache);
    }
  });

  return promesa;
};

// Por si a futuro un endpoint admin edita catálogos
export const invalidarCacheCatalogos = () => {
  caches.clear();
};

export const resolverEspecialidadId = async (nombre) => {
  const mapa = await obtenerMapaCatalogo('especialidad', 'especialidad', 'especialidad_id');
  return mapa.get(normalizarClave(nombre)) ?? null;
};

export const resolverCategoriaServicioId = async (nombre) => {
  const mapa = await obtenerMapaCatalogo('categoria_servicio', 'categoria_servicio', 'categoria_servicio_id');
  return mapa.get(normalizarClave(nombre)) ?? null;
};

export const resolverDiaSemanaId = async (nombreDia) => {
  const mapa = await obtenerMapaCatalogo('dia_semana', 'dia_semana', 'dia_semana_id');
  return mapa.get(normalizarClave(nombreDia)) ?? null;
};

export const resolverEspecieId = async (nombre) => {
  const mapa = await obtenerMapaCatalogo('especie', 'especie', 'especie_id');
  return mapa.get(normalizarClave(nombre)) ?? null;
};

export const resolverRazaId = async (especieId, nombreRaza) => {
  if (!especieId) return null;
  const mapa = await obtenerMapaCatalogo('raza', 'raza', 'raza_id', 'especie_id');
  return mapa.get(`${especieId}|${normalizarClave(nombreRaza)}`) ?? null;
};

export const resolverSexoMascotaId = async (nombre) => {
  const mapa = await obtenerMapaCatalogo('sexo_mascota', 'sexo_mascota', 'sexo_mascota_id');
  return mapa.get(normalizarClave(nombre)) ?? null;
};