const verificarRol = (...rolesPermitidos) => {
  return (req, res, next) => {
    // 1. Verificamos que el usuario exista en la request (que haya pasado por auth.js)
    if (!req.user) {
      return res.status(401).json({ 
        mensaje: "Acceso denegado. No se encontró información del usuario." 
      });
    }

    // 2. Extraemos el rol exacto del usuario de la request (asumiendo que auth.js lo puso en req.user.rol)
    const rolUsuario = req.user.rol; 

    // 3. Verificamos si el rol del usuario está dentro de los permitidos para esta ruta
    if (!rolesPermitidos.includes(rolUsuario)) {
      return res.status(403).json({ 
        mensaje: "Acceso denegado. Tu cuenta no tiene permisos para realizar esta acción." 
      });
    }

    // 4. Si tiene el rol correcto, lo dejamos pasar a la ruta
    next();
  };
};

export default verificarRol;