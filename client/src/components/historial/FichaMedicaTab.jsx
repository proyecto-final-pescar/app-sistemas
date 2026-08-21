import { useMemo, useState } from "react";
import { FileText, Pencil, Stethoscope, Trash2 } from "lucide-react";
import Card from "../ui/card/Card";
import Badge from "../ui/badge/Badge";
import Button from "../ui/button/Button";
import ConfirmModal from "../ui/confirm-modal/ConfirmModal";
import EditarFichaMedicaModal from "./EditarFichaMedicaModal";
import VacunaModal from "./VacunaModal";
import EstudioModal from "./EstudioModal";
import { formatearEdad } from "../../utils/EdadMascota";
import styles from "./FichaMedicaTab.module.css";

const textoOEstadoVacio = (valor) => {
  if (valor === null || valor === undefined || String(valor).trim() === "") return "No informado";
  return valor;
};

const formatearFecha = (fecha) => {
  if (!fecha) return "No informada";
  const valor = new Date(fecha);
  if (Number.isNaN(valor.getTime())) return "No informada";
  return valor.toLocaleDateString("es-AR", { timeZone: "UTC" });
};

const nombreProfesional = (registro) => registro?.profesionalNombre || null;

const DatoPermanente = ({ etiqueta, valor }) => (
  <div className={styles.permanentItem}>
    <dt>{etiqueta}</dt>
    <dd>{textoOEstadoVacio(valor)}</dd>
  </div>
);

const FichaMedicaTab = ({
  mascota,
  fichaMedica,
  historial,
  vacunas,
  estudios,
  profesionales,
  onGuardarFicha,
  onGuardarVacuna,
  onEliminarVacuna,
  onGuardarEstudio,
  onEliminarEstudio,
}) => {
  const [modalFicha, setModalFicha] = useState(false);
  const [vacunaSeleccionada, setVacunaSeleccionada] = useState(undefined);
  const [estudioSeleccionado, setEstudioSeleccionado] = useState(undefined);
  const [confirmacion, setConfirmacion] = useState(null);
  const [eliminando, setEliminando] = useState(false);
  const [mensaje, setMensaje] = useState(null);

  const edadTexto = formatearEdad(mascota?.fechaNacimiento);
  const ultimaConsulta = useMemo(() => {
    if (!historial.length) return null;
    return historial.reduce((ultima, consulta) => (
      !ultima || new Date(consulta.fecha) > new Date(ultima.fecha) ? consulta : ultima
    ), null);
  }, [historial]);

  const ejecutar = async (operacion, mensajeExito) => {
    setMensaje(null);
    try {
      await operacion();
      setMensaje({ tipo: "exito", texto: mensajeExito });
    } catch (error) {
      setMensaje({
        tipo: "error",
        texto: error.response?.data?.message || "No se pudo completar la operación.",
      });
      throw error;
    }
  };

  const guardarFicha = (datos) => ejecutar(
    () => onGuardarFicha(datos),
    "La ficha permanente se actualizó correctamente.",
  );

  const guardarVacuna = (datos, id) => ejecutar(
    () => onGuardarVacuna(datos, id),
    id ? "La vacuna se actualizó correctamente." : "La vacuna se agregó correctamente.",
  );

  const guardarEstudio = (datos, id, archivo) => ejecutar(
    () => onGuardarEstudio(datos, id, archivo),
    id ? "El estudio se actualizó correctamente." : "El estudio se agregó correctamente.",
  );

  const confirmarEliminacion = async () => {
    if (!confirmacion) return;
    setEliminando(true);
    try {
      if (confirmacion.tipo === "vacuna") {
        await ejecutar(() => onEliminarVacuna(confirmacion.item._id), "La vacuna se eliminó correctamente.");
      } else {
        await ejecutar(() => onEliminarEstudio(confirmacion.item._id), "El estudio se eliminó correctamente.");
      }
      setConfirmacion(null);
    } catch {
      setConfirmacion(null);
    } finally {
      setEliminando(false);
    }
  };

  return (
    <section className={styles.tabContent} aria-label="Ficha médica">
      {mensaje && (
        <div className={`${styles.feedback} ${mensaje.tipo === "error" ? styles.feedbackError : styles.feedbackSuccess}`} role="status">
          {mensaje.texto}
          <button type="button" onClick={() => setMensaje(null)} aria-label="Cerrar mensaje">×</button>
        </div>
      )}

      <div className={styles.editHeader}>
        <Button texto="Editar ficha permanente" variante="secundario" tamaño="mediano" onClick={() => setModalFicha(true)} />
      </div>

      <Card className={styles.patientCard}>
        <div className={styles.patientAvatar}>
          {mascota?.foto ? <img src={mascota.foto} alt={mascota.nombre || "Paciente"} /> : <Stethoscope size={30} />}
        </div>
        <div className={styles.patientInfo}>
          <h2>{textoOEstadoVacio(mascota?.nombre)}</h2>
          <p>
            {[mascota?.especie, mascota?.raza, mascota?.sexo].filter(Boolean).join(" · ") || "Datos generales no informados"}
          </p>
          <div className={styles.badges}>
            {typeof mascota?.esCastrado === "boolean" && (
              <Badge texto={mascota.esCastrado ? "Castrado/a" : "No castrado/a"} variante={mascota.esCastrado ? "confirmado" : "pendiente"} />
            )}
            {fichaMedica?.colorPelaje && <Badge texto={`Pelaje: ${fichaMedica.colorPelaje}`} variante="pendiente" />}
          </div>
        </div>
      </Card>

      <div className={styles.metricsGrid}>
        <Card className={styles.metricCard}><span>Peso actual</span><strong>{mascota?.peso !== null && mascota?.peso !== undefined ? `${mascota.peso} kg` : "No informado"}</strong></Card>
        <Card className={styles.metricCard}><span>Edad actual</span><strong>{edadTexto}</strong></Card>
        <Card className={styles.metricCard}><span>Consultas totales</span><strong>{historial.length}</strong></Card>
        <Card className={styles.metricCard}><span>Última consulta</span><strong>{ultimaConsulta ? formatearFecha(ultimaConsulta.fecha) : "Sin consultas"}</strong></Card>
      </div>

      <section className={styles.permanentCard}>
        <h3>Ficha permanente</h3>
        <dl className={styles.permanentGrid}>
          <DatoPermanente etiqueta="Fecha de nacimiento" valor={formatearFecha(mascota?.fechaNacimiento)} />
          <DatoPermanente etiqueta="Especie / raza" valor={[mascota?.especie, mascota?.raza].filter(Boolean).join(" · ")} />
          <DatoPermanente etiqueta="Color / pelaje" valor={fichaMedica?.colorPelaje} />
          <DatoPermanente etiqueta="Microchip" valor={fichaMedica?.microchip} />
          <DatoPermanente etiqueta="Enfermedades crónicas" valor={fichaMedica?.enfermedadesCronicas} />
          <DatoPermanente etiqueta="Cirugías previas" valor={fichaMedica?.cirugiasPrevias} />
          <DatoPermanente etiqueta="Medicamentos habituales" valor={fichaMedica?.medicamentosHabituales} />
        </dl>
      </section>

      <Card className={styles.recordsCard}>
        <div className={styles.sectionHeader}>
          <h3>Registro de vacunación</h3>
          <Button texto="+ Agregar vacuna" variante="primario" tamaño="chico" onClick={() => setVacunaSeleccionada(null)} />
        </div>
        {vacunas.length === 0 ? (
          <div className={styles.emptyState}>No hay vacunas registradas para este paciente.</div>
        ) : (
          <ul className={styles.recordList}>
            {vacunas.map((vacuna) => (
              <li key={vacuna._id}>
                <div>
                  <strong>{vacuna.nombre}</strong>
                  <span>Aplicada el {formatearFecha(vacuna.fechaAplicada)}{nombreProfesional(vacuna) ? ` · ${nombreProfesional(vacuna)}` : ""}</span>
                </div>
                <div className={styles.rowActions}>
                  <button type="button" onClick={() => setVacunaSeleccionada(vacuna)} aria-label={`Editar ${vacuna.nombre}`}><Pencil size={18} /></button>
                  <button type="button" onClick={() => setConfirmacion({ tipo: "vacuna", item: vacuna })} aria-label={`Eliminar ${vacuna.nombre}`}><Trash2 size={18} /></button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card className={styles.recordsCard}>
        <div className={styles.sectionHeader}>
          <h3>Estudios</h3>
          <Button texto="+ Agregar estudio" variante="primario" tamaño="chico" onClick={() => setEstudioSeleccionado(null)} />
        </div>
        {estudios.length === 0 ? (
          <div className={styles.emptyState}>No hay estudios registrados para este paciente.</div>
        ) : (
          <ul className={styles.recordList}>
            {estudios.map((estudio) => (
              <li key={estudio._id}>
                <div>
                  <strong>{estudio.nombre}</strong>
                  <span>{formatearFecha(estudio.fecha)}{nombreProfesional(estudio) ? ` · ${nombreProfesional(estudio)}` : ""}</span>
                </div>
                <div className={styles.rowActions}>
                  {estudio.urlArchivo ? (
                    <a href={estudio.urlArchivo} target="_blank" rel="noreferrer"><FileText size={16} /> Ver resultado</a>
                  ) : (
                    <Badge texto="Sin adjunto" variante="pendiente" />
                  )}
                  <button type="button" onClick={() => setEstudioSeleccionado(estudio)} aria-label={`Editar ${estudio.nombre}`}><Pencil size={18} /></button>
                  <button type="button" onClick={() => setConfirmacion({ tipo: "estudio", item: estudio })} aria-label={`Eliminar ${estudio.nombre}`}><Trash2 size={18} /></button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {modalFicha && (
        <EditarFichaMedicaModal abierto fichaMedica={fichaMedica} onClose={() => setModalFicha(false)} onGuardar={guardarFicha} />
      )}
      {vacunaSeleccionada !== undefined && (
        <VacunaModal
          abierto
          vacuna={vacunaSeleccionada || null}
          profesionales={profesionales}
          onClose={() => setVacunaSeleccionada(undefined)}
          onGuardar={guardarVacuna}
        />
      )}
      {estudioSeleccionado !== undefined && (
        <EstudioModal
          abierto
          estudio={estudioSeleccionado || null}
          profesionales={profesionales}
          onClose={() => setEstudioSeleccionado(undefined)}
          onGuardar={guardarEstudio}
        />
      )}
      <ConfirmModal
        abierto={Boolean(confirmacion)}
        titulo={`Eliminar ${confirmacion?.tipo || "registro"}`}
        mensaje={`¿Querés eliminar “${confirmacion?.item?.nombre || "este registro"}”? Esta acción no se puede deshacer.`}
        textoConfirmar="Eliminar"
        onConfirm={confirmarEliminacion}
        onCancel={() => setConfirmacion(null)}
        confirmando={eliminando}
      />
    </section>
  );
};

export default FichaMedicaTab;