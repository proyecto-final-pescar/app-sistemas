
// src/components/ui/info/InfoItem.jsx
import React from "react";
import "./InfoItem.css";

export default function InfoItem({ icon: Icon, label, value, className }) {
  if (!value) return null;

  return (
    <div className={`info-item ${className || ""}`}>
      <span className="info-item__label">
        <Icon className="icon-pastel" /> {label}
      </span>
      <p className={`info-item__value ${className || ""}`}>{value}</p>
    </div>
  );
}
