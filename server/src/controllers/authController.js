import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import User from '../models/User.js' 

export const login = async (req, res) => {
  try {
    const { email, password } = req.body

    const user = await User.findOne({ email: email.toLowerCase() }) 

    if (!user) {
      return res.status(401).json({ mensaje: 'Credenciales incorrectas' })
    }

    const esValida = await bcrypt.compare(password, user.password)

    if (!esValida) {
      return res.status(401).json({ mensaje: 'Credenciales incorrectas' })
    }

    const token = jwt.sign(
      {
        id: user._id,
        email: user.email,
        role: user.role
      },
      process.env.JWT_SECRET || 'clave_secreta_temporal',
      { expiresIn: '24h' }
    )

    user.historialSesiones.push({ fecha: new Date() })
    await user.save()

    return res.status(200).json({
      token,
      usuario: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    })

  } catch (error) {
    console.error('Error en el login:', error)
    return res.status(500).json({ mensaje: 'Error interno del servidor' })
  }
}