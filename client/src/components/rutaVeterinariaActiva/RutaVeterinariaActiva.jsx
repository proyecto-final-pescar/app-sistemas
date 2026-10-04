
import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { obtenerMiVeterinaria } from "../../services/veterinariaService";

export default function RutaVeterinariaActiva({ children }) {
  const [estado, setEstado] = useState("cargando"); // cargando | sin-perfil | pendiente | suspendida | activa

  useEffect(() => {
    obtenerMiVeterinaria()
      .then((data) => {
        const e = data?.estado;
        if (e === "ACT") setEstado("activa");
        else if (e === "SUS") setEstado("suspendida");
        else setEstado("pendiente");
      })
      .catch(() => setEstado("sin-perfil"));
  }, []);

  if (estado === "cargando") return null; 
  if (estado === "sin-perfil") return <Navigate to="/registro-veterinaria" replace />;
  if (estado === "pendiente" || estado === "suspendida")
    return <Navigate to="/veterinaria-pendiente" replace />;

  return children;
}