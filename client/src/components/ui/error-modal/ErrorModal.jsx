import React, { useEffect } from "react";
import PropTypes from "prop-types";
import Button from "../button/Button";
import styles from "./ErrorModal.module.css";

/**
 * Modal de error generico 
 */
const ErrorModal = ({
    abierto,
    titulo = "Ocurrió un error",
    mensaje,
    textoBoton = "Cerrar",
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
                role="alertdialog"
                aria-modal="true"
                aria-labelledby="error-modal-title"
                aria-describedby="error-modal-message"
                onClick={(e) => e.stopPropagation()}
            >
                <div className={styles.icono} aria-hidden="true">
                    ✕
                </div>
                <h2 id="error-modal-title" className={styles.titulo}>
                    {titulo}
                </h2>
                <p id="error-modal-message" className={styles.mensaje}>
                    {mensaje}
                </p>

                <div className={styles.acciones}>
                    <Button
                        texto={textoBoton}
                        variante="peligro"
                        tamaño="mediano"
                        onClick={onClose}
                    />
                </div>
            </div>
        </div>
    );
};

ErrorModal.propTypes = {
    abierto: PropTypes.bool.isRequired,
    titulo: PropTypes.string,
    mensaje: PropTypes.node.isRequired,
    textoBoton: PropTypes.string,
    onClose: PropTypes.func.isRequired,
};

export default ErrorModal;