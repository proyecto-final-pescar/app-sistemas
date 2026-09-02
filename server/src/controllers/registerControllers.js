import bcrypt from 'bcrypt';
import crypto from 'crypto';
import User from '../models/User.js';
import { sendVerificationEmail } from '../utils/mailer.js';

const TOKEN_VERIFICACION_EXPIRATION_MS = 24 * 60 * 60 * 1000; // 24hs

export const register = (rolePermitido) => async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // El rol NO se acepta desde el body.
    // Lo define exclusivamente la ruta pública utilizada.
    if (!['dueno', 'veterinaria'].includes(rolePermitido)) {
      return res.status(400).json({
        message: 'Tipo de registro inválido'
      });
    }

    // Validar campos
    if (!name || !email || !password) {
      return res.status(400).json({
        message: 'Todos los campos son requeridos'
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      return res.status(400).json({
        message: 'Email inválido'
      });
    }

    // Verificar si ya existe
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(409).json({
        message: 'El email ya está registrado'
      });
    }

    // Encriptar contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Token de verificación
    const tokenVerificacion = crypto.randomBytes(32).toString('hex');

    const tokenVerificacionHash = crypto
      .createHash('sha256')
      .update(tokenVerificacion)
      .digest('hex');

    // Guardar usuario.
    // El rol lo fuerza el backend según la ruta utilizada.
    const user = new User({
      name,
      email,
      password: hashedPassword,
      role: rolePermitido,
      verificado: false,
      tokenVerificacion: tokenVerificacionHash,
      tokenVerificacionExpires:
        Date.now() + TOKEN_VERIFICACION_EXPIRATION_MS
    });

    await user.save();

    // El envío del mail no debe romper el registro si falla
    try {
      await sendVerificationEmail(
        user.email,
        tokenVerificacion,
        user.name
      );
    } catch (mailError) {
      console.error(
        'Error al enviar el email de verificación:',
        mailError
      );
    }

    return res.status(201).json({
      success: true,
      message:
        'Cuenta creada. Revisá tu correo para verificar tu cuenta antes de iniciar sesión.'
    });
  } catch (error) {
    console.error('Error en register:', error);

    return res.status(500).json({
      message: 'Error interno del servidor'
    });
  }
};