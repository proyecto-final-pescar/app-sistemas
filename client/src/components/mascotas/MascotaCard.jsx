import React, { useState } from "react";
import PropTypes from "prop-types";
import Button from "../ui/button/Button";
import ConfirmModal from "../ui/confirm-modal/ConfirmModal";
import { formatearEdad } from "../../utils/EdadMascota";
import styles from "../../styles/MisMascotas.module.css";



const ESPECIE_EMOJI = {
    gato: "🐱",
    perro: "🐶",
    conejo: "🐰",
    ave: "🐦",
    pájaro: "🐦",
    hamster: "🐹",
    hámster: "🐹",
    tortuga: "🐢",
    pez: "🐠",
    reptil: "🦎",
    iguana: "🦎",
    caballo: "🐴",
    cerdo: "🐷",
    cobayo: "🐹",
    cuyo: "🐹",
    serpiente: "🐍",
    hurón: "🐾",
};
const EMOJI_GENERICO = "🐾";

const MascotaCard = ({ mascota, onView, onEdit, onDelete, eliminando = false }) => {
    const {
        _id,
        nombre,
        especie,
        raza,
        sexo,
        fechaNacimiento,
        foto,
        esCastrado,
        peso,
    } = mascota;

    const [modalAbierto, setModalAbierto] = useState(false);

    const emoji = ESPECIE_EMOJI[especie?.toLowerCase()] || EMOJI_GENERICO;

    const handleDeleteClick = () => {
        setModalAbierto(true);
    };

    const handleConfirmarEliminar = () => {
        setModalAbierto(false);
        onDelete(_id);
    };

    return (
        <article className={styles.card}>
            <div className={styles.cardImageWrapper}>
                {foto ? (
    <img
        src={foto}
        alt={nombre}
        className={styles.cardImage}
        onError={(e) => {
            e.currentTarget.style.display = "none";
            e.currentTarget.nextSibling.style.display = "flex";
        }}
    />
) : null}
<div
    className={styles.cardImagePlaceholder}
    style={{ display: foto ? "none" : "flex" }}
>
    <span style={{ fontSize: 48 }}>{emoji}</span>
</div>
                <div className={styles.cardImageOverlay}>
                    <span className={styles.petName}>
                        <span aria-hidden="true">{emoji}</span> {nombre}
                    </span>
                    <span className={styles.petBreed}>
                        {especie} · {raza}
                    </span>
                </div>
            </div>

            <div className={styles.cardBody}>
                <div className={styles.tagsRow}>
                    <span className={styles.tag}>{formatearEdad(fechaNacimiento)}</span>
                    {sexo && <span className={styles.tag}>{sexo}</span>}
                    <span className={styles.tag}>{peso} kg</span>
                    <span className={styles.tag}>
                        {esCastrado ? "Castrad@" : "No castrad@"}
                    </span>
                </div>

               <div className={styles.actionsRow}>
                    <Button
                        texto="Ver ficha completa ›"
                        variante="ver-ficha"
                        tamaño="chico"
                        onClick={() => onView(_id)}
                    />
                    <div className={styles.actionsSecundarias}>
                        <Button
                        texto="Editar"
                        variante="secundario"
                        tamaño="chico"
                        onClick={() => onEdit(_id)}
                        />
                        <Button
                        texto="Eliminar"
                        variante="peligro-borde"
                        tamaño="chico"
                        onClick={handleDeleteClick}
                        disabled={eliminando}
                        />
                    </div>
                    </div>
                </div>

            <ConfirmModal
                abierto={modalAbierto}
                titulo={`Eliminar a ${nombre}`}
                mensaje={
                    <>
                        Vas a eliminar el perfil de <strong>{nombre}</strong> de forma
                        permanente, incluyendo su historial guardado en la app. Esta
                        acción no se puede deshacer.
                    </>
                }
                textoConfirmar="Sí, eliminar"
                textoCancelar="Cancelar"
                varianteConfirmar="peligro"
                confirmando={eliminando}
                onConfirm={handleConfirmarEliminar}
                onCancel={() => setModalAbierto(false)}
            />
        </article>
    );
};

MascotaCard.propTypes = {
    mascota: PropTypes.shape({
        _id: PropTypes.string.isRequired,
        nombre: PropTypes.string.isRequired,
        especie: PropTypes.string,
        raza: PropTypes.string,
        sexo: PropTypes.oneOf(["Macho", "Hembra"]),
        fechaNacimiento: PropTypes.string,
        foto: PropTypes.string,
        esCastrado: PropTypes.bool,
        peso: PropTypes.number,
    }).isRequired,
    onView: PropTypes.func.isRequired,
    onEdit: PropTypes.func.isRequired,
    onDelete: PropTypes.func.isRequired,
    eliminando: PropTypes.bool,
};

export default MascotaCard;
