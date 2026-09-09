import prisma from '../../prisma/client.js';
import { resolverEspecieId, resolverRazaId, resolverSexoMascotaId } from '../utils/catalogos.js';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const esUuidValido = (id) => UUID_REGEX.test(id || '');

const INCLUDE_MASCOTA = {
    raza: { include: { especie: true } },
    sexo_mascota: true
};

const mapearMascotaLegible = (mascota) => {
    if (!mascota) return mascota;
    return {
        _id: mascota.mascota_id,
        nombre: mascota.nombre,
        especie: mascota.raza?.especie?.nombre,
        raza: mascota.raza?.nombre,
        sexo: mascota.sexo_mascota?.nombre,
        fechaNacimiento: mascota.fecha_nacimiento,
        foto: mascota.foto,
        esCastrado: mascota.es_castrado,
        peso: Number(mascota.peso),
        dueñoId: mascota.dueno_id,
        active: mascota.active,
        ...(mascota.ficha_medica !== undefined && {
            fichaMedica: mapearFichaMedicaLegible(mascota.ficha_medica)
        })
    };
};

import { mapearFichaMedicaLegible } from './fichaMedicaController.js';

// GET /mascotas: mascotas activas del usuario logueado
export const obtenerMascotas = async (req, res) => {
    try {
        const duenoId = req.user.id;

        const mascotas = await prisma.mascota.findMany({
            where: { dueno_id: duenoId, active: true },
            include: INCLUDE_MASCOTA,
            orderBy: { nombre: 'asc' }
        });

        res.json(mascotas.map(mapearMascotaLegible));
    } catch (error) {
        console.error('Error en GET /mascotas:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
};

// GET /mascotas/:id: ficha completa de una mascota (con su ficha médica)
export const obtenerMascotaPorId = async (req, res) => {
    try {
        const { id } = req.params;
        const duenoId = req.user.id;

        if (!esUuidValido(id)) {
            return res.status(400).json({ message: 'El id de la mascota no es válido' });
        }

        const mascota = await prisma.mascota.findUnique({
            where: { mascota_id: id },
            include: { ...INCLUDE_MASCOTA, ficha_medica: true }
        });

        if (!mascota || !mascota.active) {
            return res.status(404).json({ message: 'Mascota no encontrada' });
        }
        if (mascota.dueno_id !== duenoId) {
            return res.status(403).json({ message: 'No tenés permiso para ver esta mascota' });
        }

        res.json(mapearMascotaLegible(mascota));
    } catch (error) {
        console.error('Error en GET /mascotas/:id:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
};

// POST /mascotas: crea Mascota + FichaMedica en una sola escritura anidada
export const crearMascota = async (req, res) => {
    try {
        const duenoId = req.user.id;
        const { nombre, especie, raza, sexo, fechaNacimiento, foto, esCastrado, peso } = req.body;

        if (!nombre || !especie || !sexo) {
            return res.status(400).json({ message: 'Nombre, especie y sexo son requeridos' });
        }

        const especieId = await resolverEspecieId(especie);
        if (!especieId) {
            return res.status(400).json({ message: `La especie "${especie}" no es válida` });
        }

        const sexoMascotaId = await resolverSexoMascotaId(sexo);
        if (!sexoMascotaId) {
            return res.status(400).json({ message: `El sexo "${sexo}" no es válido` });
        }

        const razaId = await resolverRazaId(especieId, raza);
        if (!razaId) {
            return res.status(400).json({ message: `La raza "${raza}" no es válida para la especie seleccionada` });
        }

    const nuevaMascota = await prisma.mascota.create({
        data: {
            nombre,
            raza_id: razaId,
            sexo_mascota_id: sexoMascotaId,
            fecha_nacimiento: new Date(fechaNacimiento),
            foto,
            es_castrado: Boolean(esCastrado),
            peso,
            dueno_id: duenoId,
            ficha_medica: { create: {} }
        },
        include: { ...INCLUDE_MASCOTA, ficha_medica: true }
    });

    res.status(201).json(mapearMascotaLegible(nuevaMascota));
    } catch (error) {
        if (error.code === 'P2003') {
            return res.status(400).json({ message: 'Datos de referencia inválidos (raza, sexo o dueño)' });
        }
        console.error('Error en POST /mascotas:', error);
        res.status(500).json({ message: 'Hubo un error al crear la mascota' });
    }
};

// PUT /mascotas/:id
export const actualizarMascota = async (req, res) => {
    try {
        const { id } = req.params;
        const duenoId = req.user.id;

        if (!esUuidValido(id)) {
            return res.status(400).json({ message: 'El id de la mascota no es válido' });
        }

        const mascotaExistente = await prisma.mascota.findUnique({ where: { mascota_id: id } });
        if (!mascotaExistente || !mascotaExistente.active) {
            return res.status(404).json({ message: 'Mascota no encontrada' });
        }
        if (mascotaExistente.dueno_id !== duenoId) {
            return res.status(403).json({ message: 'No tenés permiso para editar esta mascota' });
        }

        const { nombre, especie, raza, sexo, fechaNacimiento, foto, esCastrado, peso } = req.body;
        const data = {};

        if (nombre !== undefined) data.nombre = nombre;
        if (foto !== undefined) data.foto = foto;
        if (esCastrado !== undefined) data.es_castrado = Boolean(esCastrado);
        if (peso !== undefined) data.peso = peso;
        if (fechaNacimiento !== undefined) data.fecha_nacimiento = new Date(fechaNacimiento);

        let especieId = null;
        if (especie !== undefined) {
            especieId = await resolverEspecieId(especie);
            if (!especieId) {
            return res.status(400).json({ message: `La especie "${especie}" no es válida` });
            }
        }

        if (raza !== undefined) {
            const especieIdParaRaza = especieId ?? (await prisma.raza.findUnique({
                where: { raza_id: mascotaExistente.raza_id },
                select: { especie_id: true }
            }))?.especie_id;

            const razaId = await resolverRazaId(especieIdParaRaza, raza);
            if (!razaId) {
                return res.status(400).json({ message: `La raza "${raza}" no es válida para la especie seleccionada` });
            }
            data.raza_id = razaId;
        }

        if (sexo !== undefined) {
            const sexoMascotaId = await resolverSexoMascotaId(sexo);
            if (!sexoMascotaId) {
                return res.status(400).json({ message: `El sexo "${sexo}" no es válido` });
            }
            data.sexo_mascota_id = sexoMascotaId;
        }

        const mascotaActualizada = await prisma.mascota.update({
            where: { mascota_id: id },
            data,
            include: { ...INCLUDE_MASCOTA, ficha_medica: true }
        });

        res.json(mapearMascotaLegible(mascotaActualizada));
    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({ message: 'Mascota no encontrada' });
        }
        if (error.code === 'P2003') {
            return res.status(400).json({ message: 'Datos de referencia inválidos' });
        }
        console.error('Error en PUT /mascotas:', error);
        res.status(500).json({ message: 'Error al actualizar la mascota' });
    }
};

// DELETE /mascotas/:id: BAJA LÓGICA, no borra la fila
export const eliminarMascota = async (req, res) => {
    try {
        const { id } = req.params;
        const duenoId = req.user.id;

        if (!esUuidValido(id)) {
            return res.status(400).json({ message: 'El id de la mascota no es válido' });
        }

        const mascota = await prisma.mascota.findUnique({ where: { mascota_id: id } });
        if (!mascota || !mascota.active) {
            return res.status(404).json({ message: 'Mascota no encontrada' });
        }
        if (mascota.dueno_id !== duenoId) {
            return res.status(403).json({ message: 'No tenés permiso para eliminar esta mascota' });
        }

        await prisma.mascota.update({
            where: { mascota_id: id },
            data: { active: false }
        });

        res.json({ message: 'Mascota eliminada correctamente' });
    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({ message: 'Mascota no encontrada' });
        }
        console.error('Error en DELETE /mascotas:', error);
        res.status(500).json({ message: 'Error al eliminar la mascota' });
    }
};