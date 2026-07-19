import "./Foro.css";

import { useState } from "react";

import Modal from "../../../components/layout/modal/Modal";
import NuevaPublicacionForm from "../../../components/forms/FormularioMascota/NuevaPublicacionForm/NuevaPublicacionForm";

function Foro() {
  const [modalAbierto, setModalAbierto] = useState(false);

  function abrirModal() {
    setModalAbierto(true);
  }

  function cerrarModal() {
    setModalAbierto(false);
  }

  return (
    <div>
      <h1>Foro</h1>
      <p>Sección en construcción.</p>

      <button className="btn-nueva-publicacion" onClick={abrirModal}>
        + Nueva Publicación
      </button>

      <Modal
        isOpen={modalAbierto}
        onClose={cerrarModal}
      >
        <NuevaPublicacionForm
          onCancelar={cerrarModal}
        />
      </Modal>
    </div>
  );
}

export default Foro;