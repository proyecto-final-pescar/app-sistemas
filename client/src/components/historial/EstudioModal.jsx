import { useState } from "react";
import Modal from "../layout/modal/Modal";
import Input from "../ui/input/Input";
import Select from "../ui/select/Select";
import Button from "../ui/button/Button";
import styles from "./FichaMedicaTab.module.css";

const fechaParaInput = (fecha) => fecha ? new Date(fecha).toISOString().slice(0, 10) : "";

const EstudioModal = ({ abierto, estudio, profesionales = [], onClose, onGuardar }) => {
  const [form, setForm] = useState(() => ({
    nombre: estudio?.nombre ?? "",
    fecha: fechaParaInput(estudio?.fecha),
    profesionalId: estudio?.profesionalId ?? "",
    archivo: null,
    quitarArchivo: false,
  }));
  const [errores, setErrores] = useState({});
  const [guardando, setGuardando] = useState(false);
  const [errorApi, setErrorApi] = useState("");

  const opcionesProfesionales = profesionales.map((p) => ({
    value: p._id,
    label: p.especialidad ? `${p.nombre} · ${p.especialidad}` : p.nombre,
  }));

  const enviar = async (event) => {
    event.preventDefault();
    const nuevosErrores = {};
    if (!form.nombre.trim()) nuevosErrores.nombre = "El nombre es obligatorio.";
    if (!form.fecha) nuevosErrores.fecha = "La fecha es obligatoria.";
    if (!form.profesionalId) nuevosErrores.profesionalId = "Seleccioná el profesional que realizó el estudio.";
    setErrores(nuevosErrores);
    if (Object.keys(nuevosErrores).length) return;

    setGuardando(true);
    setErrorApi("");
    try {
      const datos = { nombre: form.nombre.trim(), fecha: form.fecha, profesionalId: form.profesionalId };
      if (form.quitarArchivo && !form.archivo) datos.urlArchivo = null;
      await onGuardar(datos, estudio?._id, form.archivo);
      onClose();
    } catch (err) {
      setErrorApi(err.response?.data?.message || "No se pudo guardar el estudio.");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Modal isOpen={abierto} onClose={onClose}>
      <form className={styles.modalForm} onSubmit={enviar}>
        <div>
          <h2 className={styles.modalTitle}>{estudio ? "Editar estudio" : "Agregar estudio"}</h2>
          <p className={styles.modalSubtitle}>Podés adjuntar una imagen de hasta 5 MB.</p>
        </div>
        <Input label="Nombre del estudio" value={form.nombre} onChange={(e) => setForm((actual) => ({ ...actual, nombre: e.target.value }))} error={errores.nombre} />
        <Input label="Fecha" type="date" value={form.fecha} onChange={(e) => setForm((actual) => ({ ...actual, fecha: e.target.value }))} error={errores.fecha} />
        <Select
          label="Profesional"
          opciones={opcionesProfesionales}
          placeholder="Seleccioná un profesional"
          value={form.profesionalId}
          onChange={(e) => setForm((actual) => ({ ...actual, profesionalId: e.target.value }))}
          error={errores.profesionalId}
        />
        <label className={styles.fileField}>
          <span>Resultado (opcional)</span>
          <input type="file" accept="image/*" onChange={(e) => setForm((actual) => ({ ...actual, archivo: e.target.files?.[0] ?? null, quitarArchivo: false }))} />
          <small>{form.archivo?.name || (estudio?.urlArchivo ? "Conservar archivo actual" : "Sin archivo seleccionado")}</small>
        </label>
        {estudio?.urlArchivo && !form.archivo && (
          <label className={styles.removeFileOption}>
            <input
              type="checkbox"
              checked={form.quitarArchivo}
              onChange={(e) => setForm((actual) => ({ ...actual, quitarArchivo: e.target.checked }))}
            />
            Quitar el archivo actual
          </label>
        )}
        {errorApi && <p className={styles.formError} role="alert">{errorApi}</p>}
        <div className={styles.modalActions}>
          <Button texto="Cancelar" variante="secundario" tamaño="mediano" onClick={onClose} disabled={guardando} />
          <Button type="submit" texto={guardando ? "Guardando..." : estudio ? "Guardar cambios" : "Agregar estudio"} variante="primario" tamaño="mediano" disabled={guardando} />
        </div>
      </form>
    </Modal>
  );
};

export default EstudioModal;