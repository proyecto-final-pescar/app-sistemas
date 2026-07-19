import { useState } from "react";
import "./NuevaPublicacionForm.css";

import Input from "../../../ui/input/Input";
import Button from "../../../ui/button/Button";
import Select from "../../../ui/select/Select";
import Textarea from "../../../ui/textarea/Textarea";
import { subirImagen } from "../../../../services/uploadService";

function NuevaPublicacionForm({ onCancelar }) {
    const [foto, setFoto] = useState(null);
    const [nombre, setNombre] = useState("");
    const [zona, setZona] = useState("");
    const [descripcion, setDescripcion] = useState("");
    const [fechaultimavez, setFechaUltimaVez] = useState("");
    const [contacto, setContacto] = useState("");

    const [errores, setErrores] = useState({});

    const barriosCABA = [
        "Agronomía",
        "Almagro",
        "Balvanera",
        "Barracas",
        "Belgrano",
        "Boedo",
        "Caballito",
        "Chacarita",
        "Coghlan",
        "Colegiales",
        "Constitución",
        "Flores",
        "Floresta",
        "La Boca",
        "La Paternal",
        "Liniers",
        "Mataderos",
        "Monserrat",
        "Monte Castro",
        "Nueva Pompeya",
        "Núñez",
        "Palermo",
        "Parque Avellaneda",
        "Parque Chacabuco",
        "Parque Chas",
        "Parque Patricios",
        "Puerto Madero",
        "Recoleta",
        "Retiro",
        "Saavedra",
        "San Cristóbal",
        "San Nicolás",
        "San Telmo",
        "Vélez Sarsfield",
        "Versalles",
        "Villa Crespo",
        "Villa del Parque",
        "Villa Devoto",
        "Villa General Mitre",
        "Villa Lugano",
        "Villa Luro",
        "Villa Ortúzar",
        "Villa Pueyrredón",
        "Villa Real",
        "Villa Riachuelo",
        "Villa Santa Rita",
        "Villa Soldati",
        "Villa Urquiza",
        ];

    function validarFormulario() {
        const nuevosErrores = {};

        if (!foto) {
            nuevosErrores.foto = "La foto es ogligatoria";
        }

        if (zona.trim() === "") {
            nuevosErrores.foto = "La foto es obligatoria";
        }

        if (descripcion.trim() === "") {
            nuevosErrores.descripcion = "La descripcion fisica es obligatoria"
        }

        if (fechaultimavez.trim() === "") {
            nuevosErrores.fechaultimavez = "La fecha de vista por ultima vez es obligatoria"
        }

        if(contacto.trim() === "") {
            nuevosErrores.contacto = "El contacto es obligatorio"
        }

        setErrores(nuevosErrores);

        return Object.keys(nuevosErrores).length === 0;
    }

    async function manejarSubmit(evento) {
        evento.preventDefault();

        if (!validarFormulario()) return;

        try {
            const urlFoto = await subirImagen(foto);

            const datosPublicacion = {
            foto: urlFoto,
            nombre,
            zona,
            descripcion,
            fechaultimavez,
            contacto,
            };

            console.log("Publicación lista para enviar:", datosPublicacion);
        } catch (error) {
            console.error("Error al subir la imagen:", error);
        }
    }

    function manejarCambioFoto(evento) {
    const archivo = evento.target.files?.[0];

    if (archivo) {
        setFoto(archivo);
    }
    }

    return (

        <form className="nueva-publicacion-form" onSubmit={manejarSubmit}>

            <div className="nueva-publicacion-header">
                 <h2>Nueva Publicación</h2>
            </div>

            <div className="campo-foto">
            <label className="foto-label">
                Foto de la mascota <span>*</span>
            </label>

            <label className="publicacion-foto-upload">
                {foto ? (
                <img
                    className="publicacion-foto-preview"
                    src={URL.createObjectURL(foto)}
                    alt="Vista previa de la mascota"
                />
                ) : (
                <>
                    <span className="foto-icono">📷</span>
                    <span className="foto-texto">Subir foto de la mascota</span>
                    <span className="foto-ayuda">
                    Buena resolución para que se distinga bien
                    </span>
                </>
                )}

                <input
                type="file"
                accept="image/*"
                onChange={manejarCambioFoto}
                />
            </label>

            {errores.foto && (
                <p className="input-error">{errores.foto}</p>
            )}
            </div>

            <div className="publicacion-fila">
                <Input
                    label="Nombre (Opcional)"
                    placeholder="Ej: Tobi"
                    value={nombre}
                    onChange={(evento) => setNombre(evento.target.value)}
                    error={errores.nombre}
                />

                <Select
                    label="Zona / Barrio"
                    placeholder="Seleccionar zona"
                    opciones={barriosCABA}
                    value={zona}
                    onChange={(evento) => setZona(evento.target.value)}
                    error={errores.zona}
                />
            </div>

            <Textarea
                label="Descripción Física"
                placeholder="Color, tamaño, si lleva collar, alguna característica particular"
                value={descripcion}
                onChange={(evento) => setDescripcion(evento.target.value)}
                error={errores.descripcion}
            />

            <Input
                label="Fecha de visualizacion por ultima vez"
                type="date"
                value={fechaultimavez}
                onChange={(evento) => setFechaUltimaVez(evento.target.value)}
                error={errores.fechaultimavez}
            />

            <Input
                label="Contacto"
                placeholder="Telefono o email"
                value={contacto}
                onChange={(evento) => setContacto(evento.target.value)}
                error={errores.contacto}
            />

            <div className="publicacion-acciones">
                <Button
                    type="button"
                    texto="Cancelar"
                    variante="secundario"
                    tamaño="mediano"
                    onClick={onCancelar}
                />

                <Button
                    type="submit"
                    texto="Crear Publicación"
                    variante="primario"
                    tamaño="mediano"
                />
            </div>

        </form>

    );
}

export default NuevaPublicacionForm;