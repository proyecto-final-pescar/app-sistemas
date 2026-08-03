import { useState } from "react";
import Select from "../../ui/select/Select";
import Textarea from "../../ui/textarea/Textarea";
import { crearReporte } from "../../../services/reporteService";
import "./FormularioReporte.css";

const MOTIVOS_REPORTE = [
  {
    value: "contenido_inapropiado",
    label: "Contenido inapropiado",
  },
  {
    value: "informacion_falsa",
    label: "Información falsa",
  },
  {
    value: "spam",
    label: "Spam",
  },
  {
    value: "animal_ya_encontrado",
    label: "Animal ya encontrado",
  },
  {
    value: "publicacion_duplicada",
    label: "Publicación duplicada",
  },
  {
    value: "otro",
    label: "Otro",
  },
];

function FormularioReporte({
  publicacion,
  onCancelar,
  onReportado,
  onYaReportado,
}) {
  const [motivo, setMotivo] = useState("");
  const [descripcion, setDescripcion] = useState("");

  const [errorMotivo, setErrorMotivo] = useState("");
  const [errorDescripcion, setErrorDescripcion] = useState("");
  const [errorEnvio, setErrorEnvio] = useState("");

  const [enviando, setEnviando] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    let formularioValido = true;

    setErrorMotivo("");
    setErrorDescripcion("");
    setErrorEnvio("");

    if (!motivo) {
      setErrorMotivo("Seleccioná un motivo para continuar.");
      formularioValido = false;
    }

    if (motivo === "otro" && !descripcion.trim()) {
      setErrorDescripcion(
        'La descripción es requerida cuando seleccionás "Otro".'
      );
      formularioValido = false;
    }

    if (!formularioValido) {
      return;
    }

    try {
      setEnviando(true);

      await crearReporte({
        publicacionId: publicacion._id,
        motivo,
        descripcion: descripcion.trim(),
      });

      onReportado(publicacion._id);
    } catch (error) {
      console.error("Error al crear el reporte:", error);

      const mensaje =
        error?.response?.data?.message ||
        "No pudimos enviar el reporte. Intentá nuevamente.";

     
     
      if (error?.response?.status === 400 && mensaje === "Ya reportaste esta publicación") {
        onYaReportado?.(publicacion);
      }

      setErrorEnvio(mensaje);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <form
      className="formulario-reporte"
      onSubmit={handleSubmit}
    >
      <div className="formulario-reporte-header">
        <h2>Reportar publicación</h2>

        <p>
          ¿Querés reportar la publicación de{" "}
          <strong>
            “{publicacion?.nombre || "esta mascota"}”
          </strong>
          ? Un administrador la va a revisar para ver si infringe las normas
          de la comunidad.
        </p>
      </div>

      <Select
        label="Motivo"
        opciones={MOTIVOS_REPORTE}
        placeholder="Seleccioná un motivo"
        value={motivo}
        onChange={(event) => {
          setMotivo(event.target.value);
          setErrorMotivo("");
          setErrorEnvio("");
        }}
        error={errorMotivo}
      />

      <div className="descripcion-reporte">
        <Textarea
          label="Descripción"
          placeholder="Contanos más detalles sobre el motivo del reporte (opcional)"
          value={descripcion}
          onChange={(event) => {
            setDescripcion(event.target.value);
            setErrorDescripcion("");
            setErrorEnvio("");
          }}
          maxLength={300}
          error={errorDescripcion}
        />

        <span className="contador-caracteres">
          {descripcion.length}/300
        </span>
      </div>

      {errorEnvio && (
        <p className="error-envio-reporte" role="alert">
          {errorEnvio}
        </p>
      )}

      <div className="acciones-reporte">
        <button
          type="button"
          className="boton-cancelar-reporte"
          onClick={onCancelar}
          disabled={enviando}
        >
          Cancelar
        </button>

        <button
          type="submit"
          className="boton-enviar-reporte"
          disabled={!motivo || enviando}
        >
          {enviando ? "Reportando..." : "Reportar"}
        </button>
      </div>
    </form>
  );
}

export default FormularioReporte;
