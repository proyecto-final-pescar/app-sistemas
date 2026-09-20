export const obtenerJwtSecret = () => {
  const secret = process.env.JWT_SECRET?.trim();
  if (!secret) {
    const error = new Error('Falta configurar JWT_SECRET.');
    error.code = 'JWT_CONFIG_ERROR';
    throw error;
  }
  return secret;
};
