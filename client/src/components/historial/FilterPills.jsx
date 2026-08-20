// FilterPills.jsx
// Chips para filtrar el historial por mascota.
//
// Props:
//   mascotas  → [{ _id, nombre, emoji }]: lista de mascotas del tutor
//   activo    → string | null: _id de la mascota activa, null = "Todas"
//   onChange  → fn(id | null): callback al seleccionar un pill

import "./FilterPills.css";

export default function FilterPills({ mascotas = [], activo, onChange }) {
  return (
    <div className="filter-pills">
      {/* Pill "Todas" — activo cuando no hay mascota seleccionada */}
      <button
        className={`filter-pills__pill ${activo === null ? "filter-pills__pill--active" : ""}`}
        onClick={() => onChange(null)}
      >
        Todas
      </button>

      {/* Un pill por cada mascota */}
      {mascotas.map((m) => (
        <button
          key={m._id}
          className={`filter-pills__pill ${activo === m._id ? "filter-pills__pill--active" : ""}`}
          onClick={() => onChange(m._id)}
        >
          {m.emoji && <span className="filter-pills__emoji">{m.emoji}</span>}
          {m.nombre}
        </button>
      ))}
    </div>
  );
}
