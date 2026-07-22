import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Input from "../../../components/ui/input/Input";
import { resetPassword } from "../../../services/authService";
import "./ResetPassword.css";
import { validatePassword } from "../../../validators/PasswordValidator";
import PanelAuth from "../../../components/ui/panel-auth/PanelAuth";
import logo from "../../../../public/logo-mypet.svg";
import logo2 from "../../../../public/mypet2.svg";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { MdCheckCircle } from "react-icons/md";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();

  const [password, setPassword]         = useState("");
  const [confirmar, setConfirmar]       = useState("");
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState(null);
  const [exitoso, setExitoso]           = useState(false);
  const [verPassword, setVerPassword]   = useState(false);
  const [verConfirmar, setVerConfirmar] = useState(false);

  // Guard: si no hay token mostramos la vista de link inválido dentro del panel
  if (!token) {
    return (
      <PanelAuth
        logoLeft={logo}
        logoRight={logo2}
        titulo="Link inválido"
        subtitulo=""
      >
        <div className="reset__content">
          <div className="reset__success">
            <span className="reset__success-icon">⚠️</span>
            <h2 className="reset__success-title">Link inválido</h2>
            <p className="reset__success-text">
              Este link no es válido o ya expiró.<br />
              <a href="/forgot-password" style={{ color: "var(--color-primario)", fontWeight: 600 }}>
                Pedí uno nuevo
              </a>
            </p>
          </div>
        </div>
      </PanelAuth>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const result = validatePassword(password, confirmar);
    if (result !== true) {
      setError(result);
      return;
    }

    try {
      setLoading(true);
      await resetPassword(token, password);
      setExitoso(true);

      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "El link expiró o no es válido. Pedí uno nuevo."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <PanelAuth
      logoLeft={logo}
      logoRight={logo2}
      titulo="Restablecer contraseña"
      subtitulo="Creá tu nueva contraseña para volver a acceder a tu cuenta"
    >
      <div className="reset__content">
        {exitoso ? (
          <div className="reset__success">
            <MdCheckCircle className="reset__success-icon" size={56} aria-hidden="true" />
            <h2 className="reset__success-title">¡Contraseña actualizada!</h2>
            <p className="reset__success-text">
              Te estamos redirigiendo al inicio de sesión…
            </p>
          </div>
        ) : (
          <>
            {error && <div className="reset__error" role="alert">{error}</div>}

            <form onSubmit={handleSubmit}>
              <div className="reset__password-wrap">
                <Input
                  label="Nueva contraseña"
                  placeholder="Mínimo 8 caracteres"
                  type={verPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="reset__eye-btn"
                  onClick={() => setVerPassword(!verPassword)}
                  aria-label={verPassword ? "Ocultar contraseña" : "Ver contraseña"}
                >
                  {verPassword ? <FiEye /> : <FiEyeOff />}
                </button>
              </div>

              <div className="reset__password-wrap">
                <Input
                  label="Confirmar nueva contraseña"
                  placeholder="Repetí tu contraseña"
                  type={verConfirmar ? "text" : "password"}
                  value={confirmar}
                  onChange={(e) => setConfirmar(e.target.value)}
                />
                <button
                  type="button"
                  className="reset__eye-btn"
                  onClick={() => setVerConfirmar(!verConfirmar)}
                  aria-label={verConfirmar ? "Ocultar contraseña" : "Ver contraseña"}
                >
                  {verConfirmar ? <FiEye /> : <FiEyeOff />}
                </button>
              </div>

              <button
                type="submit"
                className="reset__btn"
                disabled={loading}
              >
                {loading ? "Actualizando..." : "Actualizar contraseña"}
              </button>
            </form>
          </>
        )}
      </div>
    </PanelAuth>
  );
}
