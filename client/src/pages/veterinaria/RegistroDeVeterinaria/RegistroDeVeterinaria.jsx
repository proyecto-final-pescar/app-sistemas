import { useState, useEffect } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import HeaderMinimo from "../../../components/layout/HeaderMinimo";
import Button from "../../../components/ui/button/Button";
import Input from "../../../components/ui/input/Input";
import Select from "../../../components/ui/select/Select";
import PanelDestacado from "../../../components/ui/panel-destacado/PanelDestacado";
import SuccessModal from "../../../components/ui/success-modal/SuccessModal";
import ErrorModal from "../../../components/ui/error-modal/ErrorModal";
import styles from "./RegistroDeVeterinaria.module.css";
import { useAutocompleteDireccion } from "../../../hooks/useAutocompleteDireccion";

import {
  servicioVacio,
  profesionalVacio,
  DIAS,
  HORAS,
  construirHorarios,
  validarEmail,
  validarCUIT,
  normalizarCUIT,
  validarTelefono,
  normalizarTelefonoAR,
  validarSitioWeb,
  normalizarSitioWeb,
  validarNombrePersona,
  direccionEnCABAPorComponentes,
  validarPrecio,
  validarCoordenadas,
  validarEnCABA,
  direccionEsPuntual,
  validarHorarios,
} from "../../../utils/RegistroVeterinarias";

import { useCategoriasServicio } from "../../../hooks/useCategoriasServicio";
import { useEspecialidades } from "../../../hooks/useEspecialidades";
import { obtenerMiVeterinaria } from "../../../services/veterinariaService";

const PASOS = ["Datos", "Servicios", "Profesionales", "Horarios"];

const IconSearch = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
    <path d="m16.5 16.5 4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);
const IconPin = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M12 2a7 7 0 0 1 7 7c0 5.25-7 13-7 13S5 14.25 5 9a7 7 0 0 1 7-7Z" stroke="currentColor" strokeWidth="2" />
    <circle cx="12" cy="9" r="2.5" stroke="currentColor" strokeWidth="2" />
  </svg>
);
const IconPlus = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <line x1="12" y1="5" x2="12" y2="19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <line x1="5" y1="12" x2="19" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);
const IconTrash = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <polyline points="3 6 5 6 21 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M19 6l-1 14H6L5 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M10 11v6M14 11v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M9 6V4h6v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);
const IconCheck = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M20 6 9 17l-5-5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const IconMapa = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M12 2a7 7 0 0 1 7 7c0 5.25-7 13-7 13S5 14.25 5 9a7 7 0 0 1 7-7Z" stroke="currentColor" strokeWidth="2" />
    <circle cx="12" cy="9" r="2.5" stroke="currentColor" strokeWidth="2" />
  </svg>
);

const hayErrores = (errores) =>
  Object.values(errores).some((v) =>
    v && typeof v === "object" ? hayErrores(v) : Boolean(v),
  );

export default function RegistroDeVeterinaria() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);

  // Guard inverso a RutaVeterinariaActiva: si el usuario ya tiene una
  // veterinaria registrada, no debe ver el formulario de alta de nuevo.
  // cargando | sin-perfil | pendiente | activa
  const [acceso, setAcceso] = useState("cargando");

  useEffect(() => {
    obtenerMiVeterinaria()
      .then((data) => {
        setAcceso(data?.estado === "ACT" ? "activa" : "pendiente");
      })
      .catch(() => setAcceso("sin-perfil"));
  }, []);

  const {
    direccion,
    lat,
    lng,
    suggestions,
    loadingAddress,
    addressComponents,
    handleChangeDireccion,
    handleSelectPlace,
  } = useAutocompleteDireccion();

  const { categorias, loading: loadingCategorias, error: errorCategorias } = useCategoriasServicio();
  const { especialidades, loading: loadingEspecialidades, error: errorEspecialidades } = useEspecialidades();

  // Paso 1
  const [form, setForm] = useState({
    nombreClinica: "",
    razonSocial: "",
    cuit: "",
    telefono: "",
    email: "",
    sitioWeb: "",
  });
  const [erroresStep1, setErroresStep1] = useState({});

  // Paso 2 — un objeto de errores por índice de servicio
  const [servicios, setServicios] = useState([servicioVacio()]);
  const [erroresStep2, setErroresStep2] = useState([]);

  // Paso 3 — un objeto de errores por índice de profesional
  const [profesionales, setProfesionales] = useState([profesionalVacio()]);
  const [erroresStep3, setErroresStep3] = useState([]);

  // Paso 4
  const [diasSeleccionados, setDiasSeleccionados] = useState({});
  const [urgencias, setUrgencias] = useState(false);
  const [errorStep4, setErrorStep4] = useState("");
  const [guardando, setGuardando] = useState(false);

  const [successModal, setSuccessModal] = useState(false);
  const [errorModal, setErrorModal] = useState({ abierto: false, mensaje: "" });

  const validateStep1 = () => {
    const errores = {};

    if (!form.nombreClinica.trim())
      errores.nombreClinica = "El nombre de la clínica es requerido.";

    if (!form.cuit.trim()) errores.cuit = "El CUIT/CUIL es requerido.";
    else if (!validarCUIT(form.cuit))
      errores.cuit = "Ingresá un CUIT/CUIL válido de 11 dígitos (con o sin guiones).";

    if (!form.telefono.trim()) errores.telefono = "El teléfono es requerido.";
    else if (!validarTelefono(form.telefono))
      errores.telefono =
        "Ingresá un teléfono de Buenos Aires: código de área 11 + número (10 dígitos), sin 0 ni 15.";

    if (!direccion.trim()) {
      errores.direccion = "La dirección es requerida.";
    } else if (!validarCoordenadas(lat, lng)) {
      errores.direccion = "Seleccioná una dirección de la lista para obtener las coordenadas.";
    } else if (
      !validarEnCABA(lat, lng) ||
      (addressComponents.length > 0 && !direccionEnCABAPorComponentes(addressComponents))
    ) {
      errores.direccion = "Por el momento MyPet solo está disponible en CABA. Esta dirección está fuera de esa zona.";
    } else if (!direccionEsPuntual(addressComponents)) {
      errores.direccion = "Ingresá una dirección puntual (calle y altura), no un barrio o localidad.";
    }

    if (!form.email.trim()) errores.email = "El email institucional es requerido.";
    else if (!validarEmail(form.email)) errores.email = "El email no tiene un formato válido.";

    if (form.sitioWeb.trim() && !validarSitioWeb(form.sitioWeb))
      errores.sitioWeb = "Ingresá un sitio web válido (ej: vetcenterpalermo.com.ar).";

    return errores;
  };

  const handleContinuarStep1 = () => {
    const errores = validateStep1();
    setErroresStep1(errores);
    if (!hayErrores(errores)) setStep(2);
  };

  // Servicios
  const handleChangeServicio = (i, field, value) =>
    setServicios((prev) =>
      prev.map((s, idx) => (idx === i ? { ...s, [field]: value } : s)),
    );
  const agregarServicio = () => {
    setServicios((prev) => [...prev, servicioVacio()]);
    setErroresStep2((prev) => [...prev, {}]);
  };
  const eliminarServicio = (i) => {
    if (servicios.length > 1) {
      const idEliminado = servicios[i]?.id;
      setServicios((prev) => prev.filter((_, idx) => idx !== i));
      setErroresStep2((prev) => prev.filter((_, idx) => idx !== i));
      // Los profesionales no pueden quedar referenciando un servicio borrado.
      setProfesionales((prev) =>
        prev.map((p) => ({
          ...p,
          serviciosIds: (p.serviciosIds || []).filter((id) => id !== idEliminado),
        })),
      );
    }
  };

  const validateStep2 = () => {
    const vistos = new Set();
    return servicios.map((s) => {
      const err = {};
      if (!s.categoria) err.categoria = "Seleccioná una categoría.";
      if (!s.nombre.trim()) err.nombre = "El nombre del servicio es requerido.";
      else {
        const clave = `${s.categoria}|${s.nombre.trim().toLowerCase()}`;
        if (vistos.has(clave))
          err.nombre = "Ya cargaste un servicio con este nombre en la misma categoría.";
        vistos.add(clave);
      }
      if (!validarPrecio(s.precio))
        err.precio = "El precio debe ser mayor a 0 y tener hasta 2 decimales.";
      return err;
    });
  };

  const handleContinuarStep2 = () => {
    const errores = validateStep2();
    setErroresStep2(errores);
    if (!errores.some(hayErrores)) setStep(3);
  };

  // Profesionales
  const handleChangeProfesional = (i, field, value) =>
    setProfesionales((prev) =>
      prev.map((p, idx) => (idx === i ? { ...p, [field]: value } : p)),
    );

  const toggleServicioProfesional = (profIndex, servicioId) => {
    setProfesionales((prev) =>
      prev.map((p, idx) => {
        if (idx !== profIndex) return p;
        const actuales = p.serviciosIds || [];
        const yaEsta = actuales.includes(servicioId);
        return {
          ...p,
          serviciosIds: yaEsta
            ? actuales.filter((id) => id !== servicioId)
            : [...actuales, servicioId],
        };
      })
    );
  };

  const agregarProfesional = () => {
    setProfesionales((prev) => [...prev, profesionalVacio()]);
    setErroresStep3((prev) => [...prev, {}]);
  };
  const eliminarProfesional = (i) => {
    if (profesionales.length > 1) {
      setProfesionales((prev) => prev.filter((_, idx) => idx !== i));
      setErroresStep3((prev) => prev.filter((_, idx) => idx !== i));
    }
  };

  const validateStep3 = () => {
    const emailsVistos = new Set();
    return profesionales.map((p) => {
      const err = {};
      if (!p.nombre.trim()) err.nombre = "El nombre es requerido.";
      else if (!validarNombrePersona(p.nombre)) err.nombre = "El nombre solo puede contener letras.";
      if (!p.apellido.trim()) err.apellido = "El apellido es requerido.";
      else if (!validarNombrePersona(p.apellido)) err.apellido = "El apellido solo puede contener letras.";
      if (!p.email.trim()) err.email = "El email es requerido.";
      else if (!validarEmail(p.email)) err.email = "El email no tiene un formato válido.";
      else {
        const clave = p.email.trim().toLowerCase();
        if (emailsVistos.has(clave)) err.email = "Este email ya está cargado en otro profesional.";
        emailsVistos.add(clave);
      }
      if (!p.especialidad) err.especialidad = "Seleccioná una especialidad.";
      // Regla de negocio: todo profesional debe brindar al menos un servicio.
      if (!(p.serviciosIds || []).length) err.servicios = "Seleccioná al menos un servicio.";
      return err;
    });
  };

  const handleContinuarStep3 = () => {
    const errores = validateStep3();
    setErroresStep3(errores);
    if (!errores.some(hayErrores)) setStep(4);
  };

  // Horarios
  const toggleDia = (dia) => {
    setDiasSeleccionados((prev) => {
      if (prev[dia]) {
        const next = { ...prev };
        delete next[dia];
        return next;
      }
      return { ...prev, [dia]: { desde: "09:00", hasta: "17:00" } };
    });
  };
  const handleHorario = (dia, campo, valor) =>
    setDiasSeleccionados((prev) => ({
      ...prev,
      [dia]: { ...prev[dia], [campo]: valor },
    }));

  const validateStep4 = () => {
    if (Object.keys(diasSeleccionados).length === 0)
      return "Seleccioná al menos un día de atención.";
    return validarHorarios(diasSeleccionados);
  };

  const handleGuardarReal = async () => {
    if (guardando) return;

    const token = localStorage.getItem("token");
    if (!token) {
      setErrorStep4("Tu sesión expiró. Iniciá sesión nuevamente.");
      return;
    }
    if (!validarCoordenadas(lat, lng)) {
      setErrorStep4(
        "La dirección seleccionada no es válida. Volvé al paso 1 y seleccioná una dirección de la lista.",
      );
      return;
    }
    if (!validarEnCABA(lat, lng)) {
      setErrorStep4("La dirección seleccionada está fuera de CABA. Volvé al paso 1 y corregila.");
      return;
    }

    setGuardando(true);
    setErrorStep4("");
    try {
      const body = {
        nombre: form.nombreClinica.trim(),
        direccion: direccion.trim(),
        razonSocial: form.razonSocial.trim(),
        cuit: normalizarCUIT(form.cuit),
        telefono: normalizarTelefonoAR(form.telefono),
        email: form.email.trim(),
        sitioWeb: normalizarSitioWeb(form.sitioWeb),
        coordenadas: { type: "Point", coordinates: [lng, lat] },
        especialidades: [],
        servicios: servicios.map((s) => ({
          idLocal: s.id,
          categoria: s.categoria,
          nombre: s.nombre.trim(),
          precio: Number(s.precio),
        })),
        profesionales: profesionales.map((p) => ({
          nombre: p.nombre.trim(),
          apellido: p.apellido.trim(),
          especialidad: p.especialidad,
          email: p.email.trim(),
          serviciosIds: p.serviciosIds || [],
        })),
        horarios: construirHorarios(diasSeleccionados),
        urgencias24hs: urgencias,
      };

      const res = await fetch(`${import.meta.env.VITE_API_URL}/veterinarias`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setErrorModal({
          abierto: true,
          mensaje: data.message || "No se pudo guardar el registro.",
        });
        return;
      }

      setSuccessModal(true);
    } catch {
      setErrorModal({
        abierto: true,
        mensaje: "Error de conexión. Intentá de nuevo.",
      });
    } finally {
      setGuardando(false);
    }
  };

  const handleGuardar = () => {
    const err = validateStep4();
    if (err) {
      setErrorStep4(err);
      return;
    }
    setErrorStep4("");
    handleGuardarReal();
  };

  if (acceso === "cargando") return null;
  if (acceso === "activa")
    return <Navigate to="/home-veterinaria" replace />;
  if (acceso === "pendiente")
    return <Navigate to="/veterinaria-pendiente" replace />;

  return (
    <div className={styles.shell}>
      <HeaderMinimo />
      <div className={styles.main}>
        <SuccessModal
          abierto={successModal}
          titulo="¡Solicitud enviada!"
          mensaje="Un administrador va a revisar los datos de tu veterinaria y verificar que cumplas con los requisitos. Te vamos a avisar en cuanto sea aprobada para que puedas empezar a usar MyPet."
          textoBoton="Entendido"
          onClose={() => {
            setSuccessModal(false);
            navigate("/veterinaria-pendiente", { replace: true });
          }}
        />
        <ErrorModal
          abierto={errorModal.abierto}
          titulo="Error al guardar"
          mensaje={errorModal.mensaje}
          textoBoton="Cerrar"
          onClose={() => setErrorModal({ abierto: false, mensaje: "" })}
        />

        {/* ══ PASO 0: bienvenida ══ */}
        {step === 0 && (
          <div className={styles.container}>
            <div className={styles.welcomeCard}>
              <div className={styles.welcomeIcono}>
                <IconMapa />
              </div>
              <h1 className={styles.welcomeTitulo}>¡Bienvenido a MyPet!</h1>
              <p className={styles.welcomeTexto}>
                Para acceder a las funcionalidades de MyPet, primero necesitamos
                que registres tu veterinaria. Va a tomar solo unos minutos: te
                vamos a pedir los datos de tu clínica, tus servicios,
                profesionales y horarios de atención.
              </p>
              <div className={styles.cabaAviso}>
                Por el momento, MyPet solo está disponible para veterinarias
                ubicadas en la <strong>Ciudad Autónoma de Buenos Aires (CABA)</strong>.
                Vas a necesitar una dirección dentro
                de esa zona para poder completar el registro.
              </div>
              <div className={styles.welcomeBotonWrap}>
                <Button
                  texto="Comenzar registro →"
                  variante="primario"
                  tamaño="mediano"
                  onClick={() => setStep(1)}
                />
              </div>
            </div>
          </div>
        )}

        {/* ── Indicador de pasos ── */}
        {step > 0 && (
          <div className={styles.container}>
            <div className={styles.stepperWrap}>
              {PASOS.map((paso, idx) => {
                const numero = idx + 1;
                const activo = step === numero;
                const completado = step > numero;
                return (
                  <div key={paso} className={styles.stepperItem}>
                    <div className={styles.stepperItemInner}>
                      <div
                        className={`${styles.stepDot} ${activo ? styles.stepDotActivo : ""} ${completado ? styles.stepDotCompletado : ""}`}
                      >
                        {completado ? <IconCheck /> : numero}
                      </div>
                      <span className={`${styles.stepLabel} ${activo ? styles.stepLabelActivo : ""}`}>
                        {paso}
                      </span>
                    </div>
                    {idx < PASOS.length - 1 && (
                      <div className={`${styles.stepLine} ${completado ? styles.stepLineCompletado : ""}`} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ══ PASO 1 ══ */}
        {step === 1 && (
          <div className={styles.container}>
            <div className={styles.panelWrap}>
              <PanelDestacado
                titulo="¡Registrá tu clínica veterinaria!"
                subtitulo="Completá el perfil de tu clínica para que los dueños de mascotas te encuentren."
              />
            </div>
            <div className={styles.formCard}>
              <h3 className={styles.cardTitle}>Datos de la clínica</h3>
              <p className={styles.cardSub}>
                Ingresá la información principal para crear el perfil de tu
                centro veterinario.
              </p>
              <div className={styles.grid2}>
                <Input
                  label="Nombre de la clínica *"
                  name="nombreClinica"
                  value={form.nombreClinica}
                  placeholder="VetCenter Palermo"
                  maxLength={80}
                  error={erroresStep1.nombreClinica}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, nombreClinica: e.target.value }))
                  }
                />
                <Input
                  label="Razón social"
                  name="razonSocial"
                  value={form.razonSocial}
                  placeholder="VetCenter Palermo S.R.L."
                  maxLength={80}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, razonSocial: e.target.value }))
                  }
                />
                <Input
                  label="CUIT/CUIL *"
                  name="cuit"
                  value={form.cuit}
                  placeholder="20-12345678-6"
                  maxLength={13}
                  error={erroresStep1.cuit}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, cuit: e.target.value.trim() }))
                  }
                />
                <Input
                  label="Teléfono *"
                  name="telefono"
                  value={form.telefono}
                  placeholder="1123456789"
                  maxLength={10}
                  error={erroresStep1.telefono}
                  onChange={(e) => {
                    const soloNumeros = e.target.value.replace(/\D/g, "");
                    setForm((f) => ({ ...f, telefono: soloNumeros }));
                  }}
                />
              </div>

              {/* Dirección con autocomplete — particular de esta pantalla */}
              <div className={`${styles.field} ${styles.direccionWrap}`}>
                <label className={styles.label}>
                  Dirección (calle y altura, en CABA)<span className={styles.req}>*</span>
                </label>
                <div className={styles.inputWrap}>
                  <span className={styles.inputIcon}>
                    <IconSearch />
                  </span>
                  <input
                    name="direccion"
                    value={direccion}
                    onChange={(e) => handleChangeDireccion(e.target.value)}
                    placeholder="Av. Rivadavia 1234, Piso 3 Dpto. B"
                    autoComplete="off"
                    className={styles.inputInner}
                  />
                  {lat && (
                    <span className={styles.inputIcon} style={{ color: "#25a36f" }}>
                      <IconPin />
                    </span>
                  )}
                </div>
                {suggestions.length > 0 && (
                  <ul className={styles.suggestions}>
                    {suggestions.map((s) => (
                      <li
                        key={s.place_id}
                        className={styles.suggestionItem}
                        onClick={() => handleSelectPlace(s)}
                      >
                        <span style={{ color: "#7c3aed", marginRight: "8px" }}>
                          📍
                        </span>
                        {s.description}
                      </li>
                    ))}
                  </ul>
                )}
                {loadingAddress && (
                  <p className={styles.helperText}>Buscando dirección...</p>
                )}
                {erroresStep1.direccion && (
                  <p className={styles.errorCampo}>{erroresStep1.direccion}</p>
                )}
              </div>

              <div className={`${styles.grid2} ${styles.grid2MarginTop}`}>
                <Input
                  label="Email institucional *"
                  type="email"
                  name="email"
                  value={form.email}
                  placeholder="info@vetcenterpalermo.com"
                  maxLength={60}
                  error={erroresStep1.email}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, email: e.target.value }))
                  }
                />
                <Input
                  label="Sitio web"
                  name="sitioWeb"
                  value={form.sitioWeb}
                  placeholder="vetcenterpalermo.com.ar"
                  maxLength={100}
                  error={erroresStep1.sitioWeb}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, sitioWeb: e.target.value }))
                  }
                />
              </div>

              <div className={styles.continuarWrap}>
                <Button
                  texto="Continuar →"
                  variante="primario"
                  tamaño="mediano"
                  onClick={handleContinuarStep1}
                />
              </div>
            </div>
          </div>
        )}

        {/* ══ PASO 2 ══ */}
        {step === 2 && (
          <div className={styles.container}>
            <div className={styles.panelWrap}>
              <PanelDestacado
                titulo="Configurá tus servicios y precios"
                subtitulo="Detallá las prestaciones y aranceles de tu clínica para tus clientes."
              />
            </div>
            <div className={styles.formCard}>
              <h3 className={styles.cardTitle}>Servicios y precios</h3>
              <p className={styles.cardSub}>Ingresá la información para crear el perfil de tu centro veterinario.</p>

              {errorCategorias && (
                <p className={styles.errorMsg}>{errorCategorias}</p>
              )}

              {errorEspecialidades && (
                <p className={styles.errorMsg}>{errorEspecialidades}</p>
              )}

              <div className={styles.listaItems}>
                {servicios.map((servicio, index) => (
                  <div key={servicio.id} className={styles.subCard}>
                    {servicios.length > 1 && (
                      <button
                        onClick={() => eliminarServicio(index)}
                        className={styles.btnEliminar}
                        title="Eliminar"
                      ><IconTrash /></button>
                    )}
                    <Select
                      label="Categoría del Servicio *"
                      opciones={categorias}
                      value={servicio.categoria}
                      placeholder={loadingCategorias ? "Cargando categorías..." : "Seleccioná una categoría"}
                      error={erroresStep2[index]?.categoria}
                      onChange={(e) => handleChangeServicio(index, "categoria", e.target.value)}
                    />
                    <Input
                      label="Nombre del Servicio o Prestación *"
                      value={servicio.nombre}
                      error={erroresStep2[index]?.nombre}
                      onChange={(e) =>
                        handleChangeServicio(index, "nombre", e.target.value)
                      }
                      maxLength={80}
                      placeholder="Ej: Vacuna Antirrábica Anual"
                    />
                    <div className={styles.field}>
                      <label className={styles.label}>
                        Precio<span className={styles.req}>*</span>
                      </label>
                      <div className={styles.precioWrap}>
                        <span className={styles.precioSimbolo}>$</span>
                        <input
                          type="number"
                          min="0"
                          value={servicio.precio}
                          onChange={(e) =>
                            handleChangeServicio(
                              index,
                              "precio",
                              e.target.value,
                            )
                          }
                          placeholder="0.00"
                          className={styles.precioInput}
                        />
                      </div>
                      {erroresStep2[index]?.precio && (
                        <p className={styles.errorCampo}>{erroresStep2[index].precio}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <button onClick={agregarServicio} className={styles.btnAgregar}>
                <IconPlus /> Agregar servicio
              </button>
              <div className={styles.botonesRow}>
                <Button
                  texto="← Atrás"
                  variante="secundario"
                  tamaño="mediano"
                  onClick={() => setStep(1)}
                />
                <Button
                  texto="Continuar →"
                  variante="primario"
                  tamaño="mediano"
                  onClick={handleContinuarStep2}
                />
              </div>
            </div>
          </div>
        )}

        {/* ══ PASO 3 ══ */}
        {step === 3 && (
          <div className={styles.container}>
            <div className={styles.panelWrap}>
              <PanelDestacado
                titulo="Sumá a tu equipo médico"
                subtitulo="Registrá a los profesionales de tu veterinaria."
              />
            </div>
            <div className={styles.formCard}>
              <h3 className={styles.cardTitle}>Profesionales</h3>
              <p className={styles.cardSub}>
                Ingresá la información para crear el perfil de tu centro
                veterinario.
              </p>
              <div className={styles.listaItems}>
                {profesionales.map((prof, index) => (
                  <div key={prof.id} className={styles.subCard}>
                    {profesionales.length > 1 && (
                      <button
                        onClick={() => eliminarProfesional(index)}
                        className={styles.btnEliminar}
                        title="Eliminar"
                      ><IconTrash /></button>
                    )}
                    <div className={styles.grid2}>
                      <Input
                        label="Nombre *"
                        value={prof.nombre}
                        error={erroresStep3[index]?.nombre}
                        maxLength={40}
                        onChange={(e) =>
                          handleChangeProfesional(index, "nombre", e.target.value)
                        }
                        placeholder="Juan"
                      />
                      <Input
                        label="Apellido *"
                        value={prof.apellido}
                        error={erroresStep3[index]?.apellido}
                        maxLength={40}
                        onChange={(e) =>
                          handleChangeProfesional(index, "apellido", e.target.value)
                        }
                        placeholder="Pérez"
                      />
                    </div>
                    <Input
                      label="Email del profesional *"
                      type="email"
                      value={prof.email}
                      error={erroresStep3[index]?.email}
                      onChange={(e) =>
                        handleChangeProfesional(index, "email", e.target.value)
                      }
                      placeholder="juanperez@email.com"
                    />
                    <Select
                      label="Especialidad *"
                      opciones={especialidades}
                      value={prof.especialidad}
                      placeholder={loadingEspecialidades ? "Cargando especialidades..." : "Seleccioná una especialidad"}
                      error={erroresStep3[index]?.especialidad}
                      onChange={(e) => handleChangeProfesional(index, "especialidad", e.target.value)}
                    />

                    <div className={styles.field}>
                      <label className={styles.label}>
                        Servicios que brinda<span className={styles.req}>*</span>
                      </label>
                      <div className={styles.profesionalesGrid}>
                        {servicios.filter((s) => s.nombre.trim()).length === 0 && (
                          <span className={styles.helperText}>
                            Cargá servicios en el paso anterior para poder asignarlos.
                          </span>
                        )}
                        {servicios
                          .filter((s) => s.nombre.trim())
                          .map((s) => {
                            const seleccionado = (prof.serviciosIds || []).includes(s.id);
                            return (
                              <button
                                key={s.id}
                                type="button"
                                className={`${styles.chipProf} ${seleccionado ? styles.chipProfActivo : ""}`}
                                onClick={() => toggleServicioProfesional(index, s.id)}
                              >
                                {s.nombre}
                                {seleccionado && <span className={styles.chipX}>×</span>}
                              </button>
                            );
                          })}
                      </div>
                      {erroresStep3[index]?.servicios && (
                        <p className={styles.errorCampo}>{erroresStep3[index].servicios}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <button
                onClick={agregarProfesional}
                className={styles.btnAgregar}
              >
                <IconPlus /> Agregar profesional
              </button>
              <div className={styles.botonesRow}>
                <Button
                  texto="← Atrás"
                  variante="secundario"
                  tamaño="mediano"
                  onClick={() => setStep(2)}
                />
                <Button
                  texto="Continuar →"
                  variante="primario"
                  tamaño="mediano"
                  onClick={handleContinuarStep3}
                />
              </div>
            </div>
          </div>
        )}

        {/* ══ PASO 4 ══ */}
        {step === 4 && (
          <div className={styles.container}>
            <div className={styles.panelWrap}>
              <PanelDestacado
                titulo="Definí tus horarios de atención"
                subtitulo="Establecé los días y franjas horarias disponibles para que los usuarios puedan programar sus turnos."
              />
            </div>
            <div className={styles.formCard}>
              <h3 className={styles.cardTitle}>Disponibilidad</h3>
              <p className={styles.cardSub}>
                Ingresá la información para crear el perfil de tu centro
                veterinario.
              </p>

              <div className={styles.field}>
                <label className={styles.label}>
                  Días de atención<span className={styles.req}>*</span>
                </label>
                <div className={styles.diasWrap}>
                  {DIAS.map((dia) => {
                    const activo = !!diasSeleccionados[dia];
                    return (
                      <button
                        key={dia}
                        onClick={() => toggleDia(dia)}
                        className={`${styles.diaBtn} ${activo ? styles.diaBtnActivo : styles.diaBtnInactivo}`}
                      >
                        {dia}
                      </button>
                    );
                  })}
                </div>
              </div>

              {Object.keys(diasSeleccionados).length > 0 && (
                <div className={styles.horariosWrap}>
                  <label className={styles.label}>Horarios por día</label>
                  {Object.entries(diasSeleccionados).map(([dia, horario]) => (
                    <div key={dia} className={styles.horarioDiaRow}>
                      <span className={styles.horarioDiaNombre}>{dia}</span>
                      <div className={styles.horarioGroup}>
                        <span className={styles.horarioGroupLabel}>Desde:</span>
                        <div className={styles.horarioSelectWrap}>
                          <Select
                            opciones={HORAS}
                            value={horario.desde}
                            onChange={(e) => handleHorario(dia, "desde", e.target.value)}
                          />
                        </div>
                      </div>
                      <div className={styles.horarioGroup}>
                        <span className={styles.horarioGroupLabel}>Hasta:</span>
                        <div className={styles.horarioSelectWrap}>
                          <Select
                            opciones={HORAS}
                            value={horario.hasta}
                            onChange={(e) => handleHorario(dia, "hasta", e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className={styles.toggleWrap}>
                <span className={styles.toggleLabel}>
                  ¿Atiende Urgencias 24 hs?
                </span>
                <button
                  onClick={() => setUrgencias((v) => !v)}
                  className={`${styles.toggleBtn} ${urgencias ? styles.toggleBtnActivo : styles.toggleBtnInactivo}`}
                >
                  <span
                    className={`${styles.toggleThumb} ${urgencias ? styles.toggleThumbActivo : styles.toggleThumbInactivo}`}
                  />
                </button>
              </div>

              {errorStep4 && <p className={styles.errorMsg}>{errorStep4}</p>}
              <div className={styles.botonesRow}>
                <Button
                  texto="← Atrás"
                  variante="secundario"
                  tamaño="mediano"
                  onClick={() => setStep(3)}
                />
                <Button
                  texto={guardando ? "Guardando..." : "Guardar Cambios"}
                  variante="primario"
                  tamaño="mediano"
                  onClick={handleGuardar}
                  disabled={guardando}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}