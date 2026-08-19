import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  obtenerNotificaciones,
  obtenerCantidadNoLeidas,
  marcarNotificacionComoLeida,
  marcarTodasComoLeidas,
} from "../../services/notificacionesService";

import styles from "./NotificationBell.module.css";

const ICONOS_POR_TIPO = {
  turno: "📅",
  estudio: "🧪",
  vacuna: "💉",
  mensaje: "💬",
  sistema: "🔔",
};

const formatearTiempoRelativo = (fecha) => {
  if (!fecha) return "";

  const ahora = new Date();
  const creada = new Date(fecha);

  const diferenciaMs = ahora - creada;
  const minutos = Math.floor(diferenciaMs / (1000 * 60));
  const horas = Math.floor(diferenciaMs / (1000 * 60 * 60));
  const dias = Math.floor(diferenciaMs / (1000 * 60 * 60 * 24));

  if (minutos < 1) {
    return "Ahora";
  }

  if (minutos < 60) {
    return `Hace ${minutos} minuto${minutos !== 1 ? "s" : ""}`;
  }

  if (horas < 24) {
    return `Hace ${horas} hora${horas !== 1 ? "s" : ""}`;
  }

  if (dias === 1) {
    return "Ayer";
  }

  if (dias < 7) {
    return `Hace ${dias} días`;
  }

  return creada.toLocaleDateString("es-AR", {
    day: "numeric",
    month: "short",
  });
};

const NotificationBell = () => {
  const navigate = useNavigate();
  const containerRef = useRef(null);

  const [abierto, setAbierto] = useState(false);
  const [notificaciones, setNotificaciones] = useState([]);
  const [noLeidas, setNoLeidas] = useState(0);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const cargarConteo = async () => {
      try {
        const cantidad = await obtenerCantidadNoLeidas();
        setNoLeidas(cantidad);
      } catch (errorConteo) {
        console.error(
          "Error al obtener notificaciones no leídas:",
          errorConteo
        );
      }
    };

    cargarConteo();
  }, []);

  useEffect(() => {
    const cerrarAlHacerClickAfuera = (evento) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(evento.target)
      ) {
        setAbierto(false);
      }
    };

    document.addEventListener("mousedown", cerrarAlHacerClickAfuera);

    return () => {
      document.removeEventListener("mousedown", cerrarAlHacerClickAfuera);
    };
  }, []);

  const cargarNotificaciones = async () => {
    setCargando(true);
    setError("");

    try {
      const data = await obtenerNotificaciones();
      setNotificaciones(Array.isArray(data) ? data : []);
    } catch (errorCarga) {
      console.error("Error al cargar notificaciones:", errorCarga);

      setError(
        errorCarga.message || "No se pudieron cargar las notificaciones."
      );
    } finally {
      setCargando(false);
    }
  };

  const handleAbrirCampana = async () => {
    const nuevoEstado = !abierto;
    setAbierto(nuevoEstado);

    if (nuevoEstado) {
      await cargarNotificaciones();
    }
  };

  const handleMarcarTodas = async () => {
    try {
      await marcarTodasComoLeidas();

      setNotificaciones((previas) =>
        previas.map((item) => ({
          ...item,
          leida: true,
        }))
      );

      setNoLeidas(0);
    } catch (errorLectura) {
      console.error(
        "Error al marcar todas las notificaciones como leídas:",
        errorLectura
      );

      setError(
        errorLectura.message ||
          "No se pudieron marcar las notificaciones como leídas."
      );
    }
  };

  const handleNotificacion = async (notificacion) => {
    try {
      if (!notificacion.leida) {
        await marcarNotificacionComoLeida(notificacion._id);

        setNotificaciones((previas) =>
          previas.map((item) =>
            item._id === notificacion._id
              ? { ...item, leida: true }
              : item
          )
        );

        setNoLeidas((cantidad) => Math.max(0, cantidad - 1));
      }

      setAbierto(false);

      if (notificacion.link) {
        navigate(notificacion.link);
      }
    } catch (errorLectura) {
      console.error(
        "Error al marcar la notificación como leída:",
        errorLectura
      );

      setError(
        errorLectura.message ||
          "No se pudo abrir la notificación."
      );
    }
  };

  return (
    <div className={styles.container} ref={containerRef}>
      <button
        type="button"
        className={styles.bellButton}
        aria-label="Notificaciones"
        aria-expanded={abierto}
        onClick={handleAbrirCampana}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>

        {noLeidas > 0 && (
          <span className={styles.badge}>
            {noLeidas > 9 ? "9+" : noLeidas}
          </span>
        )}
      </button>

      {abierto && (
        <div className={styles.dropdown}>
          <div className={styles.dropdownHeader}>
            <h3>Notificaciones</h3>

            {noLeidas > 0 && (
              <button
                type="button"
                className={styles.marcarTodas}
                onClick={handleMarcarTodas}
              >
                Marcar todas como leídas
              </button>
            )}
          </div>

          {cargando && (
            <div className={styles.emptyState}>
              <p>Cargando notificaciones...</p>
            </div>
          )}

          {!cargando && error && (
            <div className={styles.emptyState}>
              <p>{error}</p>
            </div>
          )}

          {!cargando &&
            !error &&
            notificaciones.length === 0 && (
              <div className={styles.emptyState}>
                <span>🔔</span>
                <p>¡Todo al día!</p>
                <small>No tenés notificaciones nuevas</small>
              </div>
            )}

          {!cargando &&
            !error &&
            notificaciones.length > 0 && (
              <div className={styles.lista}>
                {notificaciones.map((notificacion) => (
                  <button
                    type="button"
                    key={notificacion._id}
                    className={`${styles.notificacion} ${
                      !notificacion.leida
                        ? styles.noLeida
                        : ""
                    }`}
                    onClick={() =>
                      handleNotificacion(notificacion)
                    }
                  >
                    <span className={styles.tipoIcono}>
                      {ICONOS_POR_TIPO[notificacion.tipo] || "🔔"}
                    </span>

                    <div className={styles.contenido}>
                      <p>{notificacion.mensaje}</p>

                      <span>
                        {formatearTiempoRelativo(
                          notificacion.createdAt
                        )}
                      </span>
                    </div>

                    <span
                      className={`${styles.estado} ${
                        notificacion.leida
                          ? styles.estadoLeido
                          : styles.estadoNoLeido
                      }`}
                      aria-label={
                        notificacion.leida
                          ? "Leída"
                          : "No leída"
                      }
                    />
                  </button>
                ))}
              </div>
            )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;