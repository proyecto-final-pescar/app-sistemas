import { useNavigate } from "react-router-dom";
import Button from "../../../components/ui/button/Button";
import styles from "./Pagos.module.css";
import { Clock } from "lucide-react";

export default function PagoPendiente() {
  const navigate = useNavigate();

  return (
    <div className={styles.shell}>
      <span className={styles.step}>· PENDIENTE</span>
      <div className={styles.card}>
        <div className={styles.iconoPendiente}>
          <Clock size={28} strokeWidth={2} />
        </div>
        <h1 className={styles.titulo}>Pago en revisión</h1>
        <p className={styles.subtitulo}>
          Estamos esperando la confirmación de tu pago. Te avisaremos cuando se acredite.
        </p>
        <Button
          texto="Volver al inicio"
          variante="secundario"
          tamaño="mediano"
          onClick={() => navigate("/home")}
        />
      </div>
    </div>
  );
}