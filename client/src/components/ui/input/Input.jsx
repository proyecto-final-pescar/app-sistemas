import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import './Input.css';

function Input({
  label,
  placeholder,
  type,
  error,
  value,
  onChange,
  nombre,
  readOnly,
  disabled,
}) {
  const [mostrar, setMostrar] = useState(false);
  const esPassword = type === "password";

  let mensajeError = null;

  if (error) {
    mensajeError = (
      <p className="input-error">
        {error}
      </p>
    );
  }

  return (
    <div className="input-container">

      <label className="input-label">
        {label}
      </label>

      <div className="input-password-wrap">
        <input
          className={`input-campo ${esPassword ? "input-campo-password" : ""}`}
          placeholder={placeholder}
          type={esPassword && mostrar ? "text" : type}
          value={value}
          onChange={onChange}
          readOnly={readOnly}
          disabled={disabled}
        />

        {esPassword && (
          <button
            type="button"
            className="input-ojito"
            onClick={() => setMostrar((prev) => !prev)}
            aria-label={mostrar ? "Ocultar contraseña" : "Mostrar contraseña"}
          >
            {mostrar ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        )}
      </div>

      {mensajeError}

    </div>
  );
}

export default Input;