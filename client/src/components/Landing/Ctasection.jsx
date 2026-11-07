import { useNavigate } from "react-router-dom";
import Button from "../ui/button/Button";
import Reveal from "../ui/reveal/Reveal";
import styles from "./CtaSection.module.css";

const CtaSection = () => {
  const navigate = useNavigate();

  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <Reveal>
          <div className={styles.panel}>
            <span className={`${styles.circle} ${styles.circleBig}`} aria-hidden="true" />
            <span className={`${styles.circle} ${styles.circleSmall}`} aria-hidden="true" />

            <div className={styles.content}>
              <h2 className={styles.title}>Empezá hoy, es gratis</h2>
              <p className={styles.subtitle}>
                Registrate en menos de 2 minutos y centralizá toda la salud de
                tu mascota.
              </p>
              <div className={styles.buttonRow}>
                <Button
                  texto="Registrarme"
                  variante="primario"
                  tamaño="grande"
                  onClick={() => navigate("/registro")}
                />
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
};

export default CtaSection;