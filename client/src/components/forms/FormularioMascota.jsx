import { useState } from "react";
import "./FormularioMascota.css";

import Input from "../ui/input/Input";
import Select from "../ui/select/Select";
import Button from "../ui/button/Button";

function FormularioMascota({ mascotaInicial = null, onCancelar }) {
  const esEdicion = Boolean(mascotaInicial);

  const [nombre, setNombre] = useState(mascotaInicial?.nombre || "");
  const [especie, setEspecie] = useState(mascotaInicial?.especie || "");
  const [raza, setRaza] = useState(mascotaInicial?.raza || "");
  const [fechaNacimiento, setFechaNacimiento] = useState(
    mascotaInicial?.fechaNacimiento || ""
  );
  const [sexo, setSexo] = useState(mascotaInicial?.sexo || "");
  const [peso, setPeso] = useState(mascotaInicial?.peso || "");
  const [foto, setFoto] = useState(null);

  const [errores, setErrores] = useState({});

  function validarFormularioMascota() {
    const nuevosErrores = {};

    if (nombre.trim() === "") {
      nuevosErrores.nombre = "El campo nombre es obligatorio";
    }

    if (especie.trim() === "") {
      nuevosErrores.especie = "Debe seleccionar una especie";
    }

    if (sexo.trim() === "") {
      nuevosErrores.sexo = "Debe seleccionar un sexo";
    }
    if (fechaNacimiento.trim() === "")
    {
      nuevosErrores.fechaNacimiento = "Debe seleccionar una fecha aproximada";
    }
    if (peso.trim() === "")
    {
      nuevosErrores.peso = "El campo peso es obligatorio"
    }

    setErrores(nuevosErrores);

    return Object.keys(nuevosErrores).length === 0;
  }

  function manejarSubmit(evento) {
    evento.preventDefault();

    const formularioValido = validarFormularioMascota();

    if (formularioValido) {
      const datosMascota = {
        nombre,
        especie,
        raza,
        fechaNacimiento,
        sexo,
        peso,
        foto,
      };

      console.log(datosMascota);
    }
  }

  function manejarCambioFoto(evento) {
    const archivo = evento.target.files[0];
    setFoto(archivo);
  }

  return (
    <form className="formulario-mascota" onSubmit={manejarSubmit}>
      <div className="formulario-header">
        <div className="formulario-icono">🐾</div>

        <h2>{esEdicion ? "Editar Mascota" : "Agregar Mascota"}</h2>

        <p>Registrá a tu próximo compañero</p>
      </div>

      <label className="foto-upload">
        <span className="foto-icono">📷</span>
        <span>Subir foto</span>

        <input type="file" accept="image/*" onChange={manejarCambioFoto} />
      </label>

      <Input
        label="Nombre"
        placeholder="Ej: Luna"
        value={nombre}
        onChange={(evento) => setNombre(evento.target.value)}
        error={errores.nombre}
      />

      <Select
        label="Especie"
        placeholder="Seleccioná una especie"
        opciones={["Perro", "Gato", "Otro"]}
        value={especie}
        onChange={(evento) => setEspecie(evento.target.value)}
        error={errores.especie}
      />

      <Input
        label="Raza"
        placeholder="Ej: Labrador Retriever"
        value={raza}
        onChange={(evento) => setRaza(evento.target.value)}
        error={errores.raza}
      />

      <Input
        label="Fecha de Nacimiento (aproximado)"
        type="date"
        value={fechaNacimiento}
        onChange={(evento) => setFechaNacimiento(evento.target.value)}
        error={errores.fechaNacimiento}
      />

      <div>
        <label className="input-label">Sexo</label>

        <div className="sexo-opciones">
          <div
            className={`sexo-card ${
              sexo === "Macho" ? "sexo-card-selected" : ""
            }`}
            onClick={() => setSexo("Macho")}
          >
            Macho
          </div>

          <div
            className={`sexo-card ${
              sexo === "Hembra" ? "sexo-card-selected" : ""
            }`}
            onClick={() => setSexo("Hembra")}
          >
            Hembra
          </div>
        </div>

        {errores.sexo && <p className="input-error">{errores.sexo}</p>}
      </div>

      <Input
        label="Peso"
        placeholder="0.0 kg"
        value={peso}
        type="number"
        onChange={(evento) => setPeso(evento.target.value)}
        error={errores.peso}
      />

      <div className="formulario-acciones">
        <Button
          type="button"
          texto="Cancelar"
          variante="secundario"
          tamaño="mediano"
          onClick={onCancelar}
        />

        <Button
          type="submit"
          texto={esEdicion ? "Guardar cambios" : "Agregar Mascota"}
          variante="primario"
          tamaño="mediano"
        />
      </div>
    </form>
  );
}

export default FormularioMascota;