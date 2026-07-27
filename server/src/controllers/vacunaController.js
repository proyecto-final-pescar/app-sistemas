import Vacuna from '../models/Vacuna.js'
import Mascota from '../models/Mascota.js'

export const crearVacuna = async (req, res) => {
    try {
        const { mascotaId, historialClinicoId, nombre, fechaAplicada } = req.body

        if (!mascotaId || !nombre || !fechaAplicada) {
            return res.status(400).json({
                success: false,
                message: 'mascotaId, nombre y fechaAplicada son requeridos'
            })
        }

        const fechaValida = new Date(fechaAplicada)
        if (isNaN(fechaValida.getTime())) {
            return res.status(400).json({
                success: false,
                message: 'La fecha de aplicación no es válida'
            })
        }

        const mascota = await Mascota.findById(mascotaId)
        if (!mascota) {
            return res.status(404).json({
                success: false,
                message: 'Mascota no encontrada'
            })
        }

        const vacuna = new Vacuna({
            mascotaId,
            dueñoId: mascota.dueñoId,
            profesionalId: req.user.id,
            historialClinicoId: historialClinicoId || null,
            nombre: nombre.trim(),
            fechaAplicada: fechaValida
        })

        await vacuna.save()

        return res.status(201).json({
            success: true,
            data: vacuna
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
        console.error('Error en crearVacuna:', error)
        return res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        })
    }
}

export const obtenerVacunasPorMascota = async (req, res) => {
    try {
        const { mascotaId } = req.params

        const vacunas = await Vacuna.find({ mascotaId })
            .populate('profesionalId', 'nombre email')
            .populate('historialClinicoId', 'fecha categoriaServicio')
            .sort({ fechaAplicada: -1 })

        return res.status(200).json({
            success: true,
            data: vacunas
        })

    } catch (error) {
        console.error('Error en obtenerVacunasPorMascota:', error)
        return res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        })
    }
}

export const obtenerVacunaPorId = async (req, res) => {
    try {
        const vacuna = await Vacuna.findById(req.params.id)
            .populate('profesionalId', 'nombre email')
            .populate('mascotaId', 'nombre especie')
            .populate('historialClinicoId', 'fecha categoriaServicio')

        if (!vacuna) {
            return res.status(404).json({
                success: false,
                message: 'Vacuna no encontrada'
            })
        }

        return res.status(200).json({
            success: true,
            data: vacuna
        })

    } catch (error) {
        console.error('Error en obtenerVacunaPorId:', error)
        return res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        })
    }
}

export const actualizarVacuna = async (req, res) => {
    try {
        const vacuna = await Vacuna.findById(req.params.id)

        if (!vacuna) {
            return res.status(404).json({
                success: false,
                message: 'Vacuna no encontrada'
            })
        }

        if (vacuna.profesionalId.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Solo podés editar vacunas que vos registraste'
            })
        }

        // Solo se permiten estos campos
        const { nombre, fechaAplicada, historialClinicoId } = req.body

        if (nombre !== undefined) {
            if (!nombre.trim()) {
                return res.status(400).json({
                    success: false,
                    message: 'El nombre no puede estar vacío'
                })
            }
            vacuna.nombre = nombre.trim()
        }

        if (fechaAplicada !== undefined) {
            const fechaValida = new Date(fechaAplicada)
            if (isNaN(fechaValida.getTime())) {
                return res.status(400).json({
                    success: false,
                    message: 'La fecha no es válida'
                })
            }
            vacuna.fechaAplicada = fechaValida
        }

        if (historialClinicoId !== undefined) vacuna.historialClinicoId = historialClinicoId || null

        await vacuna.save()

        return res.status(200).json({
            success: true,
            data: vacuna
        })

    } catch (error) {
        console.error('Error en actualizarVacuna:', error)
        return res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        })
    }
}

export const eliminarVacuna = async (req, res) => {
    try {
        const vacuna = await Vacuna.findById(req.params.id)

        if (!vacuna) {
            return res.status(404).json({
                success: false,
                message: 'Vacuna no encontrada'
            })
        }

        if (vacuna.profesionalId.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Solo podés eliminar vacunas que vos registraste'
            })
        }

        await vacuna.deleteOne()

        return res.status(200).json({
            success: true,
            message: 'Vacuna eliminada correctamente'
        })

    } catch (error) {
        console.error('Error en eliminarVacuna:', error)
        return res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        })
    }
}