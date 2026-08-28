import bcrypt from 'bcrypt';
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

    // Token de verificación: se manda el valor plano por mail, en la DB se
    // guarda solo su hash (sha256 alcanza acá: es un token de 32 bytes al
    // azar con muchísima entropía, no una contraseña elegida por una
    // persona, así que no hace falta bcrypt para esto).
    const tokenVerificacion = crypto.randomBytes(32).toString('hex');
    const tokenVerificacionHash = crypto
      .createHash('sha256')
      .update(tokenVerificacion)
      .digest('hex');

    // Guardar usuario
    const user = new User({
      name,
      email,
      password: hashedPassword,
      role,
      verificado: false,
      tokenVerificacion: tokenVerificacionHash,
      tokenVerificacionExpires: Date.now() + TOKEN_VERIFICACION_EXPIRATION_MS
    });

    await user.save();

    // El envío del mail no debe romper el registro si falla
    try {
      await sendVerificationEmail(user.email, tokenVerificacion, user.name);
    } catch (mailError) {
      console.error('Error al enviar el email de verificación:', mailError);
    }

    // Ya no se devuelve un JWT de sesión: la cuenta todavía no está
    // verificada, así que no tiene sentido loguearla automáticamente.
    return res.status(201).json({
      success: true,
      message: 'Cuenta creada. Revisá tu correo para verificar tu cuenta antes de iniciar sesión.'
    });

  } catch (error) {
    console.error('Error en register:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};