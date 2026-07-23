// valida que el usuario tenga rol 'administrador'
// Debe usarse siempredespues  de verifyToken  depende de req.user
const esAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'administrador') {
    return res.status(403).json({ message: 'No tenés permiso para realizar esta acción' });
  }

  next();
};

export default esAdmin;