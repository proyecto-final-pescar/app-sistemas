import { useEffect, useRef, useState } from "react";
import { MoreVertical } from "lucide-react";
import "./MenuAcciones.css";

/**
 * Menú contextual reutilizable, tipo "⋮".
 *
 * Uso:
 *   <MenuAcciones
 *     opciones={[
 *       { id: "editar", label: "Editar", icon: Pencil, onClick: () => ... },
 *       { id: "eliminar", label: "Eliminar", icon: Trash2, variante: "peligro", onClick: () => ..., disabled: eliminando },
 *     ]}
 *   />
 */
function MenuAcciones({ opciones, ariaLabel = "Más acciones" }) {
  const [abierto, setAbierto] = useState(false);
  const contenedorRef = useRef(null);

  useEffect(() => {
    if (!abierto) return undefined;

    const manejarClickAfuera = (evento) => {
      if (contenedorRef.current && !contenedorRef.current.contains(evento.target)) {
        setAbierto(false);
      }
    };

    const manejarEscape = (evento) => {
      if (evento.key === "Escape") setAbierto(false);
    };

    document.addEventListener("mousedown", manejarClickAfuera);
    document.addEventListener("keydown", manejarEscape);

    return () => {
      document.removeEventListener("mousedown", manejarClickAfuera);
      document.removeEventListener("keydown", manejarEscape);
    };
  }, [abierto]);

  function manejarClickOpcion(opcion) {
    if (opcion.disabled) return;
    setAbierto(false);
    opcion.onClick?.();
  }

  return (
    <div className="menuAcciones" ref={contenedorRef}>
      <button
        type="button"
        className={`menuAcciones__trigger ${abierto ? "menuAcciones__trigger--activo" : ""}`}
        onClick={() => setAbierto((valor) => !valor)}
        aria-haspopup="menu"
        aria-expanded={abierto}
        aria-label={ariaLabel}
      >
        <MoreVertical size={18} />
      </button>

      {abierto && (
        <div className="menuAcciones__panel" role="menu">
          {opciones.map((opcion) => (
            <button
              key={opcion.id}
              type="button"
              role="menuitem"
              className={`menuAcciones__item ${opcion.variante === "peligro" ? "menuAcciones__item--peligro" : ""
                }`}
              onClick={() => manejarClickOpcion(opcion)}
              disabled={opcion.disabled}
            >
              {opcion.icon && <opcion.icon size={16} />}
              <span>{opcion.disabled && opcion.labelDisabled ? opcion.labelDisabled : opcion.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default MenuAcciones;