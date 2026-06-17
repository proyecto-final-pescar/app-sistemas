import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../models/usuario.js';

export const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Validar campos
    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: 'Todos los campos son requeridos' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Email inválido' });
    }

    // Verificar si ya existe
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: 'El email ya está registrado' });
    }

    // Encriptar contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Guardar usuario
    const user = new User({
      name,
      email,
      password: hashedPassword,
      role
    });
    // Generar token
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    await user.save();

    res.status(201).json({
      success: true,
      data: {
        token,
        user: { id: user._id, name: user.name, email: user.email, role: user.role }
      }
    });

  } catch (error) {
    console.error('Error en register:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};