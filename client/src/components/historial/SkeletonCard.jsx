// SkeletonCard.jsx — placeholder animado mientras cargan los datos.
// Renderiza N veces desde el padre: Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)

import "./SkeletonCard.css";

export default function SkeletonCard() {
  return (
    <div className="skeleton-card">
      <div className="skeleton skeleton-card__icon" />
      <div className="skeleton-card__body">
        <div className="skeleton skeleton-card__title" />
        <div className="skeleton skeleton-card__meta" />
      </div>
    </div>
  );
}
