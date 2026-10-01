import React, { useState } from "react";
import PropTypes from "prop-types";
import { Pencil, Trash2, PawPrint } from "lucide-react";
import Button from "../ui/button/Button";
import ConfirmModal from "../ui/confirm-modal/ConfirmModal";
import MenuAcciones from "../common/menuAcciones/MenuAcciones";
import { formatearEdad } from "../../utils/EdadMascota";
import styles from "../../styles/MisMascotas.module.css";

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
    <PawPrint size={40} color="#a78bfa" strokeWidth={1.75} />
</div>
                <div className={styles.cardImageOverlay}>
                    <span className={styles.petName}>{nombre}</span>
                    <span className={styles.petBreed}>
                        {especie} · {raza}
                    </span>
                </div>

                <div className={styles.cardMenu}>
                    <MenuAcciones
                        ariaLabel={`Más acciones para ${nombre}`}
                        opciones={[
                            {
                                id: "editar",
                                label: "Editar",
                                icon: Pencil,
                                onClick: () => onEdit(_id),
                            },
                            {
                                id: "eliminar",
                                label: "Eliminar",
                                labelDisabled: "Eliminando…",
                                icon: Trash2,
                                variante: "peligro",
                                disabled: eliminando,
                                onClick: handleDeleteClick,
                            },
                        ]}
                    />
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