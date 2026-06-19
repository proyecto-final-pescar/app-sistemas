import { Router } from 'express'
import User from '../models/User.js'
import Mascota from '../models/Mascota.js'

const router = Router()

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params

    // Buscar el usuario por ID
    const usuario = await User.findById(id)

    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' })
    }

    // Buscar las mascotas de ese usuario
    const mascotas = await Mascota.find({ dueñoId: id })

    // Armar la respuesta con los datos pedidos
    res.json({
      nombre: usuario.name,
      email: usuario.email,
      rol: usuario.role,
      fechaRegistro: usuario.createdAt,
      mascotas: mascotas
    })

  } catch (error) {
    res.status(500).json({ error: 'Error al obtener el usuario', detalle: error.message })
  }
})

export default router