import './input.css';

function Input({
  label,
  placeholder,
  type,
  error,
  value,
  onChange,
  nombre
}) {

  let mensajeError = null;

  if (error) {
    mensajeError = (
      <p className="input-error">
        {error}
      </p>
    );
  }

  console.log(nombre)

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