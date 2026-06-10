// Controllers: lógica de cada endpoint
// endpoints de registro
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const register = async (req, res) => {
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
  const user = await User.create({ name, email, password: hashedPassword, role });

  // Generar token
  const token = jwt.sign(
    { id: user._id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );

  res.status(201).json({
    token,
    user: { id: user._id, name: user.name, email: user.email, role: user.role }
  });
};