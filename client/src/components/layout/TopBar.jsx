import { useAuth } from "../../hooks/useAuth";
import NotificationBell from "../notifications/NotificationBell";

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

  return (
    <>
      {/* El TopBar se oculta en mobile — la barra del Sidebar mobile lo reemplaza */}
      <style>{`
        .topbar-root {
          display: flex;
        }
        @media (max-width: 767px) {
          .topbar-root {
            display: none;
          }
        }
      `}</style>

      <header
        className="topbar-root"
        style={{
          width: "100%",
          boxSizing: "border-box",
          backgroundColor: "#ffffff",
          borderBottom: "1px solid #ede9fe",
          height: "72px",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 24px",
          overflow: "visible",
          fontFamily: "Arial, Helvetica, sans-serif",
        }}
      >
        {/* Título y fecha */}
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

              {/* Acciones derecha */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            flexShrink: 0,
          }}
        >
          <NotificationBell />

          {/* Avatar — con soporte para foto de perfil */}
          {usuario?.fotoUrl ? (
            <img
              src={usuario.fotoUrl}
              alt={usuario?.nombre || usuario?.name || "Usuario"}
              title={usuario?.nombre || usuario?.name || "Usuario"}
              style={{
                width: "40px", height: "40px", borderRadius: "50%",
                objectFit: "cover", cursor: "pointer", flexShrink: 0,
              }}
            />
          ) : (
            <div
              title={usuario?.nombre || usuario?.name || "Usuario"}
              style={{
                width: "40px", height: "40px", borderRadius: "50%",
                backgroundColor: "#7c3aed", color: "#ffffff",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", flexShrink: 0,
                fontWeight: "700", fontSize: "16px", textTransform: "uppercase",
              }}
            >
              {inicial}
            </div>
          )}
        </div>
      </header>
    </>
  );
};

export default TopBar;
