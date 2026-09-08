import { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle,
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  Flag,
  ImageOff,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Plus,
  RefreshCw,
  Search,
  Trash2,
} from "lucide-react";
import NavbarPublic from "../../../components/layout/NavbarPublic";
import Sidebar from "../../../components/layout/Sidebar";
import TopBar from "../../../components/layout/TopBar";
import Modal from "../../../components/layout/modal/Modal";
import ConfirmModal from "../../../components/ui/confirm-modal/ConfirmModal";
import Select from "../../../components/ui/select/Select";
import FormularioPublicacion from "../../../components/forms/FormularioPublicacion";
import FormularioReporte from "../../../components/forms/FormularioReporte/FormularioReporte";
import { useAuth } from "../../../hooks/useAuth";
import {
  cambiarEstadoPublicacion,
  eliminarPublicacion,
  obtenerPublicaciones,
} from "../../../services/publicacionService";
import { obtenerZonas } from "../../../services/zonaService";
import styles from "./Foro.module.css";

const TABS_ESTADO = [
  { value: "todas", label: "Todas" },
  { value: "ACT", label: "Buscando" },
  { value: "CER", label: "Resueltos" },
];

const CONFIG_CONFIRMACION = {
  eliminar: {
    titulo: "Eliminar publicación",
    mensaje: (p) =>
      `¿Querés eliminar la publicación de "${p.nombre || "esta mascota"}"? Esta acción no se puede deshacer.`,
    textoConfirmar: "Eliminar",
    textoConfirmando: "Eliminando…",
    variante: "peligro",
  },
  marcarEncontrada: {
    titulo: "Marcar como encontrada",
    mensaje: (p) =>
      `¿Confirmás que "${p.nombre || "esta mascota"}" ya apareció? La publicación va a pasar a "Caso cerrado".`,
    textoConfirmar: "Confirmar",
    textoConfirmando: "Marcando…",
    variante: "primario",
  },
};

const getMensajeError = (error, fallback) => {
  const data = error?.response?.data;
  if (typeof data === "string") return data;
  return data?.message || data?.mensaje || data?.error || fallback;
};

const getOwnerId = (publicacion) => publicacion?.usuario?.usuario_id;

const getOwnerName = (publicacion) => {
  const owner = publicacion?.usuario;
  if (!owner) return "Tutor MyPet";
  const nombreCompleto = `${owner.nombre ?? ""} ${owner.apellido ?? ""}`.trim();
  return nombreCompleto || "Tutor MyPet";
};

const getOwnerInitials = (publicacion) => {
  const nombre = getOwnerName(publicacion);
  const iniciales = nombre
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0]?.toUpperCase())
    .join("");
  return iniciales || "MP";
};

const formatearFecha = (fecha) => {
  if (!fecha) return "Fecha sin informar";
  const date = new Date(fecha);
  if (Number.isNaN(date.getTime())) return "Fecha sin informar";
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
};

const getContactHref = (contacto) => {
  const valor = contacto?.trim();
  if (!valor) return "";
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor)) return `mailto:${valor}`;
  const digitos = valor.replace(/[^\d+]/g, "");
  const cantidadDigitos = digitos.replace(/\D/g, "").length;
  if (cantidadDigitos >= 6) return `tel:${digitos}`;
  return "";
};

const getWhatsAppHref = (contacto) => {
  const valor = contacto?.trim();
  if (!valor) return "";
  let digitos = valor.replace(/\D/g, "");
  if (digitos.length < 6) return "";

  
  if (!digitos.startsWith("54")) {
    if (digitos.startsWith("0")) digitos = digitos.slice(1);
    if (digitos.startsWith("15")) digitos = digitos.slice(2);
    digitos = `549${digitos}`;
  }

  return `https://wa.me/${digitos}`;
};

function Foro() {
  const { usuario } = useAuth();
  const [publicaciones, setPublicaciones] = useState([]);
  const [zonas, setZonas] = useState([]);
  const [filtroEstado, setFiltroEstado] = useState("todas");
  const [filtroZona, setFiltroZona] = useState("todas");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [modalAbierto, setModalAbierto] = useState(false);
  const [accionId, setAccionId] = useState("");
  const [reportadas, setReportadas] = useState(new Set());
  const [publicacionAReportar, setPublicacionAReportar] = useState(null);
  const [avisoYaReportado, setAvisoYaReportado] = useState(null);
  const [confirmacion, setConfirmacion] = useState(null);
  const [confirmando, setConfirmando] = useState(false);

  const estaAutenticado = Boolean(usuario?.usuario_id || usuario?.id);

  const esPropia = useCallback(
    (publicacion) => {
      const ownerId = getOwnerId(publicacion);
      const currentUserId = usuario?.usuario_id || usuario?.id;
      return Boolean(currentUserId && ownerId && String(ownerId) === String(currentUserId));
    },
    [usuario]
  );

  const titulo =
    filtroEstado === "ACT"
      ? "Publicaciones Activas"
      : filtroEstado === "CER"
      ? "Casos Resueltos"
      : "Publicaciones del Foro";

  const esFiltroActivo = filtroEstado === "ACT";

  const cargarZonas = useCallback(async () => {
    try {
      const data = await obtenerZonas();
      setZonas(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error al cargar zonas:", err);
    }
  }, []);

  const cargarPublicaciones = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const data = await obtenerPublicaciones({
        zonaId: filtroZona !== "todas" ? filtroZona : undefined,
        estado: filtroEstado !== "todas" ? filtroEstado : undefined,
      });
      setPublicaciones(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error al cargar publicaciones:", err);
      setError(getMensajeError(err, "No pudimos cargar el foro. Intentá nuevamente en unos minutos."));
    } finally {
      setLoading(false);
    }
  }, [filtroEstado, filtroZona]);

  useEffect(() => {
    cargarZonas();
  }, [cargarZonas]);

  useEffect(() => {
    cargarPublicaciones();
  }, [cargarPublicaciones]);

  useEffect(() => {
    if (!success) return undefined;
    const timer = setTimeout(() => setSuccess(""), 3200);
    return () => clearTimeout(timer);
  }, [success]);

  const abrirModal = () => {
    if (!estaAutenticado) {
      setSuccess("");
      setError("Podés ver el foro sin iniciar sesión. Para crear una publicación necesitás entrar como tutor.");
      return;
    }
    setModalAbierto(true);
  };

  const cerrarModal = () => setModalAbierto(false);
  const cerrarModalReporte = () => setPublicacionAReportar(null);
  const cerrarAvisoYaReportado = () => setAvisoYaReportado(null);

  const handlePublicacionGuardada = async () => {
    setModalAbierto(false);
    setFiltroEstado("ACT");
    setSuccess("Publicación creada correctamente.");
    await cargarPublicaciones();
  };

  const handleReporteExitoso = (publicacionId) => {
    setReportadas((current) => new Set(current).add(publicacionId));
    setSuccess("Publicación reportada. Un administrador la va a revisar.");
    setPublicacionAReportar(null);
  };

  const handleYaReportado = (publicacion) => {
    setReportadas((current) => new Set(current).add(publicacion.publicacion_id));
    setPublicacionAReportar(null);
    setAvisoYaReportado(publicacion);
  };

  const pedirConfirmacion = (tipo, publicacion) => setConfirmacion({ tipo, publicacion });

  const cancelarConfirmacion = () => {
    if (confirmando) return;
    setConfirmacion(null);
  };

  const ejecutarEliminar = async (publicacion) => {
    const publicacionesPrevias = publicaciones;
    try {
      setConfirmando(true);
      setAccionId(publicacion.publicacion_id);
      setError("");
      setPublicaciones((current) => current.filter((p) => p.publicacion_id !== publicacion.publicacion_id));
      await eliminarPublicacion(publicacion.publicacion_id);
      setSuccess("Publicación eliminada correctamente.");
    } catch (err) {
      console.error("Error al eliminar publicación:", err);
      setPublicaciones(publicacionesPrevias);
      setError(getMensajeError(err, "No pudimos eliminar la publicación."));
    } finally {
      setAccionId("");
      setConfirmando(false);
      setConfirmacion(null);
    }
  };

  const ejecutarMarcarEncontrada = async (publicacion) => {
    const publicacionesPrevias = publicaciones;
    try {
      setConfirmando(true);
      setAccionId(publicacion.publicacion_id);
      setError("");
      setPublicaciones((current) =>
        current.map((p) => (p.publicacion_id === publicacion.publicacion_id ? { ...p, estado_publicacion_id: "CER" } : p))
      );
      await cambiarEstadoPublicacion(publicacion.publicacion_id, "CER");
      setSuccess("Caso marcado como encontrado.");
    } catch (err) {
      console.error("Error al cambiar estado:", err);
      setPublicaciones(publicacionesPrevias);
      setError(getMensajeError(err, "No pudimos actualizar el estado de la publicación."));
    } finally {
      setAccionId("");
      setConfirmando(false);
      setConfirmacion(null);
    }
  };

  const handleConfirmar = () => {
    if (!confirmacion) return;
    const { tipo, publicacion } = confirmacion;
    if (tipo === "eliminar") ejecutarEliminar(publicacion);
    else if (tipo === "marcarEncontrada") ejecutarMarcarEncontrada(publicacion);
  };

  const handleContactar = async (event, contacto) => {
    if (getContactHref(contacto)) return;
    event.preventDefault();
    try {
      await navigator.clipboard.writeText(contacto);
      setSuccess("Contacto copiado.");
    } catch {
      setError(`Contacto: ${contacto}`);
    }
  };

  const handleReportarClick = (publicacion) => {
    if (esPropia(publicacion)) return;
    if (!estaAutenticado) {
      setError("Necesitás iniciar sesión para reportar una publicación.");
      return;
    }
    if (reportadas.has(publicacion.publicacion_id)) {
      setAvisoYaReportado(publicacion);
      return;
    }
    setPublicacionAReportar(publicacion);
  };

  const renderAcciones = (publicacion) => {
    const propia = esPropia(publicacion);
    const admin = usuario?.rol === "administrador";
    const puedeGestionar = propia || admin;
    const cerrada = publicacion.estado_publicacion_id === "CER";
    const contactHref = getContactHref(publicacion.contacto);

    if (puedeGestionar) {
      return (
        <div className={styles.ownerActions}>
          {cerrada ? (
            <button className={styles.outlineSuccessButton} type="button" disabled>
              <CheckCircle2 size={16} />
              Caso cerrado
            </button>
          ) : (
            <button
              className={styles.successButton}
              type="button"
              onClick={() => pedirConfirmacion("marcarEncontrada", publicacion)}
              disabled={accionId === publicacion.publicacion_id}
            >
              <CheckCircle2 size={16} />
              Marcar encontrada
            </button>
          )}
          <button
            className={styles.dangerButton}
            type="button"
            title="Eliminar publicación"
            aria-label="Eliminar publicación"
            onClick={() => pedirConfirmacion("eliminar", publicacion)}
            disabled={accionId === publicacion.publicacion_id}
          >
            <Trash2 size={17} />
          </button>
        </div>
      );
    }

    if (cerrada) {
      return (
        <button className={styles.outlineSuccessButton} type="button" disabled>
          Caso cerrado
        </button>
      );
    }

    const esMail = contactHref.startsWith("mailto:");
    const esTelefono = contactHref.startsWith("tel:");
    const whatsappHref = esTelefono ? getWhatsAppHref(publicacion.contacto) : "";

    if (esMail) {
      return (
        <a
          className={styles.contactButton}
          href={contactHref}
          title={`Escribir a ${publicacion.contacto}`}
          onClick={(event) => handleContactar(event, publicacion.contacto)}
        >
          <Mail size={16} />
          <span className={styles.contactButtonText}>{publicacion.contacto}</span>
        </a>
      );
    }

    if (esTelefono && whatsappHref) {
      return (
        <div className={styles.contactButtons}>
          <a
            className={styles.whatsappButton}
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            title={`Escribir por WhatsApp a ${publicacion.contacto}`}
          >
            <MessageCircle size={16} />
            WhatsApp
          </a>
          <a
            className={styles.contactButton}
            href={contactHref}
            title={`Llamar a ${publicacion.contacto}`}
          >
            <Phone size={16} />
            Llamar
          </a>
        </div>
      );
    }

    return (
      <a
        className={styles.contactButton}
        href="#contacto"
        title={publicacion.contacto ? `Contacto: ${publicacion.contacto}` : "Contactar al dueño"}
        onClick={(event) => handleContactar(event, publicacion.contacto)}
      >
        <Phone size={16} />
        <span className={styles.contactButtonText}>{publicacion.contacto || "Contactar al dueño"}</span>
      </a>
    );
  };

  const configModal = confirmacion ? CONFIG_CONFIRMACION[confirmacion.tipo] : null;

  return (
    <div className={styles.layout}>
      {estaAutenticado && <Sidebar title="Foro de Perdidos" />}

      <div className={`${styles.pageWrapper} ${!estaAutenticado ? styles.publicPageWrapper : ""}`}>
        {estaAutenticado ? <TopBar title="Foro de Perdidos" /> : <NavbarPublic />}

        <main className={styles.content}>
          <section className={styles.hero}>
            <div>
              <h1 className={styles.title}>{titulo}</h1>
              <p className={styles.subtitle}>Ayudemos a que vuelvan a casa.</p>
            </div>
            <button className={styles.primaryButton} type="button" onClick={abrirModal}>
              <Plus size={19} />
              Nueva publicación
            </button>
          </section>

          <section className={styles.filters} aria-label="Filtros del foro">
            <div className={styles.selectWrapZona}>
              <Select
                ariaLabel="Filtrar por zona"
                opciones={[
                  { value: "todas", label: "Zona: Todas" },
                  ...zonas.map((zona) => ({ value: String(zona.id), label: `Zona: ${zona.nombre}` })),
                ]}
                value={String(filtroZona)}
                onChange={(evento) => setFiltroZona(evento.target.value)}
              />
            </div>

            <div className={styles.tabGroup}>
              {TABS_ESTADO.map((tab) => (
                <button
                  key={tab.value}
                  type="button"
                  className={`${styles.tabButton} ${filtroEstado === tab.value ? styles.tabActive : ""}`}
                  onClick={() => setFiltroEstado(tab.value)}
                  aria-pressed={filtroEstado === tab.value}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </section>

          {error && (
            <div className={styles.errorBanner} role="alert">
              <AlertCircle size={18} />
              {error}
            </div>
          )}

          {success && (
            <div className={styles.successBanner} role="status">
              <CheckCircle2 size={18} />
              {success}
            </div>
          )}

          <div className={styles.statusLine}>
            <span>
              {loading
                ? "Cargando publicaciones..."
                : `${publicaciones.length} ${publicaciones.length === 1 ? "publicación" : "publicaciones"}`}
            </span>
            <button className={styles.refreshButton} type="button" onClick={cargarPublicaciones}>
              <RefreshCw size={15} />
              Actualizar
            </button>
          </div>

          {loading ? (
            <div className={styles.grid}>
              {[1, 2, 3].map((item) => (
                <div className={styles.skeleton} key={item} />
              ))}
            </div>
          ) : publicaciones.length === 0 ? (
            <div className={styles.emptyState}>
              <Search size={18} />
              {filtroEstado === "todas"
                ? "Todavía no hay publicaciones para estos filtros."
                : esFiltroActivo
                ? "No hay publicaciones activas para estos filtros."
                : "No hay casos resueltos para estos filtros."}
            </div>
          ) : (
            <div className={styles.grid}>
              {publicaciones.map((publicacion) => {
                const cerrada = publicacion.estado_publicacion_id === "CER";
                const propia = esPropia(publicacion);
                const yaReportada = reportadas.has(publicacion.publicacion_id);

                return (
                  <article className={styles.card} key={publicacion.publicacion_id}>
                    <div className={styles.imageWrap}>
                      {publicacion.foto ? (
                        <img
                          className={styles.image}
                          src={publicacion.foto}
                          alt={publicacion.nombre || "Mascota perdida"}
                          onError={(event) => {
                            event.currentTarget.style.display = "none";
                            event.currentTarget.nextElementSibling?.classList.add(styles.imagePlaceholderVisible);
                          }}
                        />
                      ) : null}
                      <div
                        className={`${styles.imagePlaceholder} ${!publicacion.foto ? styles.imagePlaceholderVisible : ""}`}
                        aria-hidden={Boolean(publicacion.foto)}
                      >
                        <ImageOff size={28} />
                        <span>Sin foto</span>
                      </div>
                      <span className={`${styles.badge} ${cerrada ? styles.badgeFound : styles.badgeLost}`}>
                        {cerrada ? "Encontrado" : "Se busca"}
                      </span>

                      {!propia && (
                        <button
                          className={`${styles.reportButton} ${yaReportada ? styles.reportButtonReportado : ""}`}
                          type="button"
                          title={yaReportada ? "Ya reportaste esta publicación" : "Reportar publicación"}
                          aria-label={yaReportada ? "Ya reportaste esta publicación" : "Reportar publicación"}
                          onClick={() => handleReportarClick(publicacion)}
                        >
                          {yaReportada ? <CheckCircle2 size={14} /> : <Flag size={14} />}
                        </button>
                      )}
                    </div>

                    <div className={styles.cardBody}>
                      <h2 className={`${styles.petName} ${cerrada ? styles.resolvedName : ""}`}>
                        {publicacion.nombre || "Mascota sin nombre"}
                      </h2>

                      <p className={styles.meta}>
                        <MapPin size={15} />
                        {publicacion.zona?.nombre || "Zona sin informar"}
                      </p>

                      <p className={styles.dateText}>
                        <CalendarDays size={15} />
                        {formatearFecha(publicacion.fecha)}
                      </p>

                      <p className={styles.description}>{publicacion.descripcion}</p>

                        {publicacion.en_revision && (
                          <div className={styles.enRevisionBanner}>
                            <AlertTriangle size={14} />
                            En revisión por reportes de la comunidad — solo vos la ves mientras un admin la evalúa.
                          </div>
                        )}

                      <div className={styles.ownerRow}>
                        <span className={styles.ownerAvatar} aria-hidden="true">
                          {getOwnerInitials(publicacion)}
                        </span>
                        <span className={styles.ownerName}>Publicado por {getOwnerName(publicacion)}</span>
                      </div>

                      <div className={styles.actions}>{renderAcciones(publicacion)}</div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </main>
      </div>

      <Modal isOpen={modalAbierto} onClose={cerrarModal} size="lg" sinPadding>
        <FormularioPublicacion
          onCancelar={cerrarModal}
          onGuardado={handlePublicacionGuardada}
          zonas={zonas}
        />
      </Modal>

      <Modal isOpen={Boolean(publicacionAReportar)} onClose={cerrarModalReporte}>
        <FormularioReporte
          publicacion={publicacionAReportar}
          onCancelar={cerrarModalReporte}
          onReportado={handleReporteExitoso}
          onYaReportado={handleYaReportado}
        />
      </Modal>

      <Modal isOpen={Boolean(avisoYaReportado)} onClose={cerrarAvisoYaReportado}>
        <div className={styles.avisoYaReportado}>
          <CheckCircle2 size={32} className={styles.avisoYaReportadoIcono} />
          <h2 className={styles.avisoYaReportadoTitulo}>Ya reportaste esta publicación</h2>
          <p className={styles.avisoYaReportadoTexto}>
            Ya enviaste un reporte sobre{" "}
            <strong>“{avisoYaReportado?.nombre || "esta publicación"}”</strong>. Un administrador la está revisando, no hace falta reportarla de nuevo.
          </p>
          <button type="button" className={styles.primaryButton} onClick={cerrarAvisoYaReportado}>
            Entendido
          </button>
        </div>
      </Modal>

      {configModal && (
        <ConfirmModal
          abierto={Boolean(confirmacion)}
          titulo={configModal.titulo}
          mensaje={configModal.mensaje(confirmacion.publicacion)}
          textoConfirmar={configModal.textoConfirmar}
          textoConfirmando={configModal.textoConfirmando}
          varianteConfirmar={configModal.variante}
          confirmando={confirmando}
          onConfirm={handleConfirmar}
          onCancel={cancelarConfirmacion}
        />
      )}
    </div>
  );
}

export default Foro;