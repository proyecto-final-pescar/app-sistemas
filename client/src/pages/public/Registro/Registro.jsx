import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Input from "../../../components/ui/input/Input";
import Button from "../../../components/ui/button/Button";
import Card from "../../../components/ui/card/Card";
import api from "../../../services/api";
import "./Registro.css";

function Registro() {
  const navigate = useNavigate();
  const [rol, setRol] = useState("");
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmarPassword, setConfirmarPassword] = useState("");

  const [errores, setErrores] = useState({});
  const [errorGeneral, setErrorGeneral] = useState("");
  const [enviando, setEnviando] = useState(false);

  function validarFormulario() {
    const nuevosErrores = {};

    if (rol === "") {
      nuevosErrores.rol = "Debes seleccionar un rol";
    }

    if (nombre.trim() === "") {
      nuevosErrores.nombre = "El nombre es obligatorio";
    }

    if (email.trim() === "") {
      nuevosErrores.email = "El email es obligatorio";
    } else if (!email.includes("@")) {
      nuevosErrores.email = "El email debe tener un formato válido";
    }

    if (password === "") {
      nuevosErrores.password = "La contraseña es obligatoria";
    } else if (password.length < 8) {
      nuevosErrores.password = "La contraseña debe tener mínimo 8 caracteres";
    }

    if (confirmarPassword === "") {
      nuevosErrores.confirmarPassword = "Debes confirmar la contraseña";
    } else if (confirmarPassword !== password) {
      nuevosErrores.confirmarPassword = "Las contraseñas deben coincidir";
    }

    setErrores(nuevosErrores);

    return Object.keys(nuevosErrores).length === 0;
  }

  const obtenerMensajeError = (data) => {
    if (typeof data === "string") {
      return data;
    }

    return data?.message || data?.mensaje || data?.error || "No se pudo crear la cuenta.";
  };

  async function manejarSubmit(evento) {
    evento.preventDefault();
    setErrorGeneral("");

    const formularioValido = validarFormulario();

    if (!formularioValido) {
      return;
    }

    try {
      setEnviando(true);

      await api.post("/auth/register", {
        name: nombre.trim(),
        email: email.trim().toLowerCase(),
        password,
        role: rol,
      });

      navigate("/login", { replace: true });
    } catch (error) {
      
      const responseData = error.response?.data;

      if (responseData) {
        setErrorGeneral(obtenerMensajeError(responseData));
      } else if (error.request) {
        setErrorGeneral("No se pudo conectar con el servidor. Revisá tu conexión e intentá de nuevo.");
      } else {
        setErrorGeneral("No se pudo crear la cuenta.");
      }
    } finally {
      setEnviando(false);
    }
  }

  return (
    <main className="registro-page">
      <header className="brand">
        <img src="/logo-mypet.svg" alt="" className="brand-icon" />
        <img src="/mypet2.svg" alt="MyPet" className="brand-logo" />
      </header>

      <Card className="registro-card">
        <header className="registro-header">
          <h1>Crear cuenta</h1>
          <h2>Unite a miles de familias que cuidan mejor a sus mascotas</h2>
        </header>

        <form onSubmit={manejarSubmit}>
          <p className="input-label">¿Quién sos?</p>

          {errores.rol && <p className="input-error">{errores.rol}</p>}

          <div className="roles-container">
            <div
              className={`role-card ${
                rol === "dueno" ? "role-card-selected" : ""
              }`}
              onClick={() => setRol("dueno")}
            >
              <div className="role-icon">
                <span>👤</span>
              </div>

              <strong>Soy Tutor</strong>
            </div>

            <div
              className={`role-card ${
                rol === "veterinaria" ? "role-card-selected" : ""
              }`}
              onClick={() => setRol("veterinaria")}
            >
              <div className="role-icon">
                <span>🩺</span>
              </div>

              <strong>Soy Veterinario</strong>
            </div>
          </div>

          <Input
            label="Nombre"
            placeholder="Ana Maria"
            value={nombre}
            onChange={(evento) => setNombre(evento.target.value)}
            error={errores.nombre}
          />

          <Input
            label="Email"
            placeholder="anamaria@gmail.com"
            value={email}
            onChange={(evento) => setEmail(evento.target.value)}
            error={errores.email}
          />

          <Input
            label="Contraseña"
            placeholder="Mínimo 8 caracteres"
            type="password"
            value={password}
            onChange={(evento) => setPassword(evento.target.value)}
            error={errores.password}
          />

          <Input
            label="Confirmar contraseña"
            placeholder="Repetí tu contraseña"
            type="password"
            value={confirmarPassword}
            onChange={(evento) => setConfirmarPassword(evento.target.value)}
            error={errores.confirmarPassword}
          />

          {errorGeneral && <p className="input-error">{errorGeneral}</p>}

          <div className="registro-button">
            <Button
              type="submit"
              texto={enviando ? "Creando cuenta..." : "Crear Cuenta ->"}
              variante="primario"
              tamaño="mediano"
              disabled={enviando}
            />
          </div>

          <p className="login-text">
            ¿Ya tenés cuenta?{" "}
            <a href="/login" className="login-link">
              Iniciá sesión
            </a>
          </p>
        </form>
      </Card>
    </main>
  );
}

export default Registro;