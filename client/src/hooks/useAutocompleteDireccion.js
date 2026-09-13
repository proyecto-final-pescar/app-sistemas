import { useState, useRef, useEffect, useCallback } from "react";

/**
 * Encapsula el autocompletado de direcciones vía Google Places:
 * debounce de búsqueda, sugerencias, y resolución de lat/lng al elegir
 * una sugerencia. Usado tanto en el registro de veterinaria como en la
 * edición de perfil, para no duplicar esta lógica en los dos lugares.
 */
export function useAutocompleteDireccion(direccionInicial = "", latInicial = null, lngInicial = null) {
  const [direccion, setDireccion] = useState(direccionInicial);
  const [lat, setLat] = useState(latInicial);
  const [lng, setLng] = useState(lngInicial);
  const [suggestions, setSuggestions] = useState([]);
  const [loadingAddress, setLoadingAddress] = useState(false);
  const debounceRef = useRef(null);

  useEffect(() => {
    if (!direccion || lat) {
      setSuggestions([]);
      return;
    }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      if (direccion.length < 4) return;
      setLoadingAddress(true);
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/places/autocomplete?input=${encodeURIComponent(direccion)}`,
        );
        const data = await res.json();
        setSuggestions(data.predictions || []);
      } catch {
        setSuggestions([]);
      } finally {
        setLoadingAddress(false);
      }
    }, 350);
    return () => clearTimeout(debounceRef.current);
  }, [direccion, lat]);

  const handleChangeDireccion = useCallback((valor) => {
    setDireccion(valor);
    setLat(null);
    setLng(null);
  }, []);

  const handleSelectPlace = useCallback(async (place) => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/places/details?place_id=${place.place_id}`,
      );
      const data = await res.json();
      const location = data.result?.geometry?.location;
      setDireccion(place.description);
      setLat(typeof location?.lat === "number" ? location.lat : null);
      setLng(typeof location?.lng === "number" ? location.lng : null);
    } catch {
      setDireccion(place.description);
    } finally {
      setSuggestions([]);
    }
  }, []);

  // Permite sincronizar el hook cuando los datos iniciales llegan de
  // forma asíncrona (ej: MiVeterinaria.jsx, que carga la veterinaria
  // después del primer render).
  const resetDireccion = useCallback((nuevaDireccion, nuevoLat, nuevoLng) => {
    setDireccion(nuevaDireccion || "");
    setLat(nuevoLat ?? null);
    setLng(nuevoLng ?? null);
    setSuggestions([]);
  }, []);

  return {
    direccion,
    lat,
    lng,
    suggestions,
    loadingAddress,
    handleChangeDireccion,
    handleSelectPlace,
    resetDireccion,
  };
}