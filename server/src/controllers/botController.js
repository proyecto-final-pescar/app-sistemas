import genAI from '../config/gemini.js';
import { BOT_SYSTEM_PROMPT } from '../config/botPrompt.js';

export const chatBot = async (req, res) => {
  try {
    const { messages } = req.body;

    if (!messages) {
      return res.status(400).json({
        message: 'El historial de mensajes es requerido'
      });
    }

    if (!Array.isArray(messages)) {
      return res.status(400).json({
        message: 'El historial de mensajes debe ser un array'
      });
    }

    if (messages.length === 0) {
      return res.status(400).json({
        message: 'El historial de mensajes no puede estar vacío'
      });
    }

    const mensajesInvalidos = messages.some(
      (message) =>
        !message ||
        !['user', 'assistant'].includes(message.role) ||
        typeof message.content !== 'string' ||
        !message.content.trim()
    );

    if (mensajesInvalidos) {
      return res.status(400).json({
        message: 'El formato de los mensajes es inválido'
      });
    }

    const ultimosMensajes = messages.slice(-10);

    const historialGemini = ultimosMensajes.map((message) => ({
      role: message.role === 'assistant' ? 'model' : 'user',
      parts: [
        {
          text: message.content
        }
      ]
    }));

    const model = genAI.getGenerativeModel({
      model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
      systemInstruction: BOT_SYSTEM_PROMPT
    });

    const result = await model.generateContent({
      contents: historialGemini
    });

    const response = result.response;
    const textoRespuesta = response.text();

    return res.status(200).json({
      reply: textoRespuesta
    });

  } catch (error) {
    console.error('Error en chatBot:', error);

    return res.status(500).json({
      reply: 'Pety no pudo responder en este momento. Intentá nuevamente en unos minutos.'
    });
  }
};