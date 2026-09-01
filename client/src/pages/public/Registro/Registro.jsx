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
import { validateEmail } from "../../../validators/EmailValidator";
import { validatePassword } from "../../../validators/PasswordValidator";
import "./Registro.css";

function Registro() {
  const navigate = useNavigate();
  const { setUsuario } = useAuth();
  const [rol, setRol] = useState("");
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmarPassword, setConfirmarPassword] = useState("");

  const [errores, setErrores] = useState({});
  const [errorGeneral, setErrorGeneral] = useState("");
  const [enviando, setEnviando] = useState(false);

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

    if (apellido.trim() === "") {
      nuevosErrores.apellido = "El apellido es obligatorio";
    }

    if (email.trim() === "") {
      nuevosErrores.email = "El email es obligatorio";
    } else {
      const resultadoEmail = validateEmail(email);
      if (resultadoEmail !== true) {
        nuevosErrores.email = resultadoEmail;
      }
    }

    if (password === "") {
      nuevosErrores.password = "La contraseña es obligatoria";
    } else if (confirmarPassword === "") {
      nuevosErrores.confirmarPassword = "Debes confirmar la contraseña";
    } else {
      const resultadoPassword = validatePassword(password, confirmarPassword);
      if (resultadoPassword !== true) {
        if (resultadoPassword === "Las contraseñas no coinciden.") {
          nuevosErrores.confirmarPassword = resultadoPassword;
        } else {
          nuevosErrores.password = resultadoPassword;
        }
      }
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

      await api.post("/auth/register", {
        nombre: nombre.trim(),
        apellido: apellido.trim(),
        email: emailNormalizado,
        password,
        role: rol,
      });

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
            apellido: data.apellido,
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
        id: user.id,
        email: user.email,
        nombre: user.nombre,
        apellido: user.apellido,
        rol: user.rol,
        fotoUrl: user.fotoUrl || "",
        asistenteVirtualId: user.asistenteVirtualId || "PER",
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
              label="Apellido"
              placeholder="Gómez"
              value={apellido}
              onChange={(evento) => setApellido(evento.target.value)}
              error={errores.apellido}
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