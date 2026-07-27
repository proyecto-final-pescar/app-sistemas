import { useState, useEffect } from "react";
import { User as UserIcon, Bell, Shield, Camera } from "lucide-react";
import Sidebar from "../../components/layout/Sidebar";
import TopBar from "../../components/layout/TopBar";
import PanelDestacado from "../../components/ui/panel-destacado/PanelDestacado";
import Button from "../../components/ui/button/Button";
import { useAuth } from "../../hooks/useAuth";
import api from "../../services/api";
import { subirImagen } from "../../services/uploadService";
import styles from "./PerfilUsuario.module.css";

const ETIQUETAS_ROL = {
  dueno: "Tutor/a",
  veterinaria: "Veterinaria/o",
  administrador: "Administrador/a",
};

const EMOJI_ESPECIE = {
  perro: "🐶",
  gato: "🐱",
};
const TAMANIO_MAXIMO_FOTO = 5 * 1024 * 1024; // 5MB

const TABS = [
  { id: "personales", label: "Datos Personales", icon: UserIcon },
  { id: "notificaciones", label: "Notificaciones", icon: Bell },
  { id: "seguridad", label: "Seguridad", icon: Shield },
];

function PerfilUsuario() {
  const { usuario, setUsuario } = useAuth();
  const usuarioId = usuario?.id || usuario?._id;

  const [tabActiva, setTabActiva] = useState("personales");
  const [perfil, setPerfil] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    telefono: "",
    zona: "",
    fotoUrl: "",
  });
  const [fotoArchivo, setFotoArchivo] = useState(null);
  const [fotoPreview, setFotoPreview] = useState(null);

  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState(null);
  const [mensajeExito, setMensajeExito] = useState(null);

  useEffect(() => {
    if (!usuarioId) return;

    const fetchPerfil = async () => {
      try {
        setCargando(true);
        setError(null);
        const { data } = await api.get(`/usuarios/${usuarioId}`);
        const perfilData = data.data;

        setPerfil(perfilData);
        setFormData({
          name: perfilData.nombre || "",
          email: perfilData.email || "",
          telefono: perfilData.telefono || "",
          zona: perfilData.zona || "",
          fotoUrl: perfilData.fotoUrl || "",
        });
      } catch (err) {
        setError("No pudimos cargar tu perfil. Probá de nuevo en un momento.");
      } finally {
        setCargando(false);
      }
    };

    fetchPerfil();
  }, [usuarioId]);

 
  useEffect(() => {
    return () => {
      if (fotoPreview) URL.revokeObjectURL(fotoPreview);
    };
  }, [fotoPreview]);

  // Auto-oculta el mensaje de éxito a los 4 segundos. 
  useEffect(() => {
    if (!mensajeExito) return;

    const timer = setTimeout(() => setMensajeExito(null), 4000);
    return () => clearTimeout(timer);
  }, [mensajeExito]);


  const handleChange = (campo) => (e) => {
    setFormData((prev) => ({ ...prev, [campo]: e.target.value }));
    setMensajeExito(null);
  };

  const handleFotoChange = (e) => {
    const archivo = e.target.files?.[0];
    e.target.value = "";
    if (!archivo) return;

    if (!archivo.type.startsWith("image/")) {
      setError("El archivo tiene que ser una imagen.");
      return;
    }

    if (archivo.size > TAMANIO_MAXIMO_FOTO) {
      setError("La imagen no puede pesar más de 5MB.");
      return;
    }

    // Solo guardamos el archivo y una preview local; se sube recién al guardar.
    setError(null);
    setFotoArchivo(archivo);
    setFotoPreview((prevUrl) => {
      if (prevUrl) URL.revokeObjectURL(prevUrl);
      return URL.createObjectURL(archivo);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setGuardando(true);
      setError(null);
      setMensajeExito(null);

      // La foto recién se sube acá, al confirmar el guardado —
    
    let fotoUrlFinal = formData.fotoUrl;
      if (fotoArchivo) {
        fotoUrlFinal = await subirImagen(fotoArchivo, "perfiles");// la foto queda en la carpeta perfiles 
      }

      const { data } = await api.put("/usuarios/perfil", {
        name: formData.name,
        email: formData.email,
        telefono: formData.telefono,
        zona: formData.zona,
        fotoUrl: fotoUrlFinal,
      });

      const actualizado = data.data;
      setPerfil((prev) => ({ ...prev, ...actualizado, nombre: actualizado.name }));
      setFormData((prev) => ({ ...prev, fotoUrl: actualizado.fotoUrl || "" }));

      if (fotoPreview) URL.revokeObjectURL(fotoPreview);
      setFotoPreview(null);
      setFotoArchivo(null);

      const usuarioActualizado = {
        ...usuario,
        nombre: actualizado.name,
        email: actualizado.email,
        fotoUrl: actualizado.fotoUrl,
      };
      localStorage.setItem("user", JSON.stringify(usuarioActualizado));
      setUsuario(usuarioActualizado);

      setMensajeExito("Perfil actualizado correctamente.");
    } catch (err) {
      const mensajeBackend = err.response?.data?.errors?.[0] || err.response?.data?.message;
      setError(mensajeBackend || "No pudimos guardar los cambios. Revisá los datos e intentá de nuevo.");
    } finally {
      setGuardando(false);
    }
  };

  const renderBadges = () => {
    if (!perfil) return null;

    const anioRegistro = perfil.fechaRegistro
      ? new Date(perfil.fechaRegistro).getFullYear()
      : null;

    if (perfil.rol === "dueno") {
      return (
        <>
          {perfil.mascotas?.map((mascota) => (
            <span key={mascota._id} className={styles.badge}>
              {EMOJI_ESPECIE[mascota.especie] || "🐾"} {mascota.nombre}
            </span>
          ))}
          {anioRegistro && (
            <span className={styles.badge}>Tutora/o desde {anioRegistro}</span>
          )}
        </>
      );
    }

    if (perfil.rol === "veterinaria") {
      return (
        <>
          {perfil.veterinaria?.nombre && (
            <span className={styles.badge}>🏥 {perfil.veterinaria.nombre}</span>
          )}
          {perfil.veterinaria?.especialidades?.map((esp) => (
            <span key={esp} className={styles.badge}>{esp}</span>
          ))}
          {anioRegistro && (
            <span className={styles.badge}>En el equipo desde {anioRegistro}</span>
          )}
        </>
      );
    }

    return anioRegistro ? (
      <span className={styles.badge}>Administrador/a desde {anioRegistro}</span>
    ) : null;
  };

  const fotoMostrar = fotoPreview || formData.fotoUrl;

  if (cargando) {
    return (
      <div className={styles.layout}>
        <Sidebar />
        <div className={styles.contenido}>
          <TopBar title="Mi Perfil y Configuración" />
          <div className={styles.cuerpo}>
            <p className={styles.estadoCarga}>Cargando perfil...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.layout}>
      <Sidebar />
      <div className={styles.contenido}>
        <TopBar title="Mi Perfil y Configuración" />

        <div className={styles.cuerpo}>
          <PanelDestacado
            titulo={
              <div className={styles.tituloConAvatar}>
                {fotoMostrar ? (
                  <img src={fotoMostrar} alt={perfil?.nombre} className={styles.avatarPanelFoto} />
                ) : (
                  <span className={styles.avatarPanel} aria-hidden="true">
                    {perfil?.nombre?.[0]?.toUpperCase() || "?"}
                  </span>
                )}
                {perfil?.nombre}
              </div>
            }
            subtitulo={`${perfil?.email || ""}${perfil?.zona ? ` · ${perfil.zona}` : ""}`}
          >
            <div className={styles.badges}>{renderBadges()}</div>
          </PanelDestacado>

          <div className={styles.tabs}>
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                className={`${styles.tab} ${tabActiva === id ? styles.tabActiva : ""}`}
                onClick={() => setTabActiva(id)}
              >
                <Icon size={18} />
                {label}
              </button>
            ))}
          </div>

          {tabActiva === "personales" && (
            <form className={styles.card} onSubmit={handleSubmit}>
              <div className={styles.avatarSeccion}>
                {fotoMostrar ? (
                  <img src={fotoMostrar} alt={formData.name} className={styles.avatarGrandeFoto} />
                ) : (
                  <div className={styles.avatarGrande}>
                    {formData.name?.[0]?.toUpperCase() || "?"}
                  </div>
                )}
                <div>
                  <h3 className={styles.nombreCard}>{formData.name}</h3>
                  <p className={styles.rolCard}>
                    {ETIQUETAS_ROL[perfil?.rol] || perfil?.rol} · Miembro desde{" "}
                    {perfil?.fechaRegistro
                      ? new Date(perfil.fechaRegistro).getFullYear()
                      : "-"}
                  </p>
                  <label className={styles.linkFoto}>
                    <Camera size={16} />
                    Cambiar foto de perfil
                    <input type="file" accept="image/*" onChange={handleFotoChange} hidden />
                  </label>
                  {fotoArchivo && (
                    <p className={styles.notaFoto}>Se guardará al hacer click en "Guardar Cambios".</p>
                  )}
                </div>
              </div>

              {error && <p className={styles.mensajeError}>{error}</p>}
              {mensajeExito && <p className={styles.mensajeExito}>{mensajeExito}</p>}

              <div className={styles.grid}>
                <div className={styles.campo}>
                  <label htmlFor="name">Nombre completo</label>
                  <input id="name" type="text" value={formData.name} onChange={handleChange("name")} />
                </div>

                <div className={styles.campo}>
                  <label htmlFor="email">Correo electrónico</label>
                  <input id="email" type="email" value={formData.email} onChange={handleChange("email")} />
                </div>

                <div className={styles.campo}>
                  <label htmlFor="telefono">Teléfono</label>
                  <input id="telefono" type="tel" value={formData.telefono} onChange={handleChange("telefono")} />
                </div>

                <div className={styles.campo}>
                  <label htmlFor="zona">Zona </label>
                  <input id="zona" type="text" value={formData.zona} onChange={handleChange("zona")} />
                </div>
              </div>

              <Button
                type="submit"
                texto={guardando ? "Guardando..." : "Guardar Cambios"}
                variante="primario"
                tamaño="mediano"
                disabled={guardando}
              />
            </form>
          )}

          {tabActiva === "notificaciones" && (
            <div className={styles.card}><p>Próximamente.</p></div>
          )}

          {tabActiva === "seguridad" && (
            <div className={styles.card}><p>Próximamente.</p></div>
          )}
        </div>
      </div>
    </div>
  );
}

export default PerfilUsuario;