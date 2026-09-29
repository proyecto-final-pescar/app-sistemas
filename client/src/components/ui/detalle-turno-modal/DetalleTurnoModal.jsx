import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import PropTypes from "prop-types";
import {
  FaCalendarAlt,
  FaHospital,
  FaUserMd,
  FaClipboardList,
  FaPaw,
  FaStickyNote,
  FaMoneyBillWave,
} from "react-icons/fa";
import Badge from "../badge/Badge";import { obtenerEstadoPago } from "../../../services/pagosService";
import { ESTADO_BADGE, formatearFechaLarga } from "../../../utils/turnos";
import styles from "./DetalleTurnoModal.module.css";

const ESTADO_PAGO_TEXTO = {
  aprobado: "Aprobado",
  pendiente: "Pendiente",
  en_proceso: "En proceso",
  rechazado: "Rechazado",
  cancelado: "Cancelado",
  reembolsado: "Reembolsado",
};

const formatearMonto = (monto) => {
  const numero = Number(monto);
  return Number.isFinite(numero) ? `$${numero.toLocaleString("es-AR")}` : "—";
};

const formatearFechaCorta = (fecha) => {
  if (!fecha) return "—";
  const d = new Date(fecha);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("es-AR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const DetalleTurnoModal = ({ abierto, turno, onClose }) => {
  const [pago, setPago] = useState(null);
  const [cargandoPago, setCargandoPago] = useState(false);

  useEffect(() => {
    if (!abierto) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [abierto, onClose]);

  useEffect(() => {
    if (!abierto || !turno?.turno_id) return;
    let cancelado = false;

    const cargarPago = async () => {
      setCargandoPago(true);
      try {
        const data = await obtenerEstadoPago(turno.turno_id);
        if (!cancelado) setPago(data);
      } catch {
        if (!cancelado) setPago({ sinDatos: true });
      } finally {
        if (!cancelado) setCargandoPago(false);
      }
    };

    cargarPago();
    return () => {
      cancelado = true;
    };
  }, [abierto, turno]);

  if (!abierto || !turno) return null;

  const badge = ESTADO_BADGE[turno.estado_turno_id];
  const esEfectivo = pago?.metodo === "efectivo";
  const pagoPendiente = pago?.estado === "pendiente";
  const textoEstadoPago =
    esEfectivo && pagoPendiente
      ? "Pendiente"
      : ESTADO_PAGO_TEXTO[pago?.estado] || pago?.estado || "—";
  const textoFechaPago =
    esEfectivo && pagoPendiente
      ? "Se abona en efectivo en el local"
      : formatearFechaCorta(pago?.fechaAprobacion);
  const razaEspecie = [turno.mascota?.raza?.nombre, turno.mascota?.raza?.especie?.nombre]
    .filter(Boolean)
    .join(" · ");

  const filas = [
    {
      icono: FaCalendarAlt,
      etiqueta: "Fecha y hora",
      valor: `${formatearFechaLarga(turno.fecha)} · ${turno.hora_inicio || "--:--"} hs`,
    },
    {
      icono: FaHospital,
      etiqueta: "Veterinaria",
      valor: turno.veterinaria?.nombre || "—",
      detalle: turno.veterinaria?.direccion || null,
    },
    turno.profesional
      ? {
          icono: FaUserMd,
          etiqueta: "Profesional",
          valor: `${turno.profesional.nombre} ${turno.profesional.apellido || ""}`.trim(),
        }
      : null,
    {
      icono: FaClipboardList,
      etiqueta: "Servicio",
      valor: turno.servicio?.nombre || turno.motivo || "—",
      detalle: turno.servicio?.categoria_servicio?.nombre || null,
    },
    {
      icono: FaPaw,
      etiqueta: "Mascota",
      valor: turno.mascota?.nombre || "—",
      detalle: razaEspecie || null,
    },
    turno.motivo && turno.motivo !== turno.servicio?.nombre
      ? { icono: FaStickyNote, etiqueta: "Motivo", valor: turno.motivo }
      : null,
    turno.notas
      ? { icono: FaStickyNote, etiqueta: "Notas", valor: turno.notas }
      : null,
    {
      icono: FaMoneyBillWave,
      etiqueta: "Monto",
      valor: formatearMonto(turno.monto_servicio),
    },
  ].filter(Boolean);

  return createPortal(
    <div className={styles.overlay} onClick={onClose} role="presentation">
      <div
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="detalle-turno-titulo"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.encabezado}>
          <h2 id="detalle-turno-titulo" className={styles.titulo}>
            Detalle del turno
          </h2>
          {badge && <Badge texto={badge.texto} variante={badge.variante} />}
        </div>

        <div className={styles.lista}>
          {filas.map((fila) => {
            const Icono = fila.icono;
            return (
              <div key={fila.etiqueta} className={styles.fila}>
                <span className={styles.icono} aria-hidden="true">
                  <Icono size={16} />
                </span>
                <div className={styles.contenido}>
                  <span className={styles.etiqueta}>{fila.etiqueta}</span>
                  <p className={styles.valor}>{fila.valor}</p>
                  {fila.detalle && <span className={styles.detalle}>{fila.detalle}</span>}
                </div>
              </div>
            );
          })}
        </div>

        <div className={styles.seccion}>
          <h3 className={styles.seccionTitulo}>Pago</h3>
          {cargandoPago ? (
            <p className={styles.mensajeSecundario}>Cargando información del pago...</p>
          ) : pago && !pago.sinDatos ? (
            <div className={styles.lista}>
              <div className={styles.fila}>
                <div className={styles.contenido}>
                  <span className={styles.etiqueta}>Estado</span>
                  <p className={styles.valor}>{textoEstadoPago}</p>
                </div>
              </div>
              <div className={styles.fila}>
                <div className={styles.contenido}>
                  <span className={styles.etiqueta}>Monto</span>
                  <p className={styles.valor}>{formatearMonto(pago.monto)}</p>
                </div>
              </div>
              <div className={styles.fila}>
                <div className={styles.contenido}>
                  <span className={styles.etiqueta}>Fecha de pago</span>
                  <p className={styles.valor}>{textoFechaPago}</p>
                </div>
              </div>
            </div>
          ) : (
            <p className={styles.mensajeSecundario}>
              Todavía no se inició el pago de este turno.
            </p>
          )}
        </div>

        <div className={styles.acciones}>
          <button type="button" className={styles.botonCerrar} onClick={onClose}>
            Cerrar
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

DetalleTurnoModal.propTypes = {
  abierto: PropTypes.bool.isRequired,
  turno: PropTypes.object,
  onClose: PropTypes.func.isRequired,
};

export default DetalleTurnoModal;
