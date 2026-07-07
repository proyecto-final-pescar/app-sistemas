import { useState } from "react";
import Input from "../../../components/ui/input/Input";
import Select from "../../../components/ui/select/Select";
import Button from "../../../components/ui/button/Button";
import Sidebar from "../../../components/layout/Sidebar";
import TopBar from "../../../components/layout/TopBar";
import "./RegistrarConsulta.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

function RegistrarConsulta() {
  const [pasoActual, setPasoActual] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [errorApi, setErrorApi] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [form, setForm] = useState({
    nombreDueno: "",
    email: "",
    nombreMascota: "",
    especie: "",
    raza: "",
    edad: "",
    sexo: "",
    peso: "",
    fecha: "",
    horario: "",
    categoriaServicio: "",
    motivoConsulta: "",
    anotaciones: "",
    profesional: "",
    monto: "",
  });

  const [errores, setErrores] = useState({});

  function actualizarCampo(campo, valor) {
    setForm({ ...form, [campo]: valor });
    setErrorApi("");
    setSuccessMessage("");

    if (errores[campo]) {
      setErrores({ ...errores, [campo]: "" });
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

    if (!form.nombreDueno.trim()) nuevosErrores.nombreDueno = "El nombre del dueño es requerido";
    if (!form.email.trim()) nuevosErrores.email = "El email es requerido";
    if (!form.nombreMascota.trim()) nuevosErrores.nombreMascota = "El nombre de la mascota es requerido";
    if (!form.especie) nuevosErrores.especie = "Debe seleccionar una especie";
    if (!form.raza.trim()) nuevosErrores.raza = "La raza es requerida";
    if (!form.edad.trim()) nuevosErrores.edad = "La edad es requerida";
    if (!form.sexo) nuevosErrores.sexo = "Debe seleccionar el sexo";
    if (!form.peso.trim()) nuevosErrores.peso = "El peso es requerido";

    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  }

  function validarPasoDos() {
    const nuevosErrores = {};

    if (!form.fecha) nuevosErrores.fecha = "La fecha es requerida";
    if (!form.horario) nuevosErrores.horario = "El horario es requerido";
    if (!form.categoriaServicio) nuevosErrores.categoriaServicio = "Debe seleccionar una categoría";
    if (!form.motivoConsulta.trim()) nuevosErrores.motivoConsulta = "El motivo es requerido";
    if (!form.anotaciones.trim()) nuevosErrores.anotaciones = "Las anotaciones son requeridas";
    if (!form.profesional) nuevosErrores.profesional = "Debe seleccionar un profesional";
    if (!form.monto) nuevosErrores.monto = "El monto es requerido";

    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  }

  function limpiarFormulario() {
    setForm({
      nombreDueno: "",
      email: "",
      nombreMascota: "",
      especie: "",
      raza: "",
      edad: "",
      sexo: "",
      peso: "",
      fecha: "",
      horario: "",
      categoriaServicio: "",
      motivoConsulta: "",
      anotaciones: "",
      profesional: "",
      monto: "",
    });

    setErrores({});
    setPasoActual(1);
  }

  async function handleSubmit(e) {
    e.preventDefault();

    setErrorApi("");
    setSuccessMessage("");

    if (pasoActual === 1) {
      if (!validarPasoUno()) return;
      setErrores({});
      setPasoActual(2);
      return;
    }

    if (!validarPasoDos()) return;

    const token = localStorage.getItem("token");

    if (!token) {
      setErrorApi("No se encontró el token de sesión. Iniciá sesión nuevamente.");
      return;
    }

    const body = {
      dueno: {
        nombre: form.nombreDueno.trim(),
        email: form.email.trim(),
      },
      mascota: {
        nombre: form.nombreMascota.trim(),
        especie: form.especie,
        raza: form.raza.trim(),
        edad: form.edad.trim(),
        sexo: form.sexo,
        peso: form.peso.trim(),
      },
      consulta: {
        fecha: form.fecha,
        horario: form.horario,
        categoriaServicio: form.categoriaServicio,
        motivoConsulta: form.motivoConsulta.trim(),
        anotaciones: form.anotaciones.trim(),
        profesional: form.profesional,
        monto: Number(form.monto),
      },
    };

    setIsLoading(true);

    try {
      const respuesta = await fetch(`${API_URL}/historial-clinico`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      const datos = await respuesta.json();

      if (!respuesta.ok) {
        setErrorApi(datos.message || "Error al registrar la consulta.");
        return;
      }

      setSuccessMessage("Consulta registrada correctamente.");
      limpiarFormulario();
    } catch (error) {
      console.error(error);
      setErrorApi("Error de conexión. Intentá de nuevo.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="registrar-consulta-layout">
      <Sidebar role="veterinaria" />

      <div className="registrar-consulta-content">
        <TopBar title="Historial Clínico" notifications={2} />

        <main className="registrar-consulta-main">
          <div className="registrar-consulta-container">
            <div className="registrar-consulta-banner">
              <p className="registrar-consulta-step">Paso {pasoActual} de 2</p>

              <h1 className="registrar-consulta-title">Registrá una consulta</h1>

              <p className="registrar-consulta-subtitle">
                {pasoActual === 1
                  ? "Cargá los datos del dueño y la mascota de tu última consulta."
                  : "Cargá los datos médicos de la consulta."}
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

            <form onSubmit={handleSubmit} className="registrar-consulta-form">
              {pasoActual === 1 && (
                <>
                  <h2 className="registrar-consulta-section-title">Datos del dueño</h2>

                  <div className="registrar-consulta-grid">
                    <Input
                      label="Nombre"
                      placeholder="Ingresá el nombre"
                      value={form.nombreDueno}
                      onChange={(e) => actualizarCampo("nombreDueno", e.target.value)}
                      error={errores.nombreDueno}
                    />

                    <Input
                      label="Email"
                      type="email"
                      placeholder="Ingresá el email"
                      value={form.email}
                      onChange={(e) => actualizarCampo("email", e.target.value)}
                      error={errores.email}
                    />
                  </div>

                  <h2 className="registrar-consulta-section-title registrar-consulta-section-title-spaced">
                    Datos de la mascota
                  </h2>

                  <div className="registrar-consulta-grid">
                    <Input
                      label="Nombre"
                      placeholder="Ingresá el nombre"
                      value={form.nombreMascota}
                      onChange={(e) => actualizarCampo("nombreMascota", e.target.value)}
                      error={errores.nombreMascota}
                    />

                    <Select
                      label="Especie"
                      placeholder="Seleccioná una especie"
                      opciones={["Perro", "Gato", "Ave", "Otro"]}
                      value={form.especie}
                      onChange={(e) => actualizarCampo("especie", e.target.value)}
                      error={errores.especie}
                    />

                    <Input
                      label="Raza"
                      placeholder="Ingresá la raza"
                      value={form.raza}
                      onChange={(e) => actualizarCampo("raza", e.target.value)}
                      error={errores.raza}
                    />

                    <Input
                      label="Fecha de nacimiento / Edad aproximada"
                      placeholder="Ej: 2 años"
                      value={form.edad}
                      onChange={(e) => actualizarCampo("edad", e.target.value)}
                      error={errores.edad}
                    />

                    <Select
                      label="Sexo"
                      placeholder="Seleccioná el sexo"
                      opciones={["Hembra", "Macho"]}
                      value={form.sexo}
                      onChange={(e) => actualizarCampo("sexo", e.target.value)}
                      error={errores.sexo}
                    />

                    <Input
                      label="Peso"
                      placeholder="Ej: 3kg"
                      value={form.peso}
                      onChange={(e) => actualizarCampo("peso", e.target.value)}
                      error={errores.peso}
                    />
                  </div>
                </>
              )}

              {pasoActual === 2 && (
                <>
                  <h2 className="registrar-consulta-section-title">Datos de la consulta</h2>

                  <div className="registrar-consulta-grid">
                    <Input
                      label="Fecha"
                      type="date"
                      value={form.fecha}
                      onChange={(e) => actualizarCampo("fecha", e.target.value)}
                      error={errores.fecha}
                    />

                    <Select
                      label="Horario"
                      placeholder="Seleccioná un horario"
                      opciones={["09:00", "10:00", "11:00", "12:00", "15:00", "16:00"]}
                      value={form.horario}
                      onChange={(e) => actualizarCampo("horario", e.target.value)}
                      error={errores.horario}
                    />

                    <Select
                      label="Categoría del servicio"
                      placeholder="Seleccioná una categoría"
                      opciones={["Vacunación", "Consulta", "Control", "Cirugía", "Urgencia"]}
                      value={form.categoriaServicio}
                      onChange={(e) => actualizarCampo("categoriaServicio", e.target.value)}
                      error={errores.categoriaServicio}
                    />

                    <Select
                      label="Profesional a cargo"
                      placeholder="Seleccioná un profesional"
                      opciones={["Dra. Laura Méndez", "Dr. Juan López", "Dra. Sofía Pérez"]}
                      value={form.profesional}
                      onChange={(e) => actualizarCampo("profesional", e.target.value)}
                      error={errores.profesional}
                    />

                    <Input
                      label="Motivo de consulta"
                      placeholder="Ej: Vacuna Antirrábica Anual"
                      value={form.motivoConsulta}
                      onChange={(e) => actualizarCampo("motivoConsulta", e.target.value)}
                      error={errores.motivoConsulta}
                    />

                    <Input
                      label="Monto"
                      placeholder="$0"
                      value={formatearMonto(form.monto)}
                      onChange={(e) => actualizarMonto(e.target.value)}
                      error={errores.monto}
                    />
                  </div>

                  <div className="registrar-consulta-textarea-wrapper">
                    <label className="registrar-consulta-label">Anotaciones</label>

                    <textarea
                      className={`registrar-consulta-textarea ${
                        errores.anotaciones ? "registrar-consulta-textarea-error" : ""
                      }`}
                      placeholder="Escribí las anotaciones de la consulta..."
                      value={form.anotaciones}
                      onChange={(e) => actualizarCampo("anotaciones", e.target.value)}
                    />

                    {errores.anotaciones && (
                      <p className="registrar-consulta-error-text">{errores.anotaciones}</p>
                    )}
                  </div>
                </>
              )}

              <div className="registrar-consulta-actions">
                {pasoActual === 2 && (
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
                  disabled={isLoading}
                />
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}

export default RegistrarConsulta;