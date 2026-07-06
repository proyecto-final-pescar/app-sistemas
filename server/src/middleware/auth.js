import jwt from 'jsonwebtoken';

const verifyToken = (req, res, next) => {

    // Leer el header Authorization
    const authHeader = req.headers.authorization;

    // Si no existe el header, devolver 401
    if (!authHeader) {
        return res.status(401).json({
            error: 'No estás autenticado. Por favor iniciá sesión.'
        });
    }
    // Extraer el token del formato "Bearer <token>"
    const token = authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({
            error: 'Credenciales inválidas. Por favor iniciá sesión nuevamente.'
        });
    }

    // Verificar y decodificar el token
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Adjuntar los datos del usuario al request
        req.user = {
            id: decoded.id,
            email: decoded.email,
            rol: decoded.rol
        };

        // Continuar a la siguiente función
        next();

    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                error: 'Tu sesión ha expirado. Por favor iniciá sesión nuevamente.'
            });
        }

        return res.status(401).json({
            error: 'No se pudo verificar tu sesión. Por favor iniciá sesión nuevamente.'
        });
    }
};

// Verifica que el usuario autenticado tenga uno de los roles permitidos
const authorize = (...rolesPermitidos) => {
    return (req, res, next) => {
        if (!req.user || !rolesPermitidos.includes(req.user.role)) {
            return res.status(403).json({
                error: 'No tenés permisos para realizar esta acción'
            });
        }
        next();
    };
};

export { verifyToken, authorize };
export default verifyToken;