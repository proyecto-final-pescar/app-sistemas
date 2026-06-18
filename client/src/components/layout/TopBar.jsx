// client/src/components/layout/TopBar.jsx

const TopBar = ({ title = "Dashboard", notifications = 2, userInitial = "A" }) => {
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
        fontFamily: "'Inter', Arial, Helvetica, sans-serif",
      }}
    >
      {/* Título de la página */}
      <h1
        style={{
          margin: 0,
          fontFamily: "'Outfit', Arial, Helvetica, sans-serif",
          fontSize: "30px",
          lineHeight: "36px",
          fontWeight: "800",
          letterSpacing: 0,
          color: "#1e1b4b",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {title}
      </h1>

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
                fontSize: "14px",
                lineHeight: "20px",
                fontWeight: "500",
                letterSpacing: "-0.15px",
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

        {/* Avatar con inicial */}
        <div
          style={{
            width: "40px",
            height: "40px",
            borderRadius: "50%",
            backgroundColor: "#7c3aed",
            color: "#ffffff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "15px",
            lineHeight: "20px",
            fontWeight: "500",
            letterSpacing: "-0.15px",
            cursor: "pointer",
            flexShrink: 0,
          }}
        >
          {userInitial}
        </div>
      </div>
    </header>
  );
};

export default TopBar;
