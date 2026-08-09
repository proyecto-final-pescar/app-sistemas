import { useEffect, useState, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import Button from "../../../components/ui/button/Button";
import { obtenerEstadoPago } from "../../../services/pagosService";
import styles from "./Pagos.module.css";
import { Check } from "lucide-react";

const INTERVALO_MS = 3000;
const MAX_INTENTOS = 20; // ~1 minuto de polling antes de rendirse

export default function PagoExitoso() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const turnoId = searchParams.get("turnoId");

    const [estado, setEstado] = useState("verificando"); // verificando | aprobado | timeout
    const intentos = useRef(0);

    useEffect(() => {
        if (!turnoId) {
            setEstado("timeout");
            return;
        }

        let cancelado = false;
        let timeoutId;

        const verificar = async () => {
            try {
                const data = await obtenerEstadoPago(turnoId);
                if (cancelado) return;

                if (data.estado === "aprobado") {
                    setEstado("aprobado");
                    return;
                }

                if (["rechazado", "cancelado"].includes(data.estado)) {
                    navigate(`/pago-fallido?turnoId=${turnoId}`, { replace: true });
                    return;
                }

                // pendiente / en_proceso: seguir esperando
                intentos.current += 1;
                if (intentos.current >= MAX_INTENTOS) {
                    navigate(`/pago-pendiente?turnoId=${turnoId}`, { replace: true });
                    return;
                }
                timeoutId = setTimeout(verificar, INTERVALO_MS);
            } catch {
                if (cancelado) return;
                intentos.current += 1;
                if (intentos.current >= MAX_INTENTOS) {
                    setEstado("timeout");
                    return;
                }
                timeoutId = setTimeout(verificar, INTERVALO_MS);
            }
        };

        verificar();
        return () => { cancelado = true; clearTimeout(timeoutId); };
    }, [turnoId, navigate]);

    if (estado === "verificando") {
        return (
            <div className={styles.shell}>
                <span className={styles.step}>1 · VERIFICANDO</span>
                <div className={styles.card}>
                    <div className={styles.spinner}></div>
                    <p className={styles.mensaje}>Verificando el estado de tu pago...</p>
                </div>
            </div>
        );
    }

    if (estado === "timeout") {
        return (
            <div className={styles.shell}>
                <span className={styles.step}>1 · VERIFICANDO</span>
                <div className={styles.card}>
                    <p className={styles.mensaje}>
                        Esto está tardando más de lo esperado. Podés revisar el estado de tu turno desde "Mis turnos".
                    </p>
                    <Button texto="Ir a mis turnos" variante="primario" tamaño="mediano" onClick={() => navigate("/mis-turnos")} />
                </div>
            </div>
        );
    }

    return (
        <div className={styles.shell}>
            <span className={styles.step}>2 · ÉXITO</span>
            <div className={styles.card}>
                <div className={styles.iconoExito}>
                    <Check size={32} strokeWidth={3} />
                </div>
                <h1 className={styles.titulo}>¡Tu turno está confirmado!</h1>
                <p className={styles.subtitulo}>Tu turno quedó reservado y pagado.</p>
                <Button texto="Ver mi turno" variante="primario" tamaño="mediano" onClick={() => navigate("/mis-turnos")} />
            </div>
        </div>
    );
}