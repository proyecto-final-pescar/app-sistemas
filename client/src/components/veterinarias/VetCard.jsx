import styles from "./VetCard.module.css";

const VetCard = ({
  vet,
  activa = false,
  distancia,
  abierta,
  onClick,
  onVerDetalle,
  variante = "grid", //  puede estar en la seccion urgencias o al buscar desde el home
}) => {
  const esSeleccionable = typeof onClick === "function";

  if (variante === "fila") {
    return (
      <div className={`${styles.card} ${styles.fila}`}>
        <div className={styles.filaInfo}>
          <p className={styles.nombre}>
            {vet.nombre}
            {vet.rating != null && (
              <span className={styles.rating}>★ {vet.rating}</span>
            )}
          </p>
          <p className={styles.direccion}>📍 {vet.direccion}</p>
          <p className={styles.horarioFila}>
            <span className={abierta ? styles.textoAbierto : styles.textoCerrado}>
              {abierta ? "Abierto" : "Cerrado"}
            </span>
            {vet.horaCierre && ` · Cierra ${vet.horaCierre}`}
          </p>
        </div>

        <button
          className={styles.btnFila}
          onClick={(e) => {
            e.stopPropagation();
            onVerDetalle();
          }}
        >
          Ver clínica
        </button>
      </div>
    );
  }

  return (
    <div
      className={`${styles.card} ${activa ? styles.activa : ""}`}
      onClick={esSeleccionable ? onClick : undefined}
      role={esSeleccionable ? "button" : undefined}
    >
      {/* Header: nombre + rating + badge */}
      <div className={styles.header}>
        <div className={styles.headerInfo}>
          <p className={styles.nombre}>
            {vet.nombre}
            {vet.rating != null && (
              <span className={styles.rating}>★ {vet.rating}</span>
            )}
          </p>
          <p className={styles.direccion}>📍 {vet.direccion}</p>
        </div>
        <span className={`${styles.badge} ${abierta ? styles.abierto : styles.cerrado}`}>
          {abierta ? "Abierto" : "Cerrado"}
        </span>
      </div>

      {/* distancia + teléfono + urgencias (solo si vienen) */}
      {(distancia != null || vet.telefono || vet.urgencias24hs) && (
        <div className={styles.meta}>
          {distancia != null && (
            <span className={styles.metaItem}>
              <span className={styles.metaIcon}>🗺</span>
              {distancia} km
            </span>
          )}
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
      )}

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