import HeaderMinimo from "../../../components/layout/HeaderMinimo";
import styles from "./SolicitudEnRevision.module.css";

const IconClock = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
    <path d="M12 7v5l3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export default function SolicitudEnRevision() {
  return (
    <div className={styles.shell}>
      <HeaderMinimo />
      <div className={styles.contenido}>
        <div className={styles.card}>
          <div className={styles.icono}>
            <IconClock />
          </div>
          <h1 className={styles.titulo}>Tu solicitud está siendo revisada</h1>
          <p className={styles.mensaje}>
            Un administrador está revisando los datos de tu veterinaria y
            verificando que cumplas con los requisitos. Cuando sea aprobada,
            vas a poder acceder a todos los beneficios de MyPet.
          </p>
        </div>
      </div>
    </div>
  );
}