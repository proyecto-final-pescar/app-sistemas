import { useNavigate } from "react-router-dom";
import PanelDestacado from "../ui/panel-destacado/PanelDestacado";
import Button from "../ui/button/Button";
import styles from "./CtaSection.module.css";

const CtaSection = () => {
  const navigate = useNavigate();

  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <PanelDestacado
          titulo="Empezá hoy, es gratis"
          subtitulo="Registrate en menos de 2 minutos y centralizá toda la salud de tu mascota."
        >
          <div className={styles.buttonRow}>
            <Button
              texto="Registrarme gratis"
              variante="primario"
              tamaño="grande"
              onClick={() => navigate("/registro")}
            />
          </div>
        </PanelDestacado>
      </div>
    </section>
  );
};

export default CtaSection;