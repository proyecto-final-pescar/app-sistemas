import FormularioMascota from "../../../components/forms/FormularioMascota.jsx";
import Button from "../../../components/ui/button/Button";
import Modal from "../../../components/layout/modal/Modal";
import { useState } from "react";

function MisMascotas() {

  const [modalAbierto, setModalAbierto] = useState(false);
  const [mascotaSeleccionada, setMascotaSeleccionada] = useState(null);

  return (
    <div>
      <h1>Mis Mascotas</h1>
      

      <Button
        texto="Agregar Mascota"
        variante="primario"
        tamaño="mediano"
        onClick={() => {
          setMascotaSeleccionada(null);
          setModalAbierto(true);
        }}
        />

                {modalAbierto && (
        <Modal
          isOpen={modalAbierto}
          onClose={() => setModalAbierto(false)}
        >
          <FormularioMascota
            mascotaInicial={mascotaSeleccionada}
            onCancelar={() => setModalAbierto(false)}
            />
        </Modal>
      )}
      
    </div>
  );
}

export default MisMascotas;