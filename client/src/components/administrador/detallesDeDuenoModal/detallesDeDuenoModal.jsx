import { useEffect, useState } from "react";
import { obtenerUsuarioPorId } from "../../../services/adminService";
import Badge from "../../ui/badge/Badge";
import styles from "./detallesDeDuenoModal.module.css";

const COLORES_MASCOTA = ["verde", "violeta"];

function DetallesDeDuenoModal({ duenoId, onClose }) {
  const [dueno, setDueno] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Cargar los datos del usuario o cambiar duenoId
  useEffect(() => {
    if (!duenoId) return;

    const fetchDueno = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await obtenerUsuarioPorId(duenoId);

        if (response.success) {
          setDueno(response.data);
        } else {
          setError("No se pudo obtener la información del dueño.");
        }
      } catch (err) {
        console.error("Error al cargar detalle del dueño:", err);
        setError(
          err.response?.data?.message || "Error al conectar con el servidor.",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchDueno();
  }, [duenoId]);

  // Cerrar con tecla Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!duenoId) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div
        className={styles.modal}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="detalles-dueno-title"
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
            <p>Cargando información del dueño...</p>
          </div>
        )}

        {error && (
          <div className={styles.errorState}>
            <p>{error}</p>
          </div>
        )}

        {!loading && !error && dueno && (
          <>
            <header className={styles.header}>
              <h2 id="detalles-dueno-title" className={styles.title}>
                Detalle de Dueño: {dueno.nombre}
              </h2>
            </header>

            <div className={styles.body}>
              {/* Columna Izquierda: Datos Personales */}
              <div className={styles.columnaDatos}>
                <div className={styles.sectionHeader}>
                  <svg
                    className={styles.iconUser}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                  <h3 className={styles.sectionTitle}>Datos Personales</h3>
                </div>

                <div className={styles.gridDatos}>
                  <div className={styles.field}>
                    <span className={styles.label}>ID Usuario</span>
                    <span className={styles.value}>{dueno.id}</span>
                  </div>

                  <div className={styles.field}>
                    <span className={styles.label}>Estado</span>
                    <div>
                      <Badge
                        texto={dueno.active ? "Activa" : "Inactiva"}
                        variante={dueno.active ? "confirmado" : "cancelado"}
                      />
                    </div>
                  </div>

                  <div className={`${styles.field} ${styles.fullWidth}`}>
                    <span className={styles.label}>Nombre Completo</span>
                    <span className={styles.value}>{dueno.nombre}</span>
                  </div>

                  <div className={`${styles.field} ${styles.fullWidth}`}>
                    <span className={styles.label}>Dirección</span>
                    <span className={styles.value}>
                      {dueno.zona || "No especificada"}
                    </span>
                  </div>

                  <div className={styles.field}>
                    <span className={styles.label}>Email</span>
                    <span className={styles.value}>{dueno.email}</span>
                  </div>

                  <div className={styles.field}>
                    <span className={styles.label}>Teléfono</span>
                    <span className={styles.value}>
                      {dueno.telefono || "Sin registrar"}
                    </span>
                  </div>
                </div>
              </div>

              <div className={styles.divider} />

              {/* Columna Derecha: Mascotas Asociadas */}
              <div className={styles.columnaMascotas}>
                <div className={styles.sectionHeader}>
                  <h3 className={styles.sectionTitle}>
                    Mascotas Asociadas ({dueno.mascotas?.length || 0})
                  </h3>
                </div>

                {!dueno.mascotas || dueno.mascotas.length === 0 ? (
                  <p className={styles.emptyState}>
                    Este dueño no tiene mascotas registradas.
                  </p>
                ) : (
                  <div className={styles.listaMascotas}>
                    {dueno.mascotas.map((mascota, index) => {
                      const colorClase =
                        styles[COLORES_MASCOTA[index % COLORES_MASCOTA.length]];

                      return (
                        <div
                          key={mascota._id || index}
                          className={`${styles.tarjetaMascota} ${colorClase}`}
                        >
                          <img
                            src={
                              mascota.foto ||
                              "https://via.placeholder.com/100?text=Mascota"
                            }
                            alt={mascota.nombre}
                            className={styles.avatarMascota}
                          />
                          <div className={styles.infoMascota}>
                            <span className={styles.nombreMascota}>
                              {mascota.nombre}
                            </span>
                            <span className={styles.edadMascota}>
                              {mascota.especie} - {mascota.raza || "Sin raza"}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default DetallesDeDuenoModal;
