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
 * Panel con la conversación.
 *
 * - Flotante: lo renderiza ChatBot.jsx cuando el chat está abierto.
 * - Inline: lo usa PerfilUsuario.jsx como vista previa funcional del asistente.
 *
 * @param {boolean} ocultarCerrar - oculta el botón de cerrar 
 * @param {boolean} autoEnfocar 
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
  ocultarCerrar = false,
  autoEnfocar = true,
}) {
  const [textoInput, setTextoInput] = useState('');
  const cuerpoRef = useRef(null);
  const inputRef = useRef(null);

  // Scroll interno del panel. Se usa scrollTo sobre el contenedor (y no
  // scrollIntoView) para no mover la página entera cuando el chat es inline.
  useEffect(() => {
    const cuerpo = cuerpoRef.current;
    if (!cuerpo) return;
    cuerpo.scrollTo({ top: cuerpo.scrollHeight, behavior: 'smooth' });
  }, [mensajes, estaEscribiendo]);

  // Devuelve el foco al input apenas se vuelve a habilitar, para que
  // el usuario pueda seguir escribiendo sin tener que hacer click de nuevo.
  useEffect(() => {
    if (estaEscribiendo) return;
    if (!autoEnfocar && mensajes.length <= 1) return;
    inputRef.current?.focus({ preventScroll: true });
  }, [estaEscribiendo, autoEnfocar, mensajes.length]);

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
        {!ocultarCerrar && (
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

      <div ref={cuerpoRef} className={estilos.cuerpoMensajes}>
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
      </div>

      <form className={estilos.formularioInput} onSubmit={manejarEnvio}>
        <input
          ref={inputRef}
          type="text"
          className={estilos.input}
          placeholder="Escribí tu mensaje..."
          value={textoInput}
          onChange={(evento) => setTextoInput(evento.target.value)}
          disabled={estaEscribiendo}
          aria-label="Mensaje para el asistente"
        />
        <button
          type="submit"
          className={estilos.botonEnviar}
          disabled={!textoInput.trim() || estaEscribiendo}
          aria-label="Enviar mensaje"
        >
          <IconoEnviar />
        </button>
      </form>
    </div>
  );
}