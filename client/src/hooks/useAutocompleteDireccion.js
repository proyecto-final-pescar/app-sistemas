import { useState, useRef, useEffect, useCallback } from "react";


export function useAutocompleteDireccion(direccionInicial = "", latInicial = null, lngInicial = null) {
  const [direccion, setDireccion] = useState(direccionInicial);
  const [lat, setLat] = useState(latInicial);
  const [lng, setLng] = useState(lngInicial);
  const [suggestions, setSuggestions] = useState([]);
  const [loadingAddress, setLoadingAddress] = useState(false);
  const [addressComponents, setAddressComponents] = useState([]);
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
    setAddressComponents([]);
  }, []);

const handleSelectPlace = useCallback(async (place) => {
  try {
    const res = await fetch(
      `${import.meta.env.VITE_API_URL}/places/details?place_id=${encodeURIComponent(place.place_id)}`,
    );
    const data = await res.json();

    if (!res.ok) {
      console.error("Error en /places/details:", data);
      throw new Error(data.detalle || data.message || "details falló");
    }

    const location = data.result?.geometry?.location;
    setDireccion(place.description);
    setLat(typeof location?.lat === "number" ? location.lat : null);
    setLng(typeof location?.lng === "number" ? location.lng : null);
    setAddressComponents(data.result?.address_components || []);
  } catch (err) {
    console.error("handleSelectPlace:", err);
    // Se conserva lo que el usuario había escrito; lat/lng siguen en null
    // y validateStep1 le va a pedir que vuelva a elegir de la lista.
    setAddressComponents([]);
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
    setAddressComponents([]);
  }, []);

  return {
    direccion,
    lat,
    lng,
    suggestions,
    loadingAddress,
    addressComponents,
    handleChangeDireccion,
    handleSelectPlace,
    resetDireccion,
  };
}