import { useNavigate } from "react-router-dom";
import "./PagoResultado.css";

function PagoFallido() {
  const navigate = useNavigate();

  return (
    <div className="pago-resultado">
      <div className="pago-resultado__card">
        <div className="pago-resultado__icono pago-resultado__icono--fallido">
          ✕
        </div>

        <h1 className="pago-resultado__titulo">
          No pudimos procesar el pago
        </h1>

        <p className="pago-resultado__texto">
          El turno fue creado, pero el pago no pudo completarse. Podés revisar
          el turno e intentar nuevamente.
        </p>

        <button
          className="pago-resultado__boton"
          onClick={() => navigate("/mis-turnos")}
        >
          Volver a mis turnos
        </button>
      </div>
    </div>
  );
}

export default PagoFallido;