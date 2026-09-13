// valida que el usuario tenga rol 'administrador'
// Debe usarse siempre despues de verifyToken, depende de req.user
const esAdmin = (req, res, next) => {
  if (!req.user || req.user.rol !== 'administrador') {
    return res.status(403).json({ message: 'No tenés permiso para realizar esta acción' });
  }

  next();
};

export default esAdmin;