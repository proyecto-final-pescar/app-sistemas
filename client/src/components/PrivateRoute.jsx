import { Navigate, useLocation } from 'react-router-dom';
import ChatBot from './chatbot/ChatBot';

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

  const PrivateRoute = ({ children, allowedRoles }) => {
  const location = useLocation();
  const token = localStorage.getItem('token');
  const payload = token ? decodeToken(token) : null;
  const tokenValido = isTokenValid(payload);

  const role = tokenValido ? (payload.role || payload.rol) : null;
  const rolPermitido = !allowedRoles || allowedRoles.includes(role);

  if (!tokenValido || !rolPermitido) {
    if (token) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // No renderizar nada si no hay token válido
  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return (
    <>
      {children}
      {role === 'dueno' && <ChatBot />}
    </>
  );
};

export default PrivateRoute;