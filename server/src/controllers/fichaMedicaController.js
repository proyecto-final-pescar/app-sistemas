import FichaMedica from '../models/FichaMedica.js'

export const actualizarFichaMedica = async (req, res) => {
  try {
    const { mascotaId } = req.params
    const dueñoId = req.user.id // mismo patrón que mascotaController

    const {
      colorPelaje,
      microchip,
      enfermedadesCronicas,
      cirugiasPrevias,
      medicamentosHabituales,
    } = req.body

    const fichaActualizada = await FichaMedica.findOneAndUpdate(
      { mascotaId },
      {
        mascotaId,
        dueñoId,
        colorPelaje,
        microchip,
        enfermedadesCronicas,
        cirugiasPrevias,
        medicamentosHabituales,
      },
      { new: true, upsert: true, runValidators: true }
    )

    res.json({ success: true, data: fichaActualizada })
  } catch (err) {
    res.status(400).json({ message: err.message || 'Error al actualizar la ficha médica' })
  }
}