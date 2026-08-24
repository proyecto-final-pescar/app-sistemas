import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Sidebar from "../../../components/layout/Sidebar";
import TopBar from "../../../components/layout/TopBar";
import VetCard from "../../../components/veterinarias/VetCard";
import {
  getAllVeterinarias,
  buscarVeterinariasCercanas,
} from "../../../services/veterinariaService";
import { calcularEstadoApertura } from "../../../utils/Horarios";
import styles from "../../../pages/tutor/HomeTutor/HomeTutor.module.css";

const RADIO_DEFAULT_METROS = 5000;
const FILTROS = ["Emergencias", "Vacunación", "Cerca mío"];

function matchFiltro(vet, filtro) {
  if (!filtro) return true;
  if (filtro === "Emergencias") return !!vet.urgencias24hs;
  if (filtro === "Vacunación") return !!vet.especialidades?.includes("Vacunación");
  return true;
}

function matchTexto(vet, q) {
  if (!q) return true;
  const texto = q.toLowerCase();
  return (
    vet.nombre?.toLowerCase().includes(texto) ||
    vet.direccion?.toLowerCase().includes(texto)
  );
}

const BuscarVeterinaria = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const query = searchParams.get("q") || "";
  const filtro = searchParams.get("filtro") || "";

  const [inputValue, setInputValue] = useState(query);
  const [veterinarias, setVeterinarias] = useState([]);
  const [cercanas, setCercanas] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // ESTADOS DE LA INTERFAZ
  const [sheetState, setSheetState] = useState("peek");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    setInputValue(query);
  }, [query]);

  const cargarListado = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getAllVeterinarias();
      const lista = Array.isArray(res) ? res : res?.data ?? [];
      setVeterinarias(lista);
    } catch (err) {
      console.error("Error al obtener veterinarias:", err);
      const status = err?.response?.status;
      const mensajeBackend = err?.response?.data?.error || err?.response?.data?.message;

      if (status === 401) {
        setError(mensajeBackend || "Tu sesión expiró. Te estamos llevando al login…");
        setTimeout(() => navigate("/login"), 1500);
      } else {
        setError(mensajeBackend || "No pudimos cargar las veterinarias.");
      }
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  const buscarCercanas = useCallback(async () => {
    if (!("geolocation" in navigator)) {
      setError("Tu navegador no soporta geolocalización.");
      setCercanas([]);
      return;
    }
    setLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const data = await buscarVeterinariasCercanas({
            lat: latitude, lng: longitude, radio: RADIO_DEFAULT_METROS,
          });
          setCercanas(data ?? []);
        } catch (err) {
          setError("No pudimos buscar veterinarias cerca tuyo.");
          setCercanas([]);
        } finally {
          setLoading(false);
        }
      },
      (geoErr) => {
        setError("Necesitamos tu ubicación. Habilitá el permiso de ubicación.");
        setCercanas([]);
        setLoading(false);
      }
    );
  }, []);

  useEffect(() => {
    if (filtro === "Cerca mío") { buscarCercanas(); } 
    else { cargarListado(); }
  }, [filtro, buscarCercanas, cargarListado]);

  const resultados = useMemo(() => {
    if (filtro === "Cerca mío") return (cercanas ?? []).filter((v) => matchTexto(v, query));
    return veterinarias.filter((v) => matchTexto(v, query) && matchFiltro(v, filtro));
  }, [filtro, cercanas, veterinarias, query]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const next = new URLSearchParams();
    if (inputValue.trim()) next.set("q", inputValue.trim());
    setSearchParams(next);
  };

  const handleFiltro = (f) => {
    const next = new URLSearchParams();
    if (filtro !== f) next.set("filtro", f);
    setSearchParams(next);
  };

  // MANEJADORES DE INTERACCIÓN
  const handleInputChange = (e) => {
    setInputValue(e.target.value);
    if (e.target.value.length > 0) setSheetState("expanded");
    else setSheetState("peek");
  };

  const handleMapInteraction = () => {
    if (sheetState !== "minimized") setSheetState("minimized");
  };

  const handleSheetInteraction = () => {
    if (sheetState === "minimized") setSheetState("peek");
  };

  return (
    <div className={styles.vetMasterLayout}>
      
      {/* SIDEBAR OCULTO */}
      <div className={`${styles.sidebarOffscreen} ${isSidebarOpen ? styles.sidebarOpen : ""}`}>
        <Sidebar title="Buscar Veterinaria" />
      </div>
      
      {isSidebarOpen && (
        <div className={styles.vetOverlay} onClick={() => setIsSidebarOpen(false)} />
      )}

      <div className={styles.vetMainView}>
        
        {/* HEADER Y BOTÓN HAMBURGUESA */}
        <div className={styles.vetHeaderWrapper}>
          <TopBar title="Urgencias 24h y Veterinarias Cercanas" />
          
          <button 
            className={styles.hamburgerBtn} 
            onClick={() => setIsSidebarOpen(true)}
            aria-label="Abrir menú"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#6B4FBB" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>
        </div>

        {/* CONTENEDOR MAPA Y PANEL */}
        <main className={styles.vetMapArea}>
          
          <div 
            className={styles.vetMapBackground}
            onClick={handleMapInteraction}
            onTouchStart={handleMapInteraction}
          >
            <p style={{ color: '#666', fontWeight: 'bold' }}>[ El Mapa va a cargar aquí ]</p>
          </div>

          <div 
            className={`${styles.vetSheet} ${styles[sheetState]}`}
            onClick={handleSheetInteraction}
          >
            <div 
              className={styles.dragHandle} 
              onClick={(e) => {
                e.stopPropagation();
                setSheetState(sheetState === "expanded" ? "peek" : "expanded");
              }}
            />

            <div style={{ padding: "0 16px" }}>
              <form className={styles.buscador} onSubmit={handleSubmit}>
                <input
                  type="text"
                  className={styles.inputBuscar}
                  placeholder="Buscar clínica o barrio..."
                  value={inputValue}
                  onChange={handleInputChange}
                  onFocus={() => setSheetState("expanded")}
                />
              </form>

              <div className={styles.chips}>
                {FILTROS.map((f) => (
                  <button
                    key={f}
                    type="button"
                    className={`${styles.chip} ${filtro === f ? styles.chipActivo : ""}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleFiltro(f);
                    }}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            <section className={styles.vetSheetContent}>
              {error && <div className={styles.errorBanner}>{error}</div>}

              {loading ? (
                <div className={styles.listaResultados} style={{ marginTop: '16px' }}>
                  {[1, 2, 3].map((i) => (
                    <div key={i} className={styles.skeletonCard} />
                  ))}
                </div>
              ) : resultados.length === 0 ? (
                <p className={styles.emptyHint}>No encontramos veterinarias.</p>
              ) : (
                <div className={styles.listaResultados} style={{ marginTop: '16px' }}>
                  {resultados.map((vet) => {
                    const { abierta, horaCierre } = calcularEstadoApertura(vet);
                    return (
                      <VetCard
                        key={vet._id}
                        vet={{ ...vet, horaCierre }}
                        variante="fila"
                        abierta={abierta}
                        onVerDetalle={() => handleVerClinica(vet._id)}
                      />
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        </main>
      </div>
    </div>
  );
};

export default BuscarVeterinaria;