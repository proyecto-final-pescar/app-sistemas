import crypto from 'crypto';
import User from '../models/User.js';
import { sendVerificationEmail } from '../utils/mailer.js';

const TOKEN_VERIFICACION_EXPIRATION_MS = 24 * 60 * 60 * 1000; // 24hs

export const verificarCuenta = async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({
        code: 'INVALID',
        message: 'El enlace de verificación no es válido'
      });
    }

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    // Se busca solo por el hash (sin filtrar por expiración todavía) para
    // poder distinguir "no existe" de "existe pero venció" o "ya se usó".
    const user = await User.findOne({ tokenVerificacion: tokenHash })
      .select('+tokenVerificacion +tokenVerificacionExpires');

    if (!user) {
      return res.status(400).json({
        code: 'INVALID',
        message: 'El enlace de verificación no es válido'
      });
    }

    if (user.verificado) {
      return res.status(200).json({
        success: true,
        code: 'ALREADY_VERIFIED',
        message: 'Tu cuenta ya estaba verificada'
      });
    }

    if (user.tokenVerificacionExpires < Date.now()) {
      return res.status(400).json({
        code: 'EXPIRED',
        message: 'El enlace de verificación venció'
      });
    }

    user.verificado = true;
    await user.save();

    return res.status(200).json({
      success: true,
      code: 'VERIFIED',
      message: 'Cuenta verificada con éxito'
    });
  } catch (error) {
    console.error('Error en verificarCuenta:', error);
    return res.status(500).json({
      code: 'SERVER_ERROR',
      message: 'Error interno del servidor'
    });
  }
};

export const reenviarVerificacion = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'El email es requerido' });
    }

    // Misma respuesta siempre, exista o no la cuenta, esté o no verificada:
    // no filtramos esa información por seguridad.
    const respuestaGenerica = () => res.status(200).json({
      success: true,
      message: 'Si el email está registrado y pendiente de verificación, vas a recibir un correo con un nuevo enlace'
    });

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user || user.verificado) {
      return respuestaGenerica();
    }

    const tokenVerificacion = crypto.randomBytes(32).toString('hex');
    const tokenVerificacionHash = crypto
      .createHash('sha256')
      .update(tokenVerificacion)
      .digest('hex');

    user.tokenVerificacion = tokenVerificacionHash;
    user.tokenVerificacionExpires = Date.now() + TOKEN_VERIFICACION_EXPIRATION_MS;
    await user.save();

    try {
      await sendVerificationEmail(user.email, tokenVerificacion, user.name);
    } catch (mailError) {
      console.error('Error al reenviar el email de verificación:', mailError);
    }

    return respuestaGenerica();
  } catch (error) {
    console.error('Error en reenviarVerificacion:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};