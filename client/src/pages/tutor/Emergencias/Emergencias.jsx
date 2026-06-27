import { useState, useEffect } from "react";
import { APIProvider, Map, AdvancedMarker } from "@vis.gl/react-google-maps";
import { useNavigate } from "react-router-dom";
import "./Emergencias.css";

// Coordenadas por defecto: centro de Buenos Aires
const BUENOS_AIRES = { lat: -34.6037, lng: -58.3816 };

// Días de la semana 
const DIAS = ["domingo", "lunes", "martes", "miercoles", "jueves", "viernes", "sabado"];

// Determina si una veterinaria está abierta ahora según sus horarios
const estaAbierta = (vet) => {
  if (vet.urgencias24hs) return true;

  const ahora = new Date();
  const diaHoy = DIAS[ahora.getDay()];
  const horarioHoy = vet.horarios?.[diaHoy];

  if (!horarioHoy?.desde || !horarioHoy?.hasta) return false;

  const [hDesde, mDesde] = horarioHoy.desde.split(":").map(Number);
  const [hHasta, mHasta] = horarioHoy.hasta.split(":").map(Number);
  const minutosAhora = ahora.getHours() * 60 + ahora.getMinutes();
  const minutosDesde = hDesde * 60 + mDesde;
  const minutosHasta = hHasta * 60 + mHasta;

  return minutosAhora >= minutosDesde && minutosAhora <= minutosHasta;
};

// Calcula distancia en km entre dos coordenadas (fórmula de Haversine)
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

const Emergencias = () => {
  const navigate = useNavigate();

  const [miUbicacion, setMiUbicacion] = useState(BUENOS_AIRES);
  const [geoAceptada, setGeoAceptada] = useState(false);
  const [mapKey, setMapKey] = useState(0);

  const [veterinarias, setVeterinarias] = useState([]);
  const [vetSeleccionada, setVetSeleccionada] = useState(null);
  const [vetDestacada, setVetDestacada] = useState(null); // La que está seleccionada en la lista lateral

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [sinResultados, setSinResultados] = useState(false);

  // 1. Obtener geolocalización y luego buscar veterinarias
  useEffect(() => {
    const buscarVeterinarias = async (lat, lng) => {
      setIsLoading(true);
      setError("");
      setSinResultados(false);

      try {
        const token = localStorage.getItem("token");

        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/api/veterinarias/buscar?lat=${lat}&lng=${lng}&radio=5000`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) throw new Error("Error al obtener veterinarias");

        const json = await response.json();
        const lista = json.data ?? [];

        if (lista.length === 0) {
          setSinResultados(true);
          setVeterinarias([]);
        } else {
          setVeterinarias(lista);
        }
      } catch {
        setError("No se pudieron cargar las veterinarias. Intentá de nuevo más tarde.");
      } finally {
        setIsLoading(false);
      }
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setMiUbicacion(coords);
          setGeoAceptada(true);
          setMapKey((k) => k + 1);
          buscarVeterinarias(coords.lat, coords.lng);
        },
        () => {
          // Usuario denegó: usamos Buenos Aires por defecto
          buscarVeterinarias(BUENOS_AIRES.lat, BUENOS_AIRES.lng);
        }
      );
    } else {
      buscarVeterinarias(BUENOS_AIRES.lat, BUENOS_AIRES.lng);
    }
  }, []);

  // Extrae lat/lng de las coordenadas GeoJSON [lng, lat]
  const getPosition = (vet) => ({
    lat: vet.coordenadas.coordinates[1],
    lng: vet.coordenadas.coordinates[0],
  });

  const abiertas = veterinarias.filter(estaAbierta).length;

  const handleMarkerClick = (vet) => {
    setVetSeleccionada(vet);
    setVetDestacada(vet._id);
  };

  const handleCardClick = (vet) => {
    setVetDestacada(vet._id);
    setVetSeleccionada(vet);
  };

  const handleCerrarBubble = () => {
    setVetSeleccionada(null);
  };

  if (isLoading)
    return <p className="mapa-estado-mensaje">Cargando mapa y veterinarias cercanas...</p>;

  if (error)
    return <p className="mapa-estado-mensaje mapa-estado-error">{error}</p>;

  return (
    <div className="emergencias-container">
      {/* ── Panel izquierdo: mapa ── */}
      <div className="emergencias-mapa-wrapper">
        {sinResultados && (
          <div className="emergencias-sin-resultados">
            No encontramos veterinarias en un radio de 5 km. Intentá ampliar el radio de búsqueda.
          </div>
        )}

        <APIProvider apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}>
          <Map
            key={mapKey}
            defaultCenter={miUbicacion}
            defaultZoom={14}
            mapId="DEMO_MAP_ID"
            onClick={handleCerrarBubble}
            clickableIcons={false}
            className="emergencias-mapa"
          >
            {/* Marcador del usuario */}
            {geoAceptada && (
              <AdvancedMarker position={miUbicacion} title="Vos estás aquí">
                <div className="marker-usuario-wrapper">
                  <div className="marker-usuario" />
                  <div className="marker-usuario__etiqueta">Vos estás aquí</div>
                </div>
              </AdvancedMarker>
            )}

            {/* Marcadores de veterinarias */}
            {veterinarias.map((vet) => (
              <AdvancedMarker
                key={vet._id}
                position={getPosition(vet)}
                title={vet.nombre}
                onClick={() => handleMarkerClick(vet)}
              >
                <div className={`marker-vete ${vetDestacada === vet._id ? "marker-vete--activo" : ""}`}>
                  <span className="marker-vete__icono">🏥</span>
                </div>
              </AdvancedMarker>
            ))}

            {/* Info bubble al hacer clic en un marcador */}
            {vetSeleccionada && (
              <AdvancedMarker position={getPosition(vetSeleccionada)}>
                <div className="info-bubble" onClick={(e) => e.stopPropagation()}>
                  <button className="info-bubble__cerrar" onClick={handleCerrarBubble}>✕</button>
                  <p className="info-bubble__nombre">{vetSeleccionada.nombre}</p>
                  <p className="info-bubble__direccion">📍 {vetSeleccionada.direccion}</p>
                  <p className="info-bubble__distancia">
                    🚗 {calcularDistancia(
                      miUbicacion.lat, miUbicacion.lng,
                      getPosition(vetSeleccionada).lat,
                      getPosition(vetSeleccionada).lng
                    )} km
                  </p>
                  {vetSeleccionada.especialidades?.length > 0 && (
                    <div className="info-bubble__tags">
                      {vetSeleccionada.especialidades.slice(0, 3).map((esp) => (
                        <span key={esp} className="tag">{esp}</span>
                      ))}
                    </div>
                  )}
                  <button
                    className="info-bubble__btn"
                    onClick={() => navigate(`/veterinarias/${vetSeleccionada._id}`)}
                  >
                    Ver veterinaria →
                  </button>
                </div>
              </AdvancedMarker>
            )}
          </Map>
        </APIProvider>
      </div>

      {/* ── Panel derecho: lista de veterinarias ── */}
      <div className="emergencias-lista">
        <p className="emergencias-lista__resumen">
          {abiertas} clínica{abiertas !== 1 ? "s" : ""} abierta{abiertas !== 1 ? "s" : ""} · {veterinarias.length} en total
        </p>

        {veterinarias.map((vet) => {
          const abierta = estaAbierta(vet);
          const pos = getPosition(vet);
          const distancia = calcularDistancia(miUbicacion.lat, miUbicacion.lng, pos.lat, pos.lng);
          const activa = vetDestacada === vet._id;

          return (
            <div
              key={vet._id}
              className={`vet-card ${activa ? "vet-card--activa" : ""}`}
              onClick={() => handleCardClick(vet)}
            >
              <div className="vet-card__header">
                <div>
                  <p className="vet-card__nombre">{vet.nombre}</p>
                  <p className="vet-card__direccion">📍 {vet.direccion}</p>
                </div>
                <span className={`badge ${abierta ? "badge--abierto" : "badge--cerrado"}`}>
                  {abierta ? "Abierto" : "Cerrado"}
                </span>
              </div>

              <div className="vet-card__info">
                <span>🚗 {distancia} km</span>
                {vet.telefono && <span>📞 {vet.telefono}</span>}
                {vet.urgencias24hs && <span>🚨 Urgencias 24hs</span>}
              </div>

              {vet.especialidades?.length > 0 && (
                <div className="vet-card__tags">
                  {vet.especialidades.slice(0, 3).map((esp) => (
                    <span key={esp} className="tag">{esp}</span>
                  ))}
                </div>
              )}

              <button
                className="vet-card__btn"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/veterinarias/${vet._id}`);
                }}
              >
                🧭 Cómo llegar
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Emergencias;
