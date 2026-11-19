# Códigos HTTP y formatos de error

## Estado del documento

Este documento es un catálogo inicial basado en lectura estática del código
del backend. No se ejecutaron pruebas; los comportamientos reales, las
respuestas completas y la consistencia entre endpoints siguen pendientes de
prueba y revisión.

| Campo | Valor |
|---|---|
| Responsable | Sofía Juanco |
| Suplente | A confirmar: nombre por asignar |
| Revisores | A confirmar: nombre por asignar |
| Fecha | 2026-11-07 |

## Criterio de relevamiento

Se cuentan los códigos HTTP que aparecen explícitamente en respuestas del
servidor (`res.status(...)`). La tabla no supone que todos los endpoints
usen una envoltura común ni que cada respuesta haya sido comprobada en
ejecución.

Un código HTTP describe el resultado de la petición a nivel de transporte.
Un campo `code` dentro del JSON es otro dato: puede representar un estado o
una causa específica y no reemplaza al código HTTP.

## Códigos HTTP observados

| Código | Significado en MyPet | Ejemplo respaldado por el código |
|---:|---|---|
| 200 | La operación terminó correctamente o el servidor acepta la notificación. El cuerpo depende del endpoint. | `GET /health` responde `{ "ok": true }`; la verificación de cuenta devuelve un resultado de éxito. |
| 201 | Se creó un recurso. | Los controllers de creación de mascotas, publicaciones, reportes, estudios, vacunas e historial clínico usan `201` al crear. |
| 400 | La petición no cumple una validación, le faltan datos o contiene un estado/formato no aceptado. | `POST /api/reportes` puede rechazar datos inválidos; `POST /api/upload` devuelve `400` ante otros errores de Multer. |
| 401 | Faltan credenciales válidas o no se pudo validar la credencial presentada. | `auth.js` responde `401` sin JWT, con JWT inválido o vencido; el middleware SSE también lo hace. |
| 403 | La identidad fue reconocida, pero no tiene el rol, estado de cuenta o acceso requerido. | `roles.js` rechaza un rol no autorizado; `auth.js` rechaza cuentas inactivas o no verificadas. |
| 404 | El recurso o relación solicitada no existe. | Los controllers de veterinarias y pagos devuelven `404` cuando no encuentran la veterinaria, el turno o el recurso indicado. |
| 409 | Hay un conflicto con el estado actual, una duplicación o una operación concurrente. | Reservar un turno no disponible, duplicar un reporte o detectar un conflicto de pago puede devolver `409`. |
| 413 | El contenido enviado supera el tamaño admitido. | `uploadRoutes.js` devuelve `413` cuando el archivo supera 5 MB. |
| 429 | Se excedió un límite de peticiones. | `placesRateLimiter.js` limita a 60 solicitudes por 5 minutos por IP; `botRateLimiter.js` limita a 20 mensajes por 5 minutos por usuario o IP. |
| 500 | Error interno, de configuración o inesperado que el endpoint no puede resolver. | `GET /health` puede devolver `500` ante un error no relacionado con la consulta de base de datos; varios controllers devuelven `500` ante errores inesperados. |
| 502 | Falló un proveedor externo que participa en la operación. | El controller de lugares traduce un error del servicio externo de Google a `502`. |
| 503 | El servicio requerido no está disponible o falta una configuración necesaria. | `GET /health` devuelve `503` si falla la consulta de base de datos; el middleware del webhook devuelve `503` si falta su configuración de firma. |

Los códigos anteriores son los observados explícitamente en el código
relevado. No se presenta una lista de códigos posibles para toda la API:
pueden existir respuestas heredadas, errores del servidor web o respuestas de
dependencias que no estén expresadas con `res.status(...)`.

## Formatos de respuesta de error observados

No hay un formato único implementado en todos los endpoints. Se observan,
entre otros, estos formatos:

| Forma observada | Ejemplo ficticio | Uso observado |
|---|---|---|
| `message` | `{ "message": "El turnoId es requerido" }` | Validaciones y errores de negocio de muchos controllers. |
| `mensaje` | `{ "mensaje": "No se pudo completar la operación" }` | Algunos endpoints usan el nombre en español; debe confirmarse por endpoint. |
| `error` | `{ "error": "Error al consultar el proveedor" }` | Respuestas puntuales de integración o controladores. |
| `motivo` junto con otros campos | `{ "error": "Cuenta no disponible", "motivo": "cuenta_desactivada" }` | El middleware de autenticación informa el motivo del bloqueo de cuenta. |
| `success` junto con `message` | `{ "success": true, "message": "Cuenta verificada con éxito" }` | Verificación de cuenta y algunas operaciones exitosas. |
| `code` junto con `message` | `{ "code": "EXPIRED", "message": "El enlace de verificación venció" }` | Verificación de cuenta usa códigos de resultado en el cuerpo. |
| Respuesta específica del endpoint | `{ "url": "https://ejemplo.invalid/archivo" }` | La subida de archivos devuelve una URL; no es un formato general de error. |

Los ejemplos son ficticios y no representan valores reales de configuración,
credenciales o usuarios. La forma exacta, los campos adicionales y el texto
pueden variar según la ruta.

## Diferencia entre HTTP `status` y el campo `code`

`400`, `401`, `403`, etc. son códigos HTTP enviados por el servidor. En
cambio, valores como `INVALID`, `EXPIRED`, `VERIFIED`, `ALREADY_VERIFIED` y
`SERVER_ERROR` aparecen como `code` dentro del JSON de verificación de cuenta.
Ese campo agrega una causa o estado de negocio; no cambia el código HTTP.

También hay controllers que leen `error.code` de una excepción de una
dependencia para registrar o construir detalles internos. Eso no demuestra
que ese valor se exponga siempre como `code` en la respuesta pública. La
exposición exacta debe revisarse endpoint por endpoint.

## Situaciones que requieren pruebas o confirmación

- Confirmar para cada endpoint el cuerpo final, los encabezados y si existe
  una envoltura de éxito o error.
- Confirmar si los errores de validación y de base de datos mantienen siempre
  el mismo nombre de campo (`message`, `mensaje`, `error` o una combinación).
- Confirmar el comportamiento de límites `429`, incluida la ventana real,
  la clave de identificación y la respuesta cuando se alcanza el límite.
- Probar el límite de archivo de `413` y los formatos de error de Multer.
- Probar los escenarios de proveedor externo que producen `502` o `503`.
- Confirmar si alguna capa de infraestructura agrega o transforma códigos
  no visibles en los controllers.
- Definir si los campos `code` de negocio deben formar parte del contrato
  público o quedar documentados solo por endpoint.
- Responsable de confirmar los puntos anteriores: A confirmar: nombre por
  asignar.

## Alcance y revisión

La información proviene de lectura estática del código y de los documentos
existentes. Las pruebas de ejecución, la revisión funcional y la revisión de
Seguridad siguen pendientes. Las observaciones de acceso o exposición de
detalles deben trasladarse a la revisión privada correspondiente antes de
publicar esta documentación fuera del repositorio.
