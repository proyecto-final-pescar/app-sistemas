import { useState } from "react";
import "../forms/FormularioMascota/FormularioMascota.css";
import "../ui/input/input.css";

import Input from "../ui/input/Input";
import Select from "../ui/select/Select";
import Button from "../ui/button/Button";
import { crearPublicacion } from "../../services/publicacionService";
import { subirImagen } from "../../services/uploadService";

const getFechaLocalInput = () => {
  const fecha = new Date();
  fecha.setMinutes(fecha.getMinutes() - fecha.getTimezoneOffset());
  return fecha.toISOString().slice(0, 10);
};

const barriosCABA = [
  "Agronomía", "Almagro", "Balvanera", "Barracas", "Belgrano",
  "Boedo", "Caballito", "Chacarita", "Coghlan", "Colegiales",
  "Constitución", "Flores", "Floresta", "La Boca", "La Paternal",
  "Liniers", "Mataderos", "Monserrat", "Monte Castro", "Nueva Pompeya",
  "Núñez", "Palermo", "Parque Avellaneda", "Parque Chacabuco",
  "Parque Chas", "Parque Patricios", "Puerto Madero", "Recoleta",
  "Retiro", "Saavedra", "San Cristóbal", "San Nicolás", "San Telmo",
  "Vélez Sarsfield", "Versalles", "Villa Crespo", "Villa del Parque",
  "Villa Devoto", "Villa General Mitre", "Villa Lugano", "Villa Luro",
  "Villa Ortúzar", "Villa Pueyrredón", "Villa Real", "Villa Riachuelo",
  "Villa Santa Rita", "Villa Soldati", "Villa Urquiza",
];

function FormularioPublicacion({ onCancelar, onGuardado }) {
  const fechaMaxima = getFechaLocalInput();

  const [foto, setFoto] = useState(null);
  const [nombre, setNombre] = useState("");
  const [zona, setZona] = useState("");
  const [fecha, setFecha] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [contacto, setContacto] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [errores, setErrores] = useState({});
  const [errorGeneral, setErrorGeneral] = useState("");

  function validarFormularioPublicacion() {
    const nuevosErrores = {};

    if (!foto) {
      nuevosErrores.foto = "Subí una foto de la mascota";
    }

    if (zona.trim() === "") {
      nuevosErrores.zona = "Seleccioná el barrio o zona";
    }

    if (fecha.trim() === "") {
      nuevosErrores.fecha = "Indicá la fecha en la que se perdió";
    } else if (fecha > fechaMaxima) {
      nuevosErrores.fecha = "La fecha no puede ser futura";
    }

    if (descripcion.trim().length < 12) {
      nuevosErrores.descripcion = "Sumá una descripción un poco más completa";
    }

    if (contacto.trim() === "") {
      nuevosErrores.contacto = "Agregá un contacto";
    }

    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  }

  async function manejarSubmit(evento) {
    evento.preventDefault();

    if (!validarFormularioPublicacion()) return;

    setGuardando(true);
    setErrorGeneral("");

    try {
      const urlFoto = await subirImagen(foto);

      await crearPublicacion({
        foto: urlFoto,
        nombre: nombre.trim() || "Mascota sin nombre",
        zona: zona.trim(),
        fecha,
        descripcion: descripcion.trim(),
        contacto: contacto.trim(),
      });

      onGuardado?.();
    } catch (error) {
      console.error(error);
      setErrorGeneral("No se pudo crear la publicación. Intentá de nuevo.");
    } finally {
      setGuardando(false);
    }
  }

  function manejarCambioFoto(evento) {
    const archivo = evento.target.files?.[0];

    if (archivo) {
      setFoto(archivo);
      setErrores((prev) => ({ ...prev, foto: "" }));
    }
  }

  return (
    <form className="formulario-mascota" onSubmit={manejarSubmit}>
      <div className="formulario-header">
        <div className="formulario-icono">📍</div>
        <h2>Nueva Publicación</h2>
        <p>Ayudemos a que vuelva a casa</p>
      </div>

      <label className="foto-upload">
        {foto ? (
          <div className="foto-preview-wrapper">
            <img
              className="preview-foto"
              src={URL.createObjectURL(foto)}
              alt="Vista previa"
            />
            <div className="foto-edit-overlay">✏️</div>
          </div>
        ) : (
          <>
            <span className="foto-icono">📷</span>
            <span>Subir foto de la mascota</span>
          </>
        )}
        <input type="file" accept="image/*" onChange={manejarCambioFoto} />
      </label>
      {errores.foto && <p className="input-error">{errores.foto}</p>}

      <Input
        label="Nombre (Opcional)"
        placeholder="Ej: Tobi"
        value={nombre}
        onChange={(evento) => setNombre(evento.target.value)}
      />

      <Select
        label="Zona / Barrio"
        placeholder="Seleccioná una zona"
        opciones={barriosCABA}
        value={zona}
        onChange={(evento) => setZona(evento.target.value)}
        error={errores.zona}
      />

      <Input
        label="Fecha en la que se perdió"
        type="date"
        value={fecha}
        onChange={(evento) => setFecha(evento.target.value)}
        error={errores.fecha}
      />

      <div className="input-container">
        <label className="input-label">Descripción Física</label>
        <textarea
          className="input-campo"
          placeholder="Color, tamaño, si llevaba collar, alguna seña particular..."
          rows={3}
          value={descripcion}
          onChange={(evento) => setDescripcion(evento.target.value)}
        />
        {errores.descripcion && <p className="input-error">{errores.descripcion}</p>}
      </div>

      <Input
        label="Contacto"
        placeholder="Teléfono o email"
        value={contacto}
        onChange={(evento) => setContacto(evento.target.value)}
        error={errores.contacto}
      />

      {errorGeneral && <p className="input-error">{errorGeneral}</p>}

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
          texto={guardando ? "Publicando..." : "Publicar"}
          variante="primario"
          tamaño="mediano"
        />
      </div>
    </form>
  );
}

export default FormularioPublicacion;