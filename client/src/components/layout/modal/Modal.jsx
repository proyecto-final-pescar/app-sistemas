import './Modal.css';

function Modal({ isOpen, onClose, children })
{
    if (!isOpen) {

     return null;

    }

    return (
        <div className = "mdl-overlay" > 
            <div className = "mdl-content">
                <button className="btn-close" onClick={onClose}>
                ×
                </button>

                {children}
            </div>
        </div>
    );
}

export default Modal;