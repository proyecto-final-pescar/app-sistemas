import { useState, useEffect } from "react";
import TutorMenu from "./TutorMenu";
import VeterinariaMenu from "./VeterinariaMenu";
import AdminMenu from "./AdminMenu";
import { useAuth } from "../../hooks/useAuth.js";
import { useNavigate, useLocation } from "react-router-dom";

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

  return (
    <>
      {/* Logo */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        gap: "10px", padding: "20px 20px 16px", borderBottom: "1px solid #f5f3ff"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <img src="/logo-mypett.svg" alt="Ícono MyPet" style={{ width: "40px", height: "40px" }} />
          <img src="/mypet.svg" alt="MyPet" style={{ height: "32px", width: "auto" }} />
        </div>
        {onClose && (
          <button
            onClick={onClose}
            style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              width: "32px", height: "32px", border: "none", borderRadius: "8px",
              backgroundColor: "transparent", color: "#6b7280", cursor: "pointer",
            }}
          >
            <IconClose />
          </button>
        )}
      </div>

      {/* Menú principal */}
      <div style={{ flex: 1, overflowY: "auto", padding: "12px 12px 0" }}>
        {rol === "veterinaria" && <VeterinariaMenu onNavigate={onClose} />}
        {rol === "dueno" && <TutorMenu onNavigate={onClose} />}
        {rol === "administrador" && <AdminMenu onNavigate={onClose} />}
      </div>

      {/* Bloque inferior */}
      <div style={{ borderTop: "1px solid #f5f3ff", padding: "12px 12px 10px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 12px", marginBottom: "4px" }}>
          {usuario?.fotoUrl ? (
            <img
              src={usuario.fotoUrl}
              alt={nombreMostrado}
              style={{
                width: "34px", height: "34px", borderRadius: "50%",
                objectFit: "cover", flexShrink: 0,
              }}
            />
          ) : (
            <div style={{
              width: "34px", height: "34px", borderRadius: "50%",
              backgroundColor: "#7c3aed", color: "#ffffff",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "13px", fontWeight: 600, flexShrink: 0,
            }}>{inicial}</div>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: "13px", fontWeight: 600, color: "#1f1739", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{nombreMostrado}</p>
            <p style={{ margin: 0, fontSize: "11px", color: "#8276ab" }}>{etiquetaRol}</p>
          </div>
          <button
            title="Cerrar sesión"
            onClick={() => { logout(); navigate("/login", { replace: true }); }}
            style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "30px", height: "30px", flexShrink: 0, border: "none", borderRadius: "8px", backgroundColor: "transparent", color: "#c4b5fd", cursor: "pointer" }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#fff1f4"; e.currentTarget.style.color = "#a31d34"; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.color = "#c4b5fd"; }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <button
            onClick={() => navigate("/perfil")}
            style={{
              display: "flex", alignItems: "center", gap: "12px", flex: 1, padding: "10px 12px",
              border: "none", borderRadius: "10px",
              backgroundColor: enPerfil ? "#f5f3ff" : "transparent",
              color: enPerfil ? "#7c3aed" : "#6b7280",
              fontSize: "14px", fontWeight: "500", cursor: "pointer", textAlign: "left", boxSizing: "border-box",
            }}
            onMouseEnter={(e) => { if (!enPerfil) { e.currentTarget.style.backgroundColor = "#f5f3ff"; e.currentTarget.style.color = "#7c3aed"; } }}
            onMouseLeave={(e) => { if (!enPerfil) { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.color = "#6b7280"; } }}
          >
            <IconConfig />
            Configuración
          </button>
          <button
            title="Contraer sidebar"
            style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "32px", height: "32px", flexShrink: 0, border: "none", borderRadius: "8px", backgroundColor: "transparent", color: "#c4b5fd", cursor: "pointer" }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#f5f3ff"; e.currentTarget.style.color = "#7c3aed"; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.color = "#c4b5fd"; }}
          >
            <IconCollapse />
          </button>
        </div>
      </div>
    </>
  );
};

const Sidebar = ({ title = "" }) => {
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
    return () => { document.body.style.overflow = ""; };
  }, [mobileAbierto]);

  return (
    <>
      {/* DESKTOP */}
      <aside style={{
        width: "260px", minWidth: "260px", height: "100vh",
        backgroundColor: "#ffffff", borderRight: "1px solid #ede9fe",
        display: "flex", flexDirection: "column", boxSizing: "border-box",
        position: "sticky", top: 0, fontFamily: "'Inter', Arial, Helvetica, sans-serif",
      }}
        className="sidebar-desktop"
      >
        <SidebarContenido />
      </aside>

      {/* MOBILE: barra superior */}
      <div className="sidebar-mobile-topbar" style={{
        display: "none",
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        height: "60px", backgroundColor: "#ffffff",
        borderBottom: "1px solid #ede9fe",
        alignItems: "center", justifyContent: "space-between",
        padding: "0 16px", boxSizing: "border-box",
        fontFamily: "'Inter', Arial, Helvetica, sans-serif",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <img src="/logo-mypett.svg" alt="MyPet" style={{ width: "28px", height: "28px" }} />
          {title && (
            <span style={{
              fontSize: "14px", fontWeight: 600,
              color: "#1c1033", whiteSpace: "nowrap",
              overflow: "hidden", textOverflow: "ellipsis",
              maxWidth: "180px",
            }}>
              {title}
            </span>
          )}
        </div>
        <button
          onClick={() => setMobileAbierto(true)}
          style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            width: "40px", height: "40px", border: "none", borderRadius: "10px",
            backgroundColor: "#f5f3ff", color: "#7c3aed", cursor: "pointer",
          }}
          aria-label="Abrir menú"
        >
          <IconHamburger />
        </button>
      </div>

      {/* MOBILE: overlay */}
      {mobileAbierto && (
        <div
          onClick={() => setMobileAbierto(false)}
          className="sidebar-mobile-overlay"
          style={{
            display: "none",
            position: "fixed", inset: 0, zIndex: 200,
            backgroundColor: "rgba(0, 0, 0, 0.45)",
          }}
        />
      )}

      {/* MOBILE: drawer */}
      <div
        className="sidebar-mobile-drawer"
        style={{
          position: "fixed", top: 0, left: 0, bottom: 0, zIndex: 300,
          width: "280px", backgroundColor: "#ffffff",
          display: "flex", flexDirection: "column", boxSizing: "border-box",
          fontFamily: "'Inter', Arial, Helvetica, sans-serif",
          transform: mobileAbierto ? "translateX(0)" : "translateX(-100%)",
          transition: "transform 0.25s ease",
          boxShadow: mobileAbierto ? "4px 0 20px rgba(0,0,0,0.12)" : "none",
        }}
      >
        <SidebarContenido onClose={() => setMobileAbierto(false)} />
      </div>

      <style>{`
        @media (max-width: 1023px) {
          .sidebar-desktop { display: none !important; }
          .sidebar-mobile-topbar { display: flex !important; }
          .sidebar-mobile-overlay { display: block !important; }
        }
        @media (min-width: 1024px) {
          .sidebar-mobile-topbar { display: none !important; }
          .sidebar-mobile-drawer { display: none !important; }
          .sidebar-mobile-overlay { display: none !important; }
        }
      `}</style>
    </>
  );
};

export default Sidebar;