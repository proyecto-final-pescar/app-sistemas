import { useState } from "react";
import "./FormularioMascota.css";

import Input from "../ui/input/Input";
import Select from "../ui/select/Select";
import Button from "../ui/button/Button";
import {
  crearMascota,
  actualizarMascota,
} from "../../services/MascotaService";
import { subirImagen } from "../../services/uploadService";

function FormularioMascota({
  mascotaInicial = null,
  onCancelar,
  onGuardado,
})  {
  const esEdicion = Boolean(mascotaInicial);

  const [nombre, setNombre] = useState(mascotaInicial?.nombre || "");
  const [especie, setEspecie] = useState(mascotaInicial?.especie || "");
  const [raza, setRaza] = useState(mascotaInicial?.raza || "");
  const [fechaNacimiento, setFechaNacimiento] = useState(
    mascotaInicial?.fechaNacimiento
        ? mascotaInicial.fechaNacimiento.split("T")[0]
        : ""
    );
  const [sexo, setSexo] = useState(mascotaInicial?.sexo || "");
  const [peso, setPeso] = useState(mascotaInicial?.peso || "");
  const [esCastrado, setEsCastrado] = useState(mascotaInicial?.esCastrado ?? false);
  const [foto, setFoto] = useState(null);
const [guardando, setGuardando] = useState(false);





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
async function manejarSubmit(evento) {
    evento.preventDefault();

    if (!validarFormularioMascota()) return;

    setGuardando(true);

    try {
      let urlFoto = mascotaInicial?.foto || "";

      if (foto) {
        urlFoto = await subirImagen(foto);
      }

      const datosMascota = {
        nombre,
        especie,
        raza,
        fechaNacimiento,
        sexo,
        peso,
        esCastrado,   
        foto: urlFoto,
      };

      if (esEdicion) {
        await actualizarMascota(mascotaInicial._id, datosMascota);
      } else {
        await crearMascota(datosMascota);
      }

      onGuardado?.();
    } catch (error) {
      console.error(error);
    } finally {
      setGuardando(false);
    }
  }

    function manejarCambioFoto(evento) {
  const archivo = evento.target.files?.[0];

  if (archivo) {
    setFoto(archivo);
  }
}

  return (
    <form className="formulario-mascota" onSubmit={manejarSubmit}>
      <div className="formulario-header">
        <div className="formulario-icono">🐾</div>

        <h2>{esEdicion ? "Editar Mascota" : "Agregar Mascota"}</h2>

       <p>{esEdicion ? "Modificá los datos de tu mascota" : "Registrá a tu próximo compañero"}</p>
      </div>

<label className="foto-upload">
  {foto || mascotaInicial?.foto ? (
    <div className="foto-preview-wrapper">
      <img
        className="preview-foto"
        src={foto ? URL.createObjectURL(foto) : mascotaInicial.foto}
        alt="Vista previa"
      />
      <div className="foto-edit-overlay">✏️</div>
    </div>
  ) : (
    <>
      <span className="foto-icono">📷</span>
      <span>{esEdicion ? "Cambiar foto" : "Subir foto"}</span>
    </>
  )}
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
      <div>
      <label className="input-label">Castración</label>
      <div className="sexo-opciones">
        <div
          className={`sexo-card ${esCastrado === true ? "sexo-card-selected" : ""}`}
          onClick={() => setEsCastrado(true)}
        >
          Castrad@
        </div>
        <div
          className={`sexo-card ${esCastrado === false ? "sexo-card-selected" : ""}`}
          onClick={() => setEsCastrado(false)}
        >
          No castrad@
        </div>
      </div>
    </div>

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
          disabled={guardando}
          texto={
            guardando
              ? "Guardando..."
              : esEdicion
              ? "Guardar cambios"
              : "Agregar Mascota"
          }
          variante="primario"
          tamaño="mediano"
        />
      </div>
    </form>
  );
}
export default FormularioMascota;