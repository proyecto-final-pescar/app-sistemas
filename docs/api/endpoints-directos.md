# API MyPet: endpoints directos del servidor

> Estado: borrador para S0-06. La información proviene de lectura estática
> del código. Las pruebas y revisiones del equipo siguen pendientes.

## Ficha del documento

| Campo | Valor |
|---|---|
| Responsable | Sofía Juanco |
| Suplente | A confirmar: nombre por asignar |
| Revisores | A confirmar: nombre por asignar |
| Fecha | 2026-11-07 |

Estas rutas se definen directamente en `server/src/index.js`, fuera de los
routers montados bajo `/api`.

## Matriz de permisos

| Método y ruta | Público | Dueño | Veterinaria | Administrador | Verificación adicional |
|---|---|---|---|---|---|
| `GET /` | Sí | Sí | Sí | Sí | No se observa autenticación ni consulta a la base. |
| `GET /health` | Sí | Sí | Sí | Sí | Ejecuta `SELECT 1` contra la base de datos; no usa sesión. |

## 1. Estado básico del servidor

**Método y ruta:** `GET /`

**Función:** confirma que el proceso responde.

**Respuesta observada:** `200` con:

```json
{ "message": "Servidor funcionando" }
```

No se observa que compruebe conexión a la base, migraciones, jobs ni servicios
externos.

## 2. Health check de base de datos

**Método y ruta:** `GET /health`

**Función:** ejecuta `prisma.$queryRaw\`SELECT 1\`` y usa el resultado para
indicar si la base responde.

**Respuestas observadas:**

- `200`: `{ "ok": true }` si la consulta tiene éxito.
- `503`: `{ "ok": false }` si la consulta falla.

No se observa autenticación ni información detallada del error en la respuesta.

## Diferencia sencilla

`GET /` solo dice que el servidor HTTP está respondiendo. `GET /health` además
intenta comprobar que la base de datos responde. Ninguno verifica por sí mismo
que todas las funciones de la aplicación estén disponibles.

## Pendientes

Debe confirmarse qué consumidores externos usan `/health`, sus tiempos de
espera y si el resultado `200` de `/` es suficiente para monitoreo:
**A confirmar: nombre por asignar**. No se ejecutaron pruebas.

Las pruebas de ejecución y las revisiones del equipo siguen pendientes.
