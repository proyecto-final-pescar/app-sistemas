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

  // NUEVO ESTADO: Controla si el panel inferior está "peek" (1.5 cards), "expanded" (todo) o "minimized" (solo buscador)
  const [sheetState, setSheetState] = useState("peek");

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
        setError(mensajeBackend || "No pudimos cargar las veterinarias. Intentá nuevamente.");
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
            lat: latitude,
            lng: longitude,
            radio: RADIO_DEFAULT_METROS,
          });
          setCercanas(data ?? []);
        } catch (err) {
          console.error("Error al buscar veterinarias cercanas:", err);
          const mensajeBackend = err?.response?.data?.message;
          setError(mensajeBackend || "No pudimos buscar veterinarias cerca tuyo.");
          setCercanas([]);
        } finally {
          setLoading(false);
        }
      },
      (geoErr) => {
        console.error("Error de geolocalización:", geoErr);
        setError(
          geoErr.code === geoErr.PERMISSION_DENIED
            ? "Necesitamos tu ubicación para mostrarte veterinarias cerca tuyo. Habilitá el permiso de ubicación."
            : "No pudimos obtener tu ubicación."
        );
        setCercanas([]);
        setLoading(false);
      }
    );
  }, []);

  useEffect(() => {
    if (filtro === "Cerca mío") {
      buscarCercanas();
    } else {
      cargarListado();
    }
  }, [filtro, buscarCercanas, cargarListado]);

  const resultados = useMemo(() => {
    if (filtro === "Cerca mío") {
      return (cercanas ?? []).filter((v) => matchTexto(v, query));
    }
    return veterinarias.filter((v) => matchTexto(v, query) && matchFiltro(v, filtro));
  }, [filtro, cercanas, veterinarias, query]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const next = new URLSearchParams();
    if (inputValue.trim()) {
      next.set("q", inputValue.trim());
    }
    setSearchParams(next);
  };

  const handleFiltro = (f) => {
    const next = new URLSearchParams();
    if (filtro !== f) {
      next.set("filtro", f);
    }
    setSearchParams(next);
  };

  const handleVerClinica = (id) => navigate(`/tutor/veterinarias/${id}`);

  // Manejador del input de búsqueda (expande el panel al teclear)
  const handleInputChange = (e) => {
    setInputValue(e.target.value);
    if (e.target.value.length > 0) {
      setSheetState("expanded");
    } else {
      setSheetState("peek");
    }
  };

  // Manejador para cuando el usuario interactúa con el mapa (minimiza el panel)
  const handleMapInteraction = () => {
    if (sheetState !== "minimized") {
      setSheetState("minimized");
    }
  };

  // Restaura el panel si estaba minimizado y el usuario toca el panel
  const handleSheetInteraction = () => {
    if (sheetState === "minimized") {
      setSheetState("peek");
    }
  };

  return (
    <div className={styles.layout}>
      {/* Sidebar envuelto en la clase que lo oculta globalmente como pediste */}
      <div className={styles.sidebarContainer}>
        <Sidebar title="Buscar Veterinaria" />
      </div>

      <div className={styles.pageWrapper}>
        <TopBar title="Urgencias 24h y Veterinarias Cercanas" />

        <main className={styles.content}>
          
          {/* ========================================== */}
          {/* CONTENEDOR DEL MAPA (Ocupa el fondo de la pantalla) */}
          {/* ========================================== */}
          <div 
            onClick={handleMapInteraction}
            onTouchStart={handleMapInteraction}
            style={{ 
              position: 'absolute', 
              top: 0, left: 0, width: '100%', height: '100%', 
              backgroundColor: '#e5e3df', zIndex: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}
          >
            {/* AQUÍ VA EL COMPONENTE DEL MAPA */}
            <p style={{ color: '#666', fontWeight: 'bold' }}>[ El Mapa va a cargar aquí ]</p>
          </div>

          {/* ========================================== */}
          {/* BOTTOM SHEET (Panel deslizable de resultados) */}
          {/* ========================================== */}
          <div 
            className={`${styles.bottomSheet} ${
              sheetState === "expanded" ? styles.sheetExpanded : 
              sheetState === "minimized" ? styles.sheetMinimized : 
              styles.sheetPeek
            }`}
            onClick={handleSheetInteraction}
          >
            {/* Manija de arrastre visual para que el usuario sepa que puede deslizar */}
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
                <button type="submit" className={styles.btnBuscar}>
                  Buscar
                </button>
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

            {/* Área que permite hacer scroll dentro del panel inferior */}
            <section className={styles.sheetContent}>
              {error && <div className={styles.errorBanner}>{error}</div>}

              {loading ? (
                <div className={styles.listaResultados} style={{ marginTop: '16px' }}>
                  {[1, 2, 3].map((i) => (
                    <div key={i} className={styles.skeletonCard} />
                  ))}
                </div>
              ) : resultados.length === 0 ? (
                <p className={styles.emptyHint}>
                  {query || filtro
                    ? "No encontramos veterinarias para esa búsqueda."
                    : "No hay veterinarias para mostrar."}
                </p>
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