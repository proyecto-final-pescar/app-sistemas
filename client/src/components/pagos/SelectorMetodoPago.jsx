// components/pagos/SelectorMetodoPago.jsx
import Modal from '../layout/modal/Modal';
import styles from './SelectorMetodoPago.module.css';

function SelectorMetodoPago({ isOpen, onClose, onElegirMercadoPago, onElegirEfectivo, monto, procesando }) {
    return (
        <Modal isOpen={isOpen} onClose={onClose} size="sm">
            <div className={styles.contenido}>
                <h3 className={styles.titulo}>¿Cómo querés pagar?</h3>
                {monto !== undefined && (
                    <p className={styles.monto}>Monto: ${monto}</p>
                )}

                <button
                    type="button"
                    className={styles.opcion}
                    onClick={onElegirMercadoPago}
                    disabled={procesando}
                    style={{ borderColor: 'var(--color-cta)' }}
                >
                    <span className={styles.opcionTitulo}>MercadoPago</span>
                    <span className={styles.opcionDescripcion}>Pagá ahora online con tarjeta o dinero en cuenta.</span>
                </button>

                <button
                    type="button"
                    className={styles.opcion}
                    onClick={onElegirEfectivo}
                    disabled={procesando}
                >
                    <span className={styles.opcionTitulo}>Efectivo</span>
                    <span className={styles.opcionDescripcion}>Reservá ahora y aboná en el local el día del turno.</span>
                </button>

                {procesando && <p className={styles.procesando}>Procesando...</p>}
            </div>
        </Modal>
    );
}

export default SelectorMetodoPago;