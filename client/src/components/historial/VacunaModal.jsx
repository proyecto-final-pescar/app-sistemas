import { useState } from "react";
import Modal from "../layout/modal/Modal";
import Input from "../ui/input/Input";
import Select from "../ui/select/Select";
import Button from "../ui/button/Button";
import styles from "./FichaMedicaTab.module.css";

const fechaParaInput = (fecha) => fecha ? new Date(fecha).toISOString().slice(0, 10) : "";

const VacunaModal = ({ abierto, vacuna, profesionales = [], onClose, onGuardar }) => {
  const [form, setForm] = useState(() => ({
    nombre: vacuna?.nombre ?? "",
    fechaAplicada: fechaParaInput(vacuna?.fechaAplicada),
    profesionalId: vacuna?.profesionalId ?? "",
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
    if (!form.fechaAplicada) nuevosErrores.fechaAplicada = "La fecha es obligatoria.";
    if (!form.profesionalId) nuevosErrores.profesionalId = "Seleccioná el profesional que aplicó la vacuna.";
    setErrores(nuevosErrores);
    if (Object.keys(nuevosErrores).length) return;

    setGuardando(true);
    setErrorApi("");
    try {
      await onGuardar(
        { nombre: form.nombre.trim(), fechaAplicada: form.fechaAplicada, profesionalId: form.profesionalId },
        vacuna?._id
      );
      onClose();
    } catch (err) {
      setErrorApi(err.response?.data?.message || "No se pudo guardar la vacuna.");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Modal isOpen={abierto} onClose={onClose}>
      <form className={styles.modalForm} onSubmit={enviar}>
        <div>
          <h2 className={styles.modalTitle}>{vacuna ? "Editar vacuna" : "Agregar vacuna"}</h2>
          <p className={styles.modalSubtitle}>Completá los datos del registro de vacunación.</p>
        </div>
        <Input label="Nombre de la vacuna" value={form.nombre} onChange={(e) => setForm((actual) => ({ ...actual, nombre: e.target.value }))} error={errores.nombre} />
        <Input label="Fecha aplicada" type="date" value={form.fechaAplicada} onChange={(e) => setForm((actual) => ({ ...actual, fechaAplicada: e.target.value }))} error={errores.fechaAplicada} />
        <Select
          label="Profesional"
          opciones={opcionesProfesionales}
          placeholder="Seleccioná un profesional"
          value={form.profesionalId}
          onChange={(e) => setForm((actual) => ({ ...actual, profesionalId: e.target.value }))}
          error={errores.profesionalId}
        />
        {errorApi && <p className={styles.formError} role="alert">{errorApi}</p>}
        <div className={styles.modalActions}>
          <Button texto="Cancelar" variante="secundario" tamaño="mediano" onClick={onClose} disabled={guardando} />
          <Button type="submit" texto={guardando ? "Guardando..." : vacuna ? "Guardar cambios" : "Agregar vacuna"} variante="primario" tamaño="mediano" disabled={guardando} />
        </div>
      </form>
    </Modal>
  );
};

export default VacunaModal;