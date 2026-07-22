import { useNavigate } from "react-router-dom";
import PanelDestacado from "../ui/panel-destacado/PanelDestacado";
import Button from "../ui/button/Button";

const CtaSection = () => {
  const navigate = useNavigate();

  return (
    <section
      style={{
        width: "100%",
        backgroundColor: "#f5f3ff",
        padding: "64px 24px",
        fontFamily: "'Inter', Arial, Helvetica, sans-serif",
      }}
    >
      <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
        <PanelDestacado
          titulo="Empezá hoy, es gratis"
          subtitulo="Registrate en menos de 2 minutos y centralizá toda la salud de tu mascota."
        >
          <div style={{ display: "flex", justifyContent: "center" }}>
            <Button
              texto="Registrarme gratis"
              variante="primario"
              tamaño="grande"
              onClick={() => navigate("/registro")}
            />
          </div>
        </PanelDestacado>
      </div>
    </section>
  );
};

export default CtaSection;