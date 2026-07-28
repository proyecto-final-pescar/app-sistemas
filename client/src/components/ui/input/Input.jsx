import './input.css';

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

      <input
        className="input-campo"
        placeholder={placeholder}
        type={type}
        value={value}
        onChange={onChange}
        readOnly={readOnly}
        disabled={disabled}
      />

      {mensajeError}

    </div>
  );
}

export default Input;