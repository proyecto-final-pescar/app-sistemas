import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { obtenerNotificaciones } from "../services/notificacionService";
import { useAuth } from "../hooks/useAuth.js";

const NotificacionesContext = createContext(null);

const API_BASE_URL = import.meta.env.VITE_API_URL;

export const NotificacionesProvider = ({ children }) => {
  const { usuario, isAuthenticated } = useAuth();

  const [notificaciones, setNotificaciones] = useState([]);
  const [cargando, setCargando] = useState(true);

  const cargar = useCallback(async () => {
    try {
      const data = await obtenerNotificaciones();
      setNotificaciones(data);
    } catch (error) {
      console.error("Error al cargar notificaciones:", error);
    } finally {
      setCargando(false);
    }
  }, []);


  useEffect(() => {
    if (!isAuthenticated) {
      setNotificaciones([]);
      setCargando(false);
      return undefined;
    }

    cargar();

    const token = localStorage.getItem("token");
    if (!token) return undefined;

    // EventSource no puede mandar headers, por eso el token va en la query

    const es = new EventSource(`${API_BASE_URL}/notificaciones/stream?token=${token}`);

    es.addEventListener("notificacion", (evento) => {
      const nueva = JSON.parse(evento.data);
      setNotificaciones((actual) =>
        actual.some((item) => item._id === nueva._id) ? actual : [nueva, ...actual]
      );
    });


    es.onopen = () => cargar();

    es.onerror = () => {
      console.error("Error en la conexión de notificaciones en tiempo real");
    };

    return () => {
      es.close();
    };
    
  }, [isAuthenticated, usuario?.id, cargar]);

  const marcarLeidaLocal = useCallback((id) => {
    setNotificaciones((actual) =>
      actual.map((item) => (item._id === id ? { ...item, leida: true } : item))
    );
  }, []);

  const marcarTodasLeidasLocal = useCallback(() => {
    setNotificaciones((actual) => actual.map((item) => ({ ...item, leida: true })));
  }, []);

  return (
    <NotificacionesContext.Provider
      value={{
        notificaciones,
        cargando,
        cargar,
        marcarLeidaLocal,
        marcarTodasLeidasLocal,
        setNotificaciones,
      }}
    >
      {children}
    </NotificacionesContext.Provider>
  );
};

export const useNotificaciones = () => {
  const ctx = useContext(NotificacionesContext);
  if (!ctx) throw new Error("useNotificaciones debe usarse dentro de NotificacionesProvider");
  return ctx;
};