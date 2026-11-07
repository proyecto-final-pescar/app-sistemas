import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth.js";
import LogoutModal from "../ui/logout-modal/LogoutModal";
import styles from "./HeaderMinimo.module.css";

const IconLogout = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

export default function HeaderMinimo() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogoutConfirm = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <header className={styles.header}>
      <div className={styles.logoGroup}>
        <img src="/logo-mypett.svg" alt="Ícono MyPet" className={styles.logoIcon} />
        <img src="/mypet.svg" alt="MyPet" className={styles.logoWordmark} />
      </div>
      <LogoutModal onConfirm={handleLogoutConfirm}>
        <button type="button" className={styles.logoutButton}>
          <IconLogout />
          <span>Cerrar sesión</span>
        </button>
      </LogoutModal>
    </header>
  );
}