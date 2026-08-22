import { useState, useCallback, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Input from "../../../components/ui/input/Input";
import { verificarCuenta, reenviarVerificacion } from "../../../services/authService";
import "./VerificarCuenta.css";
import PanelAuth from "../../../components/ui/panel-auth/PanelAuth";
import logo from "../../../../public/logo-mypet.svg";
import logo2 from "../../../../public/mypet2.svg";
import { MdCheckCircle } from "react-icons/md";

// Estados posibles de la pantalla. Cubren los 6 casos:
// a) VERIFICADO       -> token válido, primera vez
// b) VENCIDO          -> token válido pero expirado
// c) YA_VERIFICADO    -> token válido, la cuenta ya estaba verificada
// d) INVALIDO         -> token inexistente / mal formado
// e) sin token en la URL -> se resuelve como INVALIDO sin pegarle al backend
// f) ERROR_RED        -> no hubo respuesta del server (red caída, timeout, 500)
const ESTADOS = {
  CARGANDO: "cargando",
  VERIFICADO: "verificado",
  YA_VERIFICADO: "ya_verificado",
  VENCIDO: "vencido",
  INVALIDO: "invalido",
  ERROR_RED: "error_red",
};

export default function VerificarCuenta() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();

  // (e) Sin token en la URL: mismo tratamiento que token inválido,
  // sin pegarle al backend.
  const [estado, setEstado] = useState(token ? ESTADOS.CARGANDO : ESTADOS.INVALIDO);

  const [mostrarReenvio, setMostrarReenvio] = useState(false);
  const [email, setEmail] = useState("");
  const [reenviando, setReenviando] = useState(false);
  const [reenvioEnviado, setReenvioEnviado] = useState(false);
  const [errorReenvio, setErrorReenvio] = useState(null);

  const intentarVerificar = useCallback(async () => {
    if (!token) return;

    setEstado(ESTADOS.CARGANDO);

    try {
      const data = await verificarCuenta(token);

      if (data.code === "ALREADY_VERIFIED") {
        setEstado(ESTADOS.YA_VERIFICADO);
      } else {
        setEstado(ESTADOS.VERIFICADO);
      }
    } catch (err) {
      const code = err.response?.data?.code;

      if (code === "EXPIRED") {
        setEstado(ESTADOS.VENCIDO);
      } else if (code === "INVALID") {
        setEstado(ESTADOS.INVALIDO);
      } else {
        // Server respondió con algo inesperado (ej. 500) o no respondió
        // nada (red caída, timeout): mismo tratamiento, con reintento.
        setEstado(ESTADOS.ERROR_RED);
      }
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      intentarVerificar();
    }
  }, [token, intentarVerificar]);

  const handleReenviar = async (event) => {
    event.preventDefault();
    setErrorReenvio(null);
    setReenviando(true);

    try {
      await reenviarVerificacion(email.trim().toLowerCase());
      setReenvioEnviado(true);
    } catch (err) {
      setErrorReenvio(
        err.response?.data?.message || "No se pudo reenviar el correo. Probá de nuevo."
      );
    } finally {
      setReenviando(false);
    }
  };

  const renderReenvio = () => {
    if (reenvioEnviado) {
      return (
        <p className="reset__success-text verificar__reenvio-ok">
          Si el email está registrado y pendiente de verificación, vas a
          recibir un correo con un nuevo enlace.
        </p>
      );
    }

    if (!mostrarReenvio) {
      return (
        <button
          type="button"
          className="verificar__btn-secundario"
          onClick={() => setMostrarReenvio(true)}
        >
          Reenviar mail de verificación
        </button>
      );
    }

    return (
      <form onSubmit={handleReenviar} className="verificar__reenvio-form">
        {errorReenvio && (
          <div className="reset__error" role="alert">
            {errorReenvio}
          </div>
        )}
        <Input
          label="Email"
          placeholder="tu@email.com"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
        <button type="submit" className="reset__btn" disabled={reenviando}>
          {reenviando ? "Enviando..." : "Reenviar correo"}
        </button>
      </form>
    );
  };

  // (f) Cargando: mientras se está confirmando el link contra el backend.
  if (estado === ESTADOS.CARGANDO) {
    return (
      <PanelAuth
        logoLeft={logo}
        logoRight={logo2}
        titulo="Verificando tu cuenta..."
        subtitulo="Esperá un momento"
      >
        <div className="reset__content">
          <div className="reset__success">
            <p className="reset__success-text">
              Estamos confirmando tu enlace de verificación.
            </p>
          </div>
        </div>
      </PanelAuth>
    );
  }

  // (a) Verificación exitosa, primera vez.
  if (estado === ESTADOS.VERIFICADO) {
    return (
      <PanelAuth logoLeft={logo} logoRight={logo2} titulo="¡Cuenta verificada!">
        <div className="reset__content">
          <div className="reset__success">
            <MdCheckCircle className="reset__success-icon" size={56} aria-hidden="true" />
            <h2 className="reset__success-title">Tu cuenta ya está activa</h2>
            <p className="reset__success-text">
              Ya podés iniciar sesión con tu email y contraseña.
            </p>
          </div>
          <button type="button" className="reset__btn" onClick={() => navigate("/login")}>
            Ir a iniciar sesión
          </button>
        </div>
      </PanelAuth>
    );
  }

  // (c) Token ya usado / cuenta ya verificada: no es un error real.
  if (estado === ESTADOS.YA_VERIFICADO) {
    return (
      <PanelAuth logoLeft={logo} logoRight={logo2} titulo="Cuenta ya verificada">
        <div className="reset__content">
          <div className="reset__success">
            <MdCheckCircle className="reset__success-icon" size={56} aria-hidden="true" />
            <h2 className="reset__success-title">Tu cuenta ya estaba verificada</h2>
            <p className="reset__success-text">Podés iniciar sesión normalmente.</p>
          </div>
          <button type="button" className="reset__btn" onClick={() => navigate("/login")}>
            Ir a iniciar sesión
          </button>
        </div>
      </PanelAuth>
    );
  }

  // (b) Token vencido: ofrece reenviar el mail.
  if (estado === ESTADOS.VENCIDO) {
    return (
      <PanelAuth logoLeft={logo} logoRight={logo2} titulo="El enlace venció">
        <div className="reset__content">
          <div className="reset__success">
            <span className="reset__success-icon" aria-hidden="true">⚠️</span>
            <h2 className="reset__success-title">Este enlace ya no es válido</h2>
            <p className="reset__success-text">
              Los enlaces de verificación vencen a las 24hs. Pedí uno nuevo.
            </p>
          </div>
          {renderReenvio()}
        </div>
      </PanelAuth>
    );
  }

  // (f) Error de red o del servidor: ofrece reintentar la misma verificación.
  if (estado === ESTADOS.ERROR_RED) {
    return (
      <PanelAuth logoLeft={logo} logoRight={logo2} titulo="No pudimos verificar tu cuenta">
        <div className="reset__content">
          <div className="reset__success">
            <span className="reset__success-icon" aria-hidden="true">⚠️</span>
            <h2 className="reset__success-title">Hubo un problema de conexión</h2>
            <p className="reset__success-text">
              No pudimos comunicarnos con el servidor. Probá de nuevo en un momento.
            </p>
          </div>
          <button type="button" className="reset__btn" onClick={intentarVerificar}>
            Reintentar
          </button>
        </div>
      </PanelAuth>
    );
  }

  // (d) Token inválido / inexistente, y (e) sin token en la URL.
  return (
    <PanelAuth logoLeft={logo} logoRight={logo2} titulo="Enlace inválido">
      <div className="reset__content">
        <div className="reset__success">
          <span className="reset__success-icon" aria-hidden="true">⚠️</span>
          <h2 className="reset__success-title">Este enlace no es válido</h2>
          <p className="reset__success-text">
            Puede que el link esté incompleto o ya no exista. Podés volver a
            intentar el registro.
          </p>
        </div>
        <button type="button" className="reset__btn" onClick={() => navigate("/registro")}>
          Volver a registrarme
        </button>
      </div>
    </PanelAuth>
  );
}
