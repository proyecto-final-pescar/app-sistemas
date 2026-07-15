import Estudio from '../models/Estudio.js'
import Mascota from '../models/Mascota.js'

export const crearEstudio = async (req, res) => {
    try {
        const { mascotaId, consultaId, nombre, fecha, urlArchivo } = req.body

        if (!mascotaId || !nombre || !fecha) {
            return res.status(400).json({
                success: false,
                message: 'mascotaId, nombre y fecha son requeridos'
            })
        }

        const fechaValida = new Date(fecha)
        if (isNaN(fechaValida.getTime())) {
            return res.status(400).json({
                success: false,
                message: 'La fecha no es válida'
            })
        }

        if (urlArchivo) {
            try {
                new URL(urlArchivo)
            } catch {
                return res.status(400).json({
                    success: false,
                    message: 'La URL del archivo no es válida'
                })
            }
        }

        const mascota = await Mascota.findById(mascotaId)
        if (!mascota) {
            return res.status(404).json({
                success: false,
                message: 'Mascota no encontrada'
            })
        }

        const estudio = new Estudio({
            mascotaId,
            dueñoId: mascota.dueñoId,
            profesionalId: req.user.id,
            consultaId: consultaId || null,
            nombre: nombre.trim(),
            fecha: fechaValida,
            urlArchivo: urlArchivo?.trim() || null
        })

        await estudio.save()

        return res.status(201).json({
            success: true,
            data: estudio
        })

    } catch (error) {
        if (error.name === 'ValidationError') {
            const errores = Object.values(error.errors).map(e => e.message)
            return res.status(400).json({
                success: false,
                message: 'Error de validación',
                errores
            })
        }
        console.error('Error en crearEstudio:', error)
        return res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        })
    }
}

export const obtenerEstudiosPorMascota = async (req, res) => {
    try {
        const { mascotaId } = req.params

        const estudios = await Estudio.find({ mascotaId })
            .populate('profesionalId', 'nombre email')
            .populate('historialClinicoId', 'fecha categoriaServicio')
            .sort({ fecha: -1 })

        return res.status(200).json({
            success: true,
            data: estudios
        })

    } catch (error) {
        console.error('Error en obtenerEstudiosPorMascota:', error)
        return res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        })
    }
}

export const obtenerEstudioPorId = async (req, res) => {
    try {
        const estudio = await Estudio.findById(req.params.id)
            .populate('profesionalId', 'nombre email')
            .populate('mascotaId', 'nombre especie')
            .populate('historialClinicoId', 'fecha categoriaServicio')

        if (!estudio) {
            return res.status(404).json({
                success: false,
                message: 'Estudio no encontrado'
            })
        }

        return res.status(200).json({
            success: true,
            data: estudio
        })

    } catch (error) {
        console.error('Error en obtenerEstudioPorId:', error)
        return res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        })
    }
}

export const eliminarEstudio = async (req, res) => {
    try {
        const estudio = await Estudio.findById(req.params.id)

        if (!estudio) {
            return res.status(404).json({
                success: false,
                message: 'Estudio no encontrado'
            })
        }

        if (estudio.profesionalId.toString() !== req.usuario.id) {
            return res.status(403).json({
                success: false,
                message: 'Solo podés eliminar estudios que vos registraste'
            })
        }

        await estudio.deleteOne()

        return res.status(200).json({
            success: true,
            message: 'Estudio eliminado correctamente'
        })

    } catch (error) {
        console.error('Error en eliminarEstudio:', error)
        return res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        })
    }
}

export const actualizarEstudio = async (req, res) => {
    try {
        const estudio = await Estudio.findById(req.params.id)

        if (!estudio) {
            return res.status(404).json({
                success: false,
                message: 'Estudio no encontrado'
            })
        }

        if (estudio.profesionalId.toString() !== req.usuario.id) {
            return res.status(403).json({
                success: false,
                message: 'Solo podés editar estudios que vos registraste'
            })
        }

        const estudioActualizado = await Estudio.findByIdAndUpdate(
            req.params.id,
            { ...req.body },
            { new: true, runValidators: true }
        )

        return res.status(200).json({
            success: true,
            data: estudioActualizado
        })

    } catch (error) {
        console.error('Error en actualizarEstudio:', error)
        return res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        })
    }
}