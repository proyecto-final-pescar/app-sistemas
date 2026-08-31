import { useState } from "react";
import { createPortal } from "react-dom";
import ConfirmModal from "../confirm-modal/ConfirmModal";
import PropTypes from "prop-types";

const LogoutModal = ({ children, onConfirm }) => {
  const [abierto, setAbierto] = useState(false);
  const [confirmando, setConfirmando] = useState(false);

  const handleConfirm = async () => {
    setConfirmando(true);
    try {
      await onConfirm();
      setAbierto(false);
    } catch (error) {
      console.error("Error en logout:", error);
    } finally {
      setConfirmando(false);
    }
  };

  const handleClick = () => {
    setAbierto(true);
  };

  return (
    <>
      <div onClick={handleClick} style={{ cursor: "pointer" }}>
        {children}
      </div>

      {createPortal(
        <ConfirmModal
          abierto={abierto}
          titulo="Cerrar sesión"
          mensaje="¿Estás seguro de que deseas cerrar sesión?"
          textoConfirmar="Cerrar sesión"
          textoCancelar="Cancelar"
          textoConfirmando="Cerrando sesión…"
          varianteConfirmar="peligro"
          onConfirm={handleConfirm}
          onCancel={() => setAbierto(false)}
          confirmando={confirmando}
        />,
        document.body
      )}
    </>
  );
};

LogoutModal.propTypes = {
  children: PropTypes.node.isRequired,
  onConfirm: PropTypes.func.isRequired,
};

export default LogoutModal;