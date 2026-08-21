import { useState, useEffect } from "react";
import { APIProvider, Map, AdvancedMarker } from "@vis.gl/react-google-maps";
import "./MapaVeterinaria.css";

const MapaVeterinarias = () => {
  /* 3. Hooks (reservados para useAuth / useNavigate cuando se integren) */

  // 4. Estados
  const [data, setData] = useState([]); // Array de veterinarias
  const [error, setError] = useState(""); // Mensaje de error al usuario
  const [isLoading, setIsLoading] = useState(false); // Estado de carga general

  // Estados adicionales
  const [miUbicacion, setMiUbicacion] = useState({
    lat: -34.6037,
    lng: -58.3816,
  });
  // Guarda las coordenadas del usuario para centrar el mapa. Arranca con Buenos Aires como valor por defecto, y si el GPS funciona, se reemplaza con la ubicación real.
  const [veteSeleccionada, setVeteSeleccionada] = useState(null);
  // Guarda cuál veterinaria tocó el usuario.
  const [mapKey, setMapKey] = useState(0);
  const [geoAceptada, setGeoAceptada] = useState(false);

  // 5. Funciones y handlers

  // Pide geolocalización al navegador
  useEffect(() => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (posicion) => {
        setMiUbicacion({
          lat: posicion.coords.latitude,
          lng: posicion.coords.longitude,
        });
        setGeoAceptada(true);
        setMapKey((k) => k + 1);
      },
      () => {
        // No se activa geoAceptada, el marcador no aparece
      },
    );
  }, []);

  // Carga los datos de veterinarias al montar el componente
  useEffect(() => {
    const cargarVeterinarias = async () => {
      setIsLoading(true);
      try {
        const { lat, lng } = miUbicacion;

        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/api/veterinarias/buscar?lat=${lat}&lng=${lng}&radio=50000`,
        );

        if (!response.ok) throw new Error("Error al obtener las veterinarias");

        const json = await response.json();

        const veterinarias = json.data.map((vete) => ({
          id: vete._id,
          nombre: vete.nombre,
          direccion: vete.direccion,
          position: {
            lat: vete.coordenadas.coordinates[1], // índice 1 = latitud
            lng: vete.coordenadas.coordinates[0], // índice 0 = longitud
          },
        }));

        setData(veterinarias);
      } catch {
        setError(
          "No se pudieron cargar las veterinarias. Intentá de nuevo más tarde.",
        );
      } finally {
        setIsLoading(false); // Apaga el estado de carga para que desaparezca el cartel de espera.
      }
    };

    cargarVeterinarias();
  }, [miUbicacion]);

  const handleMarkerClick = (vete) => {
    setVeteSeleccionada(vete);
  };

  const handleInfoWindowClose = () => {
    setVeteSeleccionada(null);
  };

  // 6. Return con el JSX

  // Renderizado de estados obligatorios
  if (isLoading)
    return <p className="mapa-estado-mensaje">Cargando mapa y ubicación...</p>;
  if (error)
    return <p className="mapa-estado-mensaje mapa-estado-error">{error}</p>;

  return (
    <APIProvider apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}>
      <div className="mapa-caracteristicas">
        <Map
          key={mapKey}
          defaultCenter={miUbicacion}
          defaultZoom={15}
          mapId="DEMO_MAP_ID"
          onClick={handleInfoWindowClose}
          clickableIcons={false}
        >
          {/* Marcador de la ubicación del usuario */}
          {geoAceptada && (
            <AdvancedMarker position={miUbicacion} title="Vos estás aquí">
              <div className="marker-usuario-wrapper">
                <div className="marker-usuario" />
                <div className="marker-usuario__etiqueta">Vos estás aquí</div>
              </div>
            </AdvancedMarker>
          )}

          {/* Marcadores de veterinarias */}
          {data.map((vete) => (
            <AdvancedMarker
              key={vete.id}
              position={vete.position}
              title={vete.nombre}
              onClick={() => handleMarkerClick(vete)}
            >
              <div className="marker-vete">
                <span className="marker-vete__icono">🏥</span>
              </div>
            </AdvancedMarker>
          ))}

          {/* Ventana de información de la veterinaria seleccionada */}
          {veteSeleccionada && (
            <AdvancedMarker position={veteSeleccionada.position}>
              <div className="info-bubble" onClick={handleInfoWindowClose}>
                <p className="info-bubble__nombre">{veteSeleccionada.nombre}</p>
                <p className="info-bubble__distancia">
                  📍 {veteSeleccionada.distancia}
                </p>
              </div>
            </AdvancedMarker>
          )}
        </Map>
      </div>
    </APIProvider>
  );
};

export default MapaVeterinarias;

/*
  Uso:
  import MapaVeterinarias from '../../components/map/MapaVeterinaria'

  <MapaVeterinarias />

  Requiere VITE_GOOGLE_MAPS_API_KEY en el .env
*/
