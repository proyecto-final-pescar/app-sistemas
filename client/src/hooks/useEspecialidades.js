import { useEffect, useState } from "react";
import { obtenerEspecialidades } from "../services/constantesService";

export function useEspecialidades() {
  const [especialidades, setEspecialidades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let activo = true;

    const cargar = async () => {
      try {
        const data = await obtenerEspecialidades();
        if (activo) setEspecialidades(data);
      } catch {
        if (activo) {
          setError("No se pudieron cargar las especialidades.");
        }
      } finally {
        if (activo) setLoading(false);
      }
    };

    cargar();

    return () => {
      activo = false;
    };
  }, []);

  return { especialidades, loading, error };
}