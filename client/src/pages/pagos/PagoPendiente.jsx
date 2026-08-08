import { useNavigate } from "react-router-dom";
import "./PagoResultado.css";

function PagoPendiente() {
  const navigate = useNavigate();

  return (
    <div className="pago-resultado">
      <div className="pago-resultado__card">
        <div className="pago-resultado__icono pago-resultado__icono--pendiente">
          ⏳
        </div>

        <h1 className="pago-resultado__titulo">Pago pendiente</h1>

        <p className="pago-resultado__texto">
          Tu pago todavía está siendo procesado. Podés revisar el estado más
          tarde desde tus turnos.
        </p>

        <button
          className="pago-resultado__boton"
          onClick={() => navigate("/mis-turnos")}
        >
          Ver mis turnos
        </button>
      </div>
    </div>
  );
}

export default PagoPendiente;