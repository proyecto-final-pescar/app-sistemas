import { useEffect } from 'react';
import './Modal.css';

function Modal({ isOpen, onClose, children }) {
  useEffect(() => {
    if (!isOpen) return;

    const scrollOriginal = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = scrollOriginal;
    };
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="mdl-overlay" onClick={onClose}>
      <div
        className="mdl-content"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <button className="btn-close" onClick={onClose} aria-label="Cerrar">
          ×
        </button>

        {children}
      </div>
    </div>
  );
}

export default Modal;