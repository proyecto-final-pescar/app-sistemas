import Card from "../ui/card/Card";
import Badge from "../ui/badge/Badge";

const features = [
  {
    badgeTexto: "Historial digital",
    badgeVariante: "zona",
    iconBg: "#ede9fe",
    iconColor: "#7c3aed",
    title: "Historial Clínico Unificado",
    description:
      "Cargá todos los registros médicos de tu mascota — vacunas, cirugías, análisis — en un solo historial digital accesible en cualquier momento, sin buscar papeles.",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <path
          d="M5 2.5h7.5L17 7v10a.5.5 0 01-.5.5h-11A.5.5 0 015 17V3a.5.5 0 01.5-.5z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <path d="M7.5 10h5M7.5 13h5M7.5 7h2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    badgeTexto: "Urgencias 24h",
    badgeVariante: "buscado",
    iconBg: "#fee2e2",
    iconColor: "#ef4444",
    title: "Buscador de Urgencias 24h",
    description:
      "Encontrá la clínica veterinaria más cercana abierta las 24 horas en CABA y GBA con un clic. Filtrá por especialidad, distancia y disponibilidad en tiempo real.",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <circle cx="10" cy="10" r="7.5" stroke="currentColor" strokeWidth="1.5" />
        <path d="M10 6v4l2.7 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    badgeTexto: "Comparador",
    badgeVariante: "encontrado",
    iconBg: "#d1fae5",
    iconColor: "#059669",
    title: "Precios Transparentes",
    description:
      "Comparé consultas, cirugías y tratamientos entre clínicas de tu zona. Sin sorpresas: sabé exactamente cuánto vas a pagar antes de sacar turno.",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <path
          d="M3 6l4.5 4.5L11 7l6 6"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path d="M13 13h4v-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
];

const Features = () => {
  return (
    <section
      style={{
        width: "100%",
        backgroundColor: "#ffffff",
        padding: "80px 24px",
        fontFamily: "'Inter', Arial, Helvetica, sans-serif",
      }}
    >
      <div style={{ maxWidth: "1120px", margin: "0 auto", textAlign: "center" }}>
        <h2
          style={{
            margin: 0,
            fontSize: "32px",
            fontWeight: 800,
            letterSpacing: "-0.4px",
            color: "#1c1533",
          }}
        >
          Todo lo que necesitás,{" "}
          <span style={{ color: "#7c3aed" }}>siempre disponible</span>
        </h2>
        <p
          style={{
            margin: "16px auto 0",
            maxWidth: "540px",
            color: "#7c6aa6",
            fontSize: "16px",
            lineHeight: "24px",
          }}
        >
          Diseñado para dueños de mascotas en Buenos Aires que quieren acceso
          inmediato a toda la información médica de su compañero.
        </p>

        <div
          style={{
            marginTop: "56px",
            display: "flex",
            gap: "24px",
            flexWrap: "wrap",
          }}
        >
          {features.map((feature) => (
            <div key={feature.title} style={{ flex: "1 1 300px", minWidth: "260px" }}>
            <Card>
              <div style={{ textAlign: "left" }}>
                <span
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "44px",
                    height: "44px",
                    borderRadius: "12px",
                    backgroundColor: feature.iconBg,
                    color: feature.iconColor,
                  }}
                >
                  {feature.icon}
                </span>

                <div style={{ marginTop: "16px" }}>
                  <Badge texto={feature.badgeTexto} variante={feature.badgeVariante} />
                </div>

                <h3
                  style={{
                    margin: "12px 0 0",
                    fontSize: "18px",
                    fontWeight: 700,
                    color: "#1c1533",
                  }}
                >
                  {feature.title}
                </h3>
                <p
                  style={{
                    margin: "8px 0 0",
                    color: "#7c6aa6",
                    fontSize: "14px",
                    lineHeight: "22px",
                  }}
                >
                  {feature.description}
                </p>
              </div>
            </Card>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;