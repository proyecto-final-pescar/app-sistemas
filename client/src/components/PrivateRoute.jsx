import { Navigate, useLocation } from 'react-router-dom';


function decodeToken(token) {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch {
    return null;
  }
}

function isTokenValid(payload) {
  if (!payload || !payload.exp) return false;
  return Date.now() < payload.exp * 1000; 
}

/**
 * @param {ReactNode} children - contenido protegido
 * @param {string[]} [allowedRoles] - roles permitidos para esta ruta
 *   (["dueno"], ["veterinaria"], ["administrador"]).
 *   Si no se pasa, solo exige estar logeado(cualquier rol entra)
 */
const PrivateRoute = ({ children, allowedRoles }) => {
  const location = useLocation();
  const token = localStorage.getItem('token');
  const payload = token ? decodeToken(token) : null;
  const tokenValido = isTokenValid(payload);

  const role = tokenValido ? (payload.role || payload.rol) : null;
  const rolPermitido = !allowedRoles || allowedRoles.includes(role);

  // Sin token, token vencido/corrupto, o rol que no corresponde a esta
  // ruta: en todos los casos mandamos a /login.
  if (!tokenValido || !rolPermitido) {
    // Si había un token pero es inválido o no tiene el rol correcto,
    // limpiamos el storage para no dejar un estado inconsistente.
    if (token) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

export default PrivateRoute;