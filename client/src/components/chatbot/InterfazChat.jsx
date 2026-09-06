import { useState, useRef, useEffect } from 'react';
import PersonajeBot from './PersonajeBot';
import estilos from './InterfazChat.module.css';

function IconoCerrar() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true">
      <path
        d="M6 6l12 12M18 6L6 18"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconoEnviar() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true">
      <path
        d="M4 12l16-7-6 7 6 7-16-7Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IndicadorEscritura({ tardandoMucho }) {
  return (
    <div className={estilos.filaMensaje}>
      <div className={estilos.grupoEscritura}>
        <div className={`${estilos.burbujaMensaje} ${estilos.burbujaBot} ${estilos.indicadorEscritura}`}>
          <span className={estilos.punto} />
          <span className={estilos.punto} />
          <span className={estilos.punto} />
        </div>
        {tardandoMucho && (
          <p className={estilos.avisoDemora}>Esto está tardando más de lo esperado...</p>
        )}
      </div>
    </div>
  );
}

/**
 * Panel flotante con la conversación. Se renderiza únicamente cuando
 * el chat está abierto (controlado por ChatBot.jsx).
 */
export default function InterfazChat({
  mensajes,
  estaEscribiendo,
  tardandoMucho = false,
  onEnviarMensaje,
  onCerrar,
  tipoBot = 'perro',
  pose = 'idle',
  nombreBot = 'Firu',
  inline = false,
  soloVistaPrevia = false,
}) {
  const [textoInput, setTextoInput] = useState('');
  const finMensajesRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    finMensajesRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensajes, estaEscribiendo]);

  // Devuelve el foco al input apenas se vuelve a habilitar, para que
  // el usuario pueda seguir escribiendo sin tener que hacer click de nuevo.
  useEffect(() => {
    if (!estaEscribiendo) {
      inputRef.current?.focus();
    }
  }, [estaEscribiendo]);

  const manejarEnvio = (evento) => {
    evento.preventDefault();
    
    if (!textoInput.trim() || estaEscribiendo) return;
    onEnviarMensaje(textoInput);
    setTextoInput('');
  };

  return (
    <div
      className={inline ? estilos.panelInline : estilos.panel}
      role="dialog"
      aria-label={`Chat con ${nombreBot}`}
    >
      <header className={estilos.encabezado}>
        <div className={estilos.infoBot}>
          <PersonajeBot tipo={tipoBot} pose={pose} size={36} />
          <div>
            <p className={estilos.nombreBot}>{nombreBot}</p>
            <p className={estilos.estadoBot}>Asistente de MyPet</p>
          </div>
        </div>
        {!soloVistaPrevia && (
          <button
            type="button"
            className={estilos.botonCerrar}
            onClick={onCerrar}
            aria-label="Cerrar chat"
          >
            <IconoCerrar />
          </button>
        )}
      </header>

      <div className={estilos.cuerpoMensajes}>
        {mensajes.map((mensaje) => (
          <div
            key={mensaje.id}
            className={`${estilos.filaMensaje} ${
              mensaje.role === 'user' ? estilos.filaUsuario : ''
            }`}
          >
            <div
              className={`${estilos.burbujaMensaje} ${
                mensaje.role === 'user' ? estilos.burbujaUsuario : estilos.burbujaBot
              } ${mensaje.esError ? estilos.burbujaError : ''}`}
            >
              {mensaje.content}
            </div>
          </div>
        ))}

        {estaEscribiendo && <IndicadorEscritura tardandoMucho={tardandoMucho} />}

        <div ref={finMensajesRef} />
      </div>

      <form className={estilos.formularioInput} onSubmit={manejarEnvio}>
        <input
          ref={inputRef}
          type="text"
          className={estilos.input}
          placeholder="Escribí tu mensaje..."
          value={textoInput}
          onChange={(evento) => setTextoInput(evento.target.value)}
          disabled={estaEscribiendo || soloVistaPrevia}
          aria-label="Mensaje para el asistente"
        />
        <button
          type="submit"
          className={estilos.botonEnviar}
          disabled={!textoInput.trim() || estaEscribiendo || soloVistaPrevia}
          aria-label="Enviar mensaje"
        >
          <IconoEnviar />
        </button>
      </form>
    </div>
  );
}