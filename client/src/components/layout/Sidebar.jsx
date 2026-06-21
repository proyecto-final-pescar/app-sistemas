// client/src/components/layout/Sidebar.jsx

import TutorMenu from "./TutorMenu";

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

const Sidebar = ({
  role = "tutor",
  activeItem = "Dashboard",
  onSelect,
}) => {
  return (
    <aside
      style={{
        width: "260px",
        minWidth: "260px",
        height: "100vh",
        backgroundColor: "#ffffff",
        borderRight: "1px solid #ede9fe",
        display: "flex",
        flexDirection: "column",
        boxSizing: "border-box",
        position: "sticky",
        top: 0,
        fontFamily: "'Inter', Arial, Helvetica, sans-serif",
      }}
    >
      {/* ── Logo ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          padding: "20px 20px 16px",
          borderBottom: "1px solid #f5f3ff",
        }}
      >
        <img src="/logo-mypett.svg" alt="Ícono MyPet" style={{ width: "40px", height: "40px" }} />
        <img src="/mypet.svg" alt="MyPet" style={{ height: "32px", width: "auto" }} />
      </div>

      {/* ── Menú principal ── */}
      <div style={{ flex: 1, overflowY: "auto", padding: "12px 12px 0" }}>
        {role === "tutor" && (
          <TutorMenu activeItem={activeItem} onSelect={onSelect} />
        )}
      </div>

      {/* ── Bloque inferior ── */}
      <div
        style={{
          borderTop: "1px solid #f5f3ff",
          padding: "12px 12px 10px",
        }}
      >
        {/* Fila: Configuración + botón contraer */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          {/* Configuración */}
          <button
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              flex: 1,
              padding: "10px 12px",
              border: "none",
              borderRadius: "10px",
              backgroundColor: "transparent",
              color: "#6b7280",
              fontSize: "14px",
              lineHeight: "20px",
              fontWeight: "500",
              letterSpacing: "-0.15px",
              cursor: "pointer",
              textAlign: "left",
              boxSizing: "border-box",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#f5f3ff";
              e.currentTarget.style.color = "#7c3aed";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
              e.currentTarget.style.color = "#6b7280";
            }}
          >
            <IconConfig />
            Configuración
          </button>

          {/* Contraer sidebar */}
          <button
            title="Contraer sidebar"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "32px",
              height: "32px",
              flexShrink: 0,
              border: "none",
              borderRadius: "8px",
              backgroundColor: "transparent",
              color: "#c4b5fd",
              cursor: "pointer",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#f5f3ff";
              e.currentTarget.style.color = "#7c3aed";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
              e.currentTarget.style.color = "#c4b5fd";
            }}
          >
            <IconCollapse />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
