import { useEffect, useState } from "react";
import { getTurnoAdminById } from "../../../services/adminService";
import Badge from "../../ui/badge/Badge";
import styles from "./detallesDeTurnoModal.module.css";

const obtenerIniciales = (nombre) => {
  if (!nombre) return "?";
  return nombre
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((palabra) => palabra[0].toUpperCase())
    .join("");
};

const formatearFecha = (fechaISO, horaInicio) => {
  if (!fechaISO) return "Sin fecha";
  const [anio, mes, dia] = fechaISO.slice(0, 10).split("-");
  return `${dia}/${mes}/${anio} - ${horaInicio || "--:--"} hs`;
};

function DetallesDeTurnoModal({ turnoId, onClose, onVerComprobante }) {
  const [turno, setTurno] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!turnoId) return;

    const fetchTurno = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await getTurnoAdminById(turnoId);

        if (response.success) {
          setTurno(response.data);
        } else {
          setError("No se pudo obtener la información del turno.");
        }
      } catch (err) {
        console.error("Error al obtener detalle del turno:", err);
        setError(
          err.response?.data?.message || "Error al conectar con el servidor.",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchTurno();
  }, [turnoId]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose?.();
    };

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  if (!turnoId) return null;

  const inicialesDueno = obtenerIniciales(turno?.dueno?.nombre);

  const profesionalNombre = turno?.profesional
    ? `${turno.profesional.nombre} ${turno.profesional.apellido}`
    : "No especificado";

  const montoFormateado = turno?.monto != null
    ? turno.monto.toLocaleString("es-AR", { style: "currency", currency: "ARS" })
    : "Consultar";

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div
        className={styles.modal}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="detalles-turno-title"
      >
        <button
          className={styles.closeBtn}
          onClick={onClose}
          aria-label="Cerrar"
        >
          ✕
        </button>

        {loading && (
          <div className={styles.loadingState}>
            <p>Cargando detalles del turno...</p>
          </div>
        )}

        {error && (
          <div className={styles.errorState}>
            <p>{error}</p>
          </div>
        )}

        {!loading && !error && turno && (
          <>
            <div className={styles.header}>
              <h2 id="detalles-turno-title" className={styles.title}>
                Detalle del turno
              </h2>
              <Badge
                texto={turno.estado}
                variante={turno.estado?.toLowerCase()}
              />
            </div>

            <section className={styles.section}>
              <h3 className={styles.sectionTitle}>Información del turno</h3>

              <div className={styles.grid}>
                <div className={styles.field}>
                  <span className={styles.label}>Fecha y hora</span>
                  <span className={styles.value}>
                    {formatearFecha(turno.fecha, turno.hora_inicio)}
                  </span>
                </div>

                <div className={styles.field}>
                  <span className={styles.label}>Servicio</span>
                  <span className={styles.value}>
                    {turno.servicio?.nombre || turno.motivo || "No especificado"}
                  </span>
                </div>

                <div className={styles.field}>
                  <span className={styles.label}>Veterinaria</span>
                  <span className={styles.value}>
                    {turno.veterinaria?.nombre || "No especificada"}
                  </span>
                </div>

                <div className={styles.field}>
                  <span className={styles.label}>Profesional</span>
                  <span className={styles.value}>{profesionalNombre}</span>
                </div>

                <div className={styles.field}>
                  <span className={styles.label}>Monto</span>
                  <span className={`${styles.value} ${styles.monto}`}>
                    {montoFormateado}
                  </span>
                </div>

                <div className={styles.field}>
                  <span className={styles.label}>Comprobante de pago</span>
                  {turno.pago?.pago_id ? (
                    <button
                      type="button"
                      className={styles.linkComprobante}
                      onClick={() => onVerComprobante?.(turno.pago.pago_id)}
                      aria-label="Ver comprobante de pago"
                    >
                      Ver comprobante <span aria-hidden="true">→</span>
                    </button>
                  ) : (
                    <span className={styles.value}>Sin pago registrado</span>
                  )}
                </div>
              </div>
            </section>

            <section className={styles.section}>
              <h3 className={styles.sectionTitle}>Dueño</h3>
              <div className={styles.profileRow}>
                <div className={styles.avatarDueno} aria-hidden="true">
                  {inicialesDueno}
                </div>
                <div className={styles.profileInfo}>
                  <span className={styles.profileName}>
                    {turno.dueno?.nombre || "Sin nombre"}
                  </span>
                  <span className={styles.profileSubtext}>
                    {turno.dueno?.email || "Sin email"}
                  </span>
                </div>
              </div>
            </section>

            <section className={styles.section}>
              <h3 className={styles.sectionTitle}>Mascota</h3>
              <div className={styles.profileRow}>
                <div className={styles.avatarMascota}>
                  {turno.mascota?.foto ? (
                    <img
                      src={turno.mascota.foto}
                      alt={turno.mascota.nombre}
                    />
                  ) : (
                    <span className={styles.iconMascota} aria-hidden="true">
                      🐾
                    </span>
                  )}
                </div>
                <div className={styles.profileInfo}>
                  <span className={styles.profileName}>
                    {turno.mascota?.nombre || "Sin nombre"}
                  </span>
                  <span className={styles.profileSubtext}>
                    {turno.mascota?.especie || "Especie no descrita"}
                    {turno.mascota?.raza ? ` · ${turno.mascota.raza}` : ""}
                  </span>
                </div>
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}

export default DetallesDeTurnoModal;