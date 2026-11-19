# Límites y reglas transversales de la API

## Estado del documento

Este documento consolida límites y reglas observados en lectura estática del
código y en las fichas de la API. No se ejecutaron pruebas. Las políticas que
no aparecen implementadas no se presentan como existentes; quedan marcadas
como **A confirmar: nombre por asignar**.

## Límites observados

| Área o endpoint | Tipo de límite | Valor observado | Respuesta o efecto | Fuente |
|---|---|---:|---|---|
| `GET /api/places/autocomplete` y `GET /api/places/details` | Peticiones por IP | 60 cada 5 minutos | `429` al superar el límite | [Lugares](./lugares.md) |
| `POST /api/bot/chat` | Peticiones por usuario o IP | 20 mensajes cada 5 minutos | `429` y respuesta de límite del asistente | [Bot](./bot.md) |
| `POST /api/upload` | Tamaño de archivo | 5 MB por imagen | `413` si supera el tamaño | [Subida de archivos](./subida-de-archivos.md) |
| `GET /api/turnos/disponibles/grilla` | Cantidad de resultados | Máximo 500 | La consulta limita los resultados devueltos | [Turnos](./turnos.md) |
| `GET /api/turnos` | Cantidad de resultados paginados | Por defecto 10; máximo 50 | La respuesta incluye datos de paginación | [Turnos](./turnos.md) |
| `GET /api/usuarios` | Cantidad de resultados por página | Por defecto 10; máximo explícito no observado | La respuesta incluye paginación; el máximo queda pendiente | [Usuarios](./usuarios.md) |
| `GET /api/turnos/admin` | Cantidad de resultados por página | Página fija de 10 según la ficha | La respuesta se pagina | [Turnos](./turnos.md) |
| `GET /api/veterinarias` y `GET /api/veterinarias/mia/pacientes` | Cantidad de resultados | Valores por defecto y topes definidos en controllers | La respuesta incluye paginación | [Veterinarias](./veterinarias.md) |
| Turnos | Tiempo de anticipación | 10 horas para reservar | La reserva se rechaza si no cumple la anticipación | [Turnos](./turnos.md) |
| Reserva de turno | Vencimiento de pago | 3 horas desde la reserva | El turno pendiente puede liberarse al vencer | [Turnos](./turnos.md) |
| Cancelación de turno confirmado | Tiempo de cancelación | 24 horas en el flujo observado | Puede condicionar el reembolso | [Turnos](./turnos.md) |

### Tipos de límite

- **Límite de peticiones:** controla cuántas solicitudes puede realizar una
  identidad o una IP en una ventana de tiempo. Se observa en lugares y bot.
- **Tamaño de archivo:** limita el peso de cada archivo recibido. No es un
  límite de cantidad de archivos ni de peticiones.
- **Cantidad de resultados:** limita cuántos registros devuelve una consulta
  o cuántos entran en una página. No equivale a un rate limit.
- **Regla temporal de negocio:** restringe una operación por fecha u hora,
  como la anticipación o el vencimiento de una reserva.

No se observa un rate limiting específico en los routers de turnos, pagos,
usuarios, mascotas, veterinarias o reportes. Los límites de proxy,
infraestructura y proveedores externos quedan **A confirmar: nombre por
asignar**.

## Reglas de negocio transversales observadas

### Turnos, estados y vencimientos

Los estados observados incluyen `DIS` (disponible), `PEN` (pendiente), `CON`
(confirmado), `CAN` (cancelado) y `ATE` (atendido). Al reservar, un turno
disponible pasa a pendiente, se asocia a la mascota y recibe un vencimiento
de tres horas para el pago. El job de vencimientos puede devolver a disponible
un turno pendiente vencido y limpiar sus datos de reserva.

La reserva exige una anticipación mínima de 10 horas. La cancelación de un
turno confirmado con pago aprobado puede iniciar un reembolso; si el
reembolso falla, la respuesta conserva información para revisión manual.
Estas reglas y sus excepciones están detalladas en [Turnos](./turnos.md).

### Pagos

La preferencia de pago verifica la propiedad del turno, su estado y su
vencimiento. El pago en efectivo puede confirmar el turno y conservar el
registro local en estado pendiente. El webhook de Mercado Pago valida firma,
referencias, metadatos, relación con la veterinaria, moneda e importe antes
de actualizar el pago. El callback OAuth de Mercado Pago es un flujo distinto
del webhook y está documentado en [Veterinarias](./veterinarias.md).

La relación entre vencimientos, reembolsos, reintentos y eventos duplicados
requiere pruebas y confirmación del equipo. Ver [Pagos](./pagos.md).

### Moderación y publicaciones

Los reportes usan los estados `PEN`, `REV` y `DES`. El listado de publicaciones
considera reportes pendientes y, cuando se alcanza el umbral observado, puede
ocultar la publicación en el listado autenticado. El dueño conserva una
visibilidad diferenciada y el detalle público no necesariamente aplica el
mismo ocultamiento. El flujo completo y sus excepciones están en
[Reportes](./reportes.md) y [Publicaciones](./publicaciones.md).

### Catálogos y reglas expuestas

Las rutas de constantes devuelven catálogos y algunas reglas de turnos que
provienen de tablas o constantes del código, según el caso. La fuente,
versionado y exposición pública de cada catálogo están detallados en
[Constantes y zonas](./constantes-y-zonas.md).

## Diferencias de respuestas

Las fichas muestran respuestas con `message`, `mensaje`, `error`, `motivo`,
`success` y, en algunos flujos, `code`. No se presenta una envoltura única ni
una política general no comprobada. Para el detalle de códigos HTTP y formatos
de error, consultar [Códigos HTTP y formatos de error](./codigos-http-y-errores.md).

## Preguntas para el equipo

- ¿Cuál es el máximo oficial para cada parámetro de paginación?
- ¿Los límites de IP deben complementarse con límites por usuario o cuenta?
- ¿Cuál es la política esperada para reintentos y eventos duplicados de pagos?
- ¿Qué transiciones de estados de turnos y reportes son contractuales?
- ¿Qué efectos debe tener suspender o eliminar una veterinaria sobre turnos,
  pagos y visibilidad?
- ¿Qué formatos de respuesta deben considerarse contrato público?
- Responsable de confirmar estas decisiones: **A confirmar: nombre por
  asignar**.

## Pruebas y revisión

Faltan pruebas de límites, vencimientos, reservas simultáneas, pagos,
reembolsos, moderación, paginación y respuestas de error. También falta la
revisión funcional y de Seguridad. Las observaciones sensibles de Seguridad
no se copian en este documento: deben conservarse en el espacio privado que
indique el equipo.
