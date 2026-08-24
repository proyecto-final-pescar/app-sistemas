// EmptyState.jsx
// Se muestra cuando no hay registros o la búsqueda no da resultados.
// Props: icon (emoji), title, text

import "./EmptyState.css";

export default function EmptyState({
  icon = "🩺",
  title = "Sin registros",
  text = "No encontramos resultados para esta búsqueda.",
}) {
  return (
    <div className="empty-state">
      <span className="empty-state__icon">{icon}</span>
      <h3 className="empty-state__title">{title}</h3>
      <p className="empty-state__text">{text}</p>
    </div>
  );
}
