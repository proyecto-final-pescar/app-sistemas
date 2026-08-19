import User from '../models/User.js';

export const verificarCuenta = async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({ message: 'El token es requerido' });
    }

    const user = await User.findOne({
      tokenVerificacion: token,
      tokenVerificacionExpires: { $gt: Date.now() }
    }).select('+tokenVerificacion +tokenVerificacionExpires');

    if (!user) {
      return res.status(400).json({ message: 'El token es inválido o ha expirado' });
    }

    user.verificado = true;
    user.tokenVerificacion = undefined;
    user.tokenVerificacionExpires = undefined;
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Cuenta verificada con éxito'
    });
  } catch (error) {
    console.error('Error en verificarCuenta:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};