import styles from "./VetCard.module.css";

const IconPin = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
  </svg>
);
const IconRoute = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="6" cy="19" r="2"/><circle cx="18" cy="5" r="2"/>
    <path d="M8 19h6a4 4 0 0 0 4-4v-1a4 4 0 0 0-4-4H10a4 4 0 0 1-4-4v-1"/>
  </svg>
);
const IconPhone = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
  </svg>
);

const IconAlert = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
);

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
          <p className={styles.direccion}><IconPin /><span className={styles.direccionTexto}>{vet.direccion}</span></p>
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
          <p className={styles.direccion}><IconPin /><span className={styles.direccionTexto}>{vet.direccion}</span></p>
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
              <span className={styles.metaIcon}><IconRoute /></span>
              {distancia} km
            </span>
          )}
          {vet.telefono && (
            <span className={styles.metaItem}>
              <span className={styles.metaIcon}><IconPhone /></span>
              {vet.telefono}
            </span>
          )}
          {vet.urgencias24hs && (
            <span className={`${styles.metaItem} ${styles.urgencias}`}>
              <IconAlert /> Urgencias 24hs
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