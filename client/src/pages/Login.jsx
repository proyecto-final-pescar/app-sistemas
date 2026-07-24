import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.js";
import api from "../services/api.js";
import { obtenerMiVeterinaria } from "../services/veterinariaService.js";

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
      };

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(userData));
      setUsuario(userData);

      const rol = userData.rol;
      if (rol === "dueno") {
        navigate("/mascotas", { replace: true }); /*/home*/
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
          // Si la API responde error (ej. 404 porque aún no existe el
          // perfil de veterinaria), asumimos que falta completar el registro.
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
    <main style={styles.page}>
      <div style={styles.backgroundIconTop}>♥</div>
      <div style={styles.backgroundIconLeft}>♥</div>
      <div style={styles.backgroundIconBottom}>♥</div>

      <header style={styles.brand}>
        <img src="/logo-mypet.svg" alt="" style={styles.brandIcon} />
        <img src="/mypet2.svg" alt="MyPet" style={styles.brandLogo} />
      </header>

      <section style={styles.panel} aria-labelledby="login-title">
        <span aria-hidden="true" style={styles.panelTopBar} />

        <div style={styles.heading}>
          <h1 id="login-title" style={styles.title}>
            Iniciar sesión
          </h1>
          <p style={styles.subtitle}>Ingresá con tu email y contraseña</p>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          <label style={styles.field}>
            <span style={styles.label}>Email</span>
            <span style={styles.inputWrap}>
              <span aria-hidden="true" style={styles.inputIcon}>
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
                style={styles.input}
              />
            </span>
          </label>

          <label style={styles.field}>
            <span style={styles.labelRow}>
              <span style={styles.label}>Contraseña</span>
              <a href="/forgot-password" style={styles.forgotLink}>
                ¿Olvidaste tu contraseña?
              </a>
            </span>
            <span style={styles.inputWrap}>
              <span aria-hidden="true" style={styles.inputIcon}>
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
                style={styles.input}
              />
              <button
                type="button"
                aria-label={
                  showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
                }
                onClick={() => setShowPassword((currentValue) => !currentValue)}
                style={styles.passwordButton}
              >
                <EyeIcon />
              </button>
            </span>
          </label>

          {error && (
            <p role="alert" aria-live="polite" style={styles.error}>
              {error}
            </p>
          )}

          <button type="submit" disabled={isLoading} style={styles.button}>
            {isLoading ? "Ingresando..." : "Ingresar  →"}
          </button>

          <div style={styles.divider}>
            <span style={styles.dividerLine} />
            <span style={styles.dividerText}>o continuá con</span>
            <span style={styles.dividerLine} />
          </div>

          <div style={styles.socialGrid}>
            <button type="button" style={styles.socialButton}>
              Google
            </button>
            <button type="button" style={styles.socialButton}>
              Apple
            </button>
          </div>

          <p style={styles.registerText}>
            ¿No tenés cuenta?{" "}
            <a href="/registro" style={styles.registerLink}>
              Registrate
            </a>
          </p>
        </form>
      </section>

      <p style={styles.termsText}>
        Al ingresar aceptás nuestros{" "}
        <a href="/terminos" style={styles.termsLink}>
          Términos
        </a>{" "}
        y{" "}
        <a href="/privacidad" style={styles.termsLink}>
          Privacidad
        </a>
      </p>

      <button type="button" aria-label="Ayuda" style={styles.helpButton}>
        ?
      </button>
    </main>
  );
}

function EnvelopeIcon() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <rect
        width="18"
        height="14"
        x="3"
        y="5"
        rx="2"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="m4 7 8 6 8-6"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <rect
        width="16"
        height="11"
        x="4"
        y="10"
        rx="2"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M8 10V7a4 4 0 0 1 8 0v3"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="2"
      />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M2.5 12s3.4-6 9.5-6 9.5 6 9.5 6-3.4 6-9.5 6-9.5-6-9.5-6Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="2"
      />
      <circle cx="12" cy="12" r="2.5" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    position: "relative",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "26px",
    overflow: "hidden",
    boxSizing: "border-box",
    padding: "36px 20px 54px",
    background:
      "radial-gradient(circle at 88% 16%, rgba(126, 58, 237, 0.12), transparent 24%), radial-gradient(circle at 6% 94%, rgba(124, 58, 237, 0.1), transparent 21%), #f5f1ff",
    fontFamily: "'Inter', Arial, Helvetica, sans-serif",
  },
  backgroundIconTop: {
    position: "absolute",
    top: "24px",
    right: "72px",
    color: "#e8ddff",
    fontSize: "42px",
    transform: "rotate(-18deg)",
  },
  backgroundIconLeft: {
    position: "absolute",
    top: "49%",
    left: "22px",
    color: "#eadfff",
    fontSize: "28px",
    transform: "rotate(22deg)",
  },
  backgroundIconBottom: {
    position: "absolute",
    bottom: "140px",
    right: "118px",
    color: "#eadfff",
    fontSize: "22px",
    transform: "rotate(-28deg)",
  },
  brand: {
    position: "relative",
    zIndex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "16px",
  },
  brandIcon: {
    width: "58px",
    height: "58px",
    objectFit: "contain",
    boxShadow: "0 10px 24px rgba(124, 58, 237, 0.24)",
    borderRadius: "14px",
  },
  brandLogo: {
    width: "96px",
    height: "auto",
    objectFit: "contain",
  },
  panel: {
    position: "relative",
    zIndex: 1,
    width: "100%",
    maxWidth: "438px",
    boxSizing: "border-box",
    padding: "44px 40px 38px",
    border: "1px solid #eee9fb",
    borderRadius: "22px",
    backgroundColor: "#ffffff",
    boxShadow: "0 26px 60px rgba(80, 58, 121, 0.16)",
    overflow: "hidden",
  },
  panelTopBar: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "5px",
    background: "linear-gradient(90deg, #7c3aed 0%, #8b5cf6 50%, #25a36f 100%)",
  },
  heading: {
    marginBottom: "30px",
    textAlign: "center",
  },
  title: {
    margin: 0,
    color: "#1f1739",
    fontFamily: "'Outfit', Arial, Helvetica, sans-serif",
    fontSize: "30px",
    lineHeight: "36px",
    fontWeight: 800,
    letterSpacing: 0,
  },
  subtitle: {
    margin: "8px 0 0",
    color: "#74679d",
    fontFamily: "'Inter', Arial, Helvetica, sans-serif",
    fontSize: "14px",
    lineHeight: "20px",
    fontWeight: 400,
    letterSpacing: "-0.15px",
  },
  form: {
    display: "grid",
    gap: "20px",
  },
  field: {
    display: "grid",
    gap: "9px",
  },
  labelRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "12px",
  },
  label: {
    color: "#1f1739",
    fontSize: "14px",
    lineHeight: "20px",
    fontWeight: 500,
    letterSpacing: "-0.15px",
  },
  forgotLink: {
    color: "#7c3aed",
    fontSize: "14px",
    lineHeight: "20px",
    fontWeight: 500,
    letterSpacing: "-0.15px",
    textDecoration: "none",
  },
  inputWrap: {
    display: "flex",
    alignItems: "center",
    minHeight: "46px",
    borderRadius: "18px",
    backgroundColor: "#f0ecfb",
    color: "#8276ab",
    transition: "box-shadow 160ms ease, background-color 160ms ease",
  },
  inputIcon: {
    display: "grid",
    placeItems: "center",
    width: "42px",
    flex: "0 0 42px",
    color: "#8779b0",
    fontSize: "17px",
  },
  input: {
    width: "100%",
    minWidth: 0,
    border: 0,
    padding: "0 14px 0 0",
    color: "#1f1739",
    backgroundColor: "transparent",
    fontSize: "14px",
    lineHeight: "20px",
    fontWeight: 400,
    letterSpacing: "-0.15px",
    outline: "none",
  },
  passwordButton: {
    display: "grid",
    placeItems: "center",
    width: "44px",
    height: "44px",
    flex: "0 0 44px",
    border: 0,
    color: "#8276ab",
    backgroundColor: "transparent",
    cursor: "pointer",
    fontSize: "14px",
  },
  error: {
    margin: 0,
    border: "1px solid #fac7ce",
    borderRadius: "16px",
    padding: "12px 14px",
    color: "#a31d34",
    backgroundColor: "#fff1f4",
    fontSize: "14px",
    lineHeight: "20px",
    fontWeight: 400,
    letterSpacing: "-0.15px",
  },
  button: {
    width: "100%",
    minHeight: "48px",
    border: 0,
    borderRadius: "15px",
    color: "#ffffff",
    background: "linear-gradient(135deg, #8b3cf0 0%, #792de2 100%)",
    boxShadow: "0 12px 22px rgba(124, 58, 237, 0.28)",
    fontSize: "14px",
    lineHeight: "20px",
    fontWeight: 500,
    letterSpacing: "-0.15px",
    cursor: "pointer",
  },
  divider: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    margin: "10px 0 0",
  },
  dividerLine: {
    height: "1px",
    flex: 1,
    backgroundColor: "#ece6f8",
  },
  dividerText: {
    color: "#b3a8d5",
    fontSize: "14px",
    lineHeight: "20px",
    fontWeight: 400,
    letterSpacing: "-0.15px",
  },
  socialGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "12px",
  },
  socialButton: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
    minHeight: "43px",
    border: "1px solid #e5def5",
    borderRadius: "18px",
    color: "#1f1739",
    backgroundColor: "#ffffff",
    fontSize: "14px",
    lineHeight: "20px",
    fontWeight: 500,
    letterSpacing: "-0.15px",
    cursor: "pointer",
  },
  registerText: {
    margin: "9px 0 0",
    color: "#8276ab",
    fontSize: "14px",
    lineHeight: "20px",
    fontWeight: 400,
    letterSpacing: "-0.15px",
    textAlign: "center",
  },
  registerLink: {
    color: "#7c3aed",
    fontWeight: 500,
    textDecoration: "none",
  },
  termsText: {
    position: "relative",
    zIndex: 1,
    margin: 0,
    color: "#b3a8d5",
    fontSize: "14px",
    lineHeight: "20px",
    fontWeight: 400,
    letterSpacing: "-0.15px",
    textAlign: "center",
  },
  termsLink: {
    color: "#7c3aed",
    textDecoration: "none",
  },
  helpButton: {
    position: "fixed",
    right: "14px",
    bottom: "14px",
    width: "34px",
    height: "34px",
    border: 0,
    borderRadius: "50%",
    color: "#1f1739",
    backgroundColor: "#ffffff",
    boxShadow: "0 8px 22px rgba(31, 23, 57, 0.18)",
    fontSize: "20px",
    fontWeight: 800,
    cursor: "pointer",
  },
};

export default Login;
