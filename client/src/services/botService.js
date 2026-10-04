import api from './api';

// El front guarda el asistente como 'perro' / 'gato' (usuario.asistenteVirtual),
// pero el back espera 'firu' / 'luna' en el campo `asistente`.
const ASISTENTE_POR_TIPO = {
    perro: 'firu',
    gato: 'luna',
};

export async function enviarMensajeAlBot(historial, signal, tipoBot = 'perro') {
    const asistente = ASISTENTE_POR_TIPO[tipoBot] || 'firu';

    const { data } = await api.post(
        '/bot/chat',
        { messages: historial, asistente },
        { signal }
    );

    return data.reply;
}