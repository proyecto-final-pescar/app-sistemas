import { useState, useEffect, useRef, useCallback } from "react";
import { APIProvider, Map, AdvancedMarker } from "@vis.gl/react-google-maps";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../../components/layout/Sidebar";
import TopBar from "../../../components/layout/TopBar";
import VetCard from "../../../components/veterinarias/VetCard";
import api from "../../../services/api";
import styles from "./Emergencias.module.css";

const BUENOS_AIRES = { lat: -34.6037, lng: -58.3816 };
const DIAS = ["domingo", "lunes", "martes", "miercoles", "jueves", "viernes", "sabado"];
const ESPECIALIDADES = ["Todas", "Clínica General", "Cirugía", "Dermatología", "Cardiología", "Laboratorio", "Internación","Vacunación"];
const RADIOS = [1, 5, 10];
const RADIO_MAXIMO_AMPLIADO = 50000;

const estaAbierta = (vet) => {
  if (vet.urgencias24hs) return true;
  const ahora = new Date();
  const horarioHoy = vet.horarios?.[DIAS[ahora.getDay()]];
  if (!horarioHoy?.desde || !horarioHoy?.hasta) return false;
  const [hD, mD] = horarioHoy.desde.split(":").map(Number);
  const [hH, mH] = horarioHoy.hasta.split(":").map(Number);
  const min = ahora.getHours() * 60 + ahora.getMinutes();
  return min >= hD * 60 + mD && min <= hH * 60 + mH;
};

const calcularDistancia = (lat1, lng1, lat2, lng2) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return (R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))).toFixed(1);
};

const getPosition = (vet) => ({
  lat: vet.coordenadas.coordinates[1],
  lng: vet.coordenadas.coordinates[0],
});

const IconSearch = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);

const IconPin = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
  </svg>
);

const IconAlert = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
);

const IconX = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

const Emergencias = () => {
  const navigate = useNavigate();

  const [miUbicacion, setMiUbicacion]       = useState(BUENOS_AIRES);
  const [geoAceptada, setGeoAceptada]       = useState(false);
  const [mapKey, setMapKey]                 = useState(0);
  const [veterinarias, setVeterinarias]     = useState([]);
  const [vetSeleccionada, setVetSeleccionada] = useState(null);
  const [vetDestacada, setVetDestacada]     = useState(null);
  const [filtroEsp, setFiltroEsp]           = useState("Todas");
  const [radioKm, setRadioKm]               = useState(5);
  const [isLoading, setIsLoading]           = useState(true);
  const [error, setError]                   = useState("");
  const [sinResultados, setSinResultados]   = useState(false);
  const [solo24hs, setSolo24hs]             = useState(false);
  const [busqueda, setBusqueda]             = useState("");
  const [cercaMioActivo, setCercaMioActivo] = useState(false);
  const [busquedaAmpliada, setBusquedaAmpliada] = useState(false);

  // NUEVOS ESTADOS DE UI (Panel y Sidebar)
  const [sheetState, setSheetState] = useState("peek");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const coordsRef = useRef(null);

  const buscarVeterinarias = useCallback(async (lat, lng, radioOverride) => {
    setIsLoading(true);
    setError("");
    setSinResultados(false);
    setVetSeleccionada(null);
    const radioAUsar = radioOverride ?? radioKm * 1000;
    try {
      const { data: json } = await api.get("/veterinarias/buscar", {
        params: { lat, lng, radio: radioAUsar },
      });
      const lista = json.data ?? [];
      if (lista.length === 0) {
        setSinResultados(true);
        setVeterinarias([]);
      } else {
        setVeterinarias(lista);
      }
      setBusquedaAmpliada(radioOverride === RADIO_MAXIMO_AMPLIADO);
    } catch {
      setError("No se pudieron cargar las veterinarias. Intentá de nuevo más tarde.");
    } finally {
      setIsLoading(false);
    }
  }, [radioKm]);

  const handleAmpliarBusqueda = () => {
    if (!coordsRef.current) return;
    buscarVeterinarias(coordsRef.current.lat, coordsRef.current.lng, RADIO_MAXIMO_AMPLIADO);
  };

  useEffect(() => {
    const onSuccess = (pos) => {
      const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      coordsRef.current = coords;
      setMiUbicacion(coords);
      setGeoAceptada(true);
      setMapKey((k) => k + 1);
      buscarVeterinarias(coords.lat, coords.lng);
    };
    const onError = () => {
      coordsRef.current = BUENOS_AIRES;
      buscarVeterinarias(BUENOS_AIRES.lat, BUENOS_AIRES.lng);
    };
    navigator.geolocation
      ? navigator.geolocation.getCurrentPosition(onSuccess, onError)
      : onError();
  }, []); 

  useEffect(() => {
    if (!coordsRef.current) return;
    buscarVeterinarias(coordsRef.current.lat, coordsRef.current.lng);
  }, [radioKm]); 

  const veterinariasFiltradas = veterinarias
    .filter((v) =>
      filtroEsp === "Todas" ||
      v.especialidades?.some((esp) => esp.toLowerCase() === filtroEsp.toLowerCase())
    )
    .filter((v) => !solo24hs || v.urgencias24hs)
    .filter((v) =>
      busqueda.trim() === "" ||
      v.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      v.direccion.toLowerCase().includes(busqueda.toLowerCase())
    );

  const abiertas = veterinariasFiltradas.filter(estaAbierta).length;

  const handleMarkerClick  = (vet) => { setVetSeleccionada(vet); setVetDestacada(vet._id); };
  const handleCardClick    = (vet) => { setVetDestacada(vet._id); setVetSeleccionada(vet); };
  const handleCerrarBubble = ()    => setVetSeleccionada(null);
  const irAlPerfil = (vetId) => navigate(`/tutor/veterinarias/${vetId}`);

  const handleCercaMio = () => {
    const nuevoEstado = !cercaMioActivo;
    setCercaMioActivo(nuevoEstado);
    if (nuevoEstado) { setRadioKm(1); setFiltroEsp("Todas"); } 
    else { setRadioKm(5); }
  };

  const handleRadioChange = (e) => {
    setRadioKm(Number(e.target.value));
    setCercaMioActivo(false);
    setBusquedaAmpliada(false);
  };

  // CONTROL DEL PANEL (Expandir, minimizar)
  const handleBusquedaChange = (e) => {
    setBusqueda(e.target.value);
    setSheetState(e.target.value.length > 0 ? "expanded" : "peek");
  };

  const handleMapInteraction = () => {
    if (sheetState !== "minimized") setSheetState("minimized");
  };

  const handleSheetInteraction = () => {
    if (sheetState === "minimized") setSheetState("peek");
  };

  return (
    <div className={styles.vetMasterLayout}>
      
      {/* 1. SIDEBAR OCULTO */}
      <div className={`${styles.sidebarOffscreen} ${isSidebarOpen ? styles.sidebarOpen : ""}`}>
        <Sidebar role="tutor" activeItem="Emergencias" title="Urgencias 24h y Veterinarias Cercanas" />
      </div>
      
      {isSidebarOpen && (
        <div className={styles.vetOverlay} onClick={() => setIsSidebarOpen(false)} />
      )}

      {/* 2. VISTA PRINCIPAL */}
      <div className={styles.vetMainView}>
        
        {/* HEADER */}
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

        {/* CONTENEDOR MAPA Y PANEL FLOTANTE */}
        <main className={styles.vetMapArea}>
          
          {/* MAPA */}
          <div className={styles.vetMapBackground}>
            <APIProvider apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}>
              <Map
                key={mapKey}
                defaultCenter={miUbicacion}
                defaultZoom={14}
                mapId="DEMO_MAP_ID"
                onClick={() => {
                  handleCerrarBubble();
                  handleMapInteraction();
                }}
                onDragStart={handleMapInteraction} // Se minimiza el panel al arrastrar el mapa
                clickableIcons={false}
                className={styles.mapa}
              >
                {geoAceptada && (
                  <AdvancedMarker position={miUbicacion} title="Vos estás aquí">
                    <div className={styles.markerUsuarioWrapper}>
                      <div className={styles.markerUsuario} />
                      <div className={styles.markerUsuarioEtiqueta}>Vos estás aquí</div>
                    </div>
                  </AdvancedMarker>
                )}

                {veterinarias.map((vet) => (
                  <AdvancedMarker
                    key={vet._id}
                    position={getPosition(vet)}
                    title={vet.nombre}
                    onClick={() => handleMarkerClick(vet)}
                  >
                    <div className={`${styles.markerVete} ${vetDestacada === vet._id ? styles.markerVeteActivo : ""}`}>
                      <span>🏥</span>
                    </div>
                  </AdvancedMarker>
                ))}

                {vetSeleccionada && (
                  <AdvancedMarker position={getPosition(vetSeleccionada)}>
                    <div className={styles.infoBubble} onClick={(e) => e.stopPropagation()}>
                      <button className={styles.infoBubbleCerrar} onClick={handleCerrarBubble}><IconX /></button>
                      <p className={styles.infoBubbleNombre}>{vetSeleccionada.nombre}</p>
                      <p className={styles.infoBubbleDireccion}>📍 {vetSeleccionada.direccion}</p>
                      <p className={styles.infoBubbleDistancia}>
                        🗺 {calcularDistancia(miUbicacion.lat, miUbicacion.lng, getPosition(vetSeleccionada).lat, getPosition(vetSeleccionada).lng)} km
                      </p>
                      {vetSeleccionada.especialidades?.length > 0 && (
                        <div className={styles.infoBubbleTags}>
                          {vetSeleccionada.especialidades.slice(0, 3).map((esp) => (
                            <span key={esp} className={styles.tag}>{esp}</span>
                          ))}
                        </div>
                      )}
                      <button className={styles.infoBubbleBtn} onClick={() => irAlPerfil(vetSeleccionada._id)}>Ver clínica →</button>
                    </div>
                  </AdvancedMarker>
                )}
              </Map>
            </APIProvider>
            
            {/* Cartel flotante sobre el mapa si no hay resultados */}
            {sinResultados && (
              <div className={styles.sinResultados}>
                <p>No encontramos veterinarias en un radio de {radioKm} km.</p>
                <button type="button" className={styles.btnAmpliarBusqueda} onClick={handleAmpliarBusqueda}>
                  Ampliar a 50 km
                </button>
              </div>
            )}
          </div>

          {/* PANEL FLOTANTE (Bottom Sheet) */}
          <div className={`${styles.vetSheet} ${styles[sheetState]}`} onClick={handleSheetInteraction}>
            <div 
              className={styles.dragHandle} 
              onClick={(e) => {
                e.stopPropagation();
                setSheetState(sheetState === "expanded" ? "peek" : "expanded");
              }}
            />

            {/* Cabecera del panel: Buscador y Filtros */}
            <div style={{ padding: "0 16px" }}>
              <div className={styles.barraBusqueda}>
                <div className={styles.buscadorWrapper}>
                  <span className={styles.buscadorIcono}><IconSearch /></span>
                  <input
                    type="text"
                    placeholder="Buscar clínica o barrio..."
                    value={busqueda}
                    onChange={handleBusquedaChange}
                    onFocus={() => setSheetState("expanded")}
                    className={styles.buscadorInput}
                  />
                  {busqueda && (
                    <button className={styles.buscadorClear} onClick={() => setBusqueda("")}><IconX /></button>
                  )}
                </div>
              </div>

              {/* Botones de acción rápida y selects */}
              <div className={styles.filtrosWrapper}>
                <button className={`${styles.btnCercaMio} ${cercaMioActivo ? styles.btnCercaMioActivo : ""}`} onClick={handleCercaMio}>
                  <IconPin /> Cerca mío
                </button>
                <button className={`${styles.btnFiltros} ${solo24hs ? styles.btnFiltrosActivo : ""}`} onClick={() => setSolo24hs((v) => !v)}>
                  <IconAlert /> 24hs
                </button>
                <select value={filtroEsp} onChange={(e) => setFiltroEsp(e.target.value)} className={styles.select}>
                  {ESPECIALIDADES.map((e) => (<option key={e} value={e}>{e}</option>))}
                </select>
                <select value={radioKm} onChange={handleRadioChange} className={styles.select}>
                  {RADIOS.map((r) => (<option key={r} value={r}>{r} km</option>))}
                </select>
              </div>
            </div>

            {/* Contenido scrolleable del panel (Lista de resultados) */}
            <section className={styles.vetSheetContent}>
              {isLoading ? (
                <p className={styles.estadoMensaje}>Buscando veterinarias...</p>
              ) : error ? (
                <p className={`${styles.estadoMensaje} ${styles.estadoError}`}>{error}</p>
              ) : (
                <>
                  {busquedaAmpliada && veterinariasFiltradas.length > 0 && (
                    <p className={styles.avisoAmpliada}>Mostrando resultados en un radio ampliado de 50 km.</p>
                  )}
                  <p className={styles.resumen}>
                    {abiertas} clínica{abiertas !== 1 ? "s" : ""} abierta{abiertas !== 1 ? "s" : ""} · {veterinariasFiltradas.length} en total
                  </p>
                  
                  <div className={styles.lista}>
                    {veterinariasFiltradas.map((vet) => {
                      const pos = getPosition(vet);
                      return (
                        <VetCard
                          key={vet._id}
                          vet={vet}
                          activa={vetDestacada === vet._id}
                          abierta={estaAbierta(vet)}
                          distancia={calcularDistancia(miUbicacion.lat, miUbicacion.lng, pos.lat, pos.lng)}
                          onClick={() => handleCardClick(vet)}
                          onVerDetalle={() => irAlPerfil(vet._id)}
                        />
                      );
                    })}
                    {veterinariasFiltradas.length === 0 && (
                      <p className={styles.sinResultadosLista}>
                        No hay veterinarias que coincidan con los filtros aplicados.
                      </p>
                    )}
                  </div>
                </>
              )}
            </section>
          </div>

        </main>
      </div>
    </div>
  );
};

export default Emergencias;