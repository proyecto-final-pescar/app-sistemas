import Groq from 'groq-sdk';
import { getBotPrompt } from '../config/botPrompt.js';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

export const chatBot = async (req, res) => {
  try {
    const { messages, asistente = 'firu' } = req.body;

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

    const mensajesInvalidos = messages.some(
      (message) =>
        !message ||
        !['user', 'assistant'].includes(message.role) ||
        typeof message.content !== 'string' ||
        !message.content.trim()
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
      reply: 'El asistente no pudo responder en este momento. Intentá nuevamente en unos minutos.'
    });
  }
};