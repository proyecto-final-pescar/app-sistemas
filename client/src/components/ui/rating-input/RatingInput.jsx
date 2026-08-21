import { useState } from "react";
import styles from "./RatingInput.module.css";

/*
   Selector de calificación de 1 a 5 estrellas
 
  value: numero (1-5) ya seleccionado, o null si todavia no se califico.
 */
const RatingInput = ({ value = null, onSelect, disabled = false }) => {
  const [hover, setHover] = useState(null);

  const estrellas = [1, 2, 3, 4, 5];
  const activo = hover ?? value ?? 0;

  return (
    <div
      className={styles.contenedor}
      onMouseLeave={() => setHover(null)}
      role="radiogroup"
      aria-label="Calificar veterinaria"
    >
      {estrellas.map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={`${n} estrella${n > 1 ? "s" : ""}`}
          disabled={disabled}
          className={`${styles.estrella} ${n <= activo ? styles.llena : ""}`}
          onMouseEnter={() => setHover(n)}
          onClick={() => onSelect(n)}
        >
          ★
        </button>
      ))}
    </div>
  );
};

export default RatingInput;