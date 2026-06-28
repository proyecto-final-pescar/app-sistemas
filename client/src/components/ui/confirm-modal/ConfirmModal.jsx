import React, { useEffect } from "react";
import PropTypes from "prop-types";
import Button from "../button/Button";
import styles from "./ConfirmModal.module.css";

/**
 * Modal de confirmacion genérico.*/

const ConfirmModal = ({
    abierto,
    titulo = "¿Estás seguro?",
    mensaje,
    textoConfirmar = "Confirmar",
    textoCancelar = "Cancelar",
    varianteConfirmar = "peligro",
    onConfirm,
    onCancel,
    confirmando = false,
}) => {
    // Cerrar con la tecla Escape, por accesibilidad.
    useEffect(() => {
        if (!abierto) return;
        const handleKeyDown = (e) => {
            if (e.key === "Escape") onCancel();
        };
        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [abierto, onCancel]);

    if (!abierto) return null;

    return (
        <div
            className={styles.overlay}
            onClick={onCancel}
            role="presentation"
        >
            <div
                className={styles.modal}
                role="alertdialog"
                aria-modal="true"
                aria-labelledby="confirm-modal-title"
                aria-describedby="confirm-modal-message"
                onClick={(e) => e.stopPropagation()}
            >
                <h2 id="confirm-modal-title" className={styles.titulo}>
                    {titulo}
                </h2>
                <p id="confirm-modal-message" className={styles.mensaje}>
                    {mensaje}
                </p>

                <div className={styles.acciones}>
                    <Button
                        texto={textoCancelar}
                        variante="secundario"
                        tamaño="mediano"
                        onClick={onCancel}
                    />
                    <Button
                        texto={confirmando ? "Eliminando…" : textoConfirmar}
                        variante={varianteConfirmar}
                        tamaño="mediano"
                        onClick={onConfirm}
                        disabled={confirmando}
                    />
                </div>
            </div>
        </div>
    );
};

ConfirmModal.propTypes = {
    abierto: PropTypes.bool.isRequired,
    titulo: PropTypes.string,
    mensaje: PropTypes.node.isRequired,
    textoConfirmar: PropTypes.string,
    textoCancelar: PropTypes.string,
    varianteConfirmar: PropTypes.string,
    onConfirm: PropTypes.func.isRequired,
    onCancel: PropTypes.func.isRequired,
};

export default ConfirmModal;
