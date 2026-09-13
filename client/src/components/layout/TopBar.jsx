import { useAuth } from "../../hooks/useAuth";
import NotificationBell from "../notifications/NotificationBell";

import styles from "./TopBar.module.css";

const TopBar = ({ title = "Dashboard" }) => {
  const fechaHoy = new Date().toLocaleDateString("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const { usuario } = useAuth();

  const inicial = usuario?.nombre
    ? usuario.nombre.charAt(0).toUpperCase()
    : usuario?.name
    ? usuario.name.charAt(0).toUpperCase()
    : "?";
  const fecha = fechaHoy.charAt(0).toUpperCase() + fechaHoy.slice(1);
  const nombreMostrado = usuario?.nombre || usuario?.name || "Usuario";

  return (
    // El TopBar se oculta en mobile (ver .topbarRoot en TopBar.module.css) —
    // la barra del Sidebar mobile (.mobileTopbar en Sidebar.module.css) lo reemplaza.
    <header className={styles.topbarRoot}>
      {/* Título y fecha */}
      <div className={styles.titleBlock}>
        <h1 className={styles.title}>{title}</h1>
        <p className={styles.dateText}>{fecha}</p>
      </div>

      {/* Acciones derecha */}
      <div className={styles.actions}>
        <NotificationBell />

        {/* Avatar — con soporte para foto de perfil */}
        {usuario?.fotoUrl ? (
          <img
            src={usuario.fotoUrl}
            alt={nombreMostrado}
            title={nombreMostrado}
            className={styles.avatarImg}
          />
        ) : (
          <div title={nombreMostrado} className={styles.avatarFallback}>
            {inicial}
          </div>
        )}
      </div>
    </header>
  );
};

export default TopBar;