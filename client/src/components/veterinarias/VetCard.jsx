import styles from "./VetCard.module.css";

const VetCard = ({ vet, activa, distancia, abierta, onClick, onVerDetalle }) => {
  return (
    <div
      className={`${styles.card} ${activa ? styles.activa : ""}`}
      onClick={onClick}
    >
      {/* Header: nombre + badge */}
      <div className={styles.header}>
        <div className={styles.headerInfo}>
          <p className={styles.nombre}>{vet.nombre}</p>
          <p className={styles.direccion}>📍 {vet.direccion}</p>
        </div>
        <span className={`${styles.badge} ${abierta ? styles.abierto : styles.cerrado}`}>
          {abierta ? "Abierto" : "Cerrado"}
        </span>
      </div>

      {/*  distancia + teléfono + urgencias */}
      <div className={styles.meta}>
        <span className={styles.metaItem}>
          <span className={styles.metaIcon}>🗺</span>
          {distancia} km
        </span>
        {vet.telefono && (
          <span className={styles.metaItem}>
            <span className={styles.metaIcon}>📞</span>
            {vet.telefono}
          </span>
        )}
        {vet.urgencias24hs && (
          <span className={`${styles.metaItem} ${styles.urgencias}`}>
            🚨 Urgencias 24hs
          </span>
        )}
      </div>

      {/* Especialidades */}
      {vet.especialidades?.length > 0 && (
        <div className={styles.tags}>
          {vet.especialidades.slice(0, 3).map((esp) => (
            <span key={esp} className={styles.tag}>{esp}</span>
          ))}
        </div>
      )}

      {/* Botón */}
      <button
        className={styles.btn}
        onClick={(e) => {
          e.stopPropagation();
          onVerDetalle();
        }}
      >
          Ver clínica
      </button>
    </div>
  );
};

export default VetCard;