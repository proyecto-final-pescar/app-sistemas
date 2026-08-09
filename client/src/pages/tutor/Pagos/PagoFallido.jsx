import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import Button from "../../../components/ui/button/Button";
import { crearPreferenciaPago } from "../../../services/pagosService";
import styles from "./Pagos.module.css";
import { X } from "lucide-react";

export default function PagoFallido() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const turnoId = searchParams.get("turnoId");

    const [reintentando, setReintentando] = useState(false);
    const [error, setError] = useState("");

    const handleReintentar = async () => {
        if (!turnoId) {
            setError("No se pudo identificar el turno para reintentar el pago.");
            return;
        }
        setReintentando(true);
        setError("");
        try {
            const { init_point } = await crearPreferenciaPago(turnoId);
            window.location.href = init_point;
        } catch (err) {
            setError(err.response?.data?.message || "No se pudo iniciar el pago. Intentá de nuevo.");
            setReintentando(false);
        }
    };

    return (
        <div className={styles.shell}>
            <span className={styles.step}>4 · ERROR</span>
            <div className={styles.card}>
                <div className={styles.iconoError}>
                    <X size={28} strokeWidth={3} />
                </div>
                <h1 className={styles.titulo}>No pudimos procesar el pago</h1>
                <p className={styles.subtitulo}>
                    Verificá los datos de tu tarjeta o intentá con otro medio de pago.
                </p>
                {error && <p className={styles.errorTexto}>{error}</p>}
                <Button
                    texto={reintentando ? "Redirigiendo..." : "Reintentar pago"}
                    variante="primario"
                    tamaño="mediano"
                    onClick={handleReintentar}
                    disabled={reintentando}
                />
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