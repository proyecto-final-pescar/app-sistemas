import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../../hooks/useAuth.js";
import api from "../../../services/api.js";
import { obtenerMiVeterinaria } from "../../../services/veterinariaService.js";
import { obtenerMensajeError } from "../../../utils/obtenerMensajeError.js";
import styles from "./CompletarRegistroGoogle.module.css";

// si un usuario es nuevo e intenta acceder con google llega aca para seleccionar su rol

function CompletarRegistroGoogle() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setUsuario } = useAuth();

  const { googleCredential, nombre, email } = location.state || {};

  const [rol, setRol] = useState("");
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);

  // si no hay credencial de google se lo manda al login
  if (!googleCredential) {
    navigate("/login", { replace: true });
    return null;
  }

  const redirigirSegunRol = async (userData) => {
    if (userData.rol === "dueno") {
      navigate("/home", { replace: true });
      return;
    }

    if (userData.rol === "veterinaria") {
      try {
        const miVeterinaria = await obtenerMiVeterinaria();
        const tienePerfilCompletado = Boolean(
          miVeterinaria?._id || miVeterinaria?.nombre,
        );
        navigate(
          tienePerfilCompletado ? "/home-veterinaria" : "/registro-veterinaria",
          { replace: true },
        );
      } catch {
        navigate("/registro-veterinaria", { replace: true });
      }
      return;
    }

    navigate("/home", { replace: true });
  };

  const handleConfirmar = async () => {
    if (!rol) {
      setError("Elegí con qué rol querés usar MyPet.");
      return;
    }

    setError("");
    setEnviando(true);

    try {
      const { data } = await api.post("/auth/google", {
        token: googleCredential,
        role: rol,
      });

      const token = data.token;
      const user = data.usuario;

      if (!token) {
        setError("No se recibió un token de autenticación.");
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

      await redirigirSegunRol(userData);
    } catch (requestError) {
      const responseData = requestError.response?.data;

      if (responseData) {
        setError(obtenerMensajeError(responseData));
      } else if (requestError.request) {
        setError(
          "No se pudo conectar con el servidor. Revisá tu conexión e intentá de nuevo.",
        );
      } else {
        setError("Ocurrió un error inesperado. Por favor intentá nuevamente.");
      }
    } finally {
      setEnviando(false);
    }
  };

  return (
    <main className={styles.page}>
      <header className={styles.brand}>
        <img src="/logo-mypet.svg" alt="" className={styles.brandIcon} />
        <img src="/mypet2.svg" alt="MyPet" className={styles.brandLogo} />
      </header>

      <section className={styles.panel} aria-labelledby="completar-title">
        <span aria-hidden="true" className={styles.panelTopBar} />

        <div className={styles.heading}>
          <h1 id="completar-title" className={styles.title}>
            Contanos cómo querés usar MyPet
          </h1>
          <p className={styles.subtitle}>
            Confirmamos tu cuenta de Google, solo nos falta un dato más
          </p>
        </div>

        <div className={styles.googleIdentity}>
          <div className={styles.avatarPlaceholder}>
            {nombre ? nombre.charAt(0).toUpperCase() : "?"}
          </div>
          <div>
            <p className={styles.googleName}>{nombre}</p>
            <p className={styles.googleEmail}>{email}</p>
          </div>
        </div>

        <p className={styles.rolLabel}>¿Quién sos?</p>

        <div className={styles.roleGrid}>
          <button
            type="button"
            className={`${styles.roleCard} ${rol === "dueno" ? styles.roleCardSelected : ""}`}
            onClick={() => setRol("dueno")}
          >
            <span className={styles.roleIcon}>👤</span>
            <strong>Soy Tutor</strong>
          </button>

          <button
            type="button"
            className={`${styles.roleCard} ${rol === "veterinaria" ? styles.roleCardSelected : ""}`}
            onClick={() => setRol("veterinaria")}
          >
            <span className={styles.roleIcon}>🩺</span>
            <strong>Soy Veterinario</strong>
          </button>
        </div>

        {error && (
          <p role="alert" aria-live="polite" className={styles.error}>
            {error}
          </p>
        )}

        <button
          type="button"
          disabled={enviando}
          onClick={handleConfirmar}
          className={styles.button}
        >
          {enviando ? "Creando cuenta..." : "Continuar  →"}
        </button>

        <button
          type="button"
          disabled={enviando}
          onClick={() => navigate("/login", { replace: true })}
          className={styles.cancelLink}
        >
          Cancelar
        </button>
      </section>
    </main>
  );
}

export default CompletarRegistroGoogle;