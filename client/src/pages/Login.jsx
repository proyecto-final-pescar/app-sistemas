import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.js";
import api from "../services/api.js";
import { obtenerMiVeterinaria } from "../services/veterinariaService.js";
import styles from "./Login.module.css";

function Login() {
  const navigate = useNavigate();
  const { setUsuario } = useAuth();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((currentData) => ({
      ...currentData,
      [name]: value,
    }));
  };

  const getErrorMessage = (data) => {
    if (typeof data === "string") {
      return data;
    }

    return (
      data?.message ||
      data?.mensaje ||
      data?.error ||
      "No se pudo iniciar sesion."
    );
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const { data } = await api.post("/auth/login", {
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
      });

      const token = data.token || data.jwt || data.accessToken;
      const user = data.user || data.usuario || {};

      if (!token) {
        setError("No se recibio un token de autenticacion.");
        return;
      }

      const userData = {
        id: user.id || user._id || data.id,
        email: user.email || data.email || formData.email.trim().toLowerCase(),
        nombre: user.nombre || user.name || data.nombre || data.name,
        rol: user.rol || user.role || data.rol || data.role,
        fotoUrl: user.fotoUrl || data.fotoUrl || "",
        asistenteVirtual: user.asistenteVirtual || data.asistenteVirtual || "perro",
      };

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(userData));
      setUsuario(userData);

      const rol = userData.rol;
      if (rol === "dueno") {
        navigate("/home", { replace: true }); /*/home*/
        return;
      }

      if (rol === "veterinaria") {
        try {
          const miVeterinaria = await obtenerMiVeterinaria();
          const tienePerfilCompletado = Boolean(
            miVeterinaria?._id || miVeterinaria?.nombre,
          );

          if (tienePerfilCompletado) {
            navigate("/home-veterinaria", { replace: true });
          } else {
            navigate("/registro-veterinaria", { replace: true });
          }
        } catch (vetError) {
          navigate("/registro-veterinaria", { replace: true });
        }
        return;
      }

      if (rol === "administrador") {
        navigate("/dashboard", { replace: true });
        return;
      }

      navigate("/home", { replace: true });
    } catch (requestError) {
      const responseData = requestError.response?.data;

      if (responseData) {
        setError(getErrorMessage(responseData));
      } else if (requestError.request) {
        setError(
          "No se pudo conectar con el servidor. Revisá tu conexión e intentá de nuevo.",
        );
      } else {
        setError("Ocurrió un error inesperado. Por favor intentá nuevamente.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className={styles.page}>
      <div className={styles.backgroundIconTop}>♥</div>
      <div className={styles.backgroundIconLeft}>♥</div>
      <div className={styles.backgroundIconBottom}>♥</div>

      <header className={styles.brand}>
        <img src="/logo-mypet.svg" alt="" className={styles.brandIcon} />
        <img src="/mypet2.svg" alt="MyPet" className={styles.brandLogo} />
      </header>

      <section className={styles.panel} aria-labelledby="login-title">
        <span aria-hidden="true" className={styles.panelTopBar} />

        <div className={styles.heading}>
          <h1 id="login-title" className={styles.title}>
            Iniciar sesión
          </h1>
          <p className={styles.subtitle}>Ingresá con tu email y contraseña</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <label className={styles.field}>
            <span className={styles.label}>Email</span>
            <span className={styles.inputWrap}>
              <span aria-hidden="true" className={styles.inputIcon}>
                <EnvelopeIcon />
              </span>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                autoComplete="email"
                placeholder="ana@mypet.com"
                required
                className={styles.input}
              />
            </span>
          </label>

          <label className={styles.field}>
            <span className={styles.labelRow}>
              <span className={styles.label}>Contraseña</span>
              <a href="/forgot-password" className={styles.forgotLink}>
                ¿Olvidaste tu contraseña?
              </a>
            </span>
            <span className={styles.inputWrap}>
              <span aria-hidden="true" className={styles.inputIcon}>
                <LockIcon />
              </span>
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                autoComplete="current-password"
                placeholder="Mínimo 8 caracteres"
                required
                className={styles.input}
              />
              <button
                type="button"
                aria-label={
                  showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
                }
                onClick={() => setShowPassword((currentValue) => !currentValue)}
                className={styles.passwordButton}
              >
                <EyeIcon />
              </button>
            </span>
          </label>

          {error && (
            <p role="alert" aria-live="polite" className={styles.error}>
              {error}
            </p>
          )}

          <button type="submit" disabled={isLoading} className={styles.button}>
            {isLoading ? "Ingresando..." : "Ingresar  →"}
          </button>

          <div className={styles.divider}>
            <span className={styles.dividerLine} />
            <span className={styles.dividerText}>o continuá con</span>
            <span className={styles.dividerLine} />
          </div>

          <div className={styles.socialGrid}>
            <button type="button" className={styles.socialButton}>
              Google
            </button>
            <button type="button" className={styles.socialButton}>
              Apple
            </button>
          </div>

          <p className={styles.registerText}>
            ¿No tenés cuenta?{" "}
            <a href="/registro" className={styles.registerLink}>
              Registrate
            </a>
          </p>
        </form>
      </section>

      <p className={styles.termsText}>
        Al ingresar aceptás nuestros{" "}
        <a href="/terminos" className={styles.termsLink}>
          Términos
        </a>{" "}
        y{" "}
        <a href="/privacidad" className={styles.termsLink}>
          Privacidad
        </a>
      </p>

      <button type="button" aria-label="Ayuda" className={styles.helpButton}>
        ?
      </button>
    </main>
  );
}

function EnvelopeIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect width="18" height="14" x="3" y="5" rx="2" stroke="currentColor" strokeWidth="2" />
      <path d="m4 7 8 6 8-6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect width="16" height="11" x="4" y="10" rx="2" stroke="currentColor" strokeWidth="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M2.5 12s3.4-6 9.5-6 9.5 6 9.5 6-3.4 6-9.5 6-9.5-6-9.5-6Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="2" />
      <circle cx="12" cy="12" r="2.5" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

export default Login; 