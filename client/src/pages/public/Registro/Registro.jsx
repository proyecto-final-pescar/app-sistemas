import { useState } from "react";
import Input from "../../../components/ui/input/Input";
import Button from "../../../components/ui/button/Button";
import Card from "../../../components/ui/card/Card";
import logoMyPet from "../../../assets/logo-mypet.png";
import "./Registro.css";

function Registro() {
  const [rol, setRol] = useState("");
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmarPassword, setConfirmarPassword] = useState("");

  const [errores, setErrores] = useState({});

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

  function manejarSubmit(evento) {
    evento.preventDefault();

    const formularioValido = validarFormulario();

    if (formularioValido) {
      console.log({
        rol,
        nombre,
        email,
        password,
        confirmarPassword,
      });
    }
  }

  return (
    <main className="registro-page">
      <Card className="registro-card">
        <header className="registro-header">
          <div className="registro-logo">
            <img src={logoMyPet} alt="Logo MyPet" />
          </div>

          <h1>Crear cuenta</h1>

          <h2>Unite a miles de familias que cuidan mejor a sus mascotas</h2>
        </header>

        <form onSubmit={manejarSubmit}>
          <p className="input-label">¿Quién sos?</p>

          {errores.rol && <p className="input-error">{errores.rol}</p>}

          <div className="roles-container">
            <div
              className={`role-card ${
                rol === "tutor" ? "role-card-selected" : ""
              }`}
              onClick={() => setRol("tutor")}
            >
              <div className="role-icon">
              <span>👤</span>
              </div>

              <strong>Soy Tutor</strong>
            </div>

            <div
              className={`role-card ${
                rol === "veterinario" ? "role-card-selected" : ""
              }`}
              onClick={() => setRol("veterinario")}
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

          <div className="registro-button">
            <Button
              type="submit"
              texto="Crear Cuenta ->"
              variante="primario"
              tamaño="mediano"
            />
          </div>
        </form>
      </Card>
    </main>
  );
}

export default Registro;
