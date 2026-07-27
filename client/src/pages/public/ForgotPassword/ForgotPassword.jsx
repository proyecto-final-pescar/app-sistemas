import { useState } from "react";
import { Link } from "react-router-dom";

import Input from "../../../components/ui/input/Input";
import { forgotPassword } from "../../../services/authService";

import "./ForgotPassword.css";
import { validateEmail } from "../../../validators/EmailValidator";

import PanelAuth from "../../../components/ui/panel-auth/PanelAuth";
import logo from "../../../../public/logo-mypet.svg";
import logo2 from "../../../../public/mypet2.svg";
import { MdOutlineMarkEmailRead } from "react-icons/md";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [enviado, setEnviado] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const result = validateEmail(email);
    if (result !== true) {
      setError(result);
      return;
    }

    try {
      setLoading(true);
      await forgotPassword(email);
      setEnviado(true);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "No pudimos procesar tu solicitud. Intentá de nuevo."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <PanelAuth
      logoLeft={logo}
      logoRight={logo2}
      titulo="Recuperar contraseña"
      subtitulo="Ingresá tu email y te enviamos un link para restablecerla"
    >

      <div className="forgot__content">
        {enviado ? (
          <div className="forgot__success">
            <MdOutlineMarkEmailRead
            className={`forgot__success-icon ${enviado ? "pulse" : ""}`}
            size={44}
            aria-hidden="true"/>
            <h2 className="forgot__success-title">¡Revisá tu correo!</h2>
            <p className="forgot__success-text">
              Te enviamos las instrucciones a <strong>{email}</strong>.
              <br />
              Si no lo ves, revisá la carpeta de spam.
            </p>
          </div>
        ) : (
          <>
            
            {error && <div className="forgot__error">{error}</div>}

            <form onSubmit={handleSubmit}>
              <Input
                label="Email"
                placeholder="ana@mypet.com"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              <button
                type="submit"
                className="forgot__btn"
                disabled={loading}
              >
                {loading ? "Enviando..." : "Enviar instrucciones →"}
              </button>
            </form>
          </>
        )}

        <p className="forgot__footer">
          ¿Te acordaste?{" "}
          <Link to="/login">Volvé a iniciar sesión</Link>
        </p>
      </div>
    </PanelAuth>
  );
}