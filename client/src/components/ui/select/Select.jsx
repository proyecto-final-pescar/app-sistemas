import './Select.css';

function Select({
  label,
  opciones = [],
  placeholder = "Seleccioná una opción",
  value,
  onChange,
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

        <select
          className={`select-campo ${value === "" ? "select-placeholder" : ""}`}
          value={value}
          onChange={onChange}
        >
          <option value="" disabled>
            {placeholder}
          </option>

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