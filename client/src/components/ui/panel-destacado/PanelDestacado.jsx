import React from "react";
import PropTypes from "prop-types";
import styles from "./PanelDestacado.module.css";

/**
 * Panel destacado con fondo en degradado violeta.
 * Reutilizable: a veces lleva buscador y chips, a veces solo texto.
 */
const PanelDestacado = ({ chipsSuperior, titulo, subtitulo, children }) => {
    return (
        <div className={styles.panel}>
            {/* Formas decorativas de fondo, siempre presentes */}
            <span className={styles.circuloGrande} aria-hidden="true" />
            <span className={styles.circuloChico} aria-hidden="true" />

            <div className={styles.contenidoPrincipal}>
                {chipsSuperior && chipsSuperior.length > 0 && (
                    <div className={styles.chipsSuperior}>
                        {chipsSuperior.map((chip, i) => (
                            <span key={i} className={styles.chipSuperior}>
                                {chip}
                            </span>
                        ))}
                    </div>
                )}

                <h2 className={styles.titulo}>{titulo}</h2>
                {subtitulo && <p className={styles.subtitulo}>{subtitulo}</p>}
                {children && <div className={styles.contenido}>{children}</div>}
            </div>
        </div>
    );
};

PanelDestacado.propTypes = {
    chipsSuperior: PropTypes.arrayOf(PropTypes.node),
    titulo: PropTypes.node.isRequired,
    subtitulo: PropTypes.node,
    children: PropTypes.node,
};

export default PanelDestacado;