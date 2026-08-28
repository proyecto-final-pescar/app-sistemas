import { useEffect, useState } from "react";
import { obtenerCategoriasServicio } from "../services/constantesService";

// Hook para consumir las categorías de servicio desde el backend.
// Se usa en cualquier select de categoria 
export function useCategoriasServicio() {
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let activo = true;

    const cargar = async () => {
      try {
        const data = await obtenerCategoriasServicio();
        if (activo) setCategorias(data);
      } catch {
        if (activo) {
          setError("No se pudieron cargar las categorías de servicio.");
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

  return { categorias, loading, error };
}