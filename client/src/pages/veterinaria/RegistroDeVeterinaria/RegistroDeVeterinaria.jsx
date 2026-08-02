import { useState, useRef, useEffect } from "react";
import Sidebar from "../../../components/layout/Sidebar";
import TopBar from "../../../components/layout/TopBar";
import Button from "../../../components/ui/button/Button";
import Input from "../../../components/ui/input/Input";
import PanelDestacado from "../../../components/ui/panel-destacado/PanelDestacado";
import SuccessModal from "../../../components/ui/success-modal/SuccessModal";
import ErrorModal from "../../../components/ui/error-modal/ErrorModal";
import styles from "./RegistroDeVeterinaria.module.css";

import {
  servicioVacio,
  profesionalVacio,
  DIAS,
  HORAS,
  validarCamposRequeridos,
  construirHorarios,
  validarEmail,
  validarCUIT,
  validarTelefono,
  validarPrecio,
  validarCoordenadas,
  validarHorarios,
} from "../../../utils/RegistroVeterinarias";

const IconSearch = () => (
  <svg
    width="17"
    height="17"
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
  >
    <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
    <path
      d="m16.5 16.5 4 4"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);
const IconPin = () => (
  <svg
    width="17"
    height="17"
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
  >
    <path
      d="M12 2a7 7 0 0 1 7 7c0 5.25-7 13-7 13S5 14.25 5 9a7 7 0 0 1 7-7Z"
      stroke="currentColor"
      strokeWidth="2"
    />
    <circle cx="12" cy="9" r="2.5" stroke="currentColor" strokeWidth="2" />
  </svg>
);
const IconPlus = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
  >
    <line
      x1="12"
      y1="5"
      x2="12"
      y2="19"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <line
      x1="5"
      y1="12"
      x2="19"
      y2="12"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);
const IconTrash = () => (
  <svg
    width="15"
    height="15"
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
  >
    <polyline
      points="3 6 5 6 21 6"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <path
      d="M19 6l-1 14H6L5 6"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <path
      d="M10 11v6M14 11v6"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <path
      d="M9 6V4h6v2"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

const crearHandleContinuar = (validar, setError, avanzar) => () => {
  const err = validar();
  if (err) {
    setError(err);
    return;
  }
  setError("");
  avanzar();
};

export default function RegistroDeVeterinaria() {
  const [step, setStep] = useState(1);

  // Paso 1
  const [form, setForm] = useState({
    nombreClinica: "",
    razonSocial: "",
    cuit: "",
    telefono: "",
    direccion: "",
    lat: null,
    lng: null,
    email: "",
    sitioWeb: "",
  });
  const [suggestions, setSuggestions] = useState([]);
  const [loadingAddress, setLoadingAddress] = useState(false);
  const [errorStep1, setErrorStep1] = useState("");
  const debounceRef = useRef(null);

  // Paso 2
  const [servicios, setServicios] = useState([servicioVacio()]);
  const [errorStep2, setErrorStep2] = useState("");

  // Paso 3
  const [profesionales, setProfesionales] = useState([profesionalVacio()]);
  const [errorStep3, setErrorStep3] = useState("");

  // Paso 4
  const [diasSeleccionados, setDiasSeleccionados] = useState({});
  const [urgencias, setUrgencias] = useState(false);
  const [errorStep4, setErrorStep4] = useState("");
  const [guardando, setGuardando] = useState(false);

  // Modales
  const [successModal, setSuccessModal] = useState(false);
  const [errorModal, setErrorModal] = useState({ abierto: false, mensaje: "" });

  // Google Places
  useEffect(() => {
    if (!form.direccion || form.lat) {
      setSuggestions([]);
      return;
    }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      if (form.direccion.length < 4) return;
      setLoadingAddress(true);
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/places/autocomplete?input=${encodeURIComponent(form.direccion)}`,
        );
        const data = await res.json();
        setSuggestions(data.predictions || []);
      } catch {
        setSuggestions([]);
      } finally {
        setLoadingAddress(false);
      }
    }, 350);
    return () => clearTimeout(debounceRef.current);
  }, [form.direccion]);

  const handleSelectPlace = async (place) => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/places/details?place_id=${place.place_id}`,
      );
      const data = await res.json();
      const location = data.result?.geometry?.location;
      setForm((f) => ({
        ...f,
        direccion: place.description,
        lat: typeof location?.lat === "number" ? location.lat : null,
        lng: typeof location?.lng === "number" ? location.lng : null,
      }));
    } catch {
      setForm((f) => ({ ...f, direccion: place.description }));
    } finally {
      setSuggestions([]);
    }
  };

  const handleChangeStep1 = (e) => {
    const { name, value } = e.target;
    if (name === "direccion")
      setForm((f) => ({ ...f, direccion: value, lat: null, lng: null }));
    else setForm((f) => ({ ...f, [name]: value }));
  };

  const validateStep1 = () => {
    if (!form.nombreClinica.trim())
      return "El nombre de la clínica es requerido.";
    if (!form.cuit.trim()) return "El CUIT/CUIL es requerido.";
    if (!validarCUIT(form.cuit))
      return "El CUIT/CUIL no tiene un formato válido.";
    if (!form.telefono.trim()) return "El teléfono es requerido.";
    if (!validarTelefono(form.telefono))
      return "El teléfono solo puede contener números.";
    if (!form.direccion.trim()) return "La dirección es requerida.";
    if (!validarCoordenadas(form.lat, form.lng))
      return "Seleccioná una dirección de la lista para obtener las coordenadas.";
    if (!form.email.trim()) return "El email institucional es requerido.";
    if (!validarEmail(form.email))
      return "El email no tiene un formato válido.";
    return "";
  };

  const handleContinuarStep1 = crearHandleContinuar(
    validateStep1,
    setErrorStep1,
    () => setStep(2),
  );

  // Servicios
  const handleChangeServicio = (i, field, value) =>
    setServicios((prev) =>
      prev.map((s, idx) => (idx === i ? { ...s, [field]: value } : s)),
    );
  const agregarServicio = () =>
    setServicios((prev) => [...prev, servicioVacio()]);
  const eliminarServicio = (i) => {
    if (servicios.length > 1)
      setServicios((prev) => prev.filter((_, idx) => idx !== i));
  };
  const validateStep2 = () => {
    const base = validarCamposRequeridos(
      servicios,
      ["categoria", "nombre", "precio"],
      "Completá todos los campos de cada servicio.",
    );
    if (base) return base;
    if (servicios.some((s) => !validarPrecio(s.precio)))
      return "El precio debe ser numérico y mayor a 0.";
    return "";
  };
  const handleContinuarStep2 = crearHandleContinuar(
    validateStep2,
    setErrorStep2,
    () => setStep(3),
  );

  // Profesionales
  const handleChangeProfesional = (i, field, value) =>
    setProfesionales((prev) =>
      prev.map((p, idx) => (idx === i ? { ...p, [field]: value } : p)),
    );
  const agregarProfesional = () =>
    setProfesionales((prev) => [...prev, profesionalVacio()]);
  const eliminarProfesional = (i) => {
    if (profesionales.length > 1)
      setProfesionales((prev) => prev.filter((_, idx) => idx !== i));
  };

  const validateStep3 = () => {
    const base = validarCamposRequeridos(
      profesionales,
      ["nombre", "email", "especialidad"],
      "Completá todos los campos de cada profesional.",
    );
    if (base) return base;
    if (profesionales.some((p) => !validarEmail(p.email)))
      return "El email de algún profesional no tiene un formato válido.";
    return "";
  };
  const handleContinuarStep3 = crearHandleContinuar(
    validateStep3,
    setErrorStep3,
    () => setStep(4),
  );

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
    const errorHorario = validarHorarios(diasSeleccionados);
    if (errorHorario) return errorHorario;
    return "";
  };

  const handleGuardarReal = async () => {
    if (guardando) return;

    const token = localStorage.getItem("token");
    if (!token) {
      setErrorStep4("Tu sesión expiró. Iniciá sesión nuevamente.");
      return;
    }
    if (
      typeof form.lat !== "number" ||
      isNaN(form.lat) ||
      typeof form.lng !== "number" ||
      isNaN(form.lng)
    ) {
      setErrorStep4(
        "La dirección seleccionada no es válida. Volvé al paso 1 y seleccioná una dirección de la lista.",
      );
      return;
    }

    setGuardando(true);
    setErrorStep4("");
    try {
      const body = {
        nombre: form.nombreClinica,
        direccion: form.direccion,
        razonSocial: form.razonSocial,
        cuit: form.cuit,
        telefono: form.telefono,
        email: form.email,
        sitioWeb: form.sitioWeb,
        coordenadas: { type: "Point", coordinates: [form.lng, form.lat] },
        especialidades: [],
        servicios: servicios.map((s) => ({
          categoria: s.categoria,
          nombre: s.nombre,
          precio: Number(s.precio),
        })),
        profesionales: profesionales.map((p) => ({
          nombre: p.nombre,
          especialidad: p.especialidad,
          email: p.email,
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

  const handleGuardar = crearHandleContinuar(
    validateStep4,
    setErrorStep4,
    handleGuardarReal,
  );

  return (
    <div className={styles.shell}>
      <Sidebar role="veterinaria" />
      <div className={styles.main}>
        <TopBar title="Registro de clínica" notifications={2} userInitial="J" />

        {/* ── Modales ── */}
        <SuccessModal
          abierto={successModal}
          titulo="¡Registro completo!"
          mensaje="Tu clínica fue registrada correctamente y ya está visible para los usuarios."
          textoBoton="Aceptar"
          onClose={() => setSuccessModal(false)}
        />
        <ErrorModal
          abierto={errorModal.abierto}
          titulo="Error al guardar"
          mensaje={errorModal.mensaje}
          textoBoton="Cerrar"
          onClose={() => setErrorModal({ abierto: false, mensaje: "" })}
        />

        {/* ══ PASO 1 ══ */}
        {step === 1 && (
          <>
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
                  placeholder="20-12345678-9"
                  maxLength={13}
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
                  onChange={(e) => {
                    // Restricción en tiempo real: Solo números mientras escribe
                    const soloNumeros = e.target.value.replace(/\D/g, "");
                    setForm((f) => ({ ...f, telefono: soloNumeros }));
                  }}
                />
              </div>

              {/* Dirección con autocomplete — particular de esta pantalla */}
              <div className={`${styles.field} ${styles.direccionWrap}`}>
                <label className={styles.label}>
                  Dirección<span className={styles.req}>*</span>
                </label>
                <div className={styles.inputWrap}>
                  <span className={styles.inputIcon}>
                    <IconSearch />
                  </span>
                  <input
                    name="direccion"
                    value={form.direccion}
                    onChange={handleChangeStep1}
                    placeholder="Av. Rivadavia 1234, Piso 3 Dpto. B"
                    autoComplete="off"
                    className={styles.inputInner}
                  />
                  {form.lat && (
                    <span
                      className={styles.inputIcon}
                      style={{ color: "#25a36f" }}
                    >
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
              </div>

              <div className={`${styles.grid2} ${styles.grid2MarginTop}`}>
                <Input
                  label="Email institucional *"
                  type="email"
                  name="email"
                  value={form.email}
                  placeholder="info@vetcenterpalermo.com"
                  maxLength={60}
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
                  onChange={(e) =>
                    setForm((f) => ({ ...f, sitioWeb: e.target.value }))
                  }
                />
              </div>

              {errorStep1 && <p className={styles.errorMsg}>{errorStep1}</p>}
              <div className={styles.continuarWrap}>
                <Button
                  texto="Continuar →"
                  variante="primario"
                  tamaño="mediano"
                  onClick={handleContinuarStep1}
                />
              </div>
            </div>
          </>
        )}

        {/* ══ PASO 2 ══ */}
        {step === 2 && (
          <>
            <div className={styles.panelWrap}>
              <PanelDestacado
                titulo="Configurá tus servicios y precios"
                subtitulo="Detallá las prestaciones y aranceles de tu clínica para tus clientes."
              />
            </div>
            <div className={styles.formCard}>
              <h3 className={styles.cardTitle}>Servicios y precios</h3>
              <p className={styles.cardSub}>
                Ingresá la información para crear el perfil de tu centro
                veterinario.
              </p>
              <div className={styles.listaItems}>
                {servicios.map((servicio, index) => (
                  <div key={servicio.id} className={styles.subCard}>
                    {servicios.length > 1 && (
                      <button
                        onClick={() => eliminarServicio(index)}
                        className={styles.btnEliminar}
                        title="Eliminar"
                      ></button>
                    )}
                    <Input
                      label="Categoría del Servicio *"
                      value={servicio.categoria}
                      onChange={(e) =>
                        handleChangeServicio(index, "categoria", e.target.value)
                      }
                      placeholder="Ej: Vacunación, Cirugía..."
                    />
                    <Input
                      label="Nombre del Servicio o Prestación *"
                      value={servicio.nombre}
                      onChange={(e) =>
                        handleChangeServicio(index, "nombre", e.target.value)
                      }
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
                    </div>
                  </div>
                ))}
              </div>
              <button onClick={agregarServicio} className={styles.btnAgregar}>
                <IconPlus /> Agregar servicio
              </button>
              {errorStep2 && <p className={styles.errorMsg}>{errorStep2}</p>}
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
          </>
        )}

        {/* ══ PASO 3 ══ */}
        {step === 3 && (
          <>
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
                      ></button>
                    )}
                    <Input
                      label="Nombre y Apellido *"
                      value={prof.nombre}
                      onChange={(e) =>
                        handleChangeProfesional(index, "nombre", e.target.value)
                      }
                      placeholder="Dr. Juan Pérez"
                    />
                    <Input
                      label="Email del profesional *"
                      type="email"
                      value={prof.email}
                      onChange={(e) =>
                        handleChangeProfesional(index, "email", e.target.value)
                      }
                      placeholder="juanperez@email.com"
                    />
                    <Input
                      label="Especialidad *"
                      value={prof.especialidad}
                      onChange={(e) =>
                        handleChangeProfesional(
                          index,
                          "especialidad",
                          e.target.value,
                        )
                      }
                      placeholder="Ej: Veterinaria general, Cirugía..."
                    />
                  </div>
                ))}
              </div>
              <button
                onClick={agregarProfesional}
                className={styles.btnAgregar}
              >
                <IconPlus /> Agregar profesional
              </button>
              {errorStep3 && <p className={styles.errorMsg}>{errorStep3}</p>}
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
          </>
        )}

        {/* ══ PASO 4 ══ */}
        {step === 4 && (
          <>
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

              {/* Días */}
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

              {/* Horarios por día */}
              {Object.keys(diasSeleccionados).length > 0 && (
                <div className={styles.horariosWrap}>
                  <label className={styles.label}>Horarios por día</label>
                  {Object.entries(diasSeleccionados).map(([dia, horario]) => (
                    <div key={dia} className={styles.horarioDiaRow}>
                      <span className={styles.horarioDiaNombre}>{dia}</span>
                      <div className={styles.horarioGroup}>
                        <span className={styles.horarioGroupLabel}>Desde:</span>
                        <select
                          value={horario.desde}
                          onChange={(e) =>
                            handleHorario(dia, "desde", e.target.value)
                          }
                          className={styles.selectHorario}
                        >
                          {HORAS.map((h) => (
                            <option key={h} value={h}>
                              {h}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className={styles.horarioGroup}>
                        <span className={styles.horarioGroupLabel}>Hasta:</span>
                        <select
                          value={horario.hasta}
                          onChange={(e) =>
                            handleHorario(dia, "hasta", e.target.value)
                          }
                          className={styles.selectHorario}
                        >
                          {HORAS.map((h) => (
                            <option key={h} value={h}>
                              {h}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Toggle urgencias */}
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
          </>
        )}
      </div>
    </div>
  );
}
