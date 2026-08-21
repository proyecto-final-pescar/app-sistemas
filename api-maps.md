## Google Maps y JavaScript - Documento para proyecto "MyPet"

    En el sigueinte documento se vera la informacion necesaria para poder implementar Google Maps en el proyecto "MyPet"


    Instalacion

    1. Instalacion de React

        Para poder comenzar a usar la Api de Maps se necesita instalar la libreria de React. Se hace de la misma manera que VITE.

        npm install @vis.gl/react-google-maps


    2. Suscripcion a Google Cloud Service

        Para poder integrar Google Maps en la pagina va a ser necesario una API Key. Esta se consigue accediendo a Google Cloud Service y creando una cuenta. Desde ella sera necesario el poner un metodo de facturacion para acceder a una instancia de uso gratuita. El cobro de la misma solo se realizara si el uso de la Api de los usuarios excede los limites permitidos.

    3. Estructura del proyecto

        Para un mejor orden, lo mejor seria separar la aplicacion en distintos archivos, osea

        index.js (Punto de entrada. Donde conectamos React con HTML)
        ↓
        PaginaInicio.js (Junta los componentes)
        ↓
        MapaVeterinarias.js (donde va a estar alojado el componente)

    4. Creacion del componente

        Creamos el archivo donde estara todas las lineas necesarias para crear el componente

        MapaVeterinarias.js

        Luego, realizamos las importaciones necesarias

        import React, { useState, useEffect } from 'react';
        import { APIProvider, Map, AdvancedMarker } from '@vis.gl/react-google-maps';

        Esto nos permite declarar el contenedor  "ApiProvider" y el contenedor "Map".
        
        - "ApiProvider" Su trabajo es ir a internet, hablar con Google, pasarle tu API_KEY y descargar los archivos necesarios para que nuestra cumputadora entienda los mapas de Google.
        
        - "Map" es el cuerpo (lo que se va a visualizar)

        - "AdvancedMarker" sera utilizado mas adelante para las coordenadas de cada veterinaria

        Con esto hecho podemos crear el componente. Esta sera una funcion la cual tendra que cumplir dos condciones:
        - Su nombre debe empezar con mayúscula  (MapaVeterinarias y no mapaVeterinarias). Esto le ayuda a React a diferenciar una etiqueta HTML nativa (como <div> o <button>) de un componente propio (<MapaVeterinarias />).
        - Debe retornar JSX (la sintaxis que parece HTML, como <APIProvider> ... </APIProvider>). Lo que devuelve esa función es lo que React va a mostrar en la pantalla (por eso es una funcion, para usar el return)

        Un ejemplo de como deberia quedar la funcion seria asi 

    export default function MapaVeterinarias()
        { return (
            <APIProvider apiKey={API_KEY}>
            <Map />
            </APIProvider> ); 
        }


    4. Estilos del mapa

        Es necesario definir una altura para que el mapa sea visible.

        Archivo CSS:

        .mapa-caracteristicas {
        width: 100%;
        height: 500px;
        border: 2px solid #ccc;
        border-radius: 8px;
        overflow: hidden;
        }

    5. Pagina principal (PaginaInicio)

        Vamos a crear un archivo intermedio llamdado "PaginaInicio", el cual tendra un rol igual al arhivo "index.html"

        import MapaVeterinarias from './MapaVeterinarias'

        function PaginaInicio() { 
            return (
                <main className="mapa-caracteristicas">
                <MapaVeterinarias />
                </main>
                    );
                    
                }

        export default PaginaInicio;

    6. Conexion con HTML

        El archivo principal de React conecta toda la aplicación con el HTML.

        import React from 'react';
        import ReactDOM from 'react-dom/client';
        import PaginaInicio from './PaginaInicio';

        const root = ReactDOM.createRoot(document.getElementById('root'));

        root.render(
            <React.StrictMode> 
            <PaginaInicio />
            </React.StrictMode>
            );

        Esto genera que se busque con ID "root" (el cuals era un div), se crea la raiz. Este div se transforma en un contenedor que tendra toda la aplicacion

## Cómo agregar marcadores en coordenadas específicas

    En base a las coordenadas de las veterinarias que se registren al sistema, van a ser agregadas en el componente "MapaVeterinarias"

    Dentro de la funcion de "MapaVeterinarias" vamos a declarar las coordenadas

    const veteSanRoque = { lat: -34.6080, lng: -58.3720 };
    const veteMichis    = { lat: -34.5950, lng: -58.3970 };

    return (
        <APIProvider apiKey="API_KEY_">
        <Map
            defaultCenter={centroMapa}
            defaultZoom={13}
            mapId="DEMO_MAP_ID"  (Requerido por Google para usar AdvancedMarker)
        >
            <AdvancedMarker position={veteSanRoque} title="Veterinaria San Roque" />
        
            <AdvancedMarker position={veteMichis} title="Clínica Veterinaria Michis" />

        </Map>
        </APIProvider>
    );

## ¿Cómo obtener la geolocalización del navegador?

    const [miUbicacion, setMiUbicacion] = useState({ lat: -34.6037, lng: -58.3816 });
  const [cargando, setCargando] = useState(true);

  // 2. Usamos useEffect para pedir la ubicación apenas se abra la app
  useEffect(() => {
    // Verificamos si el navegador del usuario soporta geolocalización
    if (navigator.geolocation) {
      
      navigator.geolocation.getCurrentPosition(
        (posicion) => {
          // Si el usuario acepta, extraemos la latitud y longitud
          const coordenadasUser = {
            lat: posicion.coords.latitude,
            lng: posicion.coords.longitude,
          };
          
          // Actualizamos el estado con la ubicación real
          setMiUbicacion(coordenadasUser);
          setCargando(false);
        },
        (error) => {
          console.error("Error al obtener la ubicación:", error);
          setCargando(false); // Si hay error, se queda con la de defecto
        }
      );

    } else {
      console.log("Tu navegador no soporta geolocalización.");
      setCargando(false);
    }
  }, []); // Los corchetes vacíos hacen que esto se ejecute una sola vez

  // Si todavía está buscando la señal GPS, mostramos un cartelito
  if (cargando) return <p>Detectando tu ubicación...</p>;

   Para tener en cuenta:
   
    Usar useEffect: Para que el pedido de GPS se dispare una sola vez de forma automática apenas cargue la página.

    Llamar a la API nativa: Usar el comando del navegador navigator.geolocation.getCurrentPosition.
    Manejar los dos caminos (Funciones Flecha =>):

    Si sale bien: Guardar la latitud y longitud en un estado (useState) para centrar el mapa.

    Si sale mal (el usuario rechaza el permiso): Tener una ubicación por defecto (ej. el centro de la ciudad) para que la app no se rompa y muestre algo.
    
git






      


