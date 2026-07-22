# Archivos editados - Foro

Copiá y pegá cada bloque en la ruta indicada.

## client/src/App.jsx

``jsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import PrivateRoute from "./components/PrivateRoute";
import CitasAgendadas from './pages/veterinaria/CitasAgendadas/CitasAgendadas';

import Login from "./pages/public/Login/Login";
import Registro from "./pages/public/Registro/Registro";
import MisMascotas from "./pages/tutor/MisMascotas/MisMascotas";
import Turnos from "./pages/tutor/Turnos/Turnos";
import Foro from "./pages/tutor/Foro/Foro";
import AdminDashboard from "./pages/admin/AdminDashboard/AdminDashboard";
import NotFound from "./pages/NotFound/NotFound";
import Emergencias from "./pages/tutor/Emergencias/Emergencias";
import RegistroDeVeterinaria from './pages/veterinaria/RegistroDeVeterinaria/RegistroDeVeterinaria';
import AgendarTurnos from "./pages/tutor/Turnos/AgendarTurno";
import PerfilVeterinaria from "./pages/tutor/Turnos/PerfilVeterinaria";
import HomeTutor from "./pages/tutor/HomeTutor/HomeTutor";
import HomeVeterinaria from "./pages/veterinaria/HomeVeterinaria/HomeVeterinaria";


function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/registro-veterinaria" element={<PrivateRoute allowedRoles={["veterinaria"]}><RegistroDeVeterinaria /></PrivateRoute>} />
        <Route path="/login" element={<Login />} />
        <Route path="/registro" element={<Registro />} />
        <Route path="/register" element={<Registro />} />
        <Route path="/home" element={<PrivateRoute allowedRoles={["dueno"]}><HomeTutor /></PrivateRoute>} />
        <Route path="/home-veterinaria" element={<PrivateRoute allowedRoles={["veterinaria"]}><HomeVeterinaria /></PrivateRoute>} />
        <Route path="/mascotas" element={<PrivateRoute allowedRoles={["dueno"]}><MisMascotas /></PrivateRoute>} />
        <Route path="/turnos" element={<PrivateRoute allowedRoles={["dueno"]}><Turnos /></PrivateRoute>} />
        <Route
          path="/turnos/agendar/:veterinariaId"
          element={<PrivateRoute allowedRoles={["dueno"]}><AgendarTurnos /></PrivateRoute>}
        />
        <Route path="/tutor/veterinarias/:id" element={<PerfilVeterinaria />} />
        <Route path="/foro" element={<Foro />} />
        <Route path="/veterinarias" element={<PrivateRoute allowedRoles={["dueno"]}><h1>SecciÃ³n Veterinarias</h1></PrivateRoute>} />
        <Route path="/agenda" element={<PrivateRoute allowedRoles={["veterinaria"]}><CitasAgendadas /></PrivateRoute>} />
        <Route path="/urgencias" element={<PrivateRoute allowedRoles={["dueno"]}><Emergencias /></PrivateRoute>} />
        <Route path="/admin" element={<PrivateRoute allowedRoles={["administrador"]}><AdminDashboard /></PrivateRoute>} />
        <Route path="/dashboard" element={<PrivateRoute allowedRoles={["administrador"]}><AdminDashboard /></PrivateRoute>} />

        {/* "/" sin usar por ahora: lo primero que ve cualquiera que entra
            a la app es el login. Luego debria ser el landing */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
````

## client/src/pages/tutor/Foro/Foro.jsx

``jsx
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Loader2,
  MapPin,
  Phone,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import NavbarPublic from "../../../components/layout/NavbarPublic";
import Sidebar from "../../../components/layout/Sidebar";
import TopBar from "../../../components/layout/TopBar";
import { useAuth } from "../../../hooks/useAuth";
import { subirImagen } from "../../../services/uploadService";
import {
  cambiarEstadoPublicacion,
  crearPublicacion,
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

const FORM_INICIAL = {
  nombre: "",
  zona: "",
  descripcion: "",
  fecha: "",
  contacto: "",
  fotoUrl: "",
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

const getFechaLocalInput = () => {
  const fecha = new Date();
  fecha.setMinutes(fecha.getMinutes() - fecha.getTimezoneOffset());
  return fecha.toISOString().slice(0, 10);
};

function Foro() {
  const navigate = useNavigate();
  const { usuario } = useAuth();
  const fileInputRef = useRef(null);

  const [publicaciones, setPublicaciones] = useState([]);
  const [filtroEstado, setFiltroEstado] = useState("todas");
  const [filtroZona, setFiltroZona] = useState("Todas");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [modalAbierto, setModalAbierto] = useState(false);
  const [formData, setFormData] = useState(FORM_INICIAL);
  const [formErrors, setFormErrors] = useState({});
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [accionId, setAccionId] = useState("");

  const estaAutenticado = Boolean(usuario?.id);
  const fechaMaxima = useMemo(() => getFechaLocalInput(), []);

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
      setError(getMensajeError(err, "No pudimos cargar el foro. IntentÃ¡ nuevamente en unos minutos."));
    } finally {
      setLoading(false);
    }
  }, [filtroEstado, filtroZona]);

  useEffect(() => {
    const timer = setTimeout(() => {
      cargarPublicaciones();
    }, 0);

    return () => clearTimeout(timer);
  }, [cargarPublicaciones]);

  useEffect(() => {
    if (!success) {
      return undefined;
    }

    const timer = setTimeout(() => setSuccess(""), 3200);
    return () => clearTimeout(timer);
  }, [success]);

  useEffect(() => {
    return () => {
      if (imagePreview.startsWith("blob:")) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  const resetFormulario = () => {
    setFormData(FORM_INICIAL);
    setFormErrors({});
    setImageFile(null);
    setImagePreview("");
  };

  const abrirModal = () => {
    if (!estaAutenticado) {
      setSuccess("");
      setError("PodÃ©s ver el foro sin iniciar sesiÃ³n. Para crear una publicaciÃ³n necesitÃ¡s entrar como tutor.");
      return;
    }

    resetFormulario();
    setModalAbierto(true);
  };

  const cerrarModal = () => {
    if (guardando) {
      return;
    }

    setModalAbierto(false);
    resetFormulario();
  };

  const handleInputChange = (event) => {
    const { name, value } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));

    setFormErrors((current) => ({
      ...current,
      [name]: "",
    }));

    if (name === "fotoUrl") {
      setImageFile(null);
      setImagePreview(value.trim());
    }
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setFormData((current) => ({
      ...current,
      fotoUrl: "",
    }));
    setFormErrors((current) => ({
      ...current,
      foto: "",
      fotoUrl: "",
    }));
  };

  const validarFormulario = () => {
    const errors = {};
    const fotoUrl = formData.fotoUrl.trim();

    if (!formData.zona.trim()) {
      errors.zona = "IngresÃ¡ el barrio o zona.";
    }

    if (!formData.fecha) {
      errors.fecha = "IndicÃ¡ la fecha.";
    } else if (formData.fecha > fechaMaxima) {
      errors.fecha = "La fecha no puede ser futura.";
    }

    if (!formData.contacto.trim()) {
      errors.contacto = "AgregÃ¡ un contacto.";
    }

    if (formData.descripcion.trim().length < 12) {
      errors.descripcion = "SumÃ¡ una descripciÃ³n un poco mÃ¡s completa.";
    }

    if (!imageFile && !fotoUrl) {
      errors.foto = "SubÃ­ una foto o pegÃ¡ una URL.";
    }

    if (fotoUrl && !/^https?:\/\/.+/i.test(fotoUrl)) {
      errors.fotoUrl = "La URL debe empezar con http:// o https://.";
    }

    return errors;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const errors = validarFormulario();
    setFormErrors(errors);

    if (Object.keys(errors).length > 0) {
      return;
    }

    try {
      setGuardando(true);
      setError("");

      const foto = imageFile ? await subirImagen(imageFile) : formData.fotoUrl.trim();

      await crearPublicacion({
        foto,
        nombre: formData.nombre.trim() || "Mascota sin nombre",
        zona: formData.zona.trim(),
        descripcion: formData.descripcion.trim(),
        fecha: formData.fecha,
        contacto: formData.contacto.trim(),
      });

      setModalAbierto(false);
      resetFormulario();
      setFiltroEstado("activa");
      setSuccess("PublicaciÃ³n creada correctamente.");
      await cargarPublicaciones();
    } catch (err) {
      console.error("Error al crear publicaciÃ³n:", err);

      if (err?.response?.status === 401) {
        setError(getMensajeError(err, "Tu sesiÃ³n expirÃ³. Te estamos llevando al login."));
        setTimeout(() => navigate("/login"), 1300);
      } else {
        setError(getMensajeError(err, "No pudimos crear la publicaciÃ³n. IntentÃ¡ nuevamente."));
      }
    } finally {
      setGuardando(false);
    }
  };

  const handleCambiarEstado = async (id, estado) => {
    const publicacionesPrevias = publicaciones;

    try {
      setAccionId(id);
      setError("");
      setPublicaciones((current) =>
        current.map((publicacion) =>
          publicacion._id === id ? { ...publicacion, estado } : publicacion,
        ),
      );
      await cambiarEstadoPublicacion(id, estado);
      setSuccess(estado === "cerrada" ? "Caso marcado como encontrado." : "PublicaciÃ³n reabierta.");
      await cargarPublicaciones();
    } catch (err) {
      console.error("Error al cambiar estado:", err);
      setPublicaciones(publicacionesPrevias);
      setError(getMensajeError(err, "No pudimos actualizar el estado de la publicaciÃ³n."));
    } finally {
      setAccionId("");
    }
  };

  const handleEliminar = async (id) => {
    const confirmado = window.confirm("Â¿QuerÃ©s eliminar esta publicaciÃ³n?");

    if (!confirmado) {
      return;
    }

    const publicacionesPrevias = publicaciones;

    try {
      setAccionId(id);
      setError("");
      setPublicaciones((current) => current.filter((publicacion) => publicacion._id !== id));
      await eliminarPublicacion(id);
      setSuccess("PublicaciÃ³n eliminada correctamente.");
    } catch (err) {
      console.error("Error al eliminar publicaciÃ³n:", err);
      setPublicaciones(publicacionesPrevias);
      setError(getMensajeError(err, "No pudimos eliminar la publicaciÃ³n."));
    } finally {
      setAccionId("");
    }
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

  const renderAcciones = (publicacion) => {
    const ownerId = getOwnerId(publicacion);
    const propia = usuario?.id && ownerId && String(ownerId) === String(usuario.id);
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
              onClick={() => handleCambiarEstado(publicacion._id, "cerrada")}
              disabled={accionId === publicacion._id}
            >
              <CheckCircle2 size={16} />
              Marcar encontrada
            </button>
          )}

          <button
            className={styles.dangerButton}
            type="button"
            title="Eliminar publicaciÃ³n"
            aria-label="Eliminar publicaciÃ³n"
            onClick={() => handleEliminar(publicacion._id)}
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

    return (
      <a
        className={styles.contactButton}
        href={contactHref || "#contacto"}
        onClick={(event) => handleContactar(event, publicacion.contacto)}
      >
        <Phone size={16} />
        Contactar al dueÃ±o
      </a>
    );
  };

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
              Nueva publicaciÃ³n
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
                : `${publicaciones.length} ${publicaciones.length === 1 ? "publicaciÃ³n" : "publicaciones"}`}
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
                ? "TodavÃ­a no hay publicaciones para estos filtros."
                : esFiltroActivo
                  ? "No hay publicaciones activas para estos filtros."
                  : "No hay casos resueltos para estos filtros."}
            </div>
          ) : (
            <div className={styles.grid}>
              {publicaciones.map((publicacion) => {
                const cerrada = publicacion.estado === "cerrada";

                return (
                  <article className={styles.card} key={publicacion._id}>
                    <div className={styles.imageWrap}>
                      <img
                        className={styles.image}
                        src={publicacion.foto}
                        alt={publicacion.nombre || "Mascota perdida"}
                      />
                      <span className={`${styles.badge} ${cerrada ? styles.badgeFound : styles.badgeLost}`}>
                        {cerrada ? "Encontrado" : "Se busca"}
                      </span>
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

      {modalAbierto && (
        <div className={styles.modalOverlay} role="presentation">
          <section className={styles.modal} aria-labelledby="nueva-publicacion-title" role="dialog" aria-modal="true">
            <header className={styles.modalHeader}>
              <div>
                <h2 className={styles.modalTitle} id="nueva-publicacion-title">
                  Nueva publicaciÃ³n
                </h2>
                <p className={styles.modalSubtitle}>CompletÃ¡ los datos principales para activar la bÃºsqueda.</p>
              </div>

              <button
                className={styles.closeButton}
                type="button"
                onClick={cerrarModal}
                aria-label="Cerrar"
                disabled={guardando}
              >
                <X size={19} />
              </button>
            </header>

            <form className={styles.form} onSubmit={handleSubmit}>
              <div className={styles.formGrid}>
                <label className={styles.field}>
                  <span className={styles.label}>Nombre</span>
                  <input
                    className={styles.input}
                    type="text"
                    name="nombre"
                    placeholder="Rocky"
                    value={formData.nombre}
                    onChange={handleInputChange}
                  />
                </label>

                <label className={styles.field}>
                  <span className={styles.label}>Zona</span>
                  <input
                    className={styles.input}
                    type="text"
                    name="zona"
                    placeholder="Palermo"
                    value={formData.zona}
                    onChange={handleInputChange}
                  />
                  {formErrors.zona && <p className={styles.fieldError}>{formErrors.zona}</p>}
                </label>

                <label className={styles.field}>
                  <span className={styles.label}>Fecha</span>
                  <input
                    className={styles.input}
                    type="date"
                    name="fecha"
                    max={fechaMaxima}
                    value={formData.fecha}
                    onChange={handleInputChange}
                  />
                  {formErrors.fecha && <p className={styles.fieldError}>{formErrors.fecha}</p>}
                </label>

                <label className={styles.field}>
                  <span className={styles.label}>Contacto</span>
                  <input
                    className={styles.input}
                    type="text"
                    name="contacto"
                    placeholder="TelÃ©fono o email"
                    value={formData.contacto}
                    onChange={handleInputChange}
                  />
                  {formErrors.contacto && <p className={styles.fieldError}>{formErrors.contacto}</p>}
                </label>

                <label className={styles.fullField}>
                  <span className={styles.label}>DescripciÃ³n</span>
                  <textarea
                    className={styles.textarea}
                    name="descripcion"
                    placeholder="Color, tamaÃ±o, collar, seÃ±ales particulares..."
                    value={formData.descripcion}
                    onChange={handleInputChange}
                  />
                  {formErrors.descripcion && <p className={styles.fieldError}>{formErrors.descripcion}</p>}
                </label>

                <div className={styles.fullField}>
                  <span className={styles.label}>Foto</span>
                  <div className={styles.imageTools}>
                    <button
                      className={styles.imageButton}
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={guardando}
                    >
                      <Upload size={16} />
                      Subir foto
                    </button>

                    <input
                      className={styles.fileInput}
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                    />

                    <input
                      className={styles.input}
                      type="url"
                      name="fotoUrl"
                      placeholder="O pegÃ¡ una URL de imagen"
                      value={formData.fotoUrl}
                      onChange={handleInputChange}
                    />

                    {imagePreview && <img className={styles.preview} src={imagePreview} alt="Vista previa" />}
                  </div>

                  {formErrors.foto && <p className={styles.fieldError}>{formErrors.foto}</p>}
                  {formErrors.fotoUrl && <p className={styles.fieldError}>{formErrors.fotoUrl}</p>}
                </div>
              </div>

              <div className={styles.formActions}>
                <button className={styles.secondaryButton} type="button" onClick={cerrarModal} disabled={guardando}>
                  Cancelar
                </button>
                <button className={styles.primaryButton} type="submit" disabled={guardando}>
                  {guardando ? (
                    <>
                      <Loader2 size={17} />
                      Publicando
                    </>
                  ) : (
                    <>
                      <Plus size={17} />
                      Publicar
                    </>
                  )}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}

export default Foro;
````

## client/src/pages/tutor/Foro/Foro.module.css

``css
.layout {
  display: flex;
  min-height: 100vh;
  background: #f8f6ff;
  color: #1f1739;
  font-family: "Inter", "Segoe UI", system-ui, sans-serif;
}

.pageWrapper {
  display: flex;
  flex: 1;
  min-width: 0;
  min-height: 100vh;
  flex-direction: column;
}

.publicPageWrapper .content {
  width: min(1180px, 100%);
  margin: 0 auto;
  box-sizing: border-box;
}

.content {
  flex: 1;
  padding: 34px 40px 52px;
  overflow-y: auto;
}

.hero {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 28px;
}

.title {
  margin: 0;
  color: #111827;
  font-family: "Outfit", "Inter", sans-serif;
  font-size: 32px;
  line-height: 1.15;
  font-weight: 800;
  letter-spacing: 0;
}

.subtitle {
  max-width: 560px;
  margin: 10px 0 0;
  color: #5f5877;
  font-size: 15px;
  line-height: 1.6;
}

.primaryButton,
.secondaryButton,
.dangerButton,
.ghostButton,
.contactButton,
.successButton,
.outlineSuccessButton,
.tabButton,
.closeButton,
.imageButton {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 42px;
  border: 0;
  border-radius: 14px;
  font: inherit;
  font-size: 14px;
  font-weight: 700;
  line-height: 1;
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease, background-color 0.15s ease, color 0.15s ease;
}

.primaryButton {
  min-width: 204px;
  padding: 0 20px;
  color: #ffffff;
  background: #6d28d9;
  box-shadow: 0 12px 22px rgba(109, 40, 217, 0.22);
}

.primaryButton:hover,
.contactButton:hover,
.successButton:hover {
  transform: translateY(-1px);
}

.primaryButton:disabled,
.secondaryButton:disabled,
.dangerButton:disabled,
.contactButton:disabled,
.successButton:disabled,
.outlineSuccessButton:disabled,
.imageButton:disabled {
  cursor: not-allowed;
  opacity: 0.62;
  transform: none;
  box-shadow: none;
}

.filters {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 26px;
}

.selectWrap {
  position: relative;
  min-width: 190px;
}

.zoneSelect {
  width: 100%;
  height: 44px;
  padding: 0 42px 0 18px;
  border: 1px solid #e7e0f5;
  border-radius: 999px;
  color: #1f1739;
  background: #ffffff;
  font: inherit;
  font-size: 14px;
  outline: none;
  appearance: none;
}

.selectIcon {
  position: absolute;
  top: 50%;
  right: 16px;
  color: #9b91bd;
  pointer-events: none;
  transform: translateY(-50%);
}

.tabGroup {
  display: flex;
  align-items: center;
  gap: 10px;
}

.tabButton {
  min-width: 122px;
  height: 44px;
  padding: 0 18px;
  border: 1px solid #e7e0f5;
  color: #4b4266;
  background: #ffffff;
}

.tabActive {
  border-color: #6d28d9;
  color: #ffffff;
  background: #6d28d9;
  box-shadow: 0 10px 20px rgba(109, 40, 217, 0.16);
}

.statusLine {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  margin-bottom: 18px;
  color: #746b92;
  font-size: 14px;
}

.refreshButton {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border: 0;
  color: #6d28d9;
  background: transparent;
  font: inherit;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 20px;
}

.card {
  display: flex;
  min-height: 100%;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid #eee8fb;
  border-radius: 18px;
  background: #ffffff;
  box-shadow: 0 12px 26px rgba(39, 31, 66, 0.07);
}

.imageWrap {
  position: relative;
  aspect-ratio: 1.48;
  overflow: hidden;
  background: #eeeef1;
}

.image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.badge {
  position: absolute;
  top: 12px;
  left: 12px;
  display: inline-flex;
  align-items: center;
  min-height: 22px;
  padding: 0 8px;
  border-radius: 999px;
  color: #ffffff;
  font-size: 10px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0;
}

.badgeLost {
  background: #ff4b55;
}

.badgeFound {
  background: #10b981;
}

.cardBody {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 12px;
  padding: 15px 16px 16px;
}

.petName {
  margin: 0;
  color: #111827;
  font-size: 18px;
  line-height: 1.2;
  font-weight: 800;
}

.resolvedName {
  color: #9aa0b4;
}

.meta,
.dateText {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 0;
  color: #746b92;
  font-size: 13px;
  line-height: 1.4;
}

.description {
  min-height: 44px;
  margin: 0;
  color: #5a536f;
  font-size: 13px;
  line-height: 1.55;
}

.owner {
  margin: auto 0 0;
  color: #9288ad;
  font-size: 12px;
  line-height: 1.4;
}

.actions {
  display: grid;
  gap: 9px;
  margin-top: 2px;
}

.ownerActions {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 9px;
}

.contactButton,
.successButton {
  width: 100%;
  min-height: 40px;
  padding: 0 14px;
  color: #ffffff;
  background: #6d28d9;
}

.successButton {
  background: #10b981;
}

.outlineSuccessButton {
  width: 100%;
  min-height: 40px;
  padding: 0 14px;
  border: 1px solid #10b981;
  color: #059669;
  background: #ffffff;
}

.dangerButton {
  width: 40px;
  min-width: 40px;
  height: 40px;
  color: #dc2626;
  background: #fff1f2;
}

.secondaryButton {
  min-width: 112px;
  padding: 0 18px;
  border: 1px solid #e3dcef;
  color: #4b4266;
  background: #ffffff;
}

.ghostButton {
  min-width: 96px;
  padding: 0 14px;
  color: #6d28d9;
  background: #f1ebff;
}

.emptyState,
.errorBanner,
.successBanner {
  display: flex;
  align-items: center;
  gap: 10px;
  border-radius: 16px;
  padding: 14px 16px;
  font-size: 14px;
  line-height: 1.45;
}

.emptyState {
  justify-content: center;
  min-height: 180px;
  border: 1px dashed #d7cdec;
  color: #756b91;
  background: #ffffff;
}

.errorBanner {
  margin-bottom: 18px;
  border: 1px solid #fecdd3;
  color: #be123c;
  background: #fff1f2;
}

.successBanner {
  margin-bottom: 18px;
  border: 1px solid #a7f3d0;
  color: #047857;
  background: #ecfdf5;
}

.skeleton {
  min-height: 332px;
  border-radius: 18px;
  background: linear-gradient(90deg, #eee9fb 25%, #f8f6ff 37%, #eee9fb 63%);
  background-size: 400% 100%;
  animation: shimmer 1.35s ease infinite;
}

.modalOverlay {
  position: fixed;
  inset: 0;
  z-index: 30;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: rgba(31, 23, 57, 0.48);
}

.modal {
  position: relative;
  width: min(680px, 100%);
  max-height: min(88vh, 760px);
  overflow-y: auto;
  border-radius: 20px;
  background: #ffffff;
  box-shadow: 0 28px 70px rgba(31, 23, 57, 0.28);
}

.modalHeader {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18px;
  padding: 28px 30px 18px;
  border-bottom: 1px solid #f0ebfa;
}

.modalTitle {
  margin: 0;
  color: #111827;
  font-size: 24px;
  line-height: 1.2;
  font-weight: 800;
}

.modalSubtitle {
  margin: 6px 0 0;
  color: #776c95;
  font-size: 14px;
  line-height: 1.5;
}

.closeButton {
  width: 38px;
  min-width: 38px;
  height: 38px;
  color: #776c95;
  background: #f5f1ff;
}

.form {
  display: grid;
  gap: 18px;
  padding: 24px 30px 30px;
}

.formGrid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.field,
.fullField {
  display: grid;
  gap: 8px;
}

.fullField {
  grid-column: 1 / -1;
}

.label {
  color: #201839;
  font-size: 13px;
  font-weight: 700;
}

.input,
.textarea {
  width: 100%;
  border: 1px solid #e2dced;
  border-radius: 14px;
  color: #1f1739;
  background: #ffffff;
  font: inherit;
  font-size: 14px;
  box-sizing: border-box;
  outline: none;
}

.input {
  height: 44px;
  padding: 0 14px;
}

.textarea {
  min-height: 108px;
  resize: vertical;
  padding: 13px 14px;
  line-height: 1.5;
}

.input:focus,
.textarea:focus,
.zoneSelect:focus {
  border-color: #8b5cf6;
  box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.14);
}

.fieldError {
  margin: 0;
  color: #be123c;
  font-size: 12px;
  line-height: 1.35;
}

.imageTools {
  display: grid;
  grid-template-columns: 1fr;
  gap: 10px;
}

.imageButton {
  width: fit-content;
  min-height: 38px;
  padding: 0 14px;
  color: #6d28d9;
  background: #f1ebff;
}

.fileInput {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
  clip-path: inset(50%);
}

.preview {
  width: 100%;
  max-height: 240px;
  object-fit: cover;
  border-radius: 16px;
  border: 1px solid #eee8fb;
}

.formActions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding-top: 6px;
}

@keyframes shimmer {
  0% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0 50%;
  }
}

@media (max-width: 900px) {
  .layout {
    display: block;
  }

  .content {
    padding: 26px 22px 42px;
  }

  .hero {
    flex-direction: column;
    align-items: stretch;
  }

  .primaryButton {
    width: 100%;
  }
}

@media (max-width: 680px) {
  .content {
    padding: 22px 16px 36px;
  }

  .title {
    font-size: 28px;
  }

  .filters,
  .tabGroup,
  .statusLine {
    align-items: stretch;
    flex-direction: column;
  }

  .selectWrap,
  .tabButton {
    width: 100%;
  }

  .grid,
  .formGrid {
    grid-template-columns: 1fr;
  }

  .modalOverlay {
    align-items: flex-end;
    padding: 0;
  }

  .modal {
    width: 100%;
    max-height: 92vh;
    border-radius: 20px 20px 0 0;
  }

  .modalHeader,
  .form {
    padding-left: 20px;
    padding-right: 20px;
  }

  .formActions {
    flex-direction: column-reverse;
  }

  .formActions > button {
    width: 100%;
  }
}
````

## client/src/services/publicacionService.js

``js
import api from "./api";

const normalizarRespuesta = (response) => response.data?.data || response.data || [];

export const obtenerPublicaciones = async ({ zona, estado } = {}) => {
  const params = {};

  if (zona && zona !== "Todas") {
    params.zona = zona;
  }

  if (estado && estado !== "todas") {
    params.estado = estado;
  }

  const response = await api.get("/publicaciones", { params });
  return normalizarRespuesta(response);
};

export const crearPublicacion = async (publicacion) => {
  const response = await api.post("/publicaciones", publicacion);
  return normalizarRespuesta(response);
};

export const cambiarEstadoPublicacion = async (id, estado) => {
  const response = await api.patch(`/publicaciones/${id}/estado`, { estado });
  return normalizarRespuesta(response);
};

export const eliminarPublicacion = async (id) => {
  const response = await api.delete(`/publicaciones/${id}`);
  return response.data;
};

export default {
  obtenerPublicaciones,
  crearPublicacion,
  cambiarEstadoPublicacion,
  eliminarPublicacion,
};
````

## server/src/index.js

``js
import 'dotenv/config'


import express from 'express';
import cors from 'cors';
import connectDB from './config/db.js'
import routes from './routes/index.js'
import uploadRoutes from './routes/uploadRoutes.js'
import rutasTurnos from './routes/rutasTurnos.js';
import { iniciarJobsTurnos } from './jobs/turnoJobs.js';

const app = express();
const PORT = process.env.PORT || 3000;
/*
const corsOptions = {
    origin: process.env.CLIENT_URL,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}*/
/*modificacion hecha para que pueda usar el localhost*/
const corsOptions = {
  origin: (origin, callback) => {
    const allowed = new Set([
      ...(process.env.CLIENT_URL || "").split(",").map(o => o.trim()).filter(Boolean),
      "http://localhost:5173",
      "http://127.0.0.1:5173"
    ]);

    if (!origin || allowed.has(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
};


app.use(cors(corsOptions));
app.use(express.json());

app.use('/api', routes);
app.use('/api/upload', uploadRoutes)
connectDB();
app.listen(PORT, () => {
    console.log(`Servidor corriendo en puerto ${PORT}`);
});

app.get('/', (req, res) => {
    res.json({ message: 'Servidor funcionando' });
});

app.use('/api', rutasTurnos);

iniciarJobsTurnos(); // arranca el cron de liberaciÃ³n automÃ¡tica

/*import verifyToken from './middleware/auth.js';*/

/*Ruta temporal de prueba  middleware
app.get('/test-auth', verifyToken, (req, res) => {
    res.json({
        mensaje: 'Token vÃ¡lido',
        usuario: req.user
    });
});*/
export default app
````

