// ConsultaBadge.jsx
// Muestra un badge de color según el tipo de consulta.
// Prop tipo: "vacunacion" | "cirugia" | "consulta" | "control" | "desparasitacion" | "otro"

import "./ConsultaBadge.css";

const CONFIG = {
  vacunacion:       { label: "Vacunación",       emoji: "💉" },
  cirugia:          { label: "Cirugía",           emoji: "🔬" },
  consulta:         { label: "Consulta",          emoji: "🩺" },
  control:          { label: "Control",           emoji: "📋" },
  desparasitacion:  { label: "Desparasitación",   emoji: "🧪" },
  otro:             { label: "Otro",              emoji: "📌" },
};

export default function ConsultaBadge({ tipo = "otro" }) {
  const cfg = CONFIG[tipo] || CONFIG.otro;
  return (
    <span className={`consulta-badge consulta-badge--${tipo}`}>
      {cfg.emoji} {cfg.label}
    </span>
  );
}
