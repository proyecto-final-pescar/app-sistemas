// components/pagos/SelectorMetodoPago.jsx
import { useEffect, useState } from 'react';
import Modal from '../layout/modal/Modal';
import styles from './SelectorMetodoPago.module.css';

const OPCIONES = [
  {
    valor: 'mercadopago',
    titulo: 'MercadoPago',
    descripcion: 'Pagá ahora online con tarjeta o dinero en cuenta.',
  },
  {
    valor: 'efectivo',
    titulo: 'Efectivo',
    descripcion: 'Reservá ahora y aboná en el local el día del turno.',
  },
];

function SelectorMetodoPago({ isOpen, onClose, onElegirMercadoPago, onElegirEfectivo, monto, procesando }) {
  const [metodoElegido, setMetodoElegido] = useState('');

  // Resetea la selección cada vez que se abre el modal, para no arrastrar
  // la elección de una sesión de pago anterior.
  useEffect(() => {
    if (isOpen) setMetodoElegido('');
  }, [isOpen]);

  const handleConfirmar = () => {
    if (!metodoElegido || procesando) return;
    if (metodoElegido === 'mercadopago') onElegirMercadoPago();
    else onElegirEfectivo();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm" zIndex={2500}>
      <div className={styles.contenido}>
        <h3 className={styles.titulo}>¿Cómo querés pagar?</h3>
        {monto !== undefined && (
          <p className={styles.monto}>Monto: ${monto}</p>
        )}

        <div className={styles.opciones} role="radiogroup" aria-label="Método de pago">
          {OPCIONES.map((opcion) => {
            const seleccionado = metodoElegido === opcion.valor;
            return (
              <label
                key={opcion.valor}
                className={`${styles.opcion} ${seleccionado ? styles.opcionActiva : ''}`}
              >
                <input
                  type="radio"
                  name="metodoPago"
                  value={opcion.valor}
                  checked={seleccionado}
                  onChange={() => setMetodoElegido(opcion.valor)}
                  disabled={procesando}
                  className={styles.radioInput}
                />
                <span className={styles.radioCirculo} aria-hidden="true" />
                <span className={styles.opcionTexto}>
                  <span className={styles.opcionTitulo}>{opcion.titulo}</span>
                  <span className={styles.opcionDescripcion}>{opcion.descripcion}</span>
                </span>
              </label>
            );
          })}
        </div>

        <button
          type="button"
          className={styles.btnConfirmar}
          onClick={handleConfirmar}
          disabled={!metodoElegido || procesando}
        >
          {procesando ? 'Procesando...' : 'Confirmar'}
        </button>
      </div>
    </Modal>
  );
}

export default SelectorMetodoPago;