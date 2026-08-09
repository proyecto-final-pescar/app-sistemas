import { useNavigate } from "react-router-dom";
import Button from "../../../components/ui/button/Button";
import styles from "./Pagos.module.css";
import { Clock } from "lucide-react";

export default function PagoPendiente() {
  const navigate = useNavigate();

  return (
    <div className={styles.shell}>
      <span className={styles.step}>3 · PENDIENTE</span>
      <div className={styles.card}>
        <div className={styles.iconoPendiente}>
          <Clock size={28} strokeWidth={2} />
        </div>
        <h1 className={styles.titulo}>Tu pago está siendo procesado</h1>
        <p className={styles.subtitulo}>
          Cuando se acredite el pago, tu turno quedará confirmado. Te vamos a avisar por email.
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