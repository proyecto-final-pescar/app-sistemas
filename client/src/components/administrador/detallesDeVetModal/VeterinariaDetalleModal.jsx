import { useState, useEffect } from "react";
import { getVeterinariaAdminById } from "../../../services/adminService";
import styles from "./VeterinariaDetalleModal.module.css";

const VeterinariaDetalleModal = ({ veterinariaId, onClose }) => {
  const [detalle, setDetalle] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!veterinariaId) return;

    const cargarDetalle = async () => {
      setIsLoading(true);
      setError("");
      try {
        const data = await getVeterinariaAdminById(veterinariaId);
        setDetalle(data);
      } catch (err) {
        setError("No se pudo cargar el detalle de la veterinaria.");
      } finally {
        setIsLoading(false);
      }
    };

    cargarDetalle();
  }, [veterinariaId]);

  if (!veterinariaId) return null;

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div className={styles.overlay} onClick={handleOverlayClick}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2 className={styles.titulo}>{detalle?.nombre || "Datos del registro"}</h2>
          <button className={styles.btnCerrar} onClick={onClose} aria-label="Cerrar">
            ✕
          </button>
        </div>

        <div className={styles.contenido}>
          {isLoading && <p className={styles.estadoMensaje}>Cargando datos...</p>}
          {error && <p className={`${styles.estadoMensaje} ${styles.estadoError}`}>{error}</p>}

          {!isLoading && !error && detalle && (
            <>
              <section className={styles.seccion}>
                <h3 className={styles.seccionTitulo}>Datos generales</h3>
                <div className={styles.grid}>
                  <div className={styles.campo}>
                    <span className={styles.etiqueta}>Razón social</span>
                    <span className={styles.valor}>{detalle.razonSocial || "—"}</span>
                  </div>
                  <div className={styles.campo}>
                    <span className={styles.etiqueta}>CUIT</span>
                    <span className={styles.valor}>{detalle.cuit}</span>
                  </div>
                  <div className={styles.campo}>
                    <span className={styles.etiqueta}>Email</span>
                    <span className={styles.valor}>{detalle.email}</span>
                  </div>
                  <div className={styles.campo}>
                    <span className={styles.etiqueta}>Teléfono</span>
                    <span className={styles.valor}>{detalle.telefono}</span>
                  </div>
                  <div className={styles.campo}>
                    <span className={styles.etiqueta}>Dirección</span>
                    <span className={styles.valor}>{detalle.direccion}</span>
                  </div>
                  <div className={styles.campo}>
                    <span className={styles.etiqueta}>Sitio web</span>
                    <span className={styles.valor}>{detalle.sitioWeb || "—"}</span>
                  </div>
                  <div className={styles.campo}>
                    <span className={styles.etiqueta}>Atiende urgencias</span>
                    <span className={styles.valor}>{detalle.urgencias ? "Sí" : "No"}</span>
                  </div>
                  <div className={styles.campo}>
                    <span className={styles.etiqueta}>Fecha de registro</span>
                    <span className={styles.valor}>
                      {new Date(detalle.createdAt).toLocaleDateString("es-AR")}
                    </span>
                  </div>
                </div>
              </section>

              <section className={styles.seccion}>
                <h3 className={styles.seccionTitulo}>
                  Horarios de atención {detalle.horarios?.length > 0 && `(${detalle.horarios.length})`}
                </h3>
                {detalle.horarios?.length > 0 ? (
                  <ul className={styles.lista}>
                    {detalle.horarios.map((h) => (
                      <li key={h._id} className={styles.itemHorario}>
                        <span className={styles.diaSemana}>{h.diaSemana}</span>
                        <span>{h.horaDesde} - {h.horaHasta}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className={styles.sinDatos}>No cargó horarios de atención.</p>
                )}
              </section>

              <section className={styles.seccion}>
                <h3 className={styles.seccionTitulo}>
                  Servicios {detalle.servicios?.length > 0 && `(${detalle.servicios.length})`}
                </h3>
                {detalle.servicios?.length > 0 ? (
                  <ul className={styles.lista}>
                    {detalle.servicios.map((s) => (
                      <li key={s._id} className={styles.itemServicio}>
                        <div>
                          <span className={styles.nombreItem}>{s.nombre}</span>
                          {s.categoria && <span className={styles.categoria}>{s.categoria}</span>}
                        </div>
                        <span className={styles.precio}>
                          {s.precio != null
                            ? s.precio.toLocaleString("es-AR", { style: "currency", currency: "ARS" })
                            : "—"}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className={styles.sinDatos}>No cargó servicios.</p>
                )}
              </section>

              <section className={styles.seccion}>
                <h3 className={styles.seccionTitulo}>
                  Profesionales {detalle.profesionales?.length > 0 && `(${detalle.profesionales.length})`}
                </h3>
                {detalle.profesionales?.length > 0 ? (
                  <ul className={styles.lista}>
                    {detalle.profesionales.map((p) => (
                      <li key={p._id} className={styles.itemProfesional}>
                        <div>
                          <span className={styles.nombreItem}>{p.nombre} {p.apellido}</span>
                          <span className={styles.categoria}>{p.especialidad}</span>
                        </div>
                        {p.email && <span className={styles.emailProfesional}>{p.email}</span>}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className={styles.sinDatos}>No cargó profesionales.</p>
                )}
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default VeterinariaDetalleModal;