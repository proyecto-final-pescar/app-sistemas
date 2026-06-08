import './Textarea.css';

function Textarea({
  label,
  placeholder,
  error
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
      />

      {mensajeError}

    </div>
  );
}

export default Textarea;

/* <Textarea
  label="Motivo del rechazo (se enviará por email)"
  placeholder="Ingrese el motivo del rechazo"
/> */
