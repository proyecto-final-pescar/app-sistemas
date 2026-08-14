import { useState, useEffect, useCallback, useRef } from 'react';
import InterfazChat from './InterfazChat';
import PersonajeBot from './PersonajeBot';
import { useAuth } from '../../hooks/useAuth';
import estilos from './ChatBot.module.css';


const MS_DURACION_POSE_TRANSITORIA = 2200;


const URL_CHAT = `${import.meta.env.VITE_API_URL}/bot/chat`;

// Tiempo a partir del cual, si todavía no hubo respuesta, se muestra
// un mensaje adicional junto al indicador de escritura.
const MS_AVISO_DEMORA = 10000;
// Tiempo máximo de espera antes de abortar la request y mostrar error.
const MS_TIMEOUT_MAXIMO = 30000;

// Ancho del personaje dentro de la burbuja.
const TAMANIO_PERSONAJE_BURBUJA = 88;
const UMBRAL_ARRASTRE_PX = 6;
const MARGEN_VENTANA_PX = 8;

function obtenerToken() {
  return localStorage.getItem('token');
}

let idMensaje = 0;
function nuevoId() {
  idMensaje += 1;
  return idMensaje;
}

/**
 * Llama a POST /bot/chat con el historial completo de la conversación.
 * @param {{role: 'user'|'assistant', content: string}[]} historial
 * @param {AbortSignal} signal
 */
async function enviarHistorialAlBackend(historial, signal) {
  const respuesta = await fetch(URL_CHAT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${obtenerToken()}`,
    },
    body: JSON.stringify({ mensajes: historial }),
    signal,
  });

  if (!respuesta.ok) {
    throw new Error(`Error del servidor (status ${respuesta.status})`);
  }

  const datos = await respuesta.json();
 
  return datos.respuesta;
}

/**
 * Burbuja flotante del asistente virtual.
 * Se incluye una única vez en el layout principal de la app
 * 
 *
 * Muestra al personaje de cuerpo completo elegido por el usuario en
 * Configuración > Asistente virtual (PerfilUsuario.jsx), y se puede
 * arrastrar a cualquier posición de la pantalla mientras está cerrada
 * (el arrastre se desactiva mientras el chat está abierto, para no
 * desincronizar la burbuja del panel, que queda fijo).
 *
 * @param {number} notificacionesNuevas - cantidad de respuestas nuevas
 *   del bot mientras el chat está cerrado (casos futuros de notif.).
 */
export default function ChatBot({ notificacionesNuevas = 0 }) {
  const { usuario } = useAuth();
  const [abierto, setAbierto] = useState(false);
  const [mensajes, setMensajes] = useState([]);
  const [estaEscribiendo, setEstaEscribiendo] = useState(false);
  const [tardandoMucho, setTardandoMucho] = useState(false);
  const [pose, setPose] = useState('idle');

  // Preferencia guardada por el usuario en Configuración > Asistente
  // virtual (PerfilUsuario.jsx). Default 'perro' 
  const tipoBot = usuario?.asistenteVirtual || 'perro';
  const nombreBot = tipoBot === 'gato' ? 'Mimi' : 'Max';

 
  const [posicion, setPosicion] = useState(null);
  const [arrastrando, setArrastrando] = useState(false);
  const botonRef = useRef(null);
  const arrastreRef = useRef({ activo: false, offsetX: 0, offsetY: 0, movioSuficiente: false });
 
  const ultimoFueArrastreRef = useRef(false);

  const controllerRef = useRef(null);
  const timeoutAvisoRef = useRef(null);
  const timeoutMaximoRef = useRef(null);
  const timeoutPoseRef = useRef(null);

  // Saludo inicial: se agrega la primera vez que se abre el chat.
  useEffect(() => {
    if (abierto && mensajes.length === 0) {
      setMensajes([
        {
          id: nuevoId(),
          role: 'assistant',
          content: `¡Hola! Soy ${nombreBot}, tu asistente de MyPet. ¿En qué puedo ayudarte hoy?`,
        },
      ]);
    }
    // Solo se dispara la primera vez que se abre; no queremos que
   
  }, [abierto, mensajes.length]);

  // Limpieza de timers/requests pendientes si el componente se desmonta.
  useEffect(() => {
    return () => {
      controllerRef.current?.abort();
      clearTimeout(timeoutAvisoRef.current);
      clearTimeout(timeoutMaximoRef.current);
      clearTimeout(timeoutPoseRef.current);
    };
  }, []);

  const alternarChat = useCallback(() => {
    setAbierto((valorActual) => !valorActual);
  }, []);

  const cerrarChat = useCallback(() => {
    setAbierto(false);
  }, []);

  const manejarClick = useCallback(() => {
    if (ultimoFueArrastreRef.current) {
    
      ultimoFueArrastreRef.current = false;
      return;
    }
    alternarChat();
  }, [alternarChat]);

  // --- Handlers de arrastre 

  const manejarPointerDown = useCallback(
    (e) => {
      if (abierto) return;
      // Solo botón principal (o touch, que no tiene "button").
      if (e.button !== undefined && e.button !== 0) return;

      // Reset defensivo: si por algún motivo el click posterior al
      // último arrastre nunca llegó a dispararse, no queremos quedar
      // "trabados" ignorando el próximo click legítimo.
      ultimoFueArrastreRef.current = false;

      const rect = botonRef.current.getBoundingClientRect();
      arrastreRef.current = {
        activo: true,
        offsetX: e.clientX - rect.left,
        offsetY: e.clientY - rect.top,
        movioSuficiente: false,
        inicioX: e.clientX,
        inicioY: e.clientY,
        anchoBoton: rect.width,
        altoBoton: rect.height,
      };
      e.currentTarget.setPointerCapture(e.pointerId);
    },
    [abierto]
  );

  const manejarPointerMove = useCallback((e) => {
    const estado = arrastreRef.current;
    if (!estado.activo) return;

    const dx = e.clientX - estado.inicioX;
    const dy = e.clientY - estado.inicioY;

    if (!estado.movioSuficiente) {
      if (Math.hypot(dx, dy) < UMBRAL_ARRASTRE_PX) return;
      estado.movioSuficiente = true;
      setArrastrando(true);
    }

    let nuevoX = e.clientX - estado.offsetX;
    let nuevoY = e.clientY - estado.offsetY;

    // Clamp para que no se pueda arrastrar fuera de la pantalla.
    const maxX = window.innerWidth - estado.anchoBoton - MARGEN_VENTANA_PX;
    const maxY = window.innerHeight - estado.altoBoton - MARGEN_VENTANA_PX;
    nuevoX = Math.min(Math.max(nuevoX, MARGEN_VENTANA_PX), Math.max(maxX, MARGEN_VENTANA_PX));
    nuevoY = Math.min(Math.max(nuevoY, MARGEN_VENTANA_PX), Math.max(maxY, MARGEN_VENTANA_PX));

    setPosicion({ x: nuevoX, y: nuevoY });
  }, []);

  const manejarPointerUp = useCallback((e) => {
    const estado = arrastreRef.current;
    // Guardamos si hubo arrastre real para que "manejarClick" (que el
    // navegador va a disparar a continuación) lo ignore si corresponde.
    ultimoFueArrastreRef.current = estado.movioSuficiente;

    arrastreRef.current = { ...estado, activo: false, movioSuficiente: false };
    setArrastrando(false);

    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // Si el pointer ya no está capturado, no pasa nada.
    }
    
  }, []);

  
  useEffect(() => {
    const handleResize = () => {
      if (!posicion || !botonRef.current) return;
      const rect = botonRef.current.getBoundingClientRect();
      const maxX = window.innerWidth - rect.width - MARGEN_VENTANA_PX;
      const maxY = window.innerHeight - rect.height - MARGEN_VENTANA_PX;
      setPosicion((prev) => ({
        x: Math.min(Math.max(prev.x, MARGEN_VENTANA_PX), Math.max(maxX, MARGEN_VENTANA_PX)),
        y: Math.min(Math.max(prev.y, MARGEN_VENTANA_PX), Math.max(maxY, MARGEN_VENTANA_PX)),
      }));
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [posicion]);

  const enviarMensaje = useCallback(
    async (texto) => {
      const textoLimpio = texto.trim();
      // Mensaje vacío o solo espacios: se ignora sin mostrar error.
      if (!textoLimpio || estaEscribiendo) return;

      const mensajeUsuario = { id: nuevoId(), role: 'user', content: textoLimpio };

    
      const historialParaBackend = [...mensajes, mensajeUsuario]
        .filter((m) => !m.esError)
        .map(({ role, content }) => ({ role, content }));

      setMensajes((previos) => [...previos, mensajeUsuario]);
      setEstaEscribiendo(true);
      setTardandoMucho(false);
      clearTimeout(timeoutPoseRef.current);
      setPose('pensando');

      const controller = new AbortController();
      controllerRef.current = controller;

      timeoutAvisoRef.current = setTimeout(() => {
        setTardandoMucho(true);
      }, MS_AVISO_DEMORA);

      timeoutMaximoRef.current = setTimeout(() => {
        controller.abort();
      }, MS_TIMEOUT_MAXIMO);

      try {
        const contenidoRespuesta = await enviarHistorialAlBackend(
          historialParaBackend,
          controller.signal
        );
        setMensajes((previos) => [
          ...previos,
          { id: nuevoId(), role: 'assistant', content: contenidoRespuesta },
        ]);
        setPose('feliz');
      } catch (error) {
        const esCancelacion = error.name === 'AbortError';
        setMensajes((previos) => [
          ...previos,
          {
            id: nuevoId(),
            role: 'assistant',
            esError: true,
            content: esCancelacion
              ? 'La respuesta está tardando demasiado. Probá de nuevo en unos segundos.'
              : 'No pude conectarme con el asistente. Revisá tu conexión e intentá de nuevo.',
          },
        ]);
        setPose('preocupado');
      } finally {
        timeoutPoseRef.current = setTimeout(() => setPose('idle'), MS_DURACION_POSE_TRANSITORIA);
        clearTimeout(timeoutAvisoRef.current);
        clearTimeout(timeoutMaximoRef.current);
        controllerRef.current = null;
        setEstaEscribiendo(false);
        setTardandoMucho(false);
      }
    },
    [mensajes, estaEscribiendo]
  );

  const mostrarBadge = !abierto && notificacionesNuevas > 0;

  const estiloPosicion = posicion
    ? { left: posicion.x, top: posicion.y, right: 'auto', bottom: 'auto' }
    : undefined;

  return (
    <>
      <button
        ref={botonRef}
        type="button"
        className={`${estilos.burbuja} ${arrastrando ? estilos.burbujaArrastrando : ''}`}
        style={estiloPosicion}
        onClick={manejarClick}
        onPointerDown={manejarPointerDown}
        onPointerMove={manejarPointerMove}
        onPointerUp={manejarPointerUp}
        aria-label={abierto ? 'Cerrar chat con el asistente' : 'Abrir chat con el asistente'}
        aria-expanded={abierto}
      >
        <PersonajeBot
          tipo={tipoBot}
          pose={abierto ? pose : 'idle'}
          size={TAMANIO_PERSONAJE_BURBUJA}
          variante="cuerpoCompleto"
        />
        {mostrarBadge && (
          <span className={estilos.badge} aria-label={`${notificacionesNuevas} respuestas nuevas`}>
            {notificacionesNuevas > 9 ? '9+' : notificacionesNuevas}
          </span>
        )}
      </button>

      {abierto && (
        <InterfazChat
          mensajes={mensajes}
          estaEscribiendo={estaEscribiendo}
          tardandoMucho={tardandoMucho}
          onEnviarMensaje={enviarMensaje}
          onCerrar={cerrarChat}
          tipoBot={tipoBot}
          nombreBot={nombreBot}
          pose={pose}
        />
      )}
    </>
  );
}