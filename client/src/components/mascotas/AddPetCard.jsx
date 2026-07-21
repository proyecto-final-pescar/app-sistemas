import React from "react";
import PropTypes from "prop-types";
import { FiPlus } from "react-icons/fi";
import styles from "../../styles/MisMascotas.module.css";

const AddPetCard = ({ onClick }) => {
    return (
        <button type="button" className={styles.addCard} onClick={onClick}>
            <span className={styles.addIconWrapper}>
                <FiPlus size={28} />
            </span>
            <span className={styles.addCardTitle}>Agregar mascota</span>
            <span className={styles.addCardSubtitle}>
                Registrá a tu próximo compañero
            </span>
        </button>
    );
};

AddPetCard.propTypes = {
    onClick: PropTypes.func.isRequired,
};

export default AddPetCard;