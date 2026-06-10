import './Input.css';

function Input({
  label,
  placeholder,
  error
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
        type="text"
        placeholder={placeholder}
      />

      {mensajeError}

    </div>
  );
}

export default Input;

/* 
La funcion se va a llamar de la siguiente forma:

<Input
  label="Nombre"
  placeholder="Ana Gómez"
/> */