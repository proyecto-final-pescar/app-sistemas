import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";
import { MdMarkEmailRead } from "react-icons/md";
import Input from "../../../components/ui/input/Input";
import Button from "../../../components/ui/button/Button";
import Card from "../../../components/ui/card/Card";
import api from "../../../services/api";
import { reenviarVerificacion } from "../../../services/authService";
import { useAuth } from "../../../hooks/useAuth.js";
import { obtenerMensajeError } from "../../../utils/obtenerMensajeError.js";
import "./Registro.css";

function Registro() {
  const navigate = useNavigate();
  const { setUsuario } = useAuth();
  const [rol, setRol] = useState("");
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmarPassword, setConfirmarPassword] = useState("");

  const [errores, setErrores] = useState({});
  const [errorGeneral, setErrorGeneral] = useState("");
  const [enviando, setEnviando] = useState(false);

  // Se guarda el email con el que se registró para poder mostrarlo en
  // la pantalla de confirmación y reusarlo si pide reenviar el correo.
  // Este flujo es solo para el registro con contraseña: una cuenta
  // creada por Google ya viene con el email verificado por Google.
  const [registroExitoso, setRegistroExitoso] = useState(false);
  const [emailRegistrado, setEmailRegistrado] = useState("");

  const [reenviando, setReenviando] = useState(false);
  const [reenvioEnviado, setReenvioEnviado] = useState(false);
  const [errorReenvio, setErrorReenvio] = useState("");

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

  async function manejarSubmit(evento) {
    evento.preventDefault();
    setErrorGeneral("");

    const formularioValido = validarFormulario();

    if (!formularioValido) {
      return;
    }

    const emailNormalizado = email.trim().toLowerCase();

    try {
      setEnviando(true);

      await api.post(`/auth/register/${rol}`, {
         name: nombre.trim(),
         email: emailNormalizado,
         password,
      });

      // Ya no se redirige directo a /login: la cuenta recién creada no
      // está verificada todavía, así que el login la va a rechazar.
      // Se muestra una pantalla de confirmación en su lugar.
      setEmailRegistrado(emailNormalizado);
      setRegistroExitoso(true);
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

  async function manejarReenvio() {
    setErrorReenvio("");
    setReenviando(true);

    try {
      await reenviarVerificacion(emailRegistrado);
      setReenvioEnviado(true);
    } catch {
      setErrorReenvio("No se pudo reenviar el correo. Probá de nuevo en un momento.");
    } finally {
      setReenviando(false);
    }
  }

  // Primer intento de registro con Google: nunca mandamos role acá,
  // el rol de este formulario (arriba) es solo para el registro con
  // contraseña. Si la cuenta ya existe, el backend devuelve el usuario
  // real. Si no existe, responde nuevoUsuario: true y mandamos al
  // usuario a completar el registro en su propia pantalla. Una cuenta
  // creada por Google ya llega verificada, por eso este flujo no pasa
  // por la pantalla de "revisá tu correo".
  const handleGoogleSuccess = async (credentialResponse) => {
    setErrorGeneral("");
    setEnviando(true);

    try {
      const { data } = await api.post("/auth/google", {
        token: credentialResponse.credential,
      });

      if (data.nuevoUsuario) {
        navigate("/completar-registro-google", {
          state: {
            googleCredential: credentialResponse.credential,
            nombre: data.nombre,
            email: data.email,
          },
        });
        return;
      }

      const token = data.token;
      const user = data.usuario;

      if (!token) {
        setErrorGeneral("No se recibió un token de autenticación.");
        return;
      }

      const userData = {
        id: user.id || user._id,
        email: user.email,
        nombre: user.name,
        rol: user.role,
        fotoUrl: user.fotoUrl || "",
        asistenteVirtual: user.asistenteVirtual || "perro",
      };

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(userData));
      setUsuario(userData);

      const userRol = userData.rol;
      if (userRol === "dueno") {
        navigate("/mascotas", { replace: true });
        return;
      }

      if (userRol === "veterinaria") {
        navigate("/registro-veterinaria", { replace: true });
        return;
      }

      navigate("/home", { replace: true });
    } catch (error) {
      const responseData = error.response?.data;

      if (responseData) {
        setErrorGeneral(obtenerMensajeError(responseData));
      } else if (error.request) {
        setErrorGeneral(
          "No se pudo conectar con el servidor. Revisá tu conexión e intentá de nuevo.",
        );
      } else {
        setErrorGeneral("No se pudo crear la cuenta con Google.");
      }
    } finally {
      setEnviando(false);
    }
  };

  const handleGoogleError = () => {
    setErrorGeneral("No se pudo completar el registro con Google.");
  };

  if (registroExitoso) {
    return (
      <main className="registro-page">
        <header className="brand">
          <img src="/logo-mypet.svg" alt="" className="brand-icon" />
          <img src="/mypet2.svg" alt="MyPet" className="brand-logo" />
        </header>

        <Card className="registro-card">
          <div className="registro-confirmacion">
            <MdMarkEmailRead
              className="registro-confirmacion-icon"
              size={56}
              aria-hidden="true"
            />
            <h1>¡Ya casi terminás!</h1>
            <p>
              Te enviamos un correo a <strong>{emailRegistrado}</strong> con un
              link para verificar tu cuenta.
            </p>
            <p className="registro-confirmacion-subtexto">
              Tenés que confirmar tu email antes de poder iniciar sesión. Si
              no lo ves, revisá la carpeta de spam.
            </p>

            <div className="registro-button">
              <Button
                type="button"
                texto="Ir a iniciar sesión"
                variante="primario"
                tamaño="mediano"
                onClick={() => {
                  window.location.href = "/login";
                }}
              />
            </div>

            {reenvioEnviado ? (
              <p className="registro-reenvio-ok">
                Si el email está registrado y pendiente de verificación, vas a
                recibir un correo con un nuevo enlace.
              </p>
            ) : (
              <>
                {errorReenvio && <p className="input-error">{errorReenvio}</p>}
                <button
                  type="button"
                  className="registro-reenvio-link"
                  onClick={manejarReenvio}
                  disabled={reenviando}
                >
                  {reenviando ? "Enviando..." : "¿No te llegó? Reenviar correo"}
                </button>
              </>
            )}
          </div>
        </Card>
      </main>
    );
  }

  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
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

            <div className="divider">
              <span className="divider-line" />
              <span className="divider-text">o continuá con</span>
              <span className="divider-line" />
            </div>

            <div className="google-btn-wrap">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                size="large"
                width="100%"
                shape="pill"
                theme="outline"
                locale="es_AR"
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
    </GoogleOAuthProvider>
  );
}

export default Registro;