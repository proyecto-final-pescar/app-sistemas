import { useEffect } from 'react';
import { X } from 'lucide-react';
import './Modal.css';

const TAMANIOS = {
  sm: 'mdl-content--sm',
  lg: 'mdl-content--lg',
};

function Modal({ isOpen, onClose, children, size = 'sm', sinPadding }) {
  useEffect(() => {
    if (!isOpen) return;

    const scrollOriginal = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const manejarEscape = (evento) => {
      if (evento.key === 'Escape') onClose?.();
    };
    document.addEventListener('keydown', manejarEscape);

    return () => {
      document.body.style.overflow = scrollOriginal;
      document.removeEventListener('keydown', manejarEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  const claseTamanio = TAMANIOS[size] || TAMANIOS.sm;

  return (
    <div className="mdl-overlay" onClick={onClose}>
      <div
        className={`mdl-content ${claseTamanio}${sinPadding ? ' mdl-content--sin-padding' : ''}`}
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <button className="btn-close" onClick={onClose} aria-label="Cerrar">
          <X size={18} strokeWidth={2.25} />
        </button>

        {children}
      </div>
    </div>
  );
}

export default Modal;