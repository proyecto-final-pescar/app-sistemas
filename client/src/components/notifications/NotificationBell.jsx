import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Calendar,
  CreditCard,
  CheckCircle2,
  FileText,
  MessageSquare,
  Info,
  Syringe,
  Bell,
  BellOff,
} from "lucide-react";

import {
  obtenerNotificaciones,
  marcarNotificacionComoLeida,
  marcarTodasLasNotificacionesComoLeidas,
} from "../../services/notificacionService";

import styles from "./NotificationBell.module.css";

// Mapeo alineado 1 a 1 con los 7 valores reales de la tabla tipo_notificacion.
const CONFIG_POR_TIPO = {
  estudio: { icono: FileText, clase: "tipoIconoInfo" },
  mensaje: { icono: MessageSquare, clase: "tipoIconoInfo" },
  sistema: { icono: Info, clase: "tipoIconoInfo" },
  turno_confirmado: { icono: CheckCircle2, clase: "tipoIconoConfirmado" },
  turno_pendiente_pago: { icono: CreditCard, clase: "tipoIconoPago" },
  turno_recordatorio: { icono: Calendar, clase: "tipoIconoRecordatorio" },
  vacuna: { icono: Syringe, clase: "tipoIconoVeterinaria" },
};

const CONFIG_DEFAULT = { icono: Bell, clase: "tipoIconoInfo" };

const formatearTiempoRelativo = (fecha) => {
  if (!fecha) return "";

  const ahora = new Date();
  const creada = new Date(fecha);
  const diferenciaMs = ahora - creada;
  const minutos = Math.floor(diferenciaMs / (1000 * 60));
  const horas = Math.floor(diferenciaMs / (1000 * 60 * 60));
  const dias = Math.floor(diferenciaMs / (1000 * 60 * 60 * 24));

  if (minutos < 1) return "Ahora";
  if (minutos < 60) return `Hace ${minutos} minuto${minutos !== 1 ? "s" : ""}`;
  if (horas < 24) return `Hace ${horas} hora${horas !== 1 ? "s" : ""}`;
  if (dias === 1) return "Ayer";
  if (dias < 7) return `Hace ${dias} días`;

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
  const [cargando, setCargando] = useState(true);

  const noLeidas = notificaciones.filter((item) => !item.leida).length;

  useEffect(() => {
    let activo = true;

    obtenerNotificaciones()
      .then((data) => {
        if (activo) setNotificaciones(data);
      })
      .catch((error) => {
        console.error("Error al cargar notificaciones:", error);
      })
      .finally(() => {
        if (activo) setCargando(false);
      });

    return () => {
      activo = false;
    };
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

  const handleAbrirCampana = () => {
    setAbierto((prev) => !prev);
  };

  const handleMarcarTodas = async () => {
    // Optimista: actualiza la UI antes de esperar la respuesta del servidor.
    const previas = notificaciones;
    setNotificaciones((actual) => actual.map((item) => ({ ...item, leida: true })));

    try {
      await marcarTodasLasNotificacionesComoLeidas();
    } catch (error) {
      console.error("Error al marcar todas como leídas:", error);
      setNotificaciones(previas); // revierte si falló
    }
  };

  const handleNotificacion = async (notificacion) => {
    if (!notificacion.leida) {
      const previas = notificaciones;
      setNotificaciones((actual) =>
        actual.map((item) =>
          item._id === notificacion._id ? { ...item, leida: true } : item
        )
      );

      try {
        await marcarNotificacionComoLeida(notificacion._id);
      } catch (error) {
        console.error("Error al marcar notificación como leída:", error);
        setNotificaciones(previas);
      }
    }

    setAbierto(false);

    if (notificacion.link) {
      navigate(notificacion.link);
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
        <Bell size={20} />

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

          {cargando ? (
            <div className={styles.emptyState}>
              <p>Cargando...</p>
            </div>
          ) : notificaciones.length === 0 ? (
            <div className={styles.emptyState}>
              <BellOff size={32} className={styles.emptyIcon} />
              <p>¡Todo al día!</p>
              <small>No tenés notificaciones nuevas</small>
            </div>
          ) : (
            <div className={styles.lista}>
              {notificaciones.map((notificacion) => {
                const config =
                  CONFIG_POR_TIPO[notificacion.tipo] || CONFIG_DEFAULT;
                const IconoComponente = config.icono;

                return (
                  <button
                    type="button"
                    key={notificacion._id}
                    className={`${styles.notificacion} ${
                      !notificacion.leida ? styles.noLeida : ""
                    }`}
                    onClick={() => handleNotificacion(notificacion)}
                  >
                    <span
                      className={`${styles.tipoIcono} ${styles[config.clase]}`}
                    >
                      <IconoComponente size={18} />
                    </span>

                    <div className={styles.contenido}>
                      <p>{notificacion.mensaje}</p>
                      <span>
                        {formatearTiempoRelativo(notificacion.createdAt)}
                      </span>
                    </div>

                    <span
                      className={`${styles.estado} ${
                        notificacion.leida
                          ? styles.estadoLeido
                          : styles.estadoNoLeido
                      }`}
                      aria-label={notificacion.leida ? "Leída" : "No leída"}
                    />
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;