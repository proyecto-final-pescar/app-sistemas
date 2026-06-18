import './Select.css';

function Select({
  label,
  opciones = [],
  error
}) {
  let mensajeError = null;

  if (error) {
    mensajeError = (
      <p className="select-error">
        {error}
      </p>
    );
  }

  return (
    <div className="select-container">

      <label className="select-label">
        {label}
      </label>

      <select className="select-campo">
        {opciones.map((opcion) => (
          <option key={opcion} value={opcion}>
            {opcion}
          </option>
        ))}
      </select>

      {mensajeError}

    </div>
  );
}

export default Select;

/*
La funcion se va a llamar de la siguiente forma:

<Select
  label="Especie"
  opciones={["Perro", "Gato"]}
/>

<Select
  label="Sexo"
  opciones={["Macho", "Hembra"]}
/> */