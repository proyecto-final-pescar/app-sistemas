import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/User.js';
import { sendVerificationEmail } from '../utils/mailer.js';

const TOKEN_VERIFICACION_EXPIRATION_MS = 24 * 60 * 60 * 1000; // 24hs

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

    // Generar token de verificación de cuenta
    const tokenVerificacion = crypto.randomBytes(32).toString('hex');

    // Guardar usuario
    const user = new User({
      name,
      email,
      password: hashedPassword,
      role,
      verificado: false,
      tokenVerificacion,
      tokenVerificacionExpires: Date.now() + TOKEN_VERIFICACION_EXPIRATION_MS
    });

    // Generar token
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    await user.save();

    // El envío del mail no debe romper el registro si falla
    try {
      await sendVerificationEmail(user.email, tokenVerificacion, user.name);
    } catch (mailError) {
      console.error('Error al enviar el email de verificación:', mailError);
    }

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