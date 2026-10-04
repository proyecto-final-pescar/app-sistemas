import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown } from "lucide-react";
import "./Select.css";

const MARGEN_VIEWPORT = 8; 
const ALTURA_MAXIMA_MENU = 280; 

function Select({
  label,
  opciones = [],
  placeholder = "Seleccioná una opción",
  value,
  onChange,
  error,
}) {
  const [abierto, setAbierto] = useState(false);
  const [posicionMenu, setPosicionMenu] = useState(null);
  const contenedorRef = useRef(null);
  const botonRef = useRef(null);
  const menuRef = useRef(null);

  const normalizarOpcion = (opcion) =>
    typeof opcion === "string" ? { value: opcion, label: opcion } : opcion;

  const opcionSeleccionada = opciones
    .map(normalizarOpcion)
    .find((opcion) => String(opcion.value) === String(value));

  
  const actualizarPosicion = () => {
    if (!botonRef.current) return;
    const rect = botonRef.current.getBoundingClientRect();

    const espacioAbajo = window.innerHeight - rect.bottom - MARGEN_VIEWPORT;
    const espacioArriba = rect.top - MARGEN_VIEWPORT;

    const entraAbajo = espacioAbajo >= ALTURA_MAXIMA_MENU;
    const abrirHaciaArriba = !entraAbajo && espacioArriba > espacioAbajo;

    const alturaDisponible = abrirHaciaArriba ? espacioArriba : espacioAbajo;
    const alturaMenu = Math.max(0, Math.min(ALTURA_MAXIMA_MENU, alturaDisponible));

   
    setPosicionMenu({
      left: rect.left,
      width: rect.width,
      maxHeight: alturaMenu,
      ...(abrirHaciaArriba
        ? { bottom: window.innerHeight - rect.top + 4, top: "auto" }
        : { top: rect.bottom + 4, bottom: "auto" }),
    });
  };

  useLayoutEffect(() => {
    if (!abierto) return;
    actualizarPosicion();
  }, [abierto]);

  useEffect(() => {
    if (!abierto) return undefined;

    const cerrarSiEsAfuera = (event) => {
      const fueraDelBoton = contenedorRef.current && !contenedorRef.current.contains(event.target);
      const fueraDelMenu = menuRef.current && !menuRef.current.contains(event.target);
      if (fueraDelBoton && fueraDelMenu) {
        setAbierto(false);
      }
    };

    const cerrarConEscape = (event) => {
      if (event.key === "Escape") setAbierto(false);
    };

    // El scroll dentro del propio menú (listas largas) no debe reposicionarlo.
    const reposicionarSiNoEsElMenu = (event) => {
      if (menuRef.current && menuRef.current.contains(event.target)) return;
      actualizarPosicion();
    };

    document.addEventListener("mousedown", cerrarSiEsAfuera);
    document.addEventListener("keydown", cerrarConEscape);
 
    window.addEventListener("scroll", reposicionarSiNoEsElMenu, true);
    window.addEventListener("resize", actualizarPosicion);
    return () => {
      document.removeEventListener("mousedown", cerrarSiEsAfuera);
      document.removeEventListener("keydown", cerrarConEscape);
      window.removeEventListener("scroll", reposicionarSiNoEsElMenu, true);
      window.removeEventListener("resize", actualizarPosicion);
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
          ref={botonRef}
          type="button"
          className={`select-campo ${!opcionSeleccionada ? "select-placeholder" : ""}`}
          onClick={() => setAbierto((valorActual) => !valorActual)}
          aria-haspopup="listbox"
          aria-expanded={abierto}
        >
          <span className="select-valor">{opcionSeleccionada?.label || placeholder}</span>
          <ChevronDown className={`select-chevron ${abierto ? "select-chevron-abierto" : ""}`} size={17} />
        </button>

        {abierto &&
          posicionMenu &&
          createPortal(
            <ul
              ref={menuRef}
              className="select-menu select-menu-portal"
              role="listbox"
              style={{
                position: "fixed",
                top: posicionMenu.top,
                bottom: posicionMenu.bottom,
                left: posicionMenu.left,
                width: posicionMenu.width,
                maxHeight: posicionMenu.maxHeight,
              }}
            >
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
            </ul>,
            document.body
          )}
      </div>

      {error && <p className="select-error">{error}</p>}
    </div>
  );
}

export default Select;