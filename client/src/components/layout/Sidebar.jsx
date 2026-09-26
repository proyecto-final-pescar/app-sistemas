import { useState, useEffect } from "react";
import TutorMenu from "./TutorMenu";
import VeterinariaMenu from "./VeterinariaMenu";
import AdminMenu from "./AdminMenu";
import LogoutModal from "../ui/logout-modal/LogoutModal";
import NotificationBell from "../notifications/NotificationBell";
import { useAuth } from "../../hooks/useAuth.js";
import { useNavigate, useLocation } from "react-router-dom";

import styles from "./Sidebar.module.css";

const IconConfig = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

const IconCollapse = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6" />
  </svg>
);

const IconHamburger = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="6" x2="21" y2="6" />
    <line x1="3" y1="12" x2="21" y2="12" />
    <line x1="3" y1="18" x2="21" y2="18" />
  </svg>
);

const IconClose = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const ETIQUETAS_ROL = {
  dueno: "Tutor",
  veterinaria: "Veterinario",
  administrador: "Administrador",
};

const SidebarContenido = ({ onClose }) => {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const enPerfil = location.pathname === "/perfil";

  const rol = usuario?.rol;
  const nombreMostrado = usuario?.nombre || usuario?.email || "Usuario";
  const inicial = nombreMostrado.charAt(0).toUpperCase();
  const etiquetaRol = ETIQUETAS_ROL[rol] || "Usuario";

  const handleLogoutConfirm = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <>
      {/* Logo */}
      <div className={styles.logoHeader}>
        <div className={styles.logoGroup}>
          <img src="/logo-mypett.svg" alt="Ícono MyPet" className={styles.logoIcon} />
          <img src="/mypet.svg" alt="MyPet" className={styles.logoWordmark} />
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className={styles.closeButton}
            aria-label="Cerrar menú"
          >
            <IconClose />
          </button>
        )}
      </div>

      {/* Menú principal */}
      <div className={styles.menuArea}>
        {rol === "veterinaria" && <VeterinariaMenu onNavigate={onClose} />}
        {rol === "dueno" && <TutorMenu onNavigate={onClose} />}
        {rol === "administrador" && <AdminMenu onNavigate={onClose} />}
      </div>

      {/* Bloque inferior */}
      <div className={styles.bottomBlock}>
        <div className={styles.profileRow}>
          {usuario?.fotoUrl ? (
            <img src={usuario.fotoUrl} alt={nombreMostrado} className={styles.avatarImg} />
          ) : (
            <div className={styles.avatarFallback}>{inicial}</div>
          )}
          <div className={styles.profileInfo}>
            <p className={styles.profileName}>{nombreMostrado}</p>
            <p className={styles.profileRole}>{etiquetaRol}</p>
          </div>
          <LogoutModal onConfirm={handleLogoutConfirm}>
            <button title="Cerrar sesión" className={styles.logoutButton}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </button>
          </LogoutModal>
        </div>

        <div className={styles.actionsRow}>
          <button
            onClick={() => navigate("/perfil")}
            className={`${styles.configButton} ${enPerfil ? styles.configButtonActive : ""}`}
          >
            <IconConfig />
            Configuración
          </button>
          <button
            title="Contraer sidebar"
            className={styles.collapseButton}
          >
            <IconCollapse />
          </button>
        </div>
      </div>
    </>
  );
};

const Sidebar = ({ title = "Historial Clínico" }) => {
  const [mobileAbierto, setMobileAbierto] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setMobileAbierto(false);
  }, [location.pathname]);

  useEffect(() => {
    if (mobileAbierto) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileAbierto]);

  return (
    <>
      {/* DESKTOP */}
      <aside className={styles.sidebarDesktop}>
        <SidebarContenido />
      </aside>

      {/* MOBILE: barra superior */}
      <div className={styles.mobileTopbar}>
        <div className={styles.mobileTopbarLeft}>
          <img src="/logo-mypett.svg" alt="MyPet" className={styles.mobileLogo} />
          {title && <span className={styles.mobileTitle}>{title}</span>}
        </div>

        {/* Campanita + hamburguesa agrupadas: antes solo estaba el botón de
            hamburguesa acá y el space-between del padre lo empujaba solo a
            él contra el borde. Al sumar la campanita necesitan un wrapper
            propio para no separarse una de la otra. */}
        <div className={styles.mobileActions}>
          <NotificationBell />
          <button
            onClick={() => setMobileAbierto(true)}
            className={styles.hamburgerButton}
            aria-label="Abrir menú"
          >
            <IconHamburger />
          </button>
        </div>
      </div>

      {/* MOBILE: overlay */}
      {mobileAbierto && (
        <div
          onClick={() => setMobileAbierto(false)}
          className={styles.mobileOverlay}
        />
      )}

      {/* MOBILE: drawer */}
      <div
        className={`${styles.mobileDrawer} ${mobileAbierto ? styles.mobileDrawerAbierto : ""}`}
      >
        <SidebarContenido onClose={() => setMobileAbierto(false)} />
      </div>
    </>
  );
};

export default Sidebar;