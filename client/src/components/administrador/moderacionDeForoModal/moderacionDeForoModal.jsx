import { useState, useEffect } from "react";
import Button from "../../ui/button/Button";
import Badge from "../../ui/badge/Badge";
import {
  eliminarPublicacion,
  banearUsuario,
  obtenerUsuarioPorId,
  obtenerReportesPorPublicacion,
  descartarReportesPublicacion,
} from "../../../services/adminService";
import styles from "./moderacionDeForoModal.module.css";

function ModeracionDeForoModal({ publicacion, onClose, onSuccess }) {
  const [banearDueno, setBanearDueno] = useState(false);
  const [loading, setLoading] = useState(false);
  const [datosUsuario, setDatosUsuario] = useState(null);
  const [reportes, setReportes] = useState([]);
  const [loadingReportes, setLoadingReportes] = useState(true);
  const [imagenAmpliada, setImagenAmpliada] = useState(false);

  const id = publicacion?._id || publicacion?.id;
  const nombreMascota = publicacion?.nombre || publicacion?.nombreMascota;
  const titulo = nombreMascota
    ? `Buscando a ${nombreMascota}${publicacion?.especie ? ` (${publicacion.especie})` : ""}`
    : publicacion?.titulo || "Publicación de mascota";

  const fechaPublicacion = publicacion?.createdAt
    ? new Date(publicacion.createdAt).toLocaleDateString("es-AR")
    : publicacion?.fechaPublicacion || "Fecha no especificada";

  // Extraemos el ID del usuario
  const usuarioIdRaw =
    publicacion?.usuarioId?._id ||
    publicacion?.usuarioId ||
    publicacion?.autor?.id;

  // Si `usuarioId` venía populado usamos esos datos, si no, usamos los traídos del fetch `datosUsuario`
  const autor = {
    id: usuarioIdRaw,
    nombre:
      datosUsuario?.nombre ||
      publicacion?.usuarioId?.nombre ||
      publicacion?.contactoNombre ||
      publicacion?.autor?.nombre ||
      "Usuario",
    apellido: datosUsuario?.apellido || publicacion?.usuarioId?.apellido || "",
    telefono:
      datosUsuario?.telefono ||
      publicacion?.contactoTelefono ||
      publicacion?.autor?.telefono ||
      "Sin teléfono",
    email:
      datosUsuario?.email ||
      publicacion?.usuarioId?.email ||
      publicacion?.autor?.email ||
      "Sin email",
  };

  // Efecto para obtener la información del usuario si solo tenemos su ID
  useEffect(() => {
    const cargarDatosUsuario = async () => {
      // Si el ID existe pero no tenemos el objeto usuario con nombre
      if (
        usuarioIdRaw &&
        typeof usuarioIdRaw === "string" &&
        !publicacion?.usuarioId?.nombre
      ) {
        try {
          const res = await obtenerUsuarioPorId(usuarioIdRaw);
          setDatosUsuario(res.data || res);
        } catch (error) {
          console.error("Error al cargar datos del usuario:", error);
        }
      }
    };

    cargarDatosUsuario();
  }, [usuarioIdRaw, publicacion]);


  useEffect(() => {
    const cargarReportes = async () => {
      if (!id) {
        setLoadingReportes(false);
        return;
      }
      setLoadingReportes(true);
      try {
        const data = await obtenerReportesPorPublicacion(id);
        setReportes(data);
      } catch (error) {
        console.error("Error al cargar los reportes de la publicación:", error);
        setReportes([]);
      } finally {
        setLoadingReportes(false);
      }
    };

    cargarReportes();
  }, [id]);

  const descripcion = publicacion?.descripcion || "";
  const ubicacion =
    publicacion?.zona || publicacion?.ubicacion || "Ubicación no especificada";
  const imagen = publicacion?.imagen || publicacion?.foto || "/placeholder-pet.png";

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key !== "Escape") return;
      if (imagenAmpliada) {
        setImagenAmpliada(false);
      } else {
        onClose?.();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [onClose, imagenAmpliada]);

  if (!publicacion) return null;

  const handleBaja = async () => {
    try {
      setLoading(true);

      // Dar de baja (eliminar) la publicación
      // El backend marca los reportes pendientes como "revisado"
      await eliminarPublicacion(id);

      // Si se marcó la casilla de banear al usuario
      if (banearDueno && autor.id) {
        await banearUsuario(autor.id);
      }

      onSuccess?.(); // Notifica al componente padre para recargar la lista
      onClose?.();
    } catch (error) {
      console.error("Error al dar de baja la publicación:", error);
      alert(
        error.response?.data?.mensaje ||
          "Hubo un error al procesar la solicitud.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDescartar = async () => {
    try {
      setLoading(true);

      // Descarta los reportes pendientes; la publicación queda intacta
      await descartarReportesPublicacion(id);

      onSuccess?.(); // Notifica al componente padre para recargar la lista
      onClose?.();
    } catch (error) {
      console.error("Error al descartar los reportes:", error);
      alert(
        error.response?.data?.mensaje ||
          "Hubo un error al procesar la solicitud.",
      );
    } finally {
      setLoading(false);
    }
  };

  const nombreMostrar = autor.apellido
    ? `${autor.nombre} ${autor.apellido}`
    : autor.nombre;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div
        className={styles.modal}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="moderacion-foro-title"
      >
        <header className={styles.header}>
          <h2 id="moderacion-foro-title" className={styles.title}>
            Previsualizar y Moderar Publicación
          </h2>
        </header>

        <div className={styles.body}>
          {/* Columna Izquierda */}
          <div className={styles.columnaPrevisualizacion}>
            <div
              className={styles.contenedorImagen}
              onClick={() => setImagenAmpliada(true)}
              role="button"
              tabIndex={0}
              aria-label="Ver imagen completa"
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") setImagenAmpliada(true);
              }}
            >
              <img src={imagen} alt={titulo} className={styles.imagenPost} />
            </div>

            <div className={styles.postHeader}>
              <div>
                <h3 className={styles.postTitulo}>{titulo}</h3>
                <span className={styles.postMeta}>
                  Publicado el {fechaPublicacion} por{" "}
                  <strong>
                    {nombreMostrar} (
                    {autor.id ? `ID: ...${autor.id.slice(-5)}` : "N/A"})
                  </strong>
                </span>
              </div>
              <span className={styles.badgeId}>...{id?.slice(-6)}</span>
            </div>

            <div className={styles.cajaDescripcion}>
              <p className={styles.textoDescripcion}>{descripcion}</p>
            </div>

            <div className={styles.postFooter}>
              <div className={styles.infoMeta}>
                <svg
                  className={styles.icon}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                <span>{ubicacion}</span>
              </div>

              <div className={styles.infoMetaRight}>
                <div className={styles.infoMeta}>
                  <svg
                    className={styles.icon}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                    />
                  </svg>
                  <span>{autor.telefono} /</span>
                </div>
                <span className={styles.emailText}>{autor.email}</span>
              </div>
            </div>
          </div>

          <div className={styles.divider} />

          {/* Columna Derecha */}
          <div className={styles.columnaReportes}>
            <div className={styles.headerReportes}>
              <h3 className={styles.sectionTitle}>Análisis de Reportes</h3>
              <Badge
                texto={`${reportes.length} Activos`}
                variante="cancelado"
              />
            </div>

            {loadingReportes ? (
              <p className={styles.emptyState}>Cargando reportes...</p>
            ) : reportes.length === 0 ? (
              <p className={styles.emptyState}>
                No hay reportes activos para esta publicación.
              </p>
            ) : (
              <div className={styles.listaReportes}>
                {reportes.map((reporte, index) => (
                  <div
                    key={reporte._id || index}
                    className={styles.tarjetaReporte}
                  >
                    <span className={styles.tipoReporte}>
                      {reporte.motivo
                        ? reporte.motivo.replace("_", " ")
                        : "REPORTADO"}
                    </span>
                    <p className={styles.motivoReporte}>
                      {reporte.descripcion || "Sin descripción adicional."}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* Checkbox Banear Dueño */}
            <label className={styles.tarjetaBanear}>
              <input
                type="checkbox"
                checked={banearDueno}
                onChange={(e) => setBanearDueno(e.target.checked)}
                className={styles.checkboxInput}
                disabled={loading}
              />
              <div className={styles.infoBanear}>
                <span className={styles.tituloBanear}>
                  ¿Desea banear también al dueño de la publicación?
                </span>
                <span className={styles.subtextoBanear}>
                  Esta acción restringirá su acceso al sistema de por vida.
                </span>
              </div>
            </label>
          </div>
        </div>

        <footer className={styles.footer}>
          <Button
            texto="Cancelar"
            variante="secundario"
            tamaño="mediano"
            onClick={onClose}
            disabled={loading}
          />
          <Button
            texto={loading ? "Procesando..." : "Descartar reportes"}
            variante="secundario"
            tamaño="mediano"
            onClick={handleDescartar}
            disabled={loading}
          />
          <Button
            texto={loading ? "Procesando..." : "Baja"}
            variante="peligro"
            tamaño="mediano"
            onClick={handleBaja}
            disabled={loading}
          />
        </footer>
      </div>

      {imagenAmpliada && (
        <div
          className={styles.lightboxOverlay}
          onClick={(e) => {
            e.stopPropagation();
            setImagenAmpliada(false);
          }}
        >
          <button
            type="button"
            className={styles.lightboxCerrar}
            onClick={(e) => {
              e.stopPropagation();
              setImagenAmpliada(false);
            }}
            aria-label="Cerrar imagen"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
          <img
            src={imagen}
            alt={titulo}
            className={styles.lightboxImagen}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}

export default ModeracionDeForoModal;