// SearchBar.jsx
// Componente de búsqueda con ícono de lupa.
// Props:
//   value    → string: valor controlado del input
//   onChange → fn: handler al escribir
//   placeholder → string: texto del placeholder

import "./SearchBar.css";

const IconLupa = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="7" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

export default function SearchBar({ value, onChange, placeholder = "Buscar..." }) {
  return (
    <div className="search-bar">
      <span className="search-bar__icon"><IconLupa /></span>
      <input
        className="search-bar__input"
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
      />
    </div>
  );
}
