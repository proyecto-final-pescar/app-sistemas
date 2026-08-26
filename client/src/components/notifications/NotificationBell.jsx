import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Calendar,
  CreditCard,
  CheckCircle2,
  XCircle,
  Users,
  ShieldCheck,
  Bell,
  BellOff
} from "lucide-react";

import {
  obtenerNotificaciones,
  obtenerCantidadNoLeidas,
  marcarNotificacionComoLeida,
  marcarTodasComoLeidas,
} from "../../services/notificacionesService";

import styles from "./NotificationBell.module.css";

const CONFIG_POR_TIPO = {
  recordatorio_turno: { icono: Calendar, clase: "tipoIconoRecordatorio" },
  plazo_pago: { icono: CreditCard, clase: "tipoIconoPago" },
  turno_confirmado: { icono: CheckCircle2, clase: "tipoIconoConfirmado" },
  turno_cancelado: { icono: XCircle, clase: "tipoIconoCancelado" },
  turno_reservado: { icono: Users, clase: "tipoIconoInfo" },
  veterinaria_solicitud: { icono: ShieldCheck, clase: "tipoIconoVeterinaria" },
};

const CONFIG_DEFAULT = { icono: Bell, clase: "tipoIconoInfo" };

//Datos mockeados para pruebas de diseño, una vez hecho la logica de notificaciones quitarlo para usar datos reales
const NOTIFICACIONES_MOCK = [
  {
    _id: "mock-1",
    tipo: "recordatorio_turno",
    mensaje: "Recordatorio: Firulais tiene turno mañana a las 10:30.",
    leida: false,
    createdAt: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
    link: "/mis-turnos",
  },
  {
    _id: "mock-2",
    tipo: "plazo_pago",
    mensaje: "El plazo para confirmar el pago de tu turno está por vencer.",
    leida: false,
    createdAt: new Date(Date.now() - 49 * 60 * 1000).toISOString(),
    link: "/mis-turnos",
  },
  {
    _id: "mock-3",
    tipo: "turno_confirmado",
    mensaje: "Tu turno con Clínica Patitas fue confirmado para mañana a las 16:00.",
    leida: false,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    link: "/mis-turnos",
  },
  {
    _id: "mock-4",
    tipo: "turno_cancelado",
    mensaje: "Tu turno del jueves fue cancelado.",
    leida: true,
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    link: "/mis-turnos",
  },
  {
    _id: "mock-5",
    tipo: "turno_reservado",
    mensaje: "Nuevo turno reservado por Lucía para Rocco.",
    leida: false,
    createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    link: "/agenda",
  },
  {
    _id: "mock-6",
    tipo: "veterinaria_solicitud",
    mensaje: "Nueva veterinaria solicitó registrarse en MyPet.",
    leida: false,
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    link: "/admin/veterinarias",
  },
];

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
      setNotificaciones(
        Array.isArray(data) && data.length > 0 ? data : NOTIFICACIONES_MOCK
      );
    } catch (errorCarga) {
      console.error(
        "Error al cargar notificaciones (usando datos de ejemplo):",
        errorCarga
      );
      setNotificaciones(NOTIFICACIONES_MOCK);
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
        errorLectura.message || "No se pudo abrir la notificación."
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

          {!cargando && !error && notificaciones.length === 0 && (
            <div className={styles.emptyState}>
              <BellOff size={32} className={styles.emptyIcon} />
              <p>¡Todo al día!</p>
              <small>No tenés notificaciones nuevas</small>
            </div>
          )}

          {!cargando && !error && notificaciones.length > 0 && (
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
                      aria-label={
                        notificacion.leida ? "Leída" : "No leída"
                      }
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