// client/src/pages/veterinaria/RegistroDeVeterinaria/RegistroDeVeterinaria.jsx

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

export default function RegistroDeVeterinaria() {
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
  const [error, setError] = useState("");
  const debounceRef = useRef(null);

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
          `${import.meta.env.VITE_API_URL}/api/places/autocomplete?input=${encodeURIComponent(form.direccion)}`
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
        `${import.meta.env.VITE_API_URL}/api/places/details?place_id=${place.place_id}`
      );
      const data = await res.json();
      const location = data.result?.geometry?.location;
      setForm((f) => ({
        ...f,
        direccion: place.description,
        lat: location?.lat || null,
        lng: location?.lng || null,
      }));
    } catch {
      setForm((f) => ({ ...f, direccion: place.description }));
    } finally {
      setSuggestions([]);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "direccion") {
      setForm((f) => ({ ...f, direccion: value, lat: null, lng: null }));
    } else {
      setForm((f) => ({ ...f, [name]: value }));
    }
  };

  const validate = () => {
    if (!form.nombreClinica.trim()) return "El nombre de la clínica es requerido.";
    if (!form.cuit.trim()) return "El CUIT/CUIL es requerido.";
    if (!form.telefono.trim()) return "El teléfono es requerido.";
    if (!form.direccion.trim()) return "La dirección es requerida.";
    if (!form.lat) return "Seleccioná una dirección de la lista para obtener las coordenadas.";
    if (!form.email.trim()) return "El email institucional es requerido.";
    return "";
  };

  const handleContinuar = () => {
    const err = validate();
    if (err) { setError(err); return; }
    setError("");
    // Acá se puede pasar al paso 2 o enviar al backend
    alert("Paso 1 completo ✅");
  };

  return (
    <div style={styles.shell}>
      <Sidebar role="veterinaria" activeItem="Registro" />

      <div style={styles.main}>
        <TopBar title="Registro de clínica" notifications={2} userInitial="J" />

        {/* Hero banner */}
        <div style={styles.heroBanner}>
          <div style={styles.heroBubble1} />
          <div style={styles.heroBubble2} />
          <div style={{ position: "relative", zIndex: 1 }}>
            <h2 style={styles.heroTitle}>¡Registrá tu clínica veterinaria!</h2>
            <p style={styles.heroSub}>
              Completá el perfil de tu clínica para que los dueños de mascotas te encuentren.
            </p>
          </div>
        </div>

        {/* Card del formulario */}
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Datos de la clínica</h3>
          <p style={styles.cardSub}>
            Ingresá la información principal para crear el perfil de tu centro veterinario.
          </p>

          <div style={styles.grid2}>
            <div style={styles.field}>
              <label style={styles.label}>Nombre de la clínica<span style={styles.req}>*</span></label>
              <input name="nombreClinica" value={form.nombreClinica} onChange={handleChange}
                placeholder="VetCenter Palermo" style={styles.input} />
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Razón social</label>
              <input name="razonSocial" value={form.razonSocial} onChange={handleChange}
                placeholder="VetCenter Palermo S.R.L." style={styles.input} />
            </div>

            <div style={styles.field}>
              <label style={styles.label}>CUIT/CUIL<span style={styles.req}>*</span></label>
              <input name="cuit" value={form.cuit} onChange={handleChange}
                placeholder="20-12345678-9" style={styles.input} />
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Teléfono<span style={styles.req}>*</span></label>
              <input name="telefono" value={form.telefono} onChange={handleChange}
                placeholder="1123456789" style={styles.input} />
            </div>
          </div>

          {/* Dirección con autocompletado */}
          <div style={{ ...styles.field, marginTop: "16px", position: "relative" }}>
            <label style={styles.label}>Dirección<span style={styles.req}>*</span></label>
            <div style={styles.inputWrap}>
              <span style={styles.inputIcon}><IconSearch /></span>
              <input
                name="direccion"
                value={form.direccion}
                onChange={handleChange}
                placeholder="Av. Rivadavia 1234, Piso 3 Dpto. B"
                autoComplete="off"
                style={styles.inputInner}
              />
              {form.lat && <span style={{ ...styles.inputIcon, color: "#25a36f" }}><IconPin /></span>}
            </div>

            {suggestions.length > 0 && (
              <ul style={styles.suggestions}>
                {suggestions.map((s) => (
                  <li
                    key={s.place_id}
                    style={styles.suggestionItem}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f5f3ff"}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#ffffff"}
                    onClick={() => handleSelectPlace(s)}
                  >
                    <span style={{ color: "#7c3aed", marginRight: "8px" }}>📍</span>
                    {s.description}
                  </li>
                ))}
              </ul>
            )}
            {loadingAddress && <p style={styles.helperText}>Buscando dirección...</p>}
            {form.lat && (
              <p style={{ ...styles.helperText, color: "#25a36f" }}>
                ✅ Coordenadas: {form.lat.toFixed(5)}, {form.lng.toFixed(5)}
              </p>
            )}
          </div>

          <div style={{ ...styles.grid2, marginTop: "16px" }}>
            <div style={styles.field}>
              <label style={styles.label}>Email institucional<span style={styles.req}>*</span></label>
              <input name="email" type="email" value={form.email} onChange={handleChange}
                placeholder="info@vetcenterpalermo.com" style={styles.input} />
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Sitio web</label>
              <input name="sitioWeb" value={form.sitioWeb} onChange={handleChange}
                placeholder="vetcenterpalermo.com.ar" style={styles.input} />
            </div>
          </div>

          {error && <p style={styles.error}>{error}</p>}

          <button onClick={handleContinuar} style={styles.button}>
            Continuar →
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  shell: {
    display: "flex",
    minHeight: "100vh",
    backgroundColor: "#f9f8ff",
    fontFamily: "'Inter', Arial, Helvetica, sans-serif",
  },
  main: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    overflowY: "auto",
  },
  heroBanner: {
    position: "relative",
    margin: "24px 32px 0",
    borderRadius: "16px",
    padding: "28px 32px",
    background: "linear-gradient(135deg, #7c3aed 0%, #5b21b6 60%, #25a36f 100%)",
    overflow: "hidden",
  },
  heroBubble1: {
    position: "absolute", top: "-30px", right: "-30px",
    width: "140px", height: "140px", borderRadius: "50%",
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  heroBubble2: {
    position: "absolute", bottom: "-20px", right: "80px",
    width: "80px", height: "80px", borderRadius: "50%",
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  heroTitle: {
    margin: 0, fontSize: "22px", fontWeight: 800,
    color: "#ffffff", letterSpacing: "-0.3px",
  },
  heroSub: {
    margin: "8px 0 0", fontSize: "14px",
    color: "rgba(255,255,255,0.85)", lineHeight: "20px", maxWidth: "480px",
  },
  card: {
    margin: "20px 32px 40px",
    backgroundColor: "#ffffff",
    borderRadius: "16px",
    border: "1px solid #ede9fe",
    padding: "28px 28px 32px",
    boxShadow: "0 4px 20px rgba(124,58,237,0.06)",
  },
  cardTitle: {
    margin: 0, fontSize: "16px", fontWeight: 700,
    color: "#1f1739", letterSpacing: "-0.2px",
  },
  cardSub: {
    margin: "4px 0 20px", fontSize: "13px",
    color: "#8276ab", lineHeight: "18px",
  },
  grid2: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "16px 20px",
  },
  field: {
    display: "flex", flexDirection: "column", gap: "7px",
  },
  label: {
    fontSize: "13px", fontWeight: 500,
    color: "#1f1739", letterSpacing: "-0.1px",
  },
  req: { color: "#7c3aed", marginLeft: "2px" },
  input: {
    minHeight: "42px", border: "none", borderRadius: "12px",
    backgroundColor: "#f0ecfb", padding: "0 14px",
    fontSize: "14px", color: "#1f1739", outline: "none",
    fontFamily: "'Inter', Arial, Helvetica, sans-serif",
    boxSizing: "border-box", width: "100%",
  },
  inputWrap: {
    display: "flex", alignItems: "center",
    minHeight: "42px", borderRadius: "12px",
    backgroundColor: "#f0ecfb", color: "#8276ab",
  },
  inputIcon: {
    display: "grid", placeItems: "center",
    width: "40px", flex: "0 0 40px", color: "#8779b0",
  },
  inputInner: {
    flex: 1, border: "none", backgroundColor: "transparent",
    padding: "0 14px 0 0", fontSize: "14px", color: "#1f1739",
    outline: "none", fontFamily: "'Inter', Arial, Helvetica, sans-serif",
  },
  suggestions: {
    position: "absolute", top: "100%", left: 0, right: 0, zIndex: 10,
    margin: "4px 0 0", padding: 0, listStyle: "none",
    backgroundColor: "#ffffff", border: "1px solid #ede9fe",
    borderRadius: "12px", boxShadow: "0 8px 24px rgba(124,58,237,0.12)",
    overflow: "hidden",
  },
  suggestionItem: {
    padding: "11px 16px", fontSize: "13px", color: "#1f1739",
    cursor: "pointer", backgroundColor: "#ffffff",
    display: "flex", alignItems: "center",
  },
  helperText: {
    margin: "6px 0 0", fontSize: "12px", color: "#8276ab",
  },
  error: {
    margin: "16px 0 0", border: "1px solid #fac7ce",
    borderRadius: "12px", padding: "11px 14px",
    color: "#a31d34", backgroundColor: "#fff1f4",
    fontSize: "13px", lineHeight: "18px",
  },
  button: {
    display: "block", width: "100%", maxWidth: "340px",
    margin: "24px auto 0", minHeight: "48px",
    border: 0, borderRadius: "15px", color: "#ffffff",
    background: "linear-gradient(135deg, #25a36f 0%, #1a8a5a 100%)",
    boxShadow: "0 10px 20px rgba(37,163,111,0.28)",
    fontSize: "15px", fontWeight: 600, letterSpacing: "-0.1px",
    cursor: "pointer", fontFamily: "'Inter', Arial, Helvetica, sans-serif",
  },
};