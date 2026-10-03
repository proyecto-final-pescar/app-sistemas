import React, { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Sidebar from "../../../components/layout/Sidebar";
import TopBar from "../../../components/layout/TopBar";
import PanelDestacado from "../../../components/ui/panel-destacado/PanelDestacado";
import Button from "../../../components/ui/button/Button";
import VetCard from "../../../components/veterinarias/VetCard";
import {
  obtenerVeterinariasPaginadas,
  buscarVeterinariasCercanas,
} from "../../../services/veterinariaService";
import { calcularEstadoApertura } from "../../../utils/Horarios";
import styles from "../../../pages/tutor/HomeTutor/HomeTutor.module.css";

const RADIO_DEFAULT_METROS = 5000;
const VETERINARIAS_POR_PAGINA = 12;
// Código de categoria_servicio para el chip "Vacunación"
const CATEGORIA_VACUNACION = "VAC";

const FILTROS = ["Emergencias", "Vacunación", "Cerca mío"];

// Nota: los filtros de texto, urgencias y categoría los aplica el servidor
// (params q, urgencias y categoria=VAC). Acá solo se filtra en cliente el
// modo "Cerca mío", que usa el endpoint geográfico sin esos params.

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
  const [pagina, setPagina] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [cercanas, setCercanas] = useState(null);

  const [loading, setLoading] = useState(false);
  const [cargandoMas, setCargandoMas] = useState(false);
  const [error, setError] = useState(null);

  // Descarta respuestas viejas si el usuario cambia de filtro o búsqueda
  // mientras todavía hay un pedido en vuelo.
  const pedidoActual = useRef(0);

  useEffect(() => {
    setInputValue(query);
  }, [query]);

  const cargarListado = useCallback(
    async (paginaACargar = 1) => {
      const pedido = ++pedidoActual.current;
      const esPrimeraPagina = paginaACargar === 1;

      try {
        if (esPrimeraPagina) setLoading(true);
        else setCargandoMas(true);
        setError(null);

        const data = await obtenerVeterinariasPaginadas({
          q: query,
          categoria: filtro === "Vacunación" ? CATEGORIA_VACUNACION : undefined,
          urgencias: filtro === "Emergencias",
          page: paginaACargar,
          limit: VETERINARIAS_POR_PAGINA,
        });

        if (pedido !== pedidoActual.current) return;

        setVeterinarias((previas) =>
          esPrimeraPagina ? data.veterinarias : [...previas, ...data.veterinarias]
        );
        setPagina(data.page);
        setTotalPaginas(data.totalPaginas);
      } catch (err) {
        if (pedido !== pedidoActual.current) return;

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
        if (pedido === pedidoActual.current) {
          setLoading(false);
          setCargandoMas(false);
        }
      }
    },
    [navigate, query, filtro]
  );

  const buscarCercanas = useCallback(async () => {
    // Invalida cualquier pedido del listado general que siga en vuelo
    pedidoActual.current += 1;

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

  // Cada cambio de búsqueda o de chip vuelve a pedir la primera página
  useEffect(() => {
    if (filtro === "Cerca mío") {
      buscarCercanas();
    } else {
      cargarListado(1);
    }
  }, [filtro, query, buscarCercanas, cargarListado]);

  const resultados = useMemo(() => {
    if (filtro === "Cerca mío") {
      return (cercanas ?? []).filter((v) => matchTexto(v, query));
    }
    return veterinarias;
  }, [filtro, cercanas, veterinarias, query]);

  const hayMasPaginas = filtro !== "Cerca mío" && pagina < totalPaginas;

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

  return (
    <div className={styles.layout}>
      <Sidebar title="Buscar Veterinaria" />

      <div className={styles.pageWrapper}>
        <TopBar title="Buscar Veterinaria" />

        <main className={styles.content}>
          <button type="button" className={styles.volverInicio} onClick={() => navigate("/home")}>
            ← Volver al inicio
          </button>
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

            {!loading && hayMasPaginas && (
              <div className={styles.verMas}>
                <Button
                  type="button"
                  texto={cargandoMas ? "Cargando..." : "Ver más"}
                  variante="secundario"
                  tamaño="chico"
                  disabled={cargandoMas}
                  onClick={() => cargarListado(pagina + 1)}
                />
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
};

export default BuscarVeterinaria;