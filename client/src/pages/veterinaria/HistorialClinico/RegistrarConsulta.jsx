import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";

import api from "../../../services/api.js";
import Input from "../../../components/ui/input/Input";
import Button from "../../../components/ui/button/Button";
import Sidebar from "../../../components/layout/Sidebar";
import TopBar from "../../../components/layout/TopBar";

import "./RegistrarConsulta.css";

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

function obtenerFechaDeTurno(fecha) {
  if (!fecha) return "";
  return String(fecha).slice(0, 10);
}

function IconoAgenda() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  );
}

function IconoFicha() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
      <path d="M12 12v6M9 15h6" />
    </svg>
  );
}

function RegistrarConsulta() {
  const { turnoId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const origenFicha = Boolean(
    location.state?.origen === "ficha" && location.state?.mascotaId
  );
  const rutaVolver = origenFicha ? `/pacientes/${location.state.mascotaId}` : "/agenda";
  const textoVolver = origenFicha ? "← Volver al historial clínico" : "← Volver a la agenda";

  const [pasoActual, setPasoActual] = useState(1);

  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingTurno, setIsLoadingTurno] = useState(true);

  // A dónde se va después de registrar la consulta ("agenda" | "ficha").
  // Si se llegó desde la ficha del paciente, arranca en "ficha"; si no, en "agenda".
  const [destino, setDestino] = useState(origenFicha ? "ficha" : "agenda");

  const [errorApi, setErrorApi] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [nombreProfesional, setNombreProfesional] = useState("");

  const [form, setForm] = useState(estadoInicialFormulario);
  const [errores, setErrores] = useState({});

  const alertasRef = useRef(null);
  const redireccionRef = useRef(null);

  useEffect(() => {
    const obtenerTurno = async () => {
      if (!turnoId) {
        setErrorApi("No se recibió el identificador del turno.");
        setIsLoadingTurno(false);
        return;
      }

      try {
        setIsLoadingTurno(true);
        setErrorApi("");
        setSuccessMessage("");

        const respuesta = await api.get(`/turnos/${turnoId}`);
        const turno = respuesta.data?.data;

        if (!turno) {
          setErrorApi("No se pudo cargar la información del turno.");
          return;
        }

        const mascota = turno.mascota;
        const dueno = mascota?.usuario;
        const profesional = turno.profesional;

        setNombreProfesional(
          profesional ? `${profesional.nombre} ${profesional.apellido}` : "Profesional asignado"
        );

        setForm((formAnterior) => ({
          ...formAnterior,
          nombreDueno: dueno ? `${dueno.nombre} ${dueno.apellido}` : "",
          email: dueno?.email || "",
          mascotaId: mascota?.mascota_id || "",
          nombreMascota: mascota?.nombre || "",
          especie: mascota?.raza?.especie?.nombre || "",
          raza: mascota?.raza?.nombre || "",
          edad: mascota?.fecha_nacimiento
            ? convertirFechaParaInput(mascota.fecha_nacimiento)
            : "",
          sexo: mascota?.sexo_mascota?.nombre || "",
          peso: mascota?.peso != null ? String(mascota.peso) : "",
          profesionalId: turno.profesional_id || "",
          fecha: obtenerFechaDeTurno(turno.fecha),
          hora: turno.hora_inicio || "",
          categoriaServicio: turno.servicio?.categoria_servicio?.nombre || "Consulta",
          motivoConsulta: turno.motivo || "",
        }));

        if (!mascota?.mascota_id) {
          setErrorApi("El turno no tiene una mascota asociada correctamente.");
          return;
        }

        if (!turno.profesional_id) {
          setErrorApi("El turno no tiene un profesional asociado.");
        }
      } catch (error) {
        console.error("Error al obtener el turno:", error);

        setErrorApi(
          error.response?.data?.message ||
            "Ocurrió un error al cargar la información del turno."
        );
      } finally {
        setIsLoadingTurno(false);
      }
    };

    obtenerTurno();
  }, [turnoId]);

  // Si el componente se desmonta antes de la redirección, se cancela el timeout.
  useEffect(() => {
    return () => clearTimeout(redireccionRef.current);
  }, []);

  // Los avisos están arriba del formulario: si aparece uno mientras la persona
  // está abajo (botón de registrar), se lleva la vista hasta el aviso.
  useEffect(() => {
    if ((errorApi || successMessage) && alertasRef.current) {
      alertasRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [errorApi, successMessage]);

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

  // Valida, registra la consulta y redirige según el destino elegido:
  //  - "agenda": vuelve a /agenda
  //  - "ficha":  va a la ficha médica de la mascota
  async function procesarRegistro() {
    if (isLoading) return;

    setErrorApi("");
    setSuccessMessage("");

    if (!validarPasoDos()) {
      return;
    }

    const body = {
      mascotaId: form.mascotaId,
      profesionalId: form.profesionalId,
      turnoId,
      fecha: form.fecha,
      hora: form.hora,
      categoriaServicio: form.categoriaServicio,
      motivoConsulta: form.motivoConsulta.trim(),
      anotaciones: form.anotaciones.trim(),
      monto: Number(form.monto),
    };

    setIsLoading(true);

    try {
      await api.post("/historial-clinico", body);

      setSuccessMessage(
        destino === "ficha"
          ? "Consulta registrada correctamente. Te llevamos a la ficha médica..."
          : "Consulta registrada correctamente. Volvemos a la agenda..."
      );
      setErrores({});

      redireccionRef.current = setTimeout(() => {
        if (destino === "ficha") {
          navigate(`/pacientes/${form.mascotaId}`, {
            state: { tabActiva: "ficha-medica" },
          });
        } else {
          navigate("/agenda");
        }
      }, 1500);
    } catch (error) {
      console.error("Error al registrar la consulta:", error);

      setErrorApi(
        error.response?.data?.message ||
          "Error de conexión. Intentá nuevamente."
      );
    } finally {
      setIsLoading(false);
    }
  }

  // Un solo submit para los dos pasos:
  //  - paso 1: valida y avanza al paso 2
  //  - paso 2: registra la consulta y redirige según el destino elegido
  function handleSubmit(event) {
    event.preventDefault();

    if (pasoActual === 1) {
      setErrorApi("");
      setSuccessMessage("");

      if (!validarPasoUno()) {
        return;
      }

      setErrores({});
      setPasoActual(2);
      return;
    }

    procesarRegistro();
  }

  const bloqueado = isLoading || Boolean(successMessage);

  const opcionesDestino = [
    {
      valor: "agenda",
      titulo: "Ir a la agenda",
      descripcion: "Volvés a los turnos para seguir con el próximo paciente.",
      icono: <IconoAgenda />,
    },
    {
      valor: "ficha",
      titulo: "Ir a la ficha médica",
      descripcion: `Seguís cargando vacunas, estudios y datos de ${
        form.nombreMascota || "la mascota"
      }.`,
      icono: <IconoFicha />,
    },
  ];

  const textoRegistrar = isLoading
    ? "Registrando..."
    : destino === "ficha"
      ? "Registrar e ir a la ficha médica"
      : "Registrar e ir a la agenda";

  if (isLoadingTurno) {
    return (
      <div className="registrar-consulta-layout">
        <Sidebar role="veterinaria" title="Historial Clínico" />

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
            <div className="registrar-consulta-volver-wrap">
              <Button
                type="button"
                texto={textoVolver}
                variante="secundario"
                tamaño="mediano"
                disabled={isLoading}
                onClick={() => navigate(rutaVolver)}
              />
            </div>

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

            <div ref={alertasRef} className="registrar-consulta-alertas">
              {errorApi && (
                <div
                  role="alert"
                  className="registrar-consulta-alert registrar-consulta-alert-error"
                >
                  {errorApi}
                </div>
              )}

              {successMessage && (
                <div
                  role="status"
                  className="registrar-consulta-alert registrar-consulta-alert-success"
                >
                  {successMessage}
                </div>
              )}
            </div>

            <form
              onSubmit={handleSubmit}
              className="registrar-consulta-form"
            >
              {pasoActual === 1 && (
                <>
                  <div className="registrar-consulta-section">
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
                  </div>

                  <div className="registrar-consulta-section">
                    <h2 className="registrar-consulta-section-title">
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
                  </div>
                </>
              )}

              {pasoActual === 2 && (
                <>
                  <div className="registrar-consulta-section">
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

                      <div className="registrar-consulta-select-wrapper">
                        <Input
                          label="Categoría del servicio"
                          value={form.categoriaServicio}
                          readOnly
                          disabled
                          error={errores.categoriaServicio}
                        />
                      </div>

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
                      <label
                        htmlFor="registrar-consulta-anotaciones"
                        className="registrar-consulta-label"
                      >
                        Anotaciones
                      </label>

                      <textarea
                        id="registrar-consulta-anotaciones"
                        className={`registrar-consulta-textarea ${errores.anotaciones
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
                  </div>

                  <div className="registrar-consulta-section">
                    <h2
                      id="registrar-consulta-destino-titulo"
                      className="registrar-consulta-section-title"
                    >
                      Después de registrar
                    </h2>

                    <p className="registrar-consulta-section-ayuda">
                      Elegí a dónde querés ir una vez guardada la consulta.
                    </p>

                    <div
                      role="radiogroup"
                      aria-labelledby="registrar-consulta-destino-titulo"
                      className="registrar-consulta-destino-opciones"
                    >
                      {opcionesDestino.map((opcion) => (
                        <label
                          key={opcion.valor}
                          className="registrar-consulta-destino-opcion"
                        >
                          <input
                            type="radio"
                            name="destino"
                            value={opcion.valor}
                            checked={destino === opcion.valor}
                            onChange={() => setDestino(opcion.valor)}
                            disabled={bloqueado}
                            className="registrar-consulta-destino-input"
                          />

                          <span className="registrar-consulta-destino-card">
                            <span className="registrar-consulta-destino-icono">
                              {opcion.icono}
                            </span>

                            <span className="registrar-consulta-destino-textos">
                              <span className="registrar-consulta-destino-titulo">
                                {opcion.titulo}
                              </span>
                              <span className="registrar-consulta-destino-desc">
                                {opcion.descripcion}
                              </span>
                            </span>
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {!successMessage && (
                <div
                  className={`registrar-consulta-actions ${pasoActual === 2
                    ? "registrar-consulta-actions-paso-2"
                    : ""
                    }`}
                >
                  {pasoActual === 2 && (
                    <Button
                      key="paso-anterior"
                      type="button"
                      texto="← Paso anterior"
                      variante="secundario"
                      tamaño="mediano"
                      disabled={isLoading}
                      onClick={() => {
                        setErrores({});
                        setPasoActual(1);
                      }}
                    />
                  )}

                  {pasoActual === 1 && (
                    <Button
                      key="continuar"
                      type="submit"
                      texto="Continuar →"
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

                  {pasoActual === 2 && (
                    <Button
                      key="registrar"
                      type="submit"
                      texto={textoRegistrar}
                      variante="primario"
                      tamaño="mediano"
                      disabled={
                        isLoading ||
                        !form.mascotaId ||
                        !form.profesionalId
                      }
                    />
                  )}
                </div>
              )}
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}

export default RegistrarConsulta;
