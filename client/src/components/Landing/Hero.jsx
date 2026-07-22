import { useNavigate } from "react-router-dom";
import Badge from "../ui/badge/Badge";
import Button from "../ui/button/Button";
import styles from "./Hero.module.css";

const Hero = () => {
  const navigate = useNavigate();

  return (
    <section className={styles.section}>
      <div className={styles.container}>
        {/* Texto */}
        <div className={styles.textColumn}>
          <Badge texto="+12.000 mascotas registradas en CABA y GBA" variante="zona" />

          <h1 className={styles.title}>
            Toda la salud de tu <span className={styles.titleAccent}>mascota</span> en
            un solo lugar
          </h1>

          <p className={styles.description}>
            Unificá los datos clínicos dispersos de tu peludo en un historial
            digital, y encontrá clínicas de urgencias 24h en CABA y GBA en
            segundos — sin llamadas, sin estrés.
          </p>

          <div className={styles.actionsRow}>
            <Button
              texto="Registrarme gratis"
              variante="primario"
              tamaño="grande"
              onClick={() => navigate("/registro")}
            />

            <a href="#como-funciona" className={styles.link}>
              Cómo funciona ›
            </a>
          </div>

          <div className={styles.statsRow}>
            {[
              { value: "340+", label: "Clínicas 24h" },
              { value: "12k+", label: "Historiales" },
              { value: "48", label: "Barrios" },
            ].map((stat) => (
              <div key={stat.label}>
                <p className={styles.statValue}>{stat.value}</p>
                <p className={styles.statLabel}>{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Imagen + tarjetas flotantes */}
        <div className={styles.imageColumn}>
          <img
            src="https://images.unsplash.com/photo-1601758228041-f3b2795255f1?auto=format&fit=crop&w=800&q=80"
            alt="Perro sonriente en la playa"
            className={styles.heroImage}
          />

          <div className={`${styles.floatingCard} ${styles.floatingCardTop}`}>
            <span className={styles.statusDot} />
            <div>
              <p className={styles.floatingLabelSuccess}>Clínica encontrada</p>
              <p className={styles.floatingValue}>VetCenter Palermo 24h</p>
              <p className={styles.floatingSubtext}>1.2 km · Abierto ahora</p>
            </div>
          </div>

          <div className={`${styles.floatingCard} ${styles.floatingCardBottom}`}>
            <span className={styles.appointmentIcon}>
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <circle cx="10" cy="10" r="7.5" stroke="currentColor" strokeWidth="1.5" />
                <path d="M10 6v4l2.5 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </span>
            <div>
              <p className={styles.floatingLabelMuted}>Próximo turno</p>
              <p className={styles.floatingValue}>Vacuna antirrábica · Lun 26/05</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;