import { useNavigate } from "react-router-dom";
import "./PagoResultado.css";

function PagoExitoso() {
  const navigate = useNavigate();

  return (
    <div className="pago-resultado">
      <div className="pago-resultado__card">
        <div className="pago-resultado__icono pago-resultado__icono--exitoso">
          ✓
        </div>

        <h1 className="pago-resultado__titulo">¡Pago aprobado!</h1>

        <p className="pago-resultado__texto">
          Tu pago se procesó correctamente y tu turno quedó confirmado.
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

export default PagoExitoso;