import { useState } from "react";
import "./FormularioMascota.css"; // reutilizado, mismo patrón que FormularioPublicacion

import Input from "../ui/input/Input";
import Textarea from "../ui/textarea/Textarea";
import Button from "../ui/button/Button";
import { actualizarFichaMedica } from "../../services/FichaMedicaService";

function FormularioFichaMedica({ mascotaId, fichaInicial = null, onCancelar, onGuardado }) {
  const [fechaNacimiento, setFechaNacimiento] = useState(
    fichaInicial?.fechaNacimiento ? fichaInicial.fechaNacimiento.split("T")[0] : ""
  );
  const [colorPelaje, setColorPelaje] = useState(fichaInicial?.colorPelaje || "");
  const [microchip, setMicrochip] = useState(fichaInicial?.microchip || "");
  const [enfermedadesCronicas, setEnfermedadesCronicas] = useState(
    fichaInicial?.enfermedadesCronicas || ""
  );
  const [cirugiasPrevias, setCirugiasPrevias] = useState(fichaInicial?.cirugiasPrevias || "");
  const [medicamentosHabituales, setMedicamentosHabituales] = useState(
    fichaInicial?.medicamentosHabituales || ""
  );

  const [guardando, setGuardando] = useState(false);
  const [errores, setErrores] = useState({});

  function validarFormulario() {
    const nuevosErrores = {};

    if (microchip.trim() !== "" && microchip.trim().length < 9) {
      nuevosErrores.microchip = "El microchip parece incompleto";
    }

    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  }

  async function manejarSubmit(evento) {
    evento.preventDefault();

    if (!validarFormulario()) return;

    setGuardando(true);

    try {
      const datosFicha = {
        fechaNacimiento,
        colorPelaje,
        microchip,
        enfermedadesCronicas,
        cirugiasPrevias,
        medicamentosHabituales,
      };

      await actualizarFichaMedica(mascotaId, datosFicha);

      onGuardado?.();
    } catch (error) {
      console.error(error);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <form className="formulario-mascota" onSubmit={manejarSubmit}>
      <div className="formulario-header">
        <div className="formulario-icono">🩺</div>
        <h2>Editar Ficha Médica</h2>
        <p>Modificá los datos clínicos de tu mascota</p>
      </div>

      <Input
        label="Fecha de nacimiento"
        type="date"
        value={fechaNacimiento}
        onChange={(evento) => setFechaNacimiento(evento.target.value)}
        error={errores.fechaNacimiento}
      />

      <Input
        label="Color / Pelaje"
        placeholder="Ej: Blanco y negro"
        value={colorPelaje}
        onChange={(evento) => setColorPelaje(evento.target.value)}
        error={errores.colorPelaje}
      />

      <Input
        label="Microchip"
        placeholder="Ej: 985112004567890"
        value={microchip}
        onChange={(evento) => setMicrochip(evento.target.value)}
        error={errores.microchip}
      />

      <Textarea
        label="Enfermedades crónicas"
        placeholder="Ninguna registrada"
        value={enfermedadesCronicas}
        onChange={(evento) => setEnfermedadesCronicas(evento.target.value)}
        error={errores.enfermedadesCronicas}
      />

      <Textarea
        label="Cirugías previas"
        placeholder="Ninguna registrada"
        value={cirugiasPrevias}
        onChange={(evento) => setCirugiasPrevias(evento.target.value)}
        error={errores.cirugiasPrevias}
      />

      <Textarea
        label="Medicamentos habituales"
        placeholder="Ninguno"
        value={medicamentosHabituales}
        onChange={(evento) => setMedicamentosHabituales(evento.target.value)}
        error={errores.medicamentosHabituales}
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
          disabled={guardando}
          texto={guardando ? "Guardando..." : "Guardar cambios"}
          variante="violeta"
          tamaño="mediano"
        />
      </div>
    </form>
  );
}

export default FormularioFichaMedica;