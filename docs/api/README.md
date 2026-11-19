# Documentación de la API de MyPet

> Estado: borrador para S0-06. La información proviene de lectura estática
> del código. Las pruebas y revisiones del equipo siguen pendientes.

## Alcance

Esta carpeta reúne el inventario inicial de los endpoints de MyPet, organizado
por área funcional. Las fichas describen rutas, montaje, permisos, parámetros,
respuestas y reglas que pudieron verificarse leyendo el código. Los ejemplos
son ficticios y no contienen claves, tokens ni datos reales.

## Ficha del documento

| Campo | Valor |
|---|---|
| Responsable | Sofía Juanco |
| Suplente | A confirmar: nombre por asignar |
| Revisores | A confirmar: nombre por asignar |
| Fecha | 2026-11-07 (creación del índice; no se indica una fecha de última revisión) |

## Índice por área

### Convenciones generales

- [Convenciones generales de la API](./convenciones-generales.md)
- [Códigos HTTP y formatos de error](./codigos-http-y-errores.md)
- [Matriz general de permisos](./matriz-de-permisos.md)
- [Límites y reglas transversales](./limites-y-reglas.md)

### Acceso, cuentas y usuarios

- [Autenticación y cuentas](./autenticacion-y-cuentas.md)
- [Usuarios](./usuarios.md)
- [Mascotas](./mascotas.md)

### Veterinarias y turnos

- [Veterinarias](./veterinarias.md)
- [Administración de veterinarias](./administracion-veterinarias.md)
- [Turnos](./turnos.md)
- [Disponibilidad](./disponibilidad.md)
- [Pagos](./pagos.md)

### Información clínica

- [Consultas clínicas](./consultas-clinicas.md)
- [Vacunas](./vacunas.md)
- [Estudios médicos](./estudios.md)
- [Ficha médica e historial completo](./ficha-medica-e-historial.md)

### Comunicación, archivos y lugares

- [Notificaciones](./notificaciones.md)
- [Subida de archivos](./subida-de-archivos.md)
- [Lugares](./lugares.md)
- [Constantes y zonas](./constantes-y-zonas.md)
- [Asistente conversacional](./bot.md)

### Comunidad y moderación

- [Publicaciones](./publicaciones.md)
- [Reportes](./reportes.md)

### Administración y estado del servidor

- [Dashboard administrativo](./dashboard.md)
- [Endpoints directos del servidor](./endpoints-directos.md)

## Cobertura del inventario

Se relevaron **107 endpoints activos**, contando cada combinación única de
método HTTP y ruta completa observada en el montaje del servidor. Se incluyeron
las rutas montadas bajo `/api`, el endpoint de subida montado directamente,
`GET /` y `GET /health`. No se contaron `router.use`, middlewares ni rutas
comentadas.

Las rutas administrativas de turnos están incluidas dentro de la sección de
turnos en [turnos.md](./turnos.md), separadas del router principal.

## Estado y pendientes generales

Las fichas actuales son borradores basados en lectura estática. También se
incorporaron algunas observaciones manuales del entorno desplegado, siempre
identificadas por fecha y separadas de lo observado en el código. La mayoría
de los endpoints, sus cuerpos completos, errores y permisos alternativos aún
no fueron probados; las revisiones del equipo siguen pendientes.

Falta completar o consolidar:

- convenciones generales de autenticación, fechas, UUID y paginación;
- catálogo común de códigos HTTP y formato de errores;
- matriz completa de permisos para todos los endpoints;
- límites de uso y rate limiting en una vista centralizada;
- webhooks y callbacks, diferenciando pagos de OAuth;
- reglas de negocio transversales, estados, vencimientos y transiciones;
- inconsistencias observadas y decisiones del equipo;
- revisión privada de observaciones de Seguridad;
- responsables para los puntos marcados «A confirmar: nombre por asignar»;
- resultados adicionales de pruebas de ejecución y validación del entorno
  local.

Los enlaces de este índice apuntan a los archivos Markdown existentes dentro de
esta carpeta.
