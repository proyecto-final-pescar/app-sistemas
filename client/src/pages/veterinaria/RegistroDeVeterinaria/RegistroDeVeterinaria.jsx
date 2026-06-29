import { useState, useRef, useEffect } from "react";
import Sidebar from "../../../components/layout/Sidebar";
import TopBar from "../../../components/layout/TopBar";

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
const IconSave = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <polyline points="17 21 17 13 7 13 7 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <polyline points="7 3 7 8 15 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const servicioVacio = () => ({ categoria: "", nombre: "", precio: "" });
const profesionalVacio = () => ({ nombre: "", email: "", especialidad: "" });
const DIAS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
const horasDisponibles = () => {
  const horas = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 30) {
      horas.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    }
  }
  return horas;
};
const HORAS = horasDisponibles();

const crearHandleContinuar = (validar, setError, avanzar) => () => {
  const err = validar();
  if (err) { setError(err); return; }
  setError("");
  avanzar();
};

const validarCamposRequeridos = (items, campos, mensajeError) => {
  for (const item of items) {
    for (const campo of campos) {
      if (!item[campo]?.toString().trim()) return mensajeError;
    }
  }
  return "";
};

export default function RegistroDeVeterinaria() {
  const [step, setStep] = useState(1);

  // Pag 1
  const [form, setForm] = useState({
    nombreClinica: "", razonSocial: "", cuit: "",
    telefono: "", direccion: "", lat: null, lng: null,
    email: "", sitioWeb: "",
  });
  const [suggestions, setSuggestions] = useState([]);
  const [loadingAddress, setLoadingAddress] = useState(false);
  const [errorStep1, setErrorStep1] = useState("");
  const debounceRef = useRef(null);

  // Pag 2
  const [servicios, setServicios] = useState([servicioVacio()]);
  const [errorStep2, setErrorStep2] = useState("");

  // Pag 3
  const [profesionales, setProfesionales] = useState([profesionalVacio()]);
  const [errorStep3, setErrorStep3] = useState("");

  // Pag 4
  const [diasSeleccionados, setDiasSeleccionados] = useState({});
  const [urgencias, setUrgencias] = useState(false);
  const [errorStep4, setErrorStep4] = useState("");

  // Google Places
  useEffect(() => {
    if (!form.direccion || form.lat) { setSuggestions([]); return; }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      if (form.direccion.length < 4) return;
      setLoadingAddress(true);
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/places/autocomplete?input=${encodeURIComponent(form.direccion)}`);
        const data = await res.json();
        setSuggestions(data.predictions || []);
      } catch { setSuggestions([]); }
      finally { setLoadingAddress(false); }
    }, 350);
    return () => clearTimeout(debounceRef.current);
  }, [form.direccion]);

  const handleSelectPlace = async (place) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/places/details?place_id=${place.place_id}`);
      const data = await res.json();
      const location = data.result?.geometry?.location;
      setForm((f) => ({ ...f, direccion: place.description, lat: location?.lat || null, lng: location?.lng || null }));
    } catch { setForm((f) => ({ ...f, direccion: place.description })); }
    finally { setSuggestions([]); }
  };

  const handleChangeStep1 = (e) => {
    const { name, value } = e.target;
    if (name === "direccion") setForm((f) => ({ ...f, direccion: value, lat: null, lng: null }));
    else setForm((f) => ({ ...f, [name]: value }));
  };

  const validateStep1 = () => {
    if (!form.nombreClinica.trim()) return "El nombre de la clínica es requerido.";
    if (!form.cuit.trim()) return "El CUIT/CUIL es requerido.";
    if (!form.telefono.trim()) return "El teléfono es requerido.";
    if (!form.direccion.trim()) return "La dirección es requerida.";
    if (!form.lat) return "Seleccioná una dirección de la lista para obtener las coordenadas.";
    if (!form.email.trim()) return "El email institucional es requerido.";
    return "";
  };

  //---------------------------------------------------------------------------------------------------------------------------------
  //!CUANDO FUNCIONE LA API HAY QUE DESCOMENTAR ESTA LINEA
  //const handleContinuarStep1 = crearHandleContinuar(validateStep1, setErrorStep1, () => setStep(2));

  //!CUANDO FUNCIONA LA API HAY QUE SACAR ESTE BLOQUE DE CODIGO O COMENTARLO
  const handleContinuarStep1 = () => {
    setErrorStep1("");
    setStep(2);
  };

  //----------------------------------------------------------------------------------------------------------------------------------
  // Servicios
  const handleChangeServicio = (i, field, value) =>
    setServicios((prev) => prev.map((s, idx) => idx === i ? { ...s, [field]: value } : s));
  const agregarServicio = () => setServicios((prev) => [...prev, servicioVacio()]);
  const eliminarServicio = (i) => { if (servicios.length > 1) setServicios((prev) => prev.filter((_, idx) => idx !== i)); };
  const validateStep2 = () =>
    validarCamposRequeridos(servicios, ["categoria", "nombre", "precio"], "Completá todos los campos de cada servicio.");
  const handleContinuarStep2 = crearHandleContinuar(validateStep2, setErrorStep2, () => setStep(3));

  // Profesionales
  const handleChangeProfesional = (i, field, value) =>
    setProfesionales((prev) => prev.map((p, idx) => idx === i ? { ...p, [field]: value } : p));
  const agregarProfesional = () => setProfesionales((prev) => [...prev, profesionalVacio()]);
  const eliminarProfesional = (i) => { if (profesionales.length > 1) setProfesionales((prev) => prev.filter((_, idx) => idx !== i)); };
  const validateStep3 = () =>
    validarCamposRequeridos(profesionales, ["nombre", "email", "especialidad"], "Completá todos los campos de cada profesional.");
  const handleContinuarStep3 = crearHandleContinuar(validateStep3, setErrorStep3, () => setStep(4));

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
    setDiasSeleccionados((prev) => ({ ...prev, [dia]: { ...prev[dia], [campo]: valor } }));

  const validateStep4 = () => {
    if (Object.keys(diasSeleccionados).length === 0) return "Seleccioná al menos un día de atención.";
    return "";
  };
  // El botón final dice "Guardar Cambios" en vez de "Continuar", pero el patrón
  // (validar -> mostrar error o ejecutar acción) es el mismo, así que reutiliza el helper.
  const handleGuardar = crearHandleContinuar(validateStep4, setErrorStep4, () => alert("¡Registro completo! ✅"));

  return (
    <div style={styles.shell}>
      <Sidebar role="veterinaria" activeItem="Registro" />
      <div style={styles.main}>
        <TopBar title="Registro de clínica" notifications={2} userInitial="J" />

        {/* ══ PAGINA 1 ══ */}
        {step === 1 && (
          <>
            <div style={styles.heroBanner}>
              <div style={styles.heroBubble1} /><div style={styles.heroBubble2} />
              <div style={{ position: "relative", zIndex: 1 }}>
                <h2 style={styles.heroTitle}>¡Registrá tu clínica veterinaria!</h2>
                <p style={styles.heroSub}>Completá el perfil de tu clínica para que los dueños de mascotas te encuentren.</p>
              </div>
            </div>
            <div style={styles.card}>
              <h3 style={styles.cardTitle}>Datos de la clínica</h3>
              <p style={styles.cardSub}>Ingresá la información principal para crear el perfil de tu centro veterinario.</p>
              <div style={styles.grid2}>
                <div style={styles.field}>
                  <label style={styles.label}>Nombre de la clínica<span style={styles.req}>*</span></label>
                  <input name="nombreClinica" value={form.nombreClinica} onChange={handleChangeStep1} placeholder="VetCenter Palermo" style={styles.input} />
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>Razón social</label>
                  <input name="razonSocial" value={form.razonSocial} onChange={handleChangeStep1} placeholder="VetCenter Palermo S.R.L." style={styles.input} />
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>CUIT/CUIL<span style={styles.req}>*</span></label>
                  <input name="cuit" value={form.cuit} onChange={handleChangeStep1} placeholder="20-12345678-9" style={styles.input} />
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>Teléfono<span style={styles.req}>*</span></label>
                  <input name="telefono" value={form.telefono} onChange={handleChangeStep1} placeholder="1123456789" style={styles.input} />
                </div>
              </div>
              <div style={{ ...styles.field, marginTop: "16px", position: "relative" }}>
                <label style={styles.label}>Dirección<span style={styles.req}>*</span></label>
                <div style={styles.inputWrap}>
                  <span style={styles.inputIcon}><IconSearch /></span>
                  <input name="direccion" value={form.direccion} onChange={handleChangeStep1} placeholder="Av. Rivadavia 1234, Piso 3 Dpto. B" autoComplete="off" style={styles.inputInner} />
                  {form.lat && <span style={{ ...styles.inputIcon, color: "#25a36f" }}><IconPin /></span>}
                </div>
                {suggestions.length > 0 && (
                  <ul style={styles.suggestions}>
                    {suggestions.map((s) => (
                      <li key={s.place_id} style={styles.suggestionItem}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f5f3ff"}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#ffffff"}
                        onClick={() => handleSelectPlace(s)}>
                        <span style={{ color: "#7c3aed", marginRight: "8px" }}>📍</span>{s.description}
                      </li>
                    ))}
                  </ul>
                )}
                {loadingAddress && <p style={styles.helperText}>Buscando dirección...</p>}
                {form.lat && <p style={{ ...styles.helperText, color: "#25a36f" }}>✅ Coordenadas: {form.lat.toFixed(5)}, {form.lng.toFixed(5)}</p>}
              </div>
              <div style={{ ...styles.grid2, marginTop: "16px" }}>
                <div style={styles.field}>
                  <label style={styles.label}>Email institucional<span style={styles.req}>*</span></label>
                  <input name="email" type="email" value={form.email} onChange={handleChangeStep1} placeholder="info@vetcenterpalermo.com" style={styles.input} />
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>Sitio web</label>
                  <input name="sitioWeb" value={form.sitioWeb} onChange={handleChangeStep1} placeholder="vetcenterpalermo.com.ar" style={styles.input} />
                </div>
              </div>
              {errorStep1 && <p style={styles.error}>{errorStep1}</p>}
              <button onClick={handleContinuarStep1} style={{ ...styles.btnGreenFull, marginTop: "20px" }}>Continuar →</button>
            </div>
          </>
        )}

        {/* ══ PASO 2 ══ */}
        {step === 2 && (
          <>
            <div style={{ ...styles.heroBanner, background: "linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)" }}>
              <div style={styles.heroBubble1} /><div style={styles.heroBubble2} />
              <div style={{ position: "relative", zIndex: 1 }}>
                <h2 style={styles.heroTitle}>Configurá tus servicios y precios</h2>
                <p style={styles.heroSub}>Detallá las prestaciones y aranceles de tu clínica para tus clientes.</p>
              </div>
            </div>
            <div style={styles.card}>
              <h3 style={styles.cardTitle}>Servicios y precios</h3>
              <p style={styles.cardSub}>Ingresá la información para crear el perfil de tu centro veterinario.</p>
              <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                {servicios.map((servicio, index) => (
                  <div key={index} style={styles.subCard}>
                    {servicios.length > 1 && (
                      <button onClick={() => eliminarServicio(index)} style={styles.btnEliminar} title="Eliminar">
                        <IconTrash />
                      </button>
                    )}
                    <div style={styles.field}>
                      <label style={styles.label}>Categoría del Servicio<span style={styles.req}>*</span></label>
                      <input value={servicio.categoria} onChange={(e) => handleChangeServicio(index, "categoria", e.target.value)} placeholder="Ej: Vacunación, Cirugía..." style={styles.input} />
                    </div>
                    <div style={styles.field}>
                      <label style={styles.label}>Nombre del Servicio o Prestación<span style={styles.req}>*</span></label>
                      <input value={servicio.nombre} onChange={(e) => handleChangeServicio(index, "nombre", e.target.value)} placeholder="Ej: Vacuna Antirrábica Anual" style={styles.input} />
                    </div>
                    <div style={{ ...styles.field, maxWidth: "200px" }}>
                      <label style={styles.label}>Precio<span style={styles.req}>*</span></label>
                      <div style={styles.inputWrap}>
                        <span style={{ ...styles.inputIcon, fontSize: "14px", color: "#8276ab" }}>$</span>
                        <input type="number" min="0" value={servicio.precio} onChange={(e) => handleChangeServicio(index, "precio", e.target.value)} placeholder="0.00" style={styles.inputInner} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <button onClick={agregarServicio} style={styles.btnAgregar}><IconPlus /> Agregar servicio</button>
              {errorStep2 && <p style={styles.error}>{errorStep2}</p>}
              <div style={styles.botonesRow}>
                <button onClick={() => setStep(1)} style={styles.btnBack}>← Atrás</button>
                <button onClick={handleContinuarStep2} style={styles.btnGreen}>Continuar →</button>
              </div>
            </div>
          </>
        )}

        {/* ══ PASO 3 ══ */}
        {step === 3 && (
          <>
            <div style={{ ...styles.heroBanner, background: "linear-gradient(135deg, #6d28d9 0%, #4c1d95 100%)" }}>
              <div style={styles.heroBubble1} /><div style={styles.heroBubble2} />
              <div style={{ position: "relative", zIndex: 1 }}>
                <h2 style={styles.heroTitle}>Sumá a tu equipo médico</h2>
                <p style={styles.heroSub}>Registrá a los profesionales de tu veterinaria.</p>
              </div>
            </div>
            <div style={styles.card}>
              <h3 style={styles.cardTitle}>Profesionales</h3>
              <p style={styles.cardSub}>Ingresá la información para crear el perfil de tu centro veterinario.</p>
              <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                {profesionales.map((prof, index) => (
                  <div key={index} style={styles.subCard}>
                    {profesionales.length > 1 && (
                      <button onClick={() => eliminarProfesional(index)} style={styles.btnEliminar} title="Eliminar">
                        <IconTrash />
                      </button>
                    )}
                    <div style={styles.field}>
                      <label style={styles.label}>Nombre y Apellido<span style={styles.req}>*</span></label>
                      <input value={prof.nombre} onChange={(e) => handleChangeProfesional(index, "nombre", e.target.value)} placeholder="Dr. Juan Pérez" style={styles.input} />
                    </div>
                    <div style={styles.field}>
                      <label style={styles.label}>Email del profesional<span style={styles.req}>*</span></label>
                      <input type="email" value={prof.email} onChange={(e) => handleChangeProfesional(index, "email", e.target.value)} placeholder="juanperez@email.com" style={styles.input} />
                    </div>
                    <div style={styles.field}>
                      <label style={styles.label}>Especialidad<span style={styles.req}>*</span></label>
                      <input value={prof.especialidad} onChange={(e) => handleChangeProfesional(index, "especialidad", e.target.value)} placeholder="Ej: Veterinaria general, Cirugía..." style={styles.input} />
                    </div>
                  </div>
                ))}
              </div>
              <button onClick={agregarProfesional} style={styles.btnAgregar}><IconPlus /> Agregar profesional</button>
              {errorStep3 && <p style={styles.error}>{errorStep3}</p>}
              <div style={styles.botonesRow}>
                <button onClick={() => setStep(2)} style={styles.btnBack}>← Atrás</button>
                <button onClick={handleContinuarStep3} style={styles.btnGreen}>Continuar →</button>
              </div>
            </div>
          </>
        )}

        {/* ══ PASO 4 ══ */}
        {step === 4 && (
          <>
            <div style={{ ...styles.heroBanner, background: "linear-gradient(135deg, #5b21b6 0%, #3b0764 100%)" }}>
              <div style={styles.heroBubble1} /><div style={styles.heroBubble2} />
              <div style={{ position: "relative", zIndex: 1 }}>
                <h2 style={styles.heroTitle}>Definí tus horarios de atención</h2>
                <p style={styles.heroSub}>Establecé los días y franjas horarias disponibles para que los usuarios puedan programar sus turnos.</p>
              </div>
            </div>
            <div style={styles.card}>
              <h3 style={styles.cardTitle}>Disponibilidad</h3>
              <p style={styles.cardSub}>Ingresá la información para crear el perfil de tu centro veterinario.</p>

              {/* Días */}
              <div style={styles.field}>
                <label style={styles.label}>Días de atención<span style={styles.req}>*</span></label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginTop: "4px" }}>
                  {DIAS.map((dia) => {
                    const activo = !!diasSeleccionados[dia];
                    return (
                      <button
                        key={dia}
                        onClick={() => toggleDia(dia)}
                        style={{
                          padding: "8px 14px", borderRadius: "10px", border: "none", cursor: "pointer",
                          fontSize: "13px", fontWeight: 500,
                          backgroundColor: activo ? "#7c3aed" : "#f0ecfb",
                          color: activo ? "#ffffff" : "#6b7280",
                          fontFamily: "'Inter', Arial, Helvetica, sans-serif",
                          transition: "all 0.15s",
                        }}
                      >
                        {dia}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Horario por día */}
              {Object.keys(diasSeleccionados).length > 0 && (
                <div style={{ marginTop: "20px", display: "flex", flexDirection: "column", gap: "12px" }}>
                  <label style={styles.label}>Horarios por día</label>
                  {Object.entries(diasSeleccionados).map(([dia, horario]) => (
                    <div key={dia} style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                      <span style={{ fontSize: "13px", fontWeight: 600, color: "#1f1739", minWidth: "90px" }}>{dia}</span>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ fontSize: "13px", color: "#8276ab" }}>Desde:</span>
                        <select
                          value={horario.desde}
                          onChange={(e) => handleHorario(dia, "desde", e.target.value)}
                          style={styles.select}
                        >
                          {HORAS.map((h) => <option key={h} value={h}>{h}</option>)}
                        </select>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ fontSize: "13px", color: "#8276ab" }}>Hasta:</span>
                        <select
                          value={horario.hasta}
                          onChange={(e) => handleHorario(dia, "hasta", e.target.value)}
                          style={styles.select}
                        >
                          {HORAS.map((h) => <option key={h} value={h}>{h}</option>)}
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Urgencias toggle */}
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "24px" }}>
                <span style={{ fontSize: "14px", fontWeight: 500, color: "#1f1739" }}>¿Atiende Urgencias 24 hs?</span>
                <button
                  onClick={() => setUrgencias((v) => !v)}
                  style={{
                    width: "44px", height: "24px", borderRadius: "12px", border: "none",
                    backgroundColor: urgencias ? "#25a36f" : "#d1d5db",
                    cursor: "pointer", position: "relative", transition: "background-color 0.2s",
                  }}
                >
                  <span style={{
                    position: "absolute", top: "3px",
                    left: urgencias ? "22px" : "3px",
                    width: "18px", height: "18px", borderRadius: "50%",
                    backgroundColor: "#ffffff", transition: "left 0.2s",
                    boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
                  }} />
                </button>
              </div>

              {errorStep4 && <p style={styles.error}>{errorStep4}</p>}

              <div style={styles.botonesRow}>
                <button onClick={() => setStep(3)} style={styles.btnBack}>← Atrás</button>
                <button onClick={handleGuardar} style={{ ...styles.btnGreen, display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                  Guardar Cambios <IconSave />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const styles = {
  shell: { display: "flex", minHeight: "100vh", backgroundColor: "#f9f8ff", fontFamily: "'Inter', Arial, Helvetica, sans-serif" },
  main: { flex: 1, display: "flex", flexDirection: "column", overflowY: "auto" },
  heroBanner: { position: "relative", margin: "24px 32px 0", borderRadius: "16px", padding: "28px 32px", background: "linear-gradient(135deg, #7c3aed 0%, #5b21b6 60%, #25a36f 100%)", overflow: "hidden" },
  heroBubble1: { position: "absolute", top: "-30px", right: "-30px", width: "140px", height: "140px", borderRadius: "50%", backgroundColor: "rgba(255,255,255,0.08)" },
  heroBubble2: { position: "absolute", bottom: "-20px", right: "80px", width: "80px", height: "80px", borderRadius: "50%", backgroundColor: "rgba(255,255,255,0.06)" },
  heroTitle: { margin: 0, fontSize: "22px", fontWeight: 800, color: "#ffffff", letterSpacing: "-0.3px" },
  heroSub: { margin: "8px 0 0", fontSize: "14px", color: "rgba(255,255,255,0.85)", lineHeight: "20px", maxWidth: "480px" },
  card: { margin: "20px 32px 40px", backgroundColor: "#ffffff", borderRadius: "16px", border: "1px solid #ede9fe", padding: "28px 28px 32px", boxShadow: "0 4px 20px rgba(124,58,237,0.06)" },
  cardTitle: { margin: 0, fontSize: "16px", fontWeight: 700, color: "#1f1739", letterSpacing: "-0.2px" },
  cardSub: { margin: "4px 0 20px", fontSize: "13px", color: "#8276ab", lineHeight: "18px" },
  grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px 20px" },
  field: { display: "flex", flexDirection: "column", gap: "7px" },
  label: { fontSize: "13px", fontWeight: 500, color: "#1f1739", letterSpacing: "-0.1px" },
  req: { color: "#7c3aed", marginLeft: "2px" },
  input: { minHeight: "42px", border: "none", borderRadius: "12px", backgroundColor: "#f0ecfb", padding: "0 14px", fontSize: "14px", color: "#1f1739", outline: "none", fontFamily: "'Inter', Arial, Helvetica, sans-serif", boxSizing: "border-box", width: "100%" },
  inputWrap: { display: "flex", alignItems: "center", minHeight: "42px", borderRadius: "12px", backgroundColor: "#f0ecfb", color: "#8276ab" },
  inputIcon: { display: "grid", placeItems: "center", width: "40px", flex: "0 0 40px", color: "#8779b0" },
  inputInner: { flex: 1, border: "none", backgroundColor: "transparent", padding: "0 14px 0 0", fontSize: "14px", color: "#1f1739", outline: "none", fontFamily: "'Inter', Arial, Helvetica, sans-serif" },
  suggestions: { position: "absolute", top: "100%", left: 0, right: 0, zIndex: 10, margin: "4px 0 0", padding: 0, listStyle: "none", backgroundColor: "#ffffff", border: "1px solid #ede9fe", borderRadius: "12px", boxShadow: "0 8px 24px rgba(124,58,237,0.12)", overflow: "hidden" },
  suggestionItem: { padding: "11px 16px", fontSize: "13px", color: "#1f1739", cursor: "pointer", backgroundColor: "#ffffff", display: "flex", alignItems: "center" },
  helperText: { margin: "6px 0 0", fontSize: "12px", color: "#8276ab" },
  error: { margin: "16px 0 0", border: "1px solid #fac7ce", borderRadius: "12px", padding: "11px 14px", color: "#a31d34", backgroundColor: "#fff1f4", fontSize: "13px", lineHeight: "18px" },
  subCard: { position: "relative", padding: "20px", borderRadius: "12px", border: "1px solid #ede9fe", backgroundColor: "#faf9ff", display: "flex", flexDirection: "column", gap: "14px" },
  btnEliminar: { position: "absolute", top: "12px", right: "12px", display: "flex", alignItems: "center", justifyContent: "center", width: "28px", height: "28px", border: "none", borderRadius: "8px", backgroundColor: "#fff1f4", color: "#a31d34", cursor: "pointer" },
  btnAgregar: { display: "flex", alignItems: "center", gap: "6px", marginTop: "8px", padding: 0, border: "none", backgroundColor: "transparent", color: "#7c3aed", fontSize: "14px", fontWeight: 600, cursor: "pointer", fontFamily: "'Inter', Arial, Helvetica, sans-serif" },
  botonesRow: { display: "flex", gap: "12px", marginTop: "28px" },
  btnBack: { flex: 1, minHeight: "48px", border: "none", borderRadius: "15px", color: "#ffffff", background: "linear-gradient(135deg, #25a36f 0%, #1a8a5a 100%)", boxShadow: "0 10px 20px rgba(37,163,111,0.28)", fontSize: "15px", fontWeight: 600, cursor: "pointer", fontFamily: "'Inter', Arial, Helvetica, sans-serif" },
  btnGreen: { flex: 1, minHeight: "48px", border: "none", borderRadius: "15px", color: "#ffffff", background: "linear-gradient(135deg, #25a36f 0%, #1a8a5a 100%)", boxShadow: "0 10px 20px rgba(37,163,111,0.28)", fontSize: "15px", fontWeight: 600, cursor: "pointer", fontFamily: "'Inter', Arial, Helvetica, sans-serif" },
  btnGreenFull: { width: "100%", minHeight: "48px", border: "none", borderRadius: "15px", color: "#ffffff", background: "linear-gradient(135deg, #25a36f 0%, #1a8a5a 100%)", boxShadow: "0 10px 20px rgba(37,163,111,0.28)", fontSize: "15px", fontWeight: 600, cursor: "pointer", fontFamily: "'Inter', Arial, Helvetica, sans-serif" },
  select: { minHeight: "38px", border: "none", borderRadius: "10px", backgroundColor: "#f0ecfb", padding: "0 12px", fontSize: "13px", color: "#1f1739", outline: "none", cursor: "pointer", fontFamily: "'Inter', Arial, Helvetica, sans-serif" },
};