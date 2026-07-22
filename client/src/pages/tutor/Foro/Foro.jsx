<<<<<<< HEAD
import { useState } from 'react';
import Sidebar from '../../../components/layout/Sidebar';
import TopBar from '../../../components/layout/TopBar';
import Button from '../../../components/ui/button/Button';
import PublicacionCard from '../../../components/publicaciones/PublicacionCard';
import styles from './Foro.module.css';

// Mock — reemplazar por el fetch real al backend
const PUBLICACIONES_MOCK = [
  {
    id: 1,
    nombre: 'Rocky',
    ubicacion: 'Palermo',
    imagen: 'https://picsum.photos/seed/rocky-mypet/500/300',
    descripcion: 'Perrito mestizo con collar azul. Se asustó y salió corriendo por la avenida.',
    estado: 'buscando',
    fechaPerdida: '2026-07-15',
  },
  {
    id: 2,
    nombre: 'Tigre',
    ubicacion: 'San Cristóbal',
    imagen: 'https://picsum.photos/seed/tigre-mypet/500/300',
    descripcion: 'Gato atigrado, muy mimoso. Suele andar por los techos pero no regresó a casa hoy.',
    estado: 'buscando',
    fechaPerdida: '2026-07-18',
  },
  {
    id: 3,
    nombre: 'Cleta',
    ubicacion: 'Caballito',
    imagen: 'https://picsum.photos/seed/cleta-mypet/500/300',
    descripcion: 'Apareció en el patio de mi casa. Ya se reunió con su familia.',
    estado: 'resuelto',
    fechaPerdida: '2026-07-05',
  },
];

// TODO: reemplazar por el usuario logueado real (context/auth)
const USUARIO_ACTUAL_ID = 'user-1';

const TABS = [
  { key: 'buscando', label: 'Buscando' },
  { key: 'resueltos', label: 'Resueltos' },
];

function Foro() {
  const [tabActiva, setTabActiva] = useState('buscando');
  const [zona, setZona] = useState('todas');

  const publicacionesFiltradas = PUBLICACIONES_MOCK.filter((pub) => {
    const coincideEstado =
      tabActiva === 'buscando'
        ? pub.estado !== 'resuelto'
        : pub.estado === 'resuelto';

    const coincideZona = zona === 'todas' || pub.ubicacion === zona;

    return coincideEstado && coincideZona;
  });

  const handleNuevaPublicacion = () => {
    // TODO: abrir modal / navegar a formulario de nueva publicación
  };

  const handleMarcarEncontrada = (id) => {
    // TODO: conectar con el endpoint que actualiza el estado de la publicación
  };

  const handleContactar = (publicacion) => {
    // TODO: abrir modal de contacto con el dueño
  };

  const handleCardClick = (id) => {
    // TODO: navegar al detalle de la publicación
  };

  return (
    <div className={styles.layout}>
      <Sidebar />

      <div className={styles.contenido}>
        <TopBar title="Foro de Perdidos" />

        <main className={styles.main}>
          <div className={styles.header}>
            <div>
              <h1 className={styles.titulo}>Publicaciones Activas</h1>
              <p className={styles.subtitulo}>Ayudemos a que vuelvan a casa</p>
            </div>

            <Button
              texto="+ Nueva Publicación"
              variante="primario"
              tamaño="mediano"
              onClick={handleNuevaPublicacion}
            />
          </div>

          <div className={styles.filtros}>
            <select
              className={styles.filtroZona}
              value={zona}
              onChange={(e) => setZona(e.target.value)}
            >
              <option value="todas">Zona: Todas</option>
              <option value="Palermo">Palermo</option>
              <option value="San Cristóbal">San Cristóbal</option>
              <option value="Caballito">Caballito</option>
            </select>

            {TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                className={`${styles.tab} ${tabActiva === tab.key ? styles.tabActivo : ''}`}
                onClick={() => setTabActiva(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {publicacionesFiltradas.length === 0 ? (
            <p className={styles.vacio}>No hay publicaciones para este filtro todavía.</p>
          ) : (
            <div className={styles.grilla}>
              {publicacionesFiltradas.map((pub) => (
                <PublicacionCard
                  key={pub.id}
                  publicacion={pub}
                  esPropia={pub.autorId === USUARIO_ACTUAL_ID}
                  onMarcarEncontrada={handleMarcarEncontrada}
                  onContactar={handleContactar}
                  onCardClick={handleCardClick}
                />
              ))}
            </div>
          )}
        </main>
      </div>
=======
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
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
import FormularioPublicacion from "../../../components/forms/FormularioPublicacion";
import { useAuth } from "../../../hooks/useAuth";
import {
  cambiarEstadoPublicacion,
  eliminarPublicacion,
  obtenerPublicaciones,
} from "../../../services/publicacionService";
import styles from "./Foro.module.css";

const ZONAS_BASE = [
  "Todas",
  "Almagro",
  "Belgrano",
  "Boedo",
  "Caballito",
  "Flores",
  "Palermo",
  "Recoleta",
  "San Cristobal",
  "Villa Crespo",
];

const TABS_ESTADO = [
  { value: "todas", label: "Todas" },
  { value: "activa", label: "Buscando" },
  { value: "cerrada", label: "Resueltos" },
];


// Un solo ConfirmModal se reutiliza para  distintas posibilidades, así no hay que
// declarar tres modales 
const CONFIG_CONFIRMACION = {
  eliminar: {
    titulo: "Eliminar publicación",
    mensaje: (p) =>
      `¿Querés eliminar la publicación de "${p.nombre || "esta mascota"}"? Esta acción no se puede deshacer.`,
    textoConfirmar: "Eliminar",
    textoConfirmando: "Eliminando…",
    variante: "peligro",
  },
  reportar: {
    titulo: "Reportar publicación",
    mensaje: (p) =>
      `¿Querés reportar la publicación de "${p.nombre || "esta mascota"}"? Un administrador la va a revisar para ver si infringe las normas de la comunidad.`,
    textoConfirmar: "Reportar",
    textoConfirmando: "Reportando…",
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

  if (typeof data === "string") {
    return data;
  }

  return data?.message || data?.mensaje || data?.error || fallback;
};

const getOwnerId = (publicacion) => {
  const owner = publicacion?.usuarioId;
  return owner?._id || owner?.id || owner;
};

const getOwnerName = (publicacion) => {
  const owner = publicacion?.usuarioId;
  return owner?.name || owner?.nombre || "Tutor MyPet";
};

const formatearFecha = (fecha) => {
  if (!fecha) {
    return "Fecha sin informar";
  }

  const date = new Date(fecha);

  if (Number.isNaN(date.getTime())) {
    return "Fecha sin informar";
  }

  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
};

const getContactHref = (contacto) => {
  const valor = contacto?.trim();

  if (!valor) {
    return "";
  }

  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor)) {
    return `mailto:${valor}`;
  }

  const digitos = valor.replace(/[^\d+]/g, "");
  const cantidadDigitos = digitos.replace(/\D/g, "").length;

  if (cantidadDigitos >= 6) {
    return `tel:${digitos}`;
  }

  return "";
};

// wa.me necesita solo dígitos (sin +, espacios ni guiones) e idealmente
// con codigo de país incluido.

const getWhatsAppHref = (contacto) => {
  const valor = contacto?.trim();

  if (!valor) {
    return "";
  }

  const digitos = valor.replace(/\D/g, "");

  if (digitos.length < 6) {
    return "";
  }

  return `https://wa.me/${digitos}`;
};

function Foro() {
  const { usuario } = useAuth();

  const [publicaciones, setPublicaciones] = useState([]);
  const [filtroEstado, setFiltroEstado] = useState("todas");
  const [filtroZona, setFiltroZona] = useState("Todas");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [modalAbierto, setModalAbierto] = useState(false);
  const [accionId, setAccionId] = useState("");
  const [reportadas, setReportadas] = useState(new Set());

  // { tipo: 'eliminar' | 'reportar' | 'marcarEncontrada', publicacion }
  const [confirmacion, setConfirmacion] = useState(null);
  const [confirmando, setConfirmando] = useState(false);

  const estaAutenticado = Boolean(usuario?.id);

  const esPropia = useCallback(
    (publicacion) => {
      const ownerId = getOwnerId(publicacion);
      return Boolean(usuario?.id && ownerId && String(ownerId) === String(usuario.id));
    },
    [usuario],
  );

  const zonas = useMemo(() => {
    const zonasPublicadas = publicaciones
      .map((publicacion) => publicacion.zona)
      .filter(Boolean);

    return Array.from(new Set([...ZONAS_BASE, ...zonasPublicadas])).sort((a, b) => {
      if (a === "Todas") return -1;
      if (b === "Todas") return 1;
      return a.localeCompare(b, "es");
    });
  }, [publicaciones]);

  const titulo =
    filtroEstado === "activa"
      ? "Publicaciones Activas"
      : filtroEstado === "cerrada"
        ? "Casos Resueltos"
        : "Publicaciones del Foro";
  const esFiltroActivo = filtroEstado === "activa";

  const cargarPublicaciones = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const data = await obtenerPublicaciones({
        zona: filtroZona,
        estado: filtroEstado,
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
    cargarPublicaciones();
  }, [cargarPublicaciones]);

  useEffect(() => {
    if (!success) {
      return undefined;
    }

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

  const cerrarModal = () => {
    setModalAbierto(false);
  };

  const handlePublicacionGuardada = async () => {
    setModalAbierto(false);
    setFiltroEstado("activa");
    setSuccess("Publicación creada correctamente.");
    await cargarPublicaciones();
  };

  // --- Confirmación unificada para eliminar / reportar / marcar encontrada ---

  const pedirConfirmacion = (tipo, publicacion) => {
    setConfirmacion({ tipo, publicacion });
  };

  const cancelarConfirmacion = () => {
    if (confirmando) return;
    setConfirmacion(null);
  };

  const ejecutarEliminar = async (publicacion) => {
    const publicacionesPrevias = publicaciones;

    try {
      setConfirmando(true);
      setAccionId(publicacion._id);
      setError("");
      setPublicaciones((current) => current.filter((p) => p._id !== publicacion._id));
      await eliminarPublicacion(publicacion._id);
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
      setAccionId(publicacion._id);
      setError("");
      setPublicaciones((current) =>
        current.map((p) => (p._id === publicacion._id ? { ...p, estado: "cerrada" } : p)),
      );
      await cambiarEstadoPublicacion(publicacion._id, "cerrada");
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

  const ejecutarReportar = (publicacion) => {
    // TODO: conectar con el endpoint real, ej. reportarPublicacion(publicacion._id)
    setReportadas((current) => new Set(current).add(publicacion._id));
    setSuccess("Publicación reportada. Un administrador la va a revisar.");
    setConfirmacion(null);
  };

  const handleConfirmar = () => {
    if (!confirmacion) return;
    const { tipo, publicacion } = confirmacion;

    if (tipo === "eliminar") ejecutarEliminar(publicacion);
    else if (tipo === "marcarEncontrada") ejecutarMarcarEncontrada(publicacion);
    else if (tipo === "reportar") ejecutarReportar(publicacion);
  };

  const handleContactar = async (event, contacto) => {
    if (getContactHref(contacto)) {
      return;
    }

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
    pedirConfirmacion("reportar", publicacion);
  };

  const renderAcciones = (publicacion) => {
    const propia = esPropia(publicacion);
    const admin = usuario?.rol === "administrador" || usuario?.role === "administrador";
    const puedeGestionar = propia || admin;
    const cerrada = publicacion.estado === "cerrada";
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
              disabled={accionId === publicacion._id}
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
            disabled={accionId === publicacion._id}
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

    //  si el contacto es un Email: un solo boton  que abre el cliente de mail.
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

    // si el contacto es un telefono: dos opciones, WhatsApp y llamada, para que la persona elija
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

    // Fallback: contacto en un formato que no  se pudo interpretar 
    //  Copiamos el texto.
    return (
      <a
        className={styles.contactButton}
        href="#contacto"
        title={publicacion.contacto ? `Contacto: ${publicacion.contacto}` : "Contactar al dueño"}
        onClick={(event) => handleContactar(event, publicacion.contacto)}
      >
        <Phone size={16} />
        <span className={styles.contactButtonText}>
          {publicacion.contacto || "Contactar al dueño"}
        </span>
      </a>
    );
  };

  const configModal = confirmacion ? CONFIG_CONFIRMACION[confirmacion.tipo] : null;

  return (
    <div className={styles.layout}>
      {estaAutenticado && <Sidebar />}

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
            <label className={styles.selectWrap}>
              <select
                className={styles.zoneSelect}
                value={filtroZona}
                onChange={(event) => setFiltroZona(event.target.value)}
                aria-label="Filtrar por zona"
              >
                {zonas.map((zona) => (
                  <option key={zona} value={zona}>
                    Zona: {zona}
                  </option>
                ))}
              </select>
              <ChevronDown className={styles.selectIcon} size={17} />
            </label>

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
                const cerrada = publicacion.estado === "cerrada";
                const propia = esPropia(publicacion);
                const yaReportada = reportadas.has(publicacion._id);

                return (
                  <article className={styles.card} key={publicacion._id}>
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
                          className={styles.reportButton}
                          type="button"
                          title={yaReportada ? "Ya reportaste esta publicación" : "Reportar publicación"}
                          onClick={() => handleReportarClick(publicacion)}
                          disabled={yaReportada}
                        >
                          <Flag size={14} />
                        </button>
                      )}
                    </div>

                    <div className={styles.cardBody}>
                      <h2 className={`${styles.petName} ${cerrada ? styles.resolvedName : ""}`}>
                        {publicacion.nombre || "Mascota sin nombre"}
                      </h2>

                      <p className={styles.meta}>
                        <MapPin size={16} />
                        {publicacion.zona}
                      </p>

                      <p className={styles.dateText}>
                        <CalendarDays size={15} />
                        {formatearFecha(publicacion.fecha)}
                      </p>

                      <p className={styles.description}>{publicacion.descripcion}</p>
                      <p className={styles.owner}>Publicado por {getOwnerName(publicacion)}</p>

                      <div className={styles.actions}>{renderAcciones(publicacion)}</div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </main>
      </div>

      <Modal isOpen={modalAbierto} onClose={cerrarModal}>
        <FormularioPublicacion
          onCancelar={cerrarModal}
          onGuardado={handlePublicacionGuardada}
        />
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
>>>>>>> c1fa449789e678131258cb191460765ed0058556
    </div>
  );
}

export default Foro;