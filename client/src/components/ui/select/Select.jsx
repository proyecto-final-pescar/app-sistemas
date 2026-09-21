import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import "./Select.css";

function Select({
  label,
  opciones = [],
  placeholder = "Seleccioná una opción",
  value,
  onChange,
  error,
}) {
  const [abierto, setAbierto] = useState(false);
  const contenedorRef = useRef(null);

  const normalizarOpcion = (opcion) =>
    typeof opcion === "string" ? { value: opcion, label: opcion } : opcion;

  const opcionSeleccionada = opciones
    .map(normalizarOpcion)
    .find((opcion) => String(opcion.value) === String(value));

  useEffect(() => {
    if (!abierto) return undefined;

    const cerrarSiEsAfuera = (event) => {
      if (contenedorRef.current && !contenedorRef.current.contains(event.target)) {
        setAbierto(false);
      }
    };

    const cerrarConEscape = (event) => {
      if (event.key === "Escape") setAbierto(false);
    };

    document.addEventListener("mousedown", cerrarSiEsAfuera);
    document.addEventListener("keydown", cerrarConEscape);
    return () => {
      document.removeEventListener("mousedown", cerrarSiEsAfuera);
      document.removeEventListener("keydown", cerrarConEscape);
    };
  }, [abierto]);

  const elegirOpcion = (opcionValue) => {
   
    onChange({ target: { value: opcionValue } });
    setAbierto(false);
  };

   return (
    <div className="select-container">
      {label && <label className="select-label">{label}</label>}

      <div className="select-wrapper" ref={contenedorRef}>
        <button
          type="button"
          className={`select-campo ${!opcionSeleccionada ? "select-placeholder" : ""}`}
          onClick={() => setAbierto((valorActual) => !valorActual)}
          aria-haspopup="listbox"
          aria-expanded={abierto}
        >
          <span className="select-valor">{opcionSeleccionada?.label || placeholder}</span>
          <ChevronDown className={`select-chevron ${abierto ? "select-chevron-abierto" : ""}`} size={17} />
        </button>

        {abierto && (
          <ul className="select-menu" role="listbox">
            {opciones.map((opcionCruda) => {
              const opcion = normalizarOpcion(opcionCruda);
              const activa = String(opcion.value) === String(value);

              return (
                <li key={opcion.value} role="option" aria-selected={activa}>
                  <button
                    type="button"
                    className={`select-opcion ${activa ? "select-opcion-activa" : ""}`}
                    onClick={() => elegirOpcion(opcion.value)}
                  >
                    {opcion.label}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {error && <p className="select-error">{error}</p>}
    </div>
  );
}

export default Select;