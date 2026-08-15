import api from './api';

export async function enviarMensajeAlBot(historial, signal) {
    const { data } = await api.post(
        '/bot/chat',
        { messages: historial },
        { signal }
    );

    return data.reply;
}