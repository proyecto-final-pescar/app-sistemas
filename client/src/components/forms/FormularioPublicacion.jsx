import { useEffect, useState } from "react";
import { Camera, MapPin, Pencil } from "lucide-react";
import "./FormularioPublicacion.css";
import "../ui/input/Input.css";
import Input from "../ui/input/Input";
import Select from "../ui/select/Select";
import Button from "../ui/button/Button";
import { crearPublicacion } from "../../services/publicacionService";
import { subirImagen } from "../../services/uploadService";

const getFechaLocalInput = () => {
  const fecha = new Date();
  fecha.setMinutes(fecha.getMinutes() - fecha.getTimezoneOffset());
  return fecha.toISOString().slice(0, 10);
};

const LIMITE_NOMBRE = 100;
const LIMITE_DESCRIPCION = 5000;
const LIMITE_CONTACTO = 150;


const inferirTipoContacto = (valor) => {
  const texto = valor.trim();

  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(texto)) {
    return "EML";
  }

  const digitos = texto.replace(/\D/g, "");
  if (digitos.length >= 6) {
    return "TEL";
  }

  return null;
};

function FormularioPublicacion({ onCancelar, onGuardado, zonas = [] }) {
  const fechaMaxima = getFechaLocalInput();

  const [foto, setFoto] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [nombre, setNombre] = useState("");
  const [zona, setZona] = useState("");
  const [fecha, setFecha] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [contacto, setContacto] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [errores, setErrores] = useState({});
  const [errorGeneral, setErrorGeneral] = useState("");

  const opcionesZona = zonas.map((z) => ({ value: String(z.id), label: z.nombre }));

  useEffect(() => {
    if (!foto) {
      setPreviewUrl(null);
      return undefined;
    }

    const url = URL.createObjectURL(foto);
    setPreviewUrl(url);

    return () => URL.revokeObjectURL(url);
  }, [foto]);

  function validarFormularioPublicacion() {
    const nuevosErrores = {};

    if (!foto) {
      nuevosErrores.foto = "Subí una foto de la mascota";
    }

    if (zona.trim() === "") {
      nuevosErrores.zona = "Seleccioná el barrio o zona";
    }

    if (fecha.trim() === "") {
      nuevosErrores.fecha = "Indicá la fecha en la que se perdió";
    } else if (fecha > fechaMaxima) {
      nuevosErrores.fecha = "La fecha no puede ser futura";
    }

    if (descripcion.trim().length < 12) {
      nuevosErrores.descripcion = "Sumá una descripción un poco más completa";
    } else if (descripcion.trim().length > LIMITE_DESCRIPCION) {
      nuevosErrores.descripcion = `La descripción no puede superar los ${LIMITE_DESCRIPCION} caracteres`;
    }

    const contactoLimpio = contacto.trim();
    if (contactoLimpio === "") {
      nuevosErrores.contacto = "Agregá un contacto";
    } else if (contactoLimpio.length > LIMITE_CONTACTO) {
      nuevosErrores.contacto = `El contacto no puede superar los ${LIMITE_CONTACTO} caracteres`;
    } else if (!inferirTipoContacto(contactoLimpio)) {
      nuevosErrores.contacto = "Ingresá un teléfono o un email válido";
    }

    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  }

  async function manejarSubmit(evento) {
    evento.preventDefault();

    if (!validarFormularioPublicacion()) return;

    const contactoLimpio = contacto.trim();
    const tipoContacto = inferirTipoContacto(contactoLimpio);

    setGuardando(true);
    setErrorGeneral("");

    try {
      const urlFoto = await subirImagen(foto);

      await crearPublicacion({
        foto: urlFoto,
        nombre: (nombre.trim() || "Mascota sin nombre").slice(0, LIMITE_NOMBRE),
        zona,
        fecha,
        descripcion: descripcion.trim(),
        contacto: contactoLimpio,
        tipoContacto,
      });

      onGuardado?.();
    } catch (error) {
      console.error(error);
      setErrorGeneral("No se pudo crear la publicación. Intentá de nuevo.");
    } finally {
      setGuardando(false);
    }
  }

  function manejarCambioFoto(evento) {
    const archivo = evento.target.files?.[0];

    if (archivo) {
      setFoto(archivo);
      setErrores((prev) => ({ ...prev, foto: "" }));
    }
  }

  return (
    <form className="formPublicacion" onSubmit={manejarSubmit}>
      <div className="formPublicacion__header">
        <div className="formPublicacion__iconoWrap">
          <MapPin size={22} />
        </div>
        <div className="formPublicacion__titulos">
          <h2>Nueva publicación</h2>
          <p>Ayudemos a que vuelva a casa</p>
        </div>
      </div>

      <div className="formPublicacion__body">
        <div className="formPublicacion__colFoto">
          <label className="formPublicacion__foto">
            {foto ? (
              <div className="formPublicacion__fotoPreviewWrap">
                <img className="formPublicacion__fotoImg" src={previewUrl} alt="Vista previa" />
                <div className="formPublicacion__fotoOverlay">
                  <span className="formPublicacion__fotoEditBtn">
                    <Pencil size={16} />
                  </span>
                </div>
              </div>
            ) : (
              <>
                <span className="formPublicacion__fotoIconoCirculo">
                  <Camera size={20} />
                </span>
                <span className="formPublicacion__fotoTexto">Subir foto de la mascota</span>
                <span className="formPublicacion__fotoSubtexto">JPG o PNG</span>
              </>
            )}
            <input type="file" accept="image/*" onChange={manejarCambioFoto} />
          </label>
          {errores.foto && <p className="formPublicacion__error">{errores.foto}</p>}
        </div>

        <div className="formPublicacion__colCampos">
          <Input
            label="Nombre (Opcional)"
            placeholder="Ej: Tobi"
            value={nombre}
            maxLength={LIMITE_NOMBRE}
            onChange={(evento) => setNombre(evento.target.value)}
          />

          <div className="formPublicacion__fila">
            <Select
              label="Zona / Barrio"
              placeholder="Seleccioná una zona"
              opciones={opcionesZona}
              value={zona}
              onChange={(evento) => setZona(evento.target.value)}
              error={errores.zona}
            />

            <Input
              label="Fecha en la que se perdió"
              type="date"
              value={fecha}
              max={fechaMaxima}
              onChange={(evento) => setFecha(evento.target.value)}
              error={errores.fecha}
            />
          </div>

          <div className="formPublicacion__campo">
            <label className="formPublicacion__label">Descripción física</label>
            <textarea
              className="formPublicacion__textarea"
              placeholder="Color, tamaño, si llevaba collar, alguna seña particular..."
              rows={3}
              maxLength={LIMITE_DESCRIPCION}
              value={descripcion}
              onChange={(evento) => setDescripcion(evento.target.value)}
            />
            <div className="formPublicacion__campoFooter">
              {errores.descripcion && <p className="formPublicacion__error">{errores.descripcion}</p>}
              <span className="formPublicacion__contador">
                {descripcion.trim().length}/{LIMITE_DESCRIPCION}
              </span>
            </div>
          </div>

          <Input
            label="Contacto"
            placeholder="Teléfono o email"
            value={contacto}
            maxLength={LIMITE_CONTACTO}
            onChange={(evento) => setContacto(evento.target.value)}
            error={errores.contacto}
          />
        </div>
      </div>

      {errorGeneral && <p className="formPublicacion__errorGeneral">{errorGeneral}</p>}

      <div className="formPublicacion__acciones">
        <Button
          type="button"
          texto="Cancelar"
          variante="secundario"
          tamaño="mediano"
          onClick={onCancelar}
        />

        <Button
          type="submit"
          disabled={guardando}
          texto={guardando ? "Publicando..." : "Publicar"}
          variante="primario"
          tamaño="mediano"
        />
      </div>
    </form>
  );
}

export default FormularioPublicacion;