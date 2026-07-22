import PropTypes from "prop-types";
import "./PanelAuth.css";

export default function PanelAuth({ logoLeft, logoRight, titulo, subtitulo, children }) {
  return (
    <div className="panel-auth">
      <div className="panel-auth__logo" aria-hidden={!logoLeft && !logoRight}>
        {logoLeft && (typeof logoLeft === "string" ? <img id="logoLeft" src={logoLeft} alt="" /> : logoLeft) }
        {logoRight && (typeof logoRight === "string" ? <img id="logoRight" src={logoRight} alt="MyPet" /> : logoRight)}
      </div>

      <div className="panel-auth__card" role="region" aria-labelledby="panel-auth-title">
        <div className="panel-auth__card-accent" />
        <div className="panel-auth__body">
          <h1 id="panel-auth-title" className="panel-auth__title">{titulo}</h1>
          {subtitulo && <p className="panel-auth__subtitle">{subtitulo}</p>}
          <div className="panel-auth__content">{children}</div>
        </div>
      </div>
    </div>
  );
}

PanelAuth.propTypes = {
  logoLeft: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  logoRight: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  titulo: PropTypes.node.isRequired,
  subtitulo: PropTypes.node,
  children: PropTypes.node,
};
