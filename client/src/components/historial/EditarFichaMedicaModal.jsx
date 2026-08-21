import { useState } from "react";
import Modal from "../layout/modal/Modal";
import Input from "../ui/input/Input";
import Textarea from "../ui/textarea/Textarea";
import Button from "../ui/button/Button";
import styles from "./FichaMedicaTab.module.css";

const CAMPOS_INICIALES = {
  colorPelaje: "",
  microchip: "",
  enfermedadesCronicas: "",
  cirugiasPrevias: "",
  medicamentosHabituales: "",
};

const EditarFichaMedicaModal = ({ abierto, fichaMedica, onClose, onGuardar }) => {
  const [form, setForm] = useState(() => ({
    ...CAMPOS_INICIALES,
    colorPelaje: fichaMedica?.colorPelaje ?? "",
    microchip: fichaMedica?.microchip ?? "",
    enfermedadesCronicas: fichaMedica?.enfermedadesCronicas ?? "",
    cirugiasPrevias: fichaMedica?.cirugiasPrevias ?? "",
    medicamentosHabituales: fichaMedica?.medicamentosHabituales ?? "",
  }));
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  const cambiar = (campo) => (event) => {
    setForm((actual) => ({ ...actual, [campo]: event.target.value }));
  };

  const enviar = async (event) => {
    event.preventDefault();
    setGuardando(true);
    setError("");
    try {
      await onGuardar(form);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "No se pudo guardar la ficha médica.");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Modal isOpen={abierto} onClose={onClose}>
      <form className={styles.modalForm} onSubmit={enviar}>
        <div>
          <h2 className={styles.modalTitle}>Editar ficha permanente</h2>
          <p className={styles.modalSubtitle}>Actualizá únicamente la información médica permanente.</p>
        </div>
        <Input label="Color / pelaje" value={form.colorPelaje} onChange={cambiar("colorPelaje")} />
        <Input label="Microchip" value={form.microchip} onChange={cambiar("microchip")} />
        <Textarea label="Enfermedades crónicas" value={form.enfermedadesCronicas} onChange={cambiar("enfermedadesCronicas")} />
        <Textarea label="Cirugías previas" value={form.cirugiasPrevias} onChange={cambiar("cirugiasPrevias")} />
        <Textarea label="Medicamentos habituales" value={form.medicamentosHabituales} onChange={cambiar("medicamentosHabituales")} />
        {error && <p className={styles.formError} role="alert">{error}</p>}
        <div className={styles.modalActions}>
          <Button texto="Cancelar" variante="secundario" tamaño="mediano" onClick={onClose} disabled={guardando} />
          <Button type="submit" texto={guardando ? "Guardando..." : "Guardar cambios"} variante="primario" tamaño="mediano" disabled={guardando} />
        </div>
      </form>
    </Modal>
  );
};

export default EditarFichaMedicaModal;
