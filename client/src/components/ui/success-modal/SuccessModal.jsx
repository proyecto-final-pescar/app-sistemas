import React, { useEffect } from "react";
import PropTypes from "prop-types";
import Button from "../button/Button";
import styles from "./SuccessModal.module.css";

/**
 * Modal de exito generico
 */
const SuccessModal = ({
    abierto,
    titulo = "¡Listo!",
    mensaje,
    textoBoton = "Aceptar",
    onClose,
}) => {
    useEffect(() => {
        if (!abierto) return;
        const handleKeyDown = (e) => {
            if (e.key === "Escape") onClose();
        };
        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [abierto, onClose]);

    if (!abierto) return null;

    return (
        <div className={styles.overlay} onClick={onClose} role="presentation">
            <div
                className={styles.modal}
                role="status"
                aria-modal="true"
                aria-labelledby="success-modal-title"
                aria-describedby="success-modal-message"
                onClick={(e) => e.stopPropagation()}
            >
                <div className={styles.icono} aria-hidden="true">
                    ✓
                </div>
                <h2 id="success-modal-title" className={styles.titulo}>
                    {titulo}
                </h2>
                <p id="success-modal-message" className={styles.mensaje}>
                    {mensaje}
                </p>

                <div className={styles.acciones}>
                    <Button
                        texto={textoBoton}
                        variante="primario"
                        tamaño="mediano"
                        onClick={onClose}
                    />
                </div>
            </div>
        </div>
    );
};

SuccessModal.propTypes = {
    abierto: PropTypes.bool.isRequired,
    titulo: PropTypes.string,
    mensaje: PropTypes.node.isRequired,
    textoBoton: PropTypes.string,
    onClose: PropTypes.func.isRequired,
};

export default SuccessModal;