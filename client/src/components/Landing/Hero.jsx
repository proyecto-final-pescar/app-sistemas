import { useNavigate } from "react-router-dom";
import Badge from "../ui/badge/Badge";
import Button from "../ui/button/Button";


const Hero = () => {
  const navigate = useNavigate();

  return (
    <section
      style={{
        width: "100%",
        background: "linear-gradient(180deg, #f5f3ff 0%, #ffffff 100%)",
        fontFamily: "'Inter', Arial, Helvetica, sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: "1280px",
          margin: "0 auto",
          padding: "64px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "48px",
          flexWrap: "wrap",
        }}
      >
        {/* Texto */}
        <div style={{ flex: "1 1 480px", minWidth: "300px" }}>
          <Badge texto="+12.000 mascotas registradas en CABA y GBA" variante="zona" />

          <h1
            style={{
              margin: "24px 0 0",
              fontSize: "44px",
              lineHeight: "52px",
              fontWeight: 800,
              letterSpacing: "-0.5px",
              color: "#1c1533",
            }}
          >
            Toda la salud de tu <span style={{ color: "#7c3aed" }}>mascota</span> en
            un solo lugar
          </h1>

          <p
            style={{
              margin: "20px 0 0",
              maxWidth: "480px",
              color: "#7c6aa6",
              fontSize: "17px",
              lineHeight: "26px",
              fontWeight: 400,
              letterSpacing: "-0.15px",
            }}
          >
            Unificá los datos clínicos dispersos de tu peludo en un historial
            digital, y encontrá clínicas de urgencias 24h en CABA y GBA en
            segundos — sin llamadas, sin estrés.
          </p>

          <div
            style={{
              marginTop: "32px",
              display: "flex",
              alignItems: "center",
              gap: "28px",
              flexWrap: "wrap",
            }}
          >
            <Button
              texto="Registrarme gratis"
              variante="primario"
              tamaño="grande"
              onClick={() => navigate("/registro")}
            />

            <a
              href="#como-funciona"
              style={{
                color: "#7c3aed",
                fontSize: "16px",
                fontWeight: 600,
                letterSpacing: "-0.15px",
                textDecoration: "none",
              }}
            >
              Cómo funciona ›
            </a>
          </div>

          <div
            style={{
              marginTop: "40px",
              display: "flex",
              gap: "40px",
              flexWrap: "wrap",
            }}
          >
            {[
              { value: "340+", label: "Clínicas 24h" },
              { value: "12k+", label: "Historiales" },
              { value: "48", label: "Barrios" },
            ].map((stat) => (
              <div key={stat.label}>
                <p
                  style={{
                    margin: 0,
                    color: "#7c3aed",
                    fontSize: "26px",
                    fontWeight: 800,
                    letterSpacing: "-0.3px",
                  }}
                >
                  {stat.value}
                </p>
                <p
                  style={{
                    margin: "2px 0 0",
                    color: "#7c6aa6",
                    fontSize: "14px",
                    fontWeight: 400,
                  }}
                >
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Imagen + tarjetas flotantes */}
        <div style={{ position: "relative", flex: "1 1 360px", maxWidth: "420px" }}>
          <img
            src="https://images.unsplash.com/photo-1601758228041-f3b2795255f1?auto=format&fit=crop&w=800&q=80"
            alt="Perro sonriente en la playa"
            style={{
              width: "100%",
              height: "360px",
              objectFit: "cover",
              borderRadius: "24px",
              display: "block",
              boxShadow: "0 20px 40px rgba(124, 58, 237, 0.15)",
            }}
          />

          <div
            style={{
              position: "absolute",
              top: "-16px",
              right: "8px",
              display: "flex",
              alignItems: "flex-start",
              gap: "8px",
              backgroundColor: "#ffffff",
              borderRadius: "16px",
              padding: "12px 16px",
              boxShadow: "0 10px 25px rgba(0,0,0,0.12)",
              maxWidth: "220px",
            }}
          >
            <span
              style={{
                marginTop: "6px",
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                backgroundColor: "#059669",
                flexShrink: 0,
              }}
            />
            <div>
              <p style={{ margin: 0, color: "#059669", fontSize: "12px", fontWeight: 600 }}>
                Clínica encontrada
              </p>
              <p style={{ margin: "2px 0 0", color: "#1c1533", fontSize: "14px", fontWeight: 700 }}>
                VetCenter Palermo 24h
              </p>
              <p style={{ margin: "2px 0 0", color: "#9ca3af", fontSize: "12px" }}>
                1.2 km · Abierto ahora
              </p>
            </div>
          </div>

          <div
            style={{
              position: "absolute",
              bottom: "-20px",
              left: "8px",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              backgroundColor: "#ffffff",
              borderRadius: "16px",
              padding: "12px 16px",
              boxShadow: "0 10px 25px rgba(0,0,0,0.12)",
              maxWidth: "260px",
            }}
          >
            <span
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "50%",
                backgroundColor: "#ede9fe",
                color: "#7c3aed",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <circle cx="10" cy="10" r="7.5" stroke="currentColor" strokeWidth="1.5" />
                <path d="M10 6v4l2.5 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </span>
            <div>
              <p style={{ margin: 0, color: "#9ca3af", fontSize: "12px" }}>Próximo turno</p>
              <p style={{ margin: "2px 0 0", color: "#1c1533", fontSize: "14px", fontWeight: 700 }}>
                Vacuna antirrábica · Lun 26/05
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;