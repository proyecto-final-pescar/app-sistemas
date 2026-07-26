import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import Input from "../../../components/ui/input/Input";
import Button from "../../../components/ui/button/Button";
import Sidebar from "../../../components/layout/Sidebar";
import TopBar from "../../../components/layout/TopBar";

import "./RegistrarConsulta.css";
const API_URL = `${
  import.meta.env.VITE_API_URL || "http://localhost:3000"
}/api`;

const estadoInicialFormulario = {
  nombreDueno: "",
  email: "",
  mascotaId: "",
  profesionalId: "",

  nombreMascota: "",
  especie: "",
  raza: "",
  edad: "",
  sexo: "",
  peso: "",

  fecha: "",
  hora: "",
  categoriaServicio: "",
  motivoConsulta: "",
  anotaciones: "",
  monto: "",
};

function convertirFechaParaInput(fecha) {
  if (!fecha) return "";

  const valorFecha = String(fecha);
  if (/^\d{4}-\d{2}-\d{2}$/.test(valorFecha)) {
    return valorFecha;
  }

  const fechaConvertida = new Date(valorFecha);

  if (Number.isNaN(fechaConvertida.getTime())) {
    return valorFecha.slice(0, 10);
  }

  return fechaConvertida.toISOString().slice(0, 10);
}

function obtenerId(valor) {
  if (!valor) return "";

  if (typeof valor === "string") {
    return valor;
  }

  return valor._id || valor.id || "";
}

function obtenerNombrePersona(persona) {
  if (!persona || typeof persona !== "object") {
    return "";
  }

  return (
    persona.nombreCompleto ||
    persona.nombre ||
    persona.apellido ||
    persona.email ||
    ""
  );
}

function RegistrarConsulta() {
  const { turnoId } = useParams();

  const [pasoActual, setPasoActual] = useState(1);

  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingTurno, setIsLoadingTurno] = useState(true);

  const [errorApi, setErrorApi] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [nombreProfesional, setNombreProfesional] = useState("");

  const [form, setForm] = useState(estadoInicialFormulario);
  const [errores, setErrores] = useState({});

  useEffect(() => {
    const obtenerTurno = async () => {
      if (!turnoId) {
        setErrorApi(
          "No se recibió el identificador del turno."
        );
        setIsLoadingTurno(false);
        return;
      }

      const token = localStorage.getItem("token");

      if (!token) {
        setErrorApi(
          "No se encontró el token de sesión. Iniciá sesión nuevamente."
        );
        setIsLoadingTurno(false);
        return;
      }

      try {
        setIsLoadingTurno(true);
        setErrorApi("");
        setSuccessMessage("");

        const respuesta = await fetch(
          `${API_URL}/turnos/${turnoId}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

       const datos = await respuesta.json().catch(() => ({}));

        console.log(
          "Respuesta GET /api/turnos/:turnoId:",
          datos
        );

        if (!respuesta.ok) {
          throw new Error(
            datos.message ||
              "No se pudo cargar la información del turno."
          );
        }
        const turno =
          datos.turno ||
          datos.data?.turno ||
          datos.data ||
          datos;

      
         const mascota =
          typeof turno.mascotaId === "object"
            ? turno.mascotaId
            : turno.mascota ||
              turno.mascotaData ||
              {};

        const dueno =
          typeof turno.usuarioId === "object"
            ? turno.usuarioId
            : mascota.usuarioId ||
              mascota.dueno ||
              mascota.tutor ||
              turno.usuario ||
              turno.dueno ||
              turno.tutor ||
              {};

        const profesional =
          typeof turno.profesionalId === "object"
            ? turno.profesionalId
            : turno.profesional ||
              turno.veterinario ||
              turno.veterinarioId ||
              {};

        const mascotaIdObtenido =
          obtenerId(turno.mascotaId) ||
          obtenerId(mascota);

        const profesionalIdObtenido =
          obtenerId(turno.profesionalId) ||
          obtenerId(turno.profesional) ||
          obtenerId(turno.veterinarioId) ||
          obtenerId(profesional);

        const nombreProfesionalObtenido =
          obtenerNombrePersona(profesional) ||
          turno.nombreProfesional ||
          turno.profesionalNombre ||
          "";

        setNombreProfesional(
          nombreProfesionalObtenido ||
            "Profesional asignado"
        );

        setForm((formAnterior) => ({
          ...formAnterior,

          nombreDueno:
            dueno.nombreCompleto ||
            dueno.nombre ||
            turno.nombreDueno ||
            "",

          email:
            dueno.email ||
            turno.emailDueno ||
            "",

          mascotaId:
            mascotaIdObtenido,

          nombreMascota:
            mascota.nombre ||
            mascota.nombreMascota ||
            turno.nombreMascota ||
            "",

          especie:
            mascota.especie ||
            turno.especie ||
            "",

          raza:
            mascota.raza ||
            turno.raza ||
            "",

          edad:
            mascota.edad !== undefined &&
            mascota.edad !== null
              ? String(mascota.edad)
              : mascota.fechaNacimiento ||
                turno.edad ||
                "",

          sexo:
            mascota.sexo ||
            turno.sexo ||
            "",

          peso:
            mascota.peso !== undefined &&
            mascota.peso !== null
              ? String(mascota.peso)
              : turno.peso ||
                "",

          profesionalId:
            profesionalIdObtenido,

          fecha:
            convertirFechaParaInput(turno.fecha),

          hora:
            turno.hora ||
            turno.horario ||
            "",

          categoriaServicio:
            turno.categoriaServicio ||
            turno.categoria ||
            turno.servicio?.categoria ||
            turno.servicio?.nombre ||
            turno.tipoConsulta ||
            "Consulta",

          motivoConsulta:
            turno.motivoConsulta ||
            turno.motivo ||
            "",
        }));

        if (!mascotaIdObtenido) {
          setErrorApi(
            "El turno no tiene una mascota asociada correctamente."
          );
          return;
        }

        if (!profesionalIdObtenido) {
          setErrorApi(
            "El turno no tiene un profesional asociado. El backend debe incluir profesionalId en la respuesta del turno."
          );
        }
      } catch (error) {
        console.error(
          "Error al obtener el turno:",
          error
        );

        setErrorApi(
          error.message ||
            "Ocurrió un error al cargar la información del turno."
        );
      } finally {
        setIsLoadingTurno(false);
      }
    };

    obtenerTurno();
  }, [turnoId]);

  function actualizarCampo(campo, valor) {
    setForm((formAnterior) => ({
      ...formAnterior,
      [campo]: valor,
    }));

    setErrorApi("");
    setSuccessMessage("");

    if (errores[campo]) {
      setErrores((erroresAnteriores) => ({
        ...erroresAnteriores,
        [campo]: "",
      }));
    }
  }

  function actualizarMonto(valor) {
    const valorSoloNumeros = valor.replace(/[^\d]/g, "");

    actualizarCampo("monto", valorSoloNumeros);
  }

  function formatearMonto(valor) {
    if (!valor) return "";

    return `$${Number(valor).toLocaleString("es-AR")}`;
  }

  function validarPasoUno() {
    const nuevosErrores = {};

    if (!form.mascotaId) {
      nuevosErrores.mascotaId =
        "El turno no tiene una mascota asociada.";
    }

    if (!form.profesionalId) {
      nuevosErrores.profesionalId =
        "El turno no tiene un profesional asociado.";
    }

    setErrores(nuevosErrores);

    return Object.keys(nuevosErrores).length === 0;
  }

  function validarPasoDos() {
    const nuevosErrores = {};

    if (!form.fecha) {
      nuevosErrores.fecha =
        "El turno no tiene una fecha asociada.";
    }

    if (!form.hora) {
      nuevosErrores.hora =
        "El turno no tiene una hora asociada.";
    }

    if (!form.categoriaServicio) {
      nuevosErrores.categoriaServicio =
        "El turno no tiene una categoría asociada.";
    }

    if (!form.motivoConsulta.trim()) {
      nuevosErrores.motivoConsulta =
        "El motivo de consulta es requerido.";
    }

    if (!form.anotaciones.trim()) {
      nuevosErrores.anotaciones =
        "Las anotaciones son requeridas.";
    }

    if (!form.profesionalId) {
      nuevosErrores.profesionalId =
        "El turno no tiene un profesional asociado.";
    }

    if (!form.monto) {
      nuevosErrores.monto =
        "El monto es requerido.";
    }

    setErrores(nuevosErrores);

    return Object.keys(nuevosErrores).length === 0;
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setErrorApi("");
    setSuccessMessage("");

    if (pasoActual === 1) {
      if (!validarPasoUno()) {
        return;
      }

      setErrores({});
      setPasoActual(2);
      return;
    }

    if (!validarPasoDos()) {
      return;
    }

    const token = localStorage.getItem("token");

    if (!token) {
      setErrorApi(
        "No se encontró el token de sesión. Iniciá sesión nuevamente."
      );
      return;
    }

    const body = {
      mascotaId: form.mascotaId,
      profesionalId: form.profesionalId,
      fecha: form.fecha,
      hora: form.hora,
      categoriaServicio: form.categoriaServicio,
      motivoConsulta: form.motivoConsulta.trim(),
      anotaciones: form.anotaciones.trim(),
      monto: Number(form.monto),
    };

    console.log(
      "Body enviado al backend:",
      body
    );

    setIsLoading(true);

    try {
      const respuesta = await fetch(
        `${API_URL}/historial-clinico`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(body),
        }
      );

      const datos = await respuesta.json().catch(() => ({}));

      if (!respuesta.ok) {
        throw new Error(
          datos.message ||
            "Error al registrar la consulta."
        );
      }

      setSuccessMessage(
        "Consulta registrada correctamente."
      );

      setErrores({});
    } catch (error) {
      console.error(
        "Error al registrar la consulta:",
        error
      );

      setErrorApi(
        error.message ||
          "Error de conexión. Intentá nuevamente."
      );
    } finally {
      setIsLoading(false);
    }
  }

  if (isLoadingTurno) {
    return (
      <div className="registrar-consulta-layout">
        <Sidebar role="veterinaria" />

        <div className="registrar-consulta-content">
          <TopBar
            title="Historial Clínico"
            notifications={2}
          />

          <main className="registrar-consulta-main">
            <div className="registrar-consulta-container">
              <div className="registrar-consulta-form">
                <p>
                  Cargando información del turno...
                </p>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="registrar-consulta-layout">
      <Sidebar role="veterinaria" />

      <div className="registrar-consulta-content">
        <TopBar
          title="Historial Clínico"
          notifications={2}
        />

        <main className="registrar-consulta-main">
          <div className="registrar-consulta-container">
            <div className="registrar-consulta-banner">
              <p className="registrar-consulta-step">
                Paso {pasoActual} de 2
              </p>

              <h1 className="registrar-consulta-title">
                Registrá una consulta
              </h1>

              <p className="registrar-consulta-subtitle">
                {pasoActual === 1
                  ? "Verificá los datos del turno, el tutor y la mascota."
                  : "Completá los datos médicos de la consulta."}
              </p>
            </div>

            {errorApi && (
              <div className="registrar-consulta-alert registrar-consulta-alert-error">
                ❌ {errorApi}
              </div>
            )}

            {successMessage && (
              <div className="registrar-consulta-alert registrar-consulta-alert-success">
                ✅ {successMessage}
              </div>
            )}

            <form
              onSubmit={handleSubmit}
              className="registrar-consulta-form"
            >
              {pasoActual === 1 && (
                <>
                  <h2 className="registrar-consulta-section-title">
                    Datos del dueño
                  </h2>

                  <div className="registrar-consulta-grid">
                    <Input
                      label="Nombre"
                      value={form.nombreDueno}
                      readOnly
                      disabled
                    />

                    <Input
                      label="Email"
                      type="email"
                      value={form.email}
                      readOnly
                      disabled
                    />
                  </div>

                  <h2 className="registrar-consulta-section-title registrar-consulta-section-title-spaced">
                    Datos de la mascota
                  </h2>

                  <div className="registrar-consulta-grid">
                    <Input
                      label="Nombre"
                      value={form.nombreMascota}
                      readOnly
                      disabled
                    />

                    <Input
                      label="Especie"
                      value={form.especie}
                      readOnly
                      disabled
                    />

                    <Input
                      label="Raza"
                      value={form.raza}
                      readOnly
                      disabled
                    />

                    <Input
                      label="Fecha de nacimiento / Edad aproximada"
                      value={form.edad}
                      readOnly
                      disabled
                    />

                    <Input
                      label="Sexo"
                      value={form.sexo}
                      readOnly
                      disabled
                    />

                    <Input
                      label="Peso"
                      value={form.peso}
                      readOnly
                      disabled
                    />
                  </div>

                  {errores.mascotaId && (
                    <p className="registrar-consulta-error-text">
                      {errores.mascotaId}
                    </p>
                  )}

                  {errores.profesionalId && (
                    <p className="registrar-consulta-error-text">
                      {errores.profesionalId}
                    </p>
                  )}
                </>
              )}

              {pasoActual === 2 && (
                <>
                  <h2 className="registrar-consulta-section-title">
                    Datos de la consulta
                  </h2>

                  <div className="registrar-consulta-grid">
                    <Input
                      label="Fecha"
                      type="date"
                      value={form.fecha}
                      readOnly
                      disabled
                      error={errores.fecha}
                    />

                    <Input
                      label="Hora"
                      value={form.hora}
                      readOnly
                      disabled
                      error={errores.hora}
                    />

                    <Input
                      label="Categoría del servicio"
                      value={form.categoriaServicio}
                      readOnly
                      disabled
                      error={errores.categoriaServicio}
                    />

                    <Input
                      label="Profesional a cargo"
                      value={nombreProfesional}
                      readOnly
                      disabled
                      error={errores.profesionalId}
                    />

                    <Input
                      label="Motivo de consulta"
                      placeholder="Ej: Vacuna antirrábica anual"
                      value={form.motivoConsulta}
                      onChange={(event) =>
                        actualizarCampo(
                          "motivoConsulta",
                          event.target.value
                        )
                      }
                      error={errores.motivoConsulta}
                    />

                    <Input
                      label="Monto"
                      placeholder="$0"
                      value={formatearMonto(form.monto)}
                      onChange={(event) =>
                        actualizarMonto(event.target.value)
                      }
                      error={errores.monto}
                    />
                  </div>

                  <div className="registrar-consulta-textarea-wrapper">
                    <label className="registrar-consulta-label">
                      Anotaciones
                    </label>

                    <textarea
                      className={`registrar-consulta-textarea ${
                        errores.anotaciones
                          ? "registrar-consulta-textarea-error"
                          : ""
                      }`}
                      placeholder="Escribí las anotaciones de la consulta..."
                      value={form.anotaciones}
                      onChange={(event) =>
                        actualizarCampo(
                          "anotaciones",
                          event.target.value
                        )
                      }
                    />

                    {errores.anotaciones && (
                      <p className="registrar-consulta-error-text">
                        {errores.anotaciones}
                      </p>
                    )}
                  </div>
                </>
              )}

              <div className="registrar-consulta-actions">
                {pasoActual === 2 &&
                  !successMessage && (
                    <Button
                      type="button"
                      texto="← Volver"
                      variante="secundario"
                      tamaño="mediano"
                      disabled={isLoading}
                      onClick={() => {
                        setErrores({});
                        setPasoActual(1);
                      }}
                    />
                  )}

                {!successMessage && (
                  <Button
                    type="submit"
                    texto={
                      isLoading
                        ? "Registrando..."
                        : pasoActual === 1
                          ? "Continuar →"
                          : "Registrar consulta"
                    }
                    variante="primario"
                    tamaño="mediano"
                    disabled={
                      isLoading ||
                      isLoadingTurno ||
                      !form.mascotaId ||
                      !form.profesionalId
                    }
                  />
                )}
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}

export default RegistrarConsulta;