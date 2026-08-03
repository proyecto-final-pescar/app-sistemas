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

const formatearFecha = (fechaStr, horaStr) => {
  if (!fechaStr) return "Sin fecha";
  const fechaObj = new Date(fechaStr);
  const fechaLimpia = fechaObj.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  });
  return `${fechaLimpia} - ${horaStr || "--:--"} hs`;
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

  const inicialesDueno = obtenerIniciales(turno?.usuarioId?.name);

  // Obtener nombre del profesional si existe profesionalId en el turno
  const profesionalNombre =
    turno?.veterinariaId?.profesionales?.find(
      (prof) => String(prof._id) === String(turno?.profesionalId),
    )?.nombre || "No especificado";

  // Definir el monto
  const montoFormateado = turno?.monto ? `$${turno.monto}` : "Consultar";

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
            {/* Header con Título y Badge de Estado */}
            <div className={styles.header}>
              <h2 id="detalles-turno-title" className={styles.title}>
                Detalle del turno
              </h2>
              <Badge
                texto={turno.estado}
                variante={turno.estado?.toLowerCase()}
              />
            </div>

            {/* Sección: Información del turno */}
            <section className={styles.section}>
              <h3 className={styles.sectionTitle}>Información del turno</h3>

              <div className={styles.grid}>
                <div className={styles.field}>
                  <span className={styles.label}>Fecha y hora</span>
                  <span className={styles.value}>
                    {formatearFecha(turno.fecha, turno.hora)}
                  </span>
                </div>

                <div className={styles.field}>
                  <span className={styles.label}>Servicio</span>
                  <span className={styles.value}>
                    {turno.motivo || "No especificado"}
                  </span>
                </div>

                <div className={styles.field}>
                  <span className={styles.label}>Veterinaria</span>
                  <span className={styles.value}>
                    {turno.veterinariaId?.nombre || "No especificada"}
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
                  {turno.pagoId ? (
                    <button
                      type="button"
                      className={styles.linkComprobante}
                      onClick={() => onVerComprobante?.(turno.pagoId)}
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

            {/* Sección: Dueño */}
            <section className={styles.section}>
              <h3 className={styles.sectionTitle}>Dueño</h3>
              <div className={styles.profileRow}>
                <div className={styles.avatarDueno} aria-hidden="true">
                  {inicialesDueno}
                </div>
                <div className={styles.profileInfo}>
                  <span className={styles.profileName}>
                    {turno.usuarioId?.name || "Sin nombre"}
                  </span>
                  <span className={styles.profileSubtext}>
                    {turno.usuarioId?.email || "Sin email"}
                  </span>
                </div>
              </div>
            </section>

            {/* Sección: Mascota */}
            <section className={styles.section}>
              <h3 className={styles.sectionTitle}>Mascota</h3>
              <div className={styles.profileRow}>
                <div className={styles.avatarMascota}>
                  {turno.mascotaId?.foto ? (
                    <img
                      src={turno.mascotaId.foto}
                      alt={turno.mascotaId.nombre}
                    />
                  ) : (
                    <span className={styles.iconMascota} aria-hidden="true">
                      🐾
                    </span>
                  )}
                </div>
                <div className={styles.profileInfo}>
                  <span className={styles.profileName}>
                    {turno.mascotaId?.nombre || "Sin nombre"}
                  </span>
                  <span className={styles.profileSubtext}>
                    {turno.mascotaId?.especie || "Especie no descrita"}
                    {turno.mascotaId?.raza ? ` · ${turno.mascotaId.raza}` : ""}
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
