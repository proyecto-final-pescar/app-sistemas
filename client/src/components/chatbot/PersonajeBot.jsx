import { useState, useEffect } from 'react';
import estilos from './PersonajeBot.module.css';


import perroIcono from '../../assets/bot/perro-icono.png';
import perroCuerpo from '../../assets/bot/perro-cuerpo.gif';
import gatoIcono from '../../assets/bot/gato-icono.png';
import gatoCuerpo from '../../assets/bot/gato-cuerpo.gif';

const ASSETS = {
  perro: { icono: perroIcono, cuerpoCompleto: perroCuerpo },
  gato: { icono: gatoIcono, cuerpoCompleto: gatoCuerpo },
};

const PROPORCION_CUERPO_COMPLETO = 1.3;

/**
 * 
 *
 * @param {'perro'|'gato'} tipo
 * @param {'idle'|'pensando'|'feliz'|'preocupado'} pose - sigue
 *   controlando la animación CSS del contenedor (bamboleo, rebote,
 *   puntitos de "pensando"), aunque la imagen de base sea estática.
 * @param {number} size - ancho en px.
 * @param {'icono'|'cuerpoCompleto'} variante - qué imagen mostrar.
 *   'icono': para la burbuja y el header del chat.
 *   'cuerpoCompleto': para la card de selección en Configuración.
 */
export default function PersonajeBot({
  tipo = 'perro',
  pose = 'idle',
  size = 40,
  variante = 'icono',
}) {
  const [errorCarga, setErrorCarga] = useState(false);

  
  useEffect(() => {
    setErrorCarga(false);
  }, [tipo, variante]);

  const claseAnimacion = {
    idle: estilos.animIdle,
    pensando: estilos.animPensando,
    feliz: estilos.animFeliz,
    preocupado: estilos.animPreocupado,
  }[pose];

  const alto = variante === 'cuerpoCompleto' ? Math.round(size * PROPORCION_CUERPO_COMPLETO) : size;
  const src = ASSETS[tipo]?.[variante];

  return (
    <div
      className={`${estilos.contenedor} ${claseAnimacion}`}
      style={{ width: size, height: alto }}
      aria-hidden="true"
    >
      {src && !errorCarga ? (
        <img
          key={`${tipo}-${variante}`}
          src={src}
          alt=""
          className={variante === 'icono' ? estilos.imagenIcono : estilos.imagenCuerpo}
          onError={() => setErrorCarga(true)}
        />
      ) : (
        
        <div className={estilos.fallback}>{tipo === 'gato' ? '🐱' : '🐶'}</div>
      )}

      {pose === 'pensando' && (
        <div className={estilos.puntosPensando}>
          <span />
          <span />
          <span />
        </div>
      )}
    </div>
  );
}