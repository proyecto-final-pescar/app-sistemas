# API MyPet: asistente conversacional

> Estado: borrador para S0-06. La información proviene de lectura estática
> del código. Las pruebas y revisiones del equipo siguen pendientes.

## Ficha del documento

| Campo | Valor |
|---|---|
| Responsable | Sofía Juanco |
| Suplente | A confirmar: nombre por asignar |
| Revisores | A confirmar: nombre por asignar |
| Fecha | 2026-11-07 |

## Montaje y permisos

`server/src/routes/bot.js` se monta como `router.use('/bot', botRouter)` dentro
de `/api`.

| Método y ruta | Público | Dueño | Veterinaria | Administrador | Verificación adicional |
|---|---|---|---|---|---|
| `POST /api/bot/chat` | No | Sí | Sí | Sí | `verifyToken` y límite por usuario/IP. No hay restricción de rol. |

## Endpoint de chat

**Método y ruta:** `POST /api/bot/chat`

**Función:** envía un historial de mensajes a un asistente virtual y devuelve
una respuesta de texto.

**Cuerpo:**

| Campo | Tipo | Obligatorio | Regla observada |
|---|---|---|---|
| `messages` | array | Sí | No vacío; cada elemento debe tener `role` `user` o `assistant` y contenido de texto no vacío. |
| `messages[].content` | string | Sí | Máximo 500 caracteres por mensaje. |
| `asistente` | string | No | `firu` o `luna`; si falta usa `firu`. |

Ejemplo ficticio:

```json
{
  "asistente": "firu",
  "messages": [
    { "role": "user", "content": "¿Cómo veo el historial de mi mascota?" }
  ]
}
```

El controller toma solo los últimos 6 mensajes con rol `user` para enviarlos al
modelo. Los mensajes `assistant` recibidos del cliente se validan, pero no se
envían al modelo como contexto confiable.

**Proveedor externo:** utiliza el SDK de Groq y un modelo configurable del
servidor. La clave y el nombre efectivo del modelo no se incluyen. El prompt
interno limita el asistente a temas de mascotas y MyPet, y define respuestas
para pedidos fuera de alcance.

El controller bloquea patrones sospechosos de manipulación de instrucciones y
filtra ciertas respuestas antes de devolverlas. Esas reglas son observadas en
el código, no una garantía probada de seguridad completa.

**Límite de uso:** `botRateLimiter` permite 20 mensajes cada 5 minutos. La
clave principal es `req.user.id`; si no está disponible, usa la IP. Al superar
el límite responde `429` con una respuesta de “siesta” de Firu o Luna.

**Respuestas observadas:**

- `200`: `{ "reply": "Respuesta ficticia del asistente" }`.
- `200`: respuesta fija si el mensaje se bloquea por estar fuera de alcance o
  por un patrón sospechoso.
- `400`: historial faltante, no array, vacío, asistente inválido o mensajes
  inválidos.
- `429`: límite excedido.
- `401` o `403`: sesión ausente, inválida, inactiva o no verificada.
- `500`: error al consultar al proveedor u otro error interno; devuelve un
  mensaje de siesta ficticio.

Ejemplo de error ficticio:

```json
{ "message": "El historial de mensajes debe ser un array" }
```

**A confirmar:** proveedor/modelo contractual, política de retención de
mensajes, límites económicos y comportamiento ante timeout del proveedor.
Responsable: **A confirmar: nombre por asignar**.

## Observado y pendiente

Observado: autenticación, límite por usuario/IP, dos asistentes válidos,
validación de mensajes, máximo de 500 caracteres, máximo de 6 mensajes de
usuario enviados al modelo y filtros de entrada/salida.

Pendiente de probar: respuestas reales, reconexión ante errores, exactitud del
límite detrás de proxies y cobertura de los filtros: **A confirmar: nombre por
asignar**.

Las pruebas de ejecución y las revisiones del equipo siguen pendientes.
