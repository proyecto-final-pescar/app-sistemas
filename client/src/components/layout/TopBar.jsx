// client/src/components/layout/TopBar.jsx
import { useAuth } from "../../hooks/useAuth";
const TopBar = ({ title = "Dashboard", notifications = 2 }) => {
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

  return (
    <header
      style={{
        width: "100%",
        boxSizing: "border-box",
        backgroundColor: "#ffffff",
        borderBottom: "1px solid #ede9fe",
        height: "72px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 24px",
        overflow: "hidden",
        fontFamily: "Arial, Helvetica, sans-serif",
      }}
    >
      {/* el titulo de la seccion y agrego la fecha */}
      <div>
        <h1
          style={{
            margin: 0,
            fontSize: "18px",
            fontWeight: "600",
            color: "#1e1b4b",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {title}
        </h1>
        <p style={{ margin: 0, fontSize: "13px", color: "#6b7280", marginTop: "2px" }}>
          {fecha}
        </p>
      </div>

      {/* Acciones del lado derecho */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          flexShrink: 0,
        }}
      >
        {/* Campana con badge */}
        <div style={{ position: "relative" }}>
          <div
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "50%",
              backgroundColor: "#f5f3ff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#7c3aed"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
          </div>

          {/* Badge de notificaciones */}
          {notifications > 0 && (
            <span
              style={{
                position: "absolute",
                top: "0px",
                right: "0px",
                backgroundColor: "#ef4444",
                color: "#ffffff",
                fontSize: "10px",
                fontWeight: "700",
                width: "18px",
                height: "18px",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "2px solid #ffffff",
              }}
            >
              {notifications > 9 ? "9+" : notifications}
            </span>
          )}
        </div>

       
      {/* Avatar del usuario */}
{usuario?.fotoUrl ? (
  <img
    src={usuario.fotoUrl}
    alt={usuario?.nombre || usuario?.name || "Usuario"}
    title={usuario?.nombre || usuario?.name || "Usuario"}
    style={{
      width: "40px",
      height: "40px",
      borderRadius: "50%",
      objectFit: "cover",
      cursor: "pointer",
      flexShrink: 0,
    }}
  />
) : (
  <div
    title={usuario?.nombre || usuario?.name || "Usuario"}
    style={{
      width: "40px",
      height: "40px",
      borderRadius: "50%",
      backgroundColor: "#7c3aed",
      color: "#ffffff",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      cursor: "pointer",
      flexShrink: 0,
      fontWeight: "700",
      fontSize: "16px",
      textTransform: "uppercase",
    }}
  >
    {inicial}
  </div>
)}
      </div>
    </header>
  );
};

export default TopBar;