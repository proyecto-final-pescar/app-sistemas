import { useState, useEffect, useCallback, useRef } from "react";
import { User as UserIcon, Bot, Camera, Mail, Phone, Save } from "lucide-react";
import Sidebar from "../../components/layout/Sidebar";
import TopBar from "../../components/layout/TopBar";
import PanelDestacado from "../../components/ui/panel-destacado/PanelDestacado";
import Button from "../../components/ui/button/Button";
import Select from "../../components/ui/select/Select";
import PersonajeBot from "../../components/chatbot/PersonajeBot";
import InterfazChat from "../../components/chatbot/InterfazChat";
import { useAuth } from "../../hooks/useAuth";
import api from "../../services/api";
import { subirImagen } from "../../services/uploadService";
import { enviarMensajeAlBot } from "../../services/botService";
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

// Tiempos de la vista previa del asistente 
const MS_AVISO_DEMORA_PREVIEW = 10000;
const MS_TIMEOUT_PREVIEW = 30000;

const ID_SALUDO_PREVIEW = "preview-saludo";

// Campos del formulario de datos personales que se comparan para detectar cambios
const CAMPOS_FORM = ["nombre", "apellido", "email", "telefono", "zonaId", "fotoUrl"];
const FORM_VACIO = { nombre: "", apellido: "", email: "", telefono: "", zonaId: "", fotoUrl: "" };

const TABS_BASE = [
  { id: "personales", label: "Datos Personales", icon: UserIcon },
  { id: "asistente", label: "Asistente Virtual", icon: Bot },
];

const OPCIONES_ASISTENTE = [
  {
    tipo: "perro",
    nombre: "Firu",
    descripcion: "Un perrito amigable y leal, siempre listo para ayudarte.",
  },
  {
    tipo: "gato",
    nombre: "Luna",
    descripcion: "Una gatita dulce e inteligente, tu guía experta en bienestar felino.",
  },
];


function AccionesGuardado({ tipo = "button", textoGuardar, hayCambios, guardando, onGuardar, onDescartar }) {
  return (
    <div className={styles.barraCambiosAcciones}>
      {hayCambios && (
        <button
          type="button"
          className={styles.linkFoto}
          onClick={onDescartar}
          disabled={guardando}
        >
          Descartar
        </button>
      )}
      <Button
        type={tipo}
        texto={guardando ? "Guardando..." : textoGuardar}
        variante="primario"
        tamaño="mediano"
        icon={Save}
        disabled={!hayCambios || guardando}
        onClick={onGuardar}
      />
    </div>
  );
}

function PerfilUsuario() {
  const { usuario, setUsuario } = useAuth();
  const usuarioId = usuario?.id || usuario?._id;

  const [tabActiva, setTabActiva] = useState("personales");
  const [perfil, setPerfil] = useState(null);
  const [formData, setFormData] = useState(FORM_VACIO);
  // Última versión guardada del formulario: sirve para detectar cambios y para "Descartar"
  const [datosGuardados, setDatosGuardados] = useState(FORM_VACIO);
  const [fotoArchivo, setFotoArchivo] = useState(null);
  const [fotoPreview, setFotoPreview] = useState(null);

  const [zonas, setZonas] = useState([]);
  const [estadoZonas, setEstadoZonas] = useState("cargando");

  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState(null);
  const [errorGuardado, setErrorGuardado] = useState(null);
  const [mensajeExito, setMensajeExito] = useState(null);

  const [asistenteSeleccionado, setAsistenteSeleccionado] = useState("perro");
  const [guardandoAsistente, setGuardandoAsistente] = useState(false);
  const [errorAsistente, setErrorAsistente] = useState(null);
  const [exitoAsistente, setExitoAsistente] = useState(null);

  // Vista previa funcional del asistente (le pega al mismo endpoint que el chat flotante).
  const [mensajesPreview, setMensajesPreview] = useState([]);
  const [escribiendoPreview, setEscribiendoPreview] = useState(false);
  const [tardandoPreview, setTardandoPreview] = useState(false);
  const controllerPreviewRef = useRef(null);

  const nombreAsistente = OPCIONES_ASISTENTE.find(
    (o) => o.tipo === asistenteSeleccionado
  )?.nombre;

  const asistenteGuardado = perfil?.asistenteVirtual || "perro";
  const hayCambiosPersonales =
    !!fotoArchivo || CAMPOS_FORM.some((campo) => formData[campo] !== datosGuardados[campo]);
  const hayCambiosAsistente = asistenteSeleccionado !== asistenteGuardado;

  const cargarZonas = useCallback(async () => {
    try {
      setEstadoZonas("cargando");
      const { data } = await api.get("/zonas");

      // Se acepta { data: [...] } o el array directo.
      const lista = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : null;

      if (!lista) {
        console.warn("Respuesta inesperada de /zonas (se esperaba un array):", data);
        setZonas([]);
        setEstadoZonas("error");
        return;
      }

      const validas = lista.filter((z) => z && z.id != null && z.nombre);
      if (lista.length > 0 && validas.length === 0) {
        console.warn("Las zonas de /zonas no tienen los campos id y nombre. Primer elemento:", lista[0]);
        setZonas([]);
        setEstadoZonas("error");
        return;
      }

      setZonas(validas);
      setEstadoZonas("ok");
    } catch (err) {
      console.error("No se pudieron cargar las zonas:", err.response?.status, err);
      setZonas([]);
      setEstadoZonas("error");
    }
  }, []);

  useEffect(() => {
    cargarZonas();
  }, [cargarZonas]);

  useEffect(() => {
    if (!usuarioId) return;

    const fetchPerfil = async () => {
      try {
        setCargando(true);
        setError(null);
        const { data } = await api.get(`/usuarios/${usuarioId}`);
        const perfilData = data.data;

        const inicial = {
          nombre: perfilData.nombre || "",
          apellido: perfilData.apellido || "",
          email: perfilData.email || "",
          telefono: perfilData.telefono || "",
          zonaId: perfilData.zonaId != null ? String(perfilData.zonaId) : "",
          fotoUrl: perfilData.fotoUrl || "",
        };

        setPerfil(perfilData);
        setFormData(inicial);
        setDatosGuardados(inicial);

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

  // Al cambiar de asistente se reinicia la conversación de prueba y se cancela
  // cualquier request en curso, para que no llegue una respuesta del asistente anterior.
  useEffect(() => {
    controllerPreviewRef.current?.abort();
    setEscribiendoPreview(false);
    setTardandoPreview(false);
    setMensajesPreview([
      {
        id: ID_SALUDO_PREVIEW,
        role: "assistant",
        content: `¡Hola! Soy ${nombreAsistente}, tu asistente de MyPet. ¿En qué puedo ayudarte hoy?`,
      },
    ]);
  }, [asistenteSeleccionado, nombreAsistente]);

  // Cancela la request pendiente si se desmonta la página.
  useEffect(() => {
    return () => controllerPreviewRef.current?.abort();
  }, []);

  const handleChange = (campo) => (e) => {
    setFormData((prev) => ({ ...prev, [campo]: e.target.value }));
    setMensajeExito(null);
    setErrorGuardado(null);
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
    setMensajeExito(null);
    setFotoArchivo(archivo);
    setFotoPreview((prevUrl) => {
      if (prevUrl) URL.revokeObjectURL(prevUrl);
      return URL.createObjectURL(archivo);
    });
  };

  const handleDescartarPersonales = () => {
    setFormData(datosGuardados);
    setFotoArchivo(null);
    setFotoPreview(null);
    setError(null);
    setErrorGuardado(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!hayCambiosPersonales || guardando) return;

    try {
      setGuardando(true);
      setError(null);
      setErrorGuardado(null);
      setMensajeExito(null);

      let fotoUrlFinal = formData.fotoUrl;
      if (fotoArchivo) {
        fotoUrlFinal = await subirImagen(fotoArchivo, "perfiles");
      }

      const { data } = await api.put("/usuarios/perfil", {
        nombre: formData.nombre,
        apellido: formData.apellido,
        email: formData.email,
        telefono: formData.telefono,
        zonaId: formData.zonaId === "" ? null : Number(formData.zonaId),
        fotoUrl: fotoUrlFinal,
      });

      const actualizado = data.data;

      // Si el back no devuelve zonaId o fotoUrl, se conserva lo que se acaba de enviar
      // en vez de vaciar el campo.
      const formGuardado = {
        ...formData,
        nombre: actualizado.nombre ?? formData.nombre,
        apellido: actualizado.apellido ?? formData.apellido,
        fotoUrl: actualizado.fotoUrl !== undefined ? actualizado.fotoUrl || "" : fotoUrlFinal,
        zonaId:
          actualizado.zonaId !== undefined
            ? actualizado.zonaId != null
              ? String(actualizado.zonaId)
              : ""
            : formData.zonaId,
      };

      setPerfil((prev) => ({
        ...prev,
        ...actualizado,
        nombre: actualizado.nombre,
        zona: actualizado.zona,
      }));
      setFormData(formGuardado);
      setDatosGuardados(formGuardado);

      if (fotoPreview) URL.revokeObjectURL(fotoPreview);
      setFotoPreview(null);
      setFotoArchivo(null);

      const usuarioActualizado = {
        ...usuario,
        nombre: actualizado.nombre,
        apellido: actualizado.apellido,
        email: actualizado.email,
        fotoUrl: formGuardado.fotoUrl,
      };
      localStorage.setItem("user", JSON.stringify(usuarioActualizado));
      setUsuario(usuarioActualizado);

      setMensajeExito("Perfil actualizado correctamente.");
    } catch (err) {
      const errores = err.response?.data?.errors;
      const mensajeBackend =
        Array.isArray(errores) && errores.length > 0
          ? errores.join(" ")
          : err.response?.data?.message;
      setErrorGuardado(
        mensajeBackend || "No pudimos guardar los cambios. Revisá los datos e intentá de nuevo."
      );
    } finally {
      setGuardando(false);
    }
  };

  const handleDescartarAsistente = () => {
    setAsistenteSeleccionado(asistenteGuardado);
    setErrorAsistente(null);
  };

  const handleGuardarAsistente = async () => {
    if (!hayCambiosAsistente || guardandoAsistente) return;

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

  const handleEnviarPreview = async (texto) => {
    const contenido = (texto || "").trim();
    if (!contenido || escribiendoPreview) return;

    const mensajeUsuario = { id: `u-${Date.now()}`, role: "user", content: contenido };

    // El saludo inicial y los mensajes de error son solo de la UI: no se mandan al back.
    const historial = [...mensajesPreview, mensajeUsuario]
      .filter((m) => m.id !== ID_SALUDO_PREVIEW && !m.esError)
      .map(({ role, content }) => ({ role, content }));

    setMensajesPreview((prev) => [...prev, mensajeUsuario]);
    setEscribiendoPreview(true);
    setTardandoPreview(false);

    const controller = new AbortController();
    controllerPreviewRef.current = controller;

    let vencioTimeout = false;
    const timeoutAviso = setTimeout(() => setTardandoPreview(true), MS_AVISO_DEMORA_PREVIEW);
    const timeoutMaximo = setTimeout(() => {
      vencioTimeout = true;
      controller.abort();
    }, MS_TIMEOUT_PREVIEW);

    try {
      // Se usa el asistente seleccionado en pantalla, aunque todavía no esté guardado.
      const respuesta = await enviarMensajeAlBot(historial, controller.signal, asistenteSeleccionado);

      setMensajesPreview((prev) => [
        ...prev,
        { id: `a-${Date.now()}`, role: "assistant", content: respuesta },
      ]);
    } catch (err) {
      const cancelado = err.code === "ERR_CANCELED";

      // Cancelado por cambio de asistente o por desmontaje: no se muestra nada.
      if (cancelado && !vencioTimeout) return;

      // Si el back respondió con un mensaje propio (ej: rate limit 429), se muestra ese.
      const respuestaBack = err.response?.data?.reply;

      setMensajesPreview((prev) => [
        ...prev,
        {
          id: `e-${Date.now()}`,
          role: "assistant",
          esError: true,
          content: vencioTimeout
            ? "La respuesta está tardando demasiado. Probá de nuevo en unos segundos."
            : respuestaBack ||
              "No pude conectarme con el asistente. Revisá tu conexión e intentá de nuevo.",
        },
      ]);
    } finally {
      clearTimeout(timeoutAviso);
      clearTimeout(timeoutMaximo);
      // Si cambió el asistente mientras tanto, el efecto de reinicio ya limpió el estado.
      if (controllerPreviewRef.current === controller) {
        controllerPreviewRef.current = null;
        setEscribiendoPreview(false);
        setTardandoPreview(false);
      }
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
              {mascota.foto ? (
                <img
                  src={mascota.foto}
                  alt={mascota.nombre}
                  className={styles.fotoMascotaBadge}
                />
              ) : (
                <span className={styles.emojiMascota}>
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
  const nombreCompleto = [perfil?.nombre, perfil?.apellido].filter(Boolean).join(" ");
  const nombreFormulario = [formData.nombre, formData.apellido].filter(Boolean).join(" ");
  const tabsVisibles = TABS_BASE.filter(
    (tab) => tab.id !== "asistente" || perfil?.rol === "dueno"
  );

  // La primera opción permite volver a "sin zona". Mientras carga, el texto lo avisa.
  const opcionesZona = [
    {
      value: "",
      label: estadoZonas === "cargando" ? "Cargando zonas..." : "Sin zona asignada",
    },
    ...zonas.map((z) => ({ value: String(z.id), label: z.nombre })),
  ];

  const mensajeZonas =
    estadoZonas === "error" ? (
      <>
        No pudimos cargar las zonas.{" "}
        <button type="button" className={styles.linkFoto} onClick={cargarZonas}>
          Reintentar
        </button>
      </>
    ) : estadoZonas === "ok" && zonas.length === 0 ? (
      "Todavía no hay zonas disponibles."
    ) : null;

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
            compacto
            titulo={
              <div className={styles.tituloConAvatar}>
                {fotoMostrar ? (
                  <img src={fotoMostrar} alt={nombreCompleto} className={styles.avatarPanelFoto} />
                ) : (
                  <span className={styles.avatarPanel} aria-hidden="true">
                    {perfil?.nombre?.[0]?.toUpperCase() || "?"}
                  </span>
                )}
                {nombreCompleto}
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
                  <img src={fotoMostrar} alt={nombreFormulario} className={styles.avatarGrandeFoto} />
                ) : (
                  <div className={styles.avatarGrande}>
                    {formData.nombre?.[0]?.toUpperCase() || "?"}
                  </div>
                )}
                <div className={styles.filaInferiorAsistente}>
                  <div>
                    <h3 className={styles.nombreCard}>{nombreFormulario}</h3>
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
                      <p className={styles.notaFoto}>Se guardará al hacer click en "Guardar datos".</p>
                    )}
                  </div>

                  <AccionesGuardado
                    tipo="submit"
                    textoGuardar="Guardar datos"
                    hayCambios={hayCambiosPersonales}
                    guardando={guardando}
                    onDescartar={handleDescartarPersonales}
                  />
                </div>
              </div>

              {error && <p className={styles.mensajeError} role="alert">{error}</p>}
              {errorGuardado && <p className={styles.mensajeError} role="alert">{errorGuardado}</p>}
              {mensajeExito && <p className={styles.mensajeExito} role="status">{mensajeExito}</p>}

              <div className={styles.grid}>
                <div className={styles.campo}>
                  <label htmlFor="nombre">Nombre</label>
                  <div className={styles.inputConIcono}>
                    <UserIcon className={styles.iconoCampo} size={18} aria-hidden="true" />
                    <input
                      id="nombre"
                      type="text"
                      maxLength={100}
                      autoComplete="given-name"
                      value={formData.nombre}
                      onChange={handleChange("nombre")}
                    />
                  </div>
                </div>

                <div className={styles.campo}>
                  <label htmlFor="apellido">Apellido</label>
                  <div className={styles.inputConIcono}>
                    <UserIcon className={styles.iconoCampo} size={18} aria-hidden="true" />
                    <input
                      id="apellido"
                      type="text"
                      maxLength={100}
                      autoComplete="family-name"
                      value={formData.apellido}
                      onChange={handleChange("apellido")}
                    />
                  </div>
                </div>

                <div className={styles.campo}>
                  <label htmlFor="email">Correo electrónico</label>
                  <div className={styles.inputConIcono}>
                    <Mail className={styles.iconoCampo} size={18} aria-hidden="true" />
                    <input id="email" type="email" value={formData.email} onChange={handleChange("email")} />
                  </div>
                </div>

                <div className={styles.campo}>
                  <label htmlFor="telefono">Teléfono</label>
                  <div className={styles.inputConIcono}>
                    <Phone className={styles.iconoCampo} size={18} aria-hidden="true" />
                    <input id="telefono" type="tel" value={formData.telefono} onChange={handleChange("telefono")} />
                  </div>
                </div>

                <Select
                  label="Zona"
                  placeholder={estadoZonas === "cargando" ? "Cargando zonas..." : "Zona asignada"}
                  opciones={opcionesZona}
                  value={formData.zonaId}
                  onChange={handleChange("zonaId")}
                  error={mensajeZonas}
                />
              </div>
            </form>
          )}

          {tabActiva === "asistente" && perfil?.rol === "dueno" && (
            <div className={styles.card}>
              <div className={styles.filaInferiorAsistente}>
                <div className={styles.campo}>
                  <h2 className={styles.tituloAsistente}>Personalizá tu asistente virtual</h2>
                  <p className={styles.textoAyudaAsistente}>
                    Elegí el compañero virtual que te va a ayudar en MyPet. Vas a poder cambiarlo cuando quieras.
                  </p>
                </div>

                <AccionesGuardado
                  textoGuardar="Guardar asistente"
                  hayCambios={hayCambiosAsistente}
                  guardando={guardandoAsistente}
                  onGuardar={handleGuardarAsistente}
                  onDescartar={handleDescartarAsistente}
                />
              </div>

              {errorAsistente && <p className={styles.mensajeError} role="alert">{errorAsistente}</p>}
              {exitoAsistente && <p className={styles.mensajeExito} role="status">{exitoAsistente}</p>}

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
                        onClick={() => {
                          setAsistenteSeleccionado(opcion.tipo);
                          setExitoAsistente(null);
                          setErrorAsistente(null);
                        }}
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
                    ocultarCerrar
                    autoEnfocar={false}
                    tipoBot={asistenteSeleccionado}
                    pose={escribiendoPreview ? "pensando" : "idle"}
                    estaEscribiendo={escribiendoPreview}
                    tardandoMucho={tardandoPreview}
                    nombreBot={nombreAsistente}
                    mensajes={mensajesPreview}
                    onEnviarMensaje={handleEnviarPreview}
                  />
                </div>
              </div>

              <div className={styles.filaInferiorAsistente}>
                <div className={styles.tipAsistente}>
                  <span className={styles.tipIcono} aria-hidden="true">💡</span>
                  <p>
                    <strong>¿Sabías que?</strong> Tu asistente virtual puede ayudarte a sacar
                    turnos, resolver dudas y mucho más.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default PerfilUsuario;