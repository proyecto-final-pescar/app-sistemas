import "./Textarea.css";

function Textarea({
  label,
  placeholder,
  value,
  onChange,
  error,
  maxLength,
}) {
  let mensajeError = null;

  if (error) {
    mensajeError = (
      <p className="textarea-error">
        {error}
      </p>
    );
  }

  return (
    <div className="textarea-container">
      <label className="textarea-label">
        {label}
      </label>

      <textarea
        className="textarea-campo"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        maxLength={maxLength}
      />

      {mensajeError}
    </div>
  );
}

export default Textarea;
