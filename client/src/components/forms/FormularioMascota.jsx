import { useState, useEffect } from "react";
import { PawPrint, Camera, Pencil } from "lucide-react";
import "./FormularioMascota.css";

import Input from "../ui/input/Input";
import Select from "../ui/select/Select";
import Button from "../ui/button/Button";
import RecortadorImagen from "../common/RecortadorImagen";
import { crearMascota, actualizarMascota } from "../../services/mascotaService";
import { subirImagen } from "../../services/uploadService";
import {
  obtenerEspecies,
  obtenerRazas,
} from "../../services/constantesService";

function FormularioMascota({ mascotaInicial = null, onCancelar, onGuardado }) {
  const esEdicion = Boolean(mascotaInicial);

  const [nombre, setNombre] = useState(mascotaInicial?.nombre || "");
  const [especie, setEspecie] = useState(mascotaInicial?.especie || "");
  const [raza, setRaza] = useState(mascotaInicial?.raza || "");
  const [fechaNacimiento, setFechaNacimiento] = useState(
    mascotaInicial?.fechaNacimiento
      ? mascotaInicial.fechaNacimiento.split("T")[0]
      : "",
  );
  const [sexo, setSexo] = useState(mascotaInicial?.sexo || "");
  const [peso, setPeso] = useState(
    mascotaInicial?.peso !== undefined && mascotaInicial?.peso !== null
      ? String(mascotaInicial.peso)
      : ""
  );
  const [esCastrado, setEsCastrado] = useState(
    mascotaInicial?.esCastrado ?? false,
  );
  const [foto, setFoto] = useState(null);
  const [archivoParaRecortar, setArchivoParaRecortar] = useState(null);
  const [guardando, setGuardando] = useState(false);

  const [especiesDisponibles, setEspeciesDisponibles] = useState([]);
  const [razasDisponibles, setRazasDisponibles] = useState([]);

  // Traer el catálogo de especies del backend
  useEffect(() => {
    obtenerEspecies().then(setEspeciesDisponibles);
  }, []);

  useEffect(() => {
    if (!especie) {
      setRazasDisponibles([]);
      return;
    }
    obtenerRazas(especie).then(setRazasDisponibles);
  }, [especie]);

  const [errores, setErrores] = useState({});

  function validarFormularioMascota() {
    const nuevosErrores = {};

    if (nombre.trim() === "") {
      nuevosErrores.nombre = "El campo nombre es obligatorio";
    }

    if (especie.trim() === "") {
      nuevosErrores.especie = "Debe seleccionar una especie";
    }

    if (raza.trim() === "") {
      nuevosErrores.raza = "Debe seleccionar una raza";
    }

    if (sexo.trim() === "") {
      nuevosErrores.sexo = "Debe seleccionar un sexo";
    }
    if (fechaNacimiento.trim() === "") {
      nuevosErrores.fechaNacimiento = "Debe seleccionar una fecha aproximada";
    }
    if (peso.trim() === "") {
      nuevosErrores.peso = "El campo peso es obligatorio";
    }

    setErrores(nuevosErrores);

    return Object.keys(nuevosErrores).length === 0;
  }
  async function manejarSubmit(evento) {
    evento.preventDefault();

    if (!validarFormularioMascota()) return;

    setGuardando(true);

    try {
      let urlFoto = mascotaInicial?.foto || "";

      if (foto) {
        urlFoto = await subirImagen(foto);
      }

      const datosMascota = {
        nombre,
        especie,
        raza,
        fechaNacimiento,
        sexo,
        peso,
        esCastrado,
        foto: urlFoto,
      };

      if (esEdicion) {
        await actualizarMascota(mascotaInicial._id, datosMascota);
      } else {
        await crearMascota(datosMascota);
      }

      onGuardado?.();
    } catch (error) {
      console.error(error);
    } finally {
      setGuardando(false);
    }
  }

  function manejarCambioFoto(evento) {
    const archivo = evento.target.files?.[0];

    if (archivo) {
      setArchivoParaRecortar(archivo);
    }

    // Permite volver a elegir el mismo archivo si se cancela el recorte
    evento.target.value = "";
  }

  function manejarRecorteConfirmado(archivoRecortado) {
    setFoto(archivoRecortado);
    setArchivoParaRecortar(null);
  }

  function manejarRecorteCancelado() {
    setArchivoParaRecortar(null);
  }

  return (
    <form className="formMascota" onSubmit={manejarSubmit}>
      <div className="formMascota__header">
        <div className="formMascota__iconoWrap">
          <PawPrint size={22} />
        </div>
        <div className="formMascota__titulos">
          <h2>{esEdicion ? "Editar Mascota" : "Agregar Mascota"}</h2>
          <p>
            {esEdicion
              ? "Modificá los datos de tu mascota"
              : "Registrá a tu próximo compañero"}
          </p>
        </div>
      </div>

      <div className="formMascota__body">
        <div className="formMascota__colFoto">
          <label className="formMascota__foto">
            {foto || mascotaInicial?.foto ? (
              <div className="formMascota__fotoPreviewWrap">
                <img
                  className="formMascota__fotoImg"
                  src={foto ? URL.createObjectURL(foto) : mascotaInicial.foto}
                  alt="Vista previa"
                />
                <div className="formMascota__fotoOverlay">
                  <span className="formMascota__fotoEditBtn">
                    <Pencil size={15} />
                  </span>
                  <span className="formMascota__fotoOverlayTexto">
                    {esEdicion ? "Cambiar foto" : "Subir foto"}
                  </span>
                </div>
              </div>
            ) : (
              <>
                <span className="formMascota__fotoIconoCirculo">
                  <Camera size={20} />
                </span>
                <span className="formMascota__fotoTexto">
                  {esEdicion ? "Cambiar foto" : "Subir foto"}
                </span>
                <span className="formMascota__fotoSubtexto">
                  JPG o PNG
                </span>
              </>
            )}
            <input type="file" accept="image/*" onChange={manejarCambioFoto} />
          </label>
        </div>

        <div className="formMascota__colCampos">
          <Input
            label="Nombre"
            placeholder="Ej: Luna"
            value={nombre}
            onChange={(evento) => setNombre(evento.target.value)}
            error={errores.nombre}
          />

          <div className="formMascota__fila">
            <Select
              label="Especie"
              placeholder="Seleccioná una especie"
              opciones={especiesDisponibles}
              value={especie}
              onChange={(evento) => {
                setEspecie(evento.target.value);
                setRaza("");
              }}
              error={errores.especie}
            />

            <Select
              label="Raza"
              placeholder={especie ? "Seleccioná una raza" : "Elegí primero una especie"}
              opciones={razasDisponibles}
              value={raza}
              onChange={(evento) => setRaza(evento.target.value)}
              error={errores.raza}
              disabled={!especie}
            />
          </div>

          <div className="formMascota__fila">
            <Input
              label="Fecha de Nacimiento (aproximado)"
              type="date"
              value={fechaNacimiento}
              onChange={(evento) => setFechaNacimiento(evento.target.value)}
              error={errores.fechaNacimiento}
            />

            <Input
              label="Peso"
              placeholder="0.0 kg"
              value={peso}
              type="number"
              onChange={(evento) => setPeso(evento.target.value)}
              error={errores.peso}
            />
          </div>

          <div>
            <label className="formMascota__label">Sexo</label>
            <div className="formMascota__opciones">
              <div
                className={`formMascota__opcion ${sexo === "Macho" ? "formMascota__opcion--selected" : ""
                  }`}
                onClick={() => setSexo("Macho")}
              >
                Macho
              </div>

              <div
                className={`formMascota__opcion ${sexo === "Hembra" ? "formMascota__opcion--selected" : ""
                  }`}
                onClick={() => setSexo("Hembra")}
              >
                Hembra
              </div>
            </div>
            {errores.sexo && <p className="formMascota__error">{errores.sexo}</p>}
          </div>

          <div>
            <label className="formMascota__label">Castración</label>
            <div className="formMascota__opciones">
              <div
                className={`formMascota__opcion ${esCastrado === true ? "formMascota__opcion--selected" : ""}`}
                onClick={() => setEsCastrado(true)}
              >
                Castrad@
              </div>
              <div
                className={`formMascota__opcion ${esCastrado === false ? "formMascota__opcion--selected" : ""}`}
                onClick={() => setEsCastrado(false)}
              >
                No castrad@
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="formMascota__acciones">
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
          texto={
            guardando
              ? "Guardando..."
              : esEdicion
                ? "Guardar cambios"
                : "Agregar Mascota"
          }
          variante="primario"
          tamaño="mediano"
        />
      </div>

      {archivoParaRecortar && (
        <RecortadorImagen
          archivo={archivoParaRecortar}
          aspecto={3 / 4}
          forma="rectangular"
          titulo="Ajustá la foto de tu mascota"
         
          onCancelar={manejarRecorteCancelado}
          onConfirmar={manejarRecorteConfirmado}
        />
      )}
    </form>
  );
}
export default FormularioMascota;