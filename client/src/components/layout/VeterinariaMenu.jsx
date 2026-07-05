import { useNavigate, useLocation } from "react-router-dom";

const menuItems = [
  {
    label: "Registro",
    path: "/registro-veterinaria",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
      </svg>
    ),
  },
  {
    label: "Historial Clínico",
    path: "/historial-clinico",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="12" y1="11" x2="12" y2="17" />
        <line x1="9" y1="14" x2="15" y2="14" />
      </svg>
    ),
  },
  {
    label: "Turnos",
    path: "/turnos-veterinaria",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
  },
];

const VeterinariaMenu = () => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <nav style={{ padding: "8px 0", fontFamily: "'Inter', Arial, Helvetica, sans-serif" }}>
      {menuItems.map((item) => {
        const isActive = location.pathname === item.path;
        return (
          <button
            key={item.label}
            onClick={() => navigate(item.path)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              width: "100%",
              padding: "11px 20px",
              border: "none",
              borderRadius: "10px",
              backgroundColor: isActive ? "#ede9fe" : "transparent",
              color: isActive ? "#6d28d9" : "#6b7280",
              fontSize: "14px",
              lineHeight: "20px",
              fontWeight: isActive ? "500" : "400",
              letterSpacing: "-0.15px",
              cursor: "pointer",
              textAlign: "left",
              transition: "background-color 0.15s, color 0.15s",
              boxSizing: "border-box",
            }}
            onMouseEnter={(e) => {
              if (!isActive) {
                e.currentTarget.style.backgroundColor = "#f5f3ff";
                e.currentTarget.style.color = "#7c3aed";
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive) {
                e.currentTarget.style.backgroundColor = "transparent";
                e.currentTarget.style.color = "#6b7280";
              }
            }}
          >
            <span style={{ flexShrink: 0 }}>{item.icon}</span>
            {item.label}
            {isActive && (
              <span style={{
                marginLeft: "auto",
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                backgroundColor: "#7c3aed",
                flexShrink: 0,
              }} />
            )}
          </button>
        );
      })}
    </nav>
  );
};

export default VeterinariaMenu;