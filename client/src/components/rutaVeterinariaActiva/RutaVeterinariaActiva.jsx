import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { obtenerMiVeterinaria } from "../../services/veterinariaService";

// Último estado conocido, atado al token para no mezclar sesiones
// Al volver a montarse el guard se usa al instante y se revalida en segundo plano
let estadoCache = null; // { token, estado }

const calcularEstado = (data) => {
  const e = data?.estado;
  if (e === "ACT") return "activa";
  if (e === "SUS") return "suspendida";
  return "pendiente";
};

const Cargando = () => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "60vh",
      fontSize: "1rem",
      color: "#6b7280",
    }}
  >
    Cargando...
  </div>
);


export default function RutaVeterinariaActiva({ children }) {
  const token = localStorage.getItem("token");
  const cacheValida = estadoCache?.token === token ? estadoCache.estado : null;

  // cargando | sin-perfil | pendiente | suspendida | activa
  const [estado, setEstado] = useState(cacheValida ?? "cargando");

  useEffect(() => {
    let cancelado = false;

    obtenerMiVeterinaria()
      .then((data) => {
        const nuevo = calcularEstado(data);
        estadoCache = { token, estado: nuevo };
        if (!cancelado) setEstado(nuevo);
      })
      .catch(() => {
        if (cancelado) return;
        // Si ya había un estado conocido, un error de red puntual no debe sacarte de la pantalla
        if (estadoCache?.token === token) return;
        setEstado("sin-perfil");
      });

    return () => {
      cancelado = true;
    };
  }, [token]);

  if (estado === "cargando") return <Cargando />;
  if (estado === "sin-perfil") return <Navigate to="/registro-veterinaria" replace />;
  if (estado === "pendiente" || estado === "suspendida")
    return <Navigate to="/veterinaria-pendiente" replace />;

  return children ?? <Outlet />;
}