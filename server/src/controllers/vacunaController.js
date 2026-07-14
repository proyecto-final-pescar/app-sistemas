import Vacuna from '../models/Vacuna.js'
import Mascota from '../models/Mascota.js'

export const crearVacuna = async (req, res) => {
    try {
        const { mascotaId, consultaId, nombre, fechaAplicada } = req.body

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
            consultaId: consultaId || null,
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
            .populate('consultaId', 'fecha categoriaServicio')
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
            .populate('consultaId', 'fecha categoriaServicio')

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

        //      Solo el veterinario que la creó puede editarla
        if (vacuna.profesionalId.toString() !== req.usuario.id) {
            return res.status(403).json({
                success: false,
                message: 'Solo podés editar vacunas que vos registraste'
            })
        }

        const vacunaActualizada = await Vacuna.findByIdAndUpdate(
            req.params.id,
            { ...req.body },
            { new: true, runValidators: true }
        )

        return res.status(200).json({
            success: true,
            data: vacunaActualizada
        })

    } catch (error) {
        console.error('Error en actualizarVacuna:', error)
        return res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        })
    }
}

/* export const eliminarVacuna = async (req, res) => {
    try {
        const vacuna = await Vacuna.findById(req.params.id)

        if (!vacuna) {
            return res.status(404).json({
                success: false,
                message: 'Vacuna no encontrada'
            })
        }

        if (vacuna.profesionalId.toString() !== req.usuario.id) {
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
} */