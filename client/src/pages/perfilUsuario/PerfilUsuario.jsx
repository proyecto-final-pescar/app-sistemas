import { useState, useEffect } from "react";
import { User as UserIcon, Bot, Camera } from "lucide-react";
import Sidebar from "../../components/layout/Sidebar";
import TopBar from "../../components/layout/TopBar";
import PanelDestacado from "../../components/ui/panel-destacado/PanelDestacado";
import Button from "../../components/ui/button/Button";
import PersonajeBot from "../../components/chatbot/PersonajeBot";
import InterfazChat from "../../components/chatbot/InterfazChat";
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

const TABS_BASE = [
  { id: "personales", label: "Datos Personales", icon: UserIcon },
  { id: "asistente", label: "Asistente Virtual", icon: Bot },
];

const OPCIONES_ASISTENTE = [
  {
    tipo: "perro",
    nombre: "Max",
    descripcion: "Un perrito amigable y leal, siempre listo para ayudarte.",
  },
  {
    tipo: "gato",
    nombre: "Mimi",
    descripcion: "Una gatita dulce e inteligente, tu guía experta en bienestar felino.",
  },
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

  const [asistenteSeleccionado, setAsistenteSeleccionado] = useState("perro");
  const [guardandoAsistente, setGuardandoAsistente] = useState(false);
  const [errorAsistente, setErrorAsistente] = useState(null);
  const [exitoAsistente, setExitoAsistente] = useState(null);

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
       
        setAsistenteSeleccionado(perfilData.asistenteVirtual || "perro");
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

  useEffect(() => {
    if (!mensajeExito) return;
    const timer = setTimeout(() => setMensajeExito(null), 4000);
    return () => clearTimeout(timer);
  }, [mensajeExito]);

  useEffect(() => {
    if (!exitoAsistente) return;
    const timer = setTimeout(() => setExitoAsistente(null), 4000);
    return () => clearTimeout(timer);
  }, [exitoAsistente]);

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
    
      let fotoUrlFinal = formData.fotoUrl;
      if (fotoArchivo) {
        fotoUrlFinal = await subirImagen(fotoArchivo, "perfiles");
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

  const handleGuardarAsistente = async () => {
    try {
      setGuardandoAsistente(true);
      setErrorAsistente(null);
      setExitoAsistente(null);

      await api.put("/usuarios/perfil", { asistenteVirtual: asistenteSeleccionado });

      const usuarioActualizado = {
        ...usuario,
        asistenteVirtual: asistenteSeleccionado,
      };
      localStorage.setItem("user", JSON.stringify(usuarioActualizado));
      setUsuario(usuarioActualizado);
      setPerfil((prev) => (prev ? { ...prev, asistenteVirtual: asistenteSeleccionado } : prev));

      setExitoAsistente("Asistente actualizado correctamente.");
    } catch (err) {
      setErrorAsistente("No pudimos guardar el asistente elegido. Probá de nuevo.");
    } finally {
      setGuardandoAsistente(false);
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
            <button
              key={mascota._id}
              type="button"
              className={styles.badgeMascota}
              onClick={(e) => {
                e.currentTarget.scrollIntoView({
                  behavior: "smooth",
                  inline: "center",
                  block: "nearest"
                });
              }}
            >
              {/* CORRECCIÓN AQUÍ: Se cambió mascota.fotoUrl a mascota.foto basado en la DB */}
              {mascota.foto ? (
                <img 
                  src={mascota.foto} 
                  alt={mascota.nombre} 
                  className={styles.fotoMascotaBadge} 
                />
              ) : (
                <span className={styles.emojiMascota}>
                  {/* Aseguramos que la especie esté en minúscula para que coincida con el diccionario */}
                  {EMOJI_ESPECIE[mascota.especie?.toLowerCase()] || "🐾"}
                </span>
              )}
              {mascota.nombre}
            </button>
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
  const tabsVisibles = TABS_BASE.filter(
    (tab) => tab.id !== "asistente" || perfil?.rol === "dueno"
  );

  if (cargando) {
    return (
      <div className={styles.layout}>
        <Sidebar title="Mi Perfil y Configuración"/>
        <div className={styles.contenido}>
          <div className={styles.headerFijo}>
            <TopBar title="Mi Perfil y Configuración" />
          </div>
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
        
        <div className={styles.headerFijo}>
          <TopBar title="Mi Perfil y Configuración" />
        </div>

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
            {tabsVisibles.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                className={`${styles.tab} ${tabActiva === id ? styles.tabActiva : ""}`}
                onClick={(e) => {
                  setTabActiva(id);
                  e.currentTarget.scrollIntoView({
                    behavior: "smooth",
                    inline: "center",
                    block: "nearest"
                  });
                }}
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

          {tabActiva === "asistente" && perfil?.rol === "dueno" && (
            <div className={styles.card}>
              <h2 className={styles.tituloAsistente}>Personalizá tu asistente virtual</h2>
              <p className={styles.textoAyudaAsistente}>
                Elegí el compañero virtual que te va a ayudar en MyPet. Vas a poder cambiarlo cuando quieras.
              </p>

              {errorAsistente && <p className={styles.mensajeError}>{errorAsistente}</p>}
              {exitoAsistente && <p className={styles.mensajeExito}>{exitoAsistente}</p>}

              <div className={styles.contenidoAsistente}>
                <div className={styles.opcionesAsistente}>
                  {OPCIONES_ASISTENTE.map((opcion) => {
                    const seleccionada = asistenteSeleccionado === opcion.tipo;
                    return (
                      <button
                        key={opcion.tipo}
                        type="button"
                        className={`${styles.tarjetaAsistente} ${
                          seleccionada ? styles.tarjetaAsistenteSeleccionada : ""
                        }`}
                        onClick={() => setAsistenteSeleccionado(opcion.tipo)}
                        aria-pressed={seleccionada}
                      >
                        {seleccionada ? (
                          <span className={styles.checkAsistente}>✓</span>
                        ) : (
                          <span className={styles.circuloVacio} aria-hidden="true" />
                        )}
                        <div className={styles.fondoAvatarAsistente}>
                          <PersonajeBot
                            tipo={opcion.tipo}
                            pose="idle"
                            size={100}
                            variante="icono"
                          />
                        </div>
                        <p className={styles.nombreAsistente}>{opcion.nombre}</p>
                        <p className={styles.descripcionAsistente}>{opcion.descripcion}</p>
                        {seleccionada && (
                          <span className={styles.pillSeleccionado}>Seleccionado</span>
                        )}
                      </button>
                    );
                  })}
                </div>

                <div className={styles.previewAsistente}>
                  <p className={styles.labelPreview}>Vista previa</p>
                  <InterfazChat
                    inline
                    soloVistaPrevia
                    tipoBot={asistenteSeleccionado}
                    pose="idle"
                    estaEscribiendo={false}
                    nombreBot={
                      OPCIONES_ASISTENTE.find((o) => o.tipo === asistenteSeleccionado)?.nombre
                    }
                    mensajes={[
                      {
                        id: "preview",
                        role: "assistant",
                        content: `¡Hola! Soy ${
                          OPCIONES_ASISTENTE.find((o) => o.tipo === asistenteSeleccionado)?.nombre
                        }, tu asistente de MyPet. ¿En qué puedo ayudarte hoy?`,
                      },
                    ]}
                    onEnviarMensaje={() => {}}
                    onCerrar={() => {}}
                  />
                </div>
              </div>

              <div className={styles.filaInferiorAsistente}>
                <div className={styles.tipAsistente}>
                  <span className={styles.tipIcono} aria-hidden="true">💡</span>
                  <p>
                    <strong>¿Sabías que?</strong> Tu asistente virtual puede ayudarte a sacar
                    turnos, resolver dudas, recordarte vacunas y mucho más.
                  </p>
                </div>

                <Button
                  type="button"
                  texto={guardandoAsistente ? "Guardando..." : "Guardar Cambios"}
                  variante="primario"
                  tamaño="mediano"
                  disabled={guardandoAsistente}
                  onClick={handleGuardarAsistente}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default PerfilUsuario;