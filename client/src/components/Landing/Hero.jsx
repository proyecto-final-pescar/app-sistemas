import { useNavigate } from "react-router-dom";
import { Calendar, ShieldCheck } from "lucide-react";
import Badge from "../ui/badge/Badge";
import Button from "../ui/button/Button";
import { getMascota } from "./mascotas";
import styles from "./Hero.module.css";

const Hero = () => {
  const navigate = useNavigate();
  const principal = getMascota(0);
  const arriba = getMascota(1);
  const abajo = getMascota(2);
  const extra = getMascota(4);

  return (
    <section className={styles.section}>
      <span className={`${styles.blob} ${styles.blobViolet}`} aria-hidden="true" />
      <span className={`${styles.blob} ${styles.blobGreen}`} aria-hidden="true" />

      <div className={styles.container}>
        {/* Texto */}
        <div className={styles.textColumn}>
          <div className={styles.fadeUp}>
            <Badge texto="Disponible en CABA" variante="zona" />
          </div>

          <h1 className={`${styles.title} ${styles.fadeUp} ${styles.d1}`}>
            Toda la salud de tu <span className={styles.titleAccent}>mascota</span> en
            un solo lugar
          </h1>

          <p className={`${styles.description} ${styles.fadeUp} ${styles.d2}`}>
            Unificá los datos clínicos dispersos de tu peludo en un historial
            digital, y encontrá clínicas de urgencias 24h en CABA en
            segundos — sin llamadas, sin estrés.
          </p>

          <div className={`${styles.actionsRow} ${styles.fadeUp} ${styles.d3}`}>
            <Button
              texto="Registrarme gratis"
              variante="primario"
              tamaño="grande"
              onClick={() => navigate("/registro")}
            />
          </div>
        </div>

        {/* Collage + tarjetas flotantes */}
        <div className={styles.imageColumn}>
          <div className={styles.collage}>
            <div className={`${styles.frame} ${styles.frameMain}`}>
              <img
                src={principal.src}
                alt={principal.alt}
                className={styles.img}
                fetchPriority="high"
                decoding="async"
              />
            </div>
            <div className={`${styles.frame} ${styles.frameTop}`}>
              <img
                src={arriba.src}
                alt={arriba.alt}
                className={styles.img}
                decoding="async"
              />
            </div>
            <div className={`${styles.frame} ${styles.frameBottom}`}>
              <img
                src={abajo.src}
                alt={abajo.alt}
                className={styles.img}
                decoding="async"
              />
            </div>
            <div className={`${styles.frame} ${styles.frameSmall}`}>
              <img
                src={extra.src}
                alt={extra.alt}
                className={styles.img}
                decoding="async"
              />
            </div>
          </div>

          <div className={`${styles.floatingCard} ${styles.floatingCardTop}`}>
            <span className={styles.statusDot} />
            <div>
              <p className={styles.floatingLabelSuccess}>Clínica encontrada</p>
              <p className={styles.floatingValue}>VetCenter</p>
              <p className={styles.floatingSubtext}>1.2 km · Abierto ahora</p>
            </div>
          </div>

          <div className={`${styles.chip} ${styles.chipRight}`}>
            <span className={styles.chipIcon}>
              <Calendar size={18} aria-hidden="true" />
            </span>
            Turno confirmado
          </div>

          <div className={`${styles.chip} ${styles.chipBottom}`}>
            <span className={styles.chipIcon}>
              <ShieldCheck size={18} aria-hidden="true" />
            </span>
            Vacunas al día
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;