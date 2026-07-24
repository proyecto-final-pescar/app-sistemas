import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Sidebar from "../../../components/layout/Sidebar";
import TopBar from "../../../components/layout/TopBar";
import PanelDestacado from "../../../components/ui/panel-destacado/PanelDestacado";
import VetCard from "../../../components/veterinarias/VetCard";
import {
  getAllVeterinarias,
  buscarVeterinariasCercanas,
} from "../../../services/veterinariaService";
import styles from "../../../pages/tutor/HomeTutor/HomeTutor.module.css";

const RADIO_DEFAULT_METROS = 5000;

const FILTROS = ["Emergencias", "Vacunación", "Cerca mío"];


function matchFiltro(vet, filtro) {
  if (!filtro) return true;
  if (filtro === "Emergencias") return !!vet.urgencias24hs;
  if (filtro === "Vacunación") return !!vet.especialidades?.includes("Vacunación")> 0;
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

  useEffect(() => {
    setInputValue(query);
  }, [query]);

  const cargarListado = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getAllVeterinarias();
      // getAllVeterinarias  devuelve el body completo ({success, data}),
      
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
    const next = new URLSearchParams(searchParams);
    if (inputValue.trim()) {
      next.set("q", inputValue.trim());
    } else {
      next.delete("q");
    }
    setSearchParams(next);
  };

  const handleFiltro = (f) => {
    const next = new URLSearchParams(searchParams);
    if (filtro === f) {
      next.delete("filtro"); 
    } else {
      next.set("filtro", f);
    }
    setSearchParams(next);
  };

  const handleVerClinica = (id) => navigate(`/tutor/veterinarias/${id}`);

  return (
    <div className={styles.layout}>
      <Sidebar />

      <div className={styles.pageWrapper}>
        <TopBar title="Buscar Veterinaria" />

        <main className={styles.content}>
          <PanelDestacado
            titulo="Encontrá la veterinaria ideal"
            subtitulo="Encontrá la mejor atención para tu mejor amigo."
          >
            <form className={styles.buscador} onSubmit={handleSubmit}>
              <input
                type="text"
                className={styles.inputBuscar}
                placeholder="Buscar clínica veterinaria ..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
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
                  onClick={() => handleFiltro(f)}
                >
                  {f}
                </button>
              ))}
            </div>
          </PanelDestacado>

          <section className={styles.resultados}>
            {error && <div className={styles.errorBanner}>{error}</div>}

            {loading ? (
              <div className={styles.listaResultados}>
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
              <div className={styles.listaResultados}>
                {resultados.map((vet) => (
                  <VetCard
                    key={vet._id}
                    vet={vet}
                    variante="fila"
                    // falta calcular la hora de cierre
                    abierta={vet.abierta ?? true}
                    onVerDetalle={() => handleVerClinica(vet._id)}
                  />
                ))}
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
};

export default BuscarVeterinaria;