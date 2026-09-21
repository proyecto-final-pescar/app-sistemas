import Groq from 'groq-sdk';
import { getBotPrompt } from '../config/botPrompt.js';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

const ASISTENTES_VALIDOS = ['firu', 'luna'];
const MAX_CARACTERES_POR_MENSAJE = 2000;


const MENSAJES_SIESTA = {
  firu: 'Guau... ando dormido en una siesta ahora mismo 🐶💤 Volvé a intentar en un ratito.',
  luna: 'Zzz... estoy en plena siesta gatuna 🐱💤 Probá de nuevo un poco más tarde.'
};

export const chatBot = async (req, res) => {
  // Declarado afuera del try para poder usarlo también en el catch
  let asistente = 'firu';

  try {
    const { messages } = req.body;
    asistente = req.body.asistente || 'firu';

    // Validaciones
    if (!messages) {
      return res.status(400).json({ message: 'El historial de mensajes es requerido' });
    }

    if (!Array.isArray(messages)) {
      return res.status(400).json({ message: 'El historial de mensajes debe ser un array' });
    }

    if (messages.length === 0) {
      return res.status(400).json({ message: 'El historial de mensajes no puede estar vacío' });
    }

    if (!ASISTENTES_VALIDOS.includes(asistente)) {
      return res.status(400).json({ message: 'El asistente elegido no es válido' });
    }

    const mensajesInvalidos = messages.some(
      (message) =>
        !message ||
        !['user', 'assistant'].includes(message.role) ||
        typeof message.content !== 'string' ||
        !message.content.trim() ||
        message.content.length > MAX_CARACTERES_POR_MENSAJE
    );

    if (mensajesInvalidos) {
      return res.status(400).json({ message: 'El formato de los mensajes es inválido' });
    }

    // Últimos 10 mensajes para no exceder tokens
    const ultimosMensajes = messages.slice(-10);

    // System prompt con la personalidad correcta según el asistente elegido
    const systemPrompt = getBotPrompt(asistente);

    const completion = await groq.chat.completions.create({
      // "llama-3.1-8b-instant" fue dado de baja por Groq el 16/08/2026
      // (tanto free como developer tier). Reemplazado por gpt-oss-20b,
      // que es el modelo que Groq recomienda como sucesor.
      model: process.env.GROQ_MODEL || 'openai/gpt-oss-20b',
      messages: [
        { role: 'system', content: systemPrompt },
        ...ultimosMensajes
      ],
      temperature: 0.7,
      max_tokens: 300
    });

    const textoRespuesta = completion.choices[0]?.message?.content ||
      'No pude generar una respuesta en este momento.';

    return res.status(200).json({ reply: textoRespuesta });

  } catch (error) {
    console.error('Error en chatBot:', error);
    return res.status(500).json({
      reply: MENSAJES_SIESTA[asistente] || MENSAJES_SIESTA.firu
    });
  }
};