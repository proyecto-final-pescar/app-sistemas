# API MyPet: disponibilidad

> Estado: borrador para S0-06.
>
> La información se obtuvo mediante lectura estática del código. No se
> ejecutaron pruebas. Los ejemplos son ficticios y no contienen datos reales.

## Ficha del documento

| Campo | Valor |
|---|---|
| Responsable | Sofía Juanco |
| Suplente | A confirmar: nombre por asignar |
| Revisores | A confirmar: nombre por asignar |
| Fecha | 2026-11-07 |

## Montaje y alcance

`server/src/routes/disponibilidad.js` se monta en
`server/src/routes/index.js` como `router.use('/disponibilidad',
disponibilidadRouter)`. El router general se monta bajo `/api`.

La única ruta activa es:

| Método y ruta | Función sencilla |
|---|---|
| `GET /api/disponibilidad/:veterinariaId` | Consulta los turnos disponibles de una veterinaria para una fecha y, opcionalmente, un servicio. |

Archivos y funciones revisados:

- `server/src/routes/disponibilidad.js`: ruta y `verifyToken`.
- `server/src/routes/index.js`: montaje del router.
- `server/src/controllers/disponibilidadController.js`:
  `obtenerDisponibilidad`.
- `server/src/middleware/auth.js`: autenticación de la sesión.
- `server/src/routes/rutasTurnos.js` y
  `server/src/controllers/turnoController.js`: ruta y controller de la grilla
  usados para la comparación.

## Matriz de permisos

| Método y ruta | Público | Dueño | Veterinaria | Administrador | Verificación adicional |
|---|---|---|---|---|---|
| `GET /api/disponibilidad/:veterinariaId` | No | Sí, con sesión válida | Sí, con sesión válida | Sí, con sesión válida | Solo se observa `verifyToken`; el controller comprueba que la veterinaria exista y esté activa, pero no aplica propiedad o rol. |

La ruta no usa `authorize`. Por lo tanto, el código observado permite que
cualquier cuenta autenticada consulte una veterinaria activa, sujeto a que el
identificador y la fecha sean aceptados. No se observa rate limiting.

## Ficha del endpoint

### Método y ruta

`GET /api/disponibilidad/:veterinariaId`

### Para qué sirve

Busca turnos en estado `DIS` para una veterinaria y una fecha determinada.
También informa el día de la semana y el horario de atención configurado.

### Parámetros

| Parámetro | Ubicación | Tipo | Obligatorio | Regla observada |
|---|---|---|---|---|
| `veterinariaId` | Ruta | UUID o identificador de veterinaria | Sí | Se usa para buscar una veterinaria activa. |
| `fecha` | Query | string | Sí | Debe tener formato `YYYY-MM-DD` y no ser anterior al día actual UTC. |
| `servicioId` | Query | string | No | Si se envía, se agrega como filtro del servicio; no se observa una validación explícita de formato o existencia antes de consultar. |

No se observa cuerpo de petición.

Ejemplo ficticio:

```text
GET /api/disponibilidad/<ID_VETERINARIA_FICTICIO>?fecha=2026-12-01&servicioId=<ID_SERVICIO_FICTICIO>
```

### Reglas observadas

- La fecha es obligatoria.
- Debe coincidir con la expresión de formato `YYYY-MM-DD`.
- No se permiten fechas anteriores al día actual calculado en UTC.
- La veterinaria debe existir y tener estado `ACT`.
- Si no hay horario configurado para ese día, se devuelve una lista vacía con
  un mensaje que indica que la veterinaria no atiende ese día.
- La búsqueda consulta turnos de esa veterinaria, en esa fecha y estado `DIS`.
- Si se envía `servicioId`, se filtra por ese servicio.
- Los turnos se ordenan por hora de inicio ascendente.

El controller usa el día UTC para encontrar el código de día y formatea las
horas como `HH:MM`. No se observa una validación independiente de que la fecha
calendario exista más allá de la conversión de JavaScript; debe probarse.

### Respuestas observadas

Cuando hay turnos:

- `200` con `success` y `data` que incluye `fecha`, `dia`,
  `horarioAtencion`, `turnosDisponibles` y `totalDisponibles`.
- Cada turno incluye `turnoId`, `horaInicio`, `horaFin`, `servicio`,
  `montoServicio` y `profesional`.

Ejemplo ficticio:

```json
{
  "success": true,
  "data": {
    "fecha": "2026-12-01",
    "dia": "martes",
    "horarioAtencion": "09:00 a 18:00",
    "turnosDisponibles": [
      {
        "turnoId": "<ID_TURNO_FICTICIO>",
        "horaInicio": "09:00",
        "horaFin": "09:30",
        "servicio": {
          "servicio_id": "<ID_SERVICIO_FICTICIO>",
          "nombre": "Consulta ficticia",
          "precio": 1500
        },
        "montoServicio": 1500,
        "profesional": {
          "profesional_id": "<ID_PROFESIONAL_FICTICIO>",
          "nombre": "Profesional",
          "apellido": "Ficticio"
        }
      }
    ],
    "totalDisponibles": 1
  }
}
```

Cuando la veterinaria no atiende ese día, devuelve `200` con la lista vacía,
`totalDisponibles: 0` y el mensaje correspondiente. Cuando atiende pero no
hay turnos libres, también devuelve `200` con lista vacía e informa el horario
de atención.

**Errores observados:**

- `400`: falta `fecha`;
- `400`: formato de fecha inválido;
- `400`: fecha pasada;
- `400`: identificador de veterinaria inválido si Prisma informa `P2023`;
- `404`: veterinaria inexistente o no activa;
- `401` o `403`: desde `verifyToken` por sesión ausente, inválida, inactiva o
  no verificada;
- `500`: error interno.

Ejemplo ficticio:

```json
{
  "message": "No podés consultar disponibilidad para fechas pasadas"
}
```

## Comparación con la grilla de `docs/api/turnos.md`

La grilla corresponde a `GET /api/turnos/disponibles/grilla`, mientras que
esta consulta corresponde a `GET /api/disponibilidad/:veterinariaId`.

| Aspecto | Disponibilidad | Grilla de turnos |
|---|---|---|
| Identificación de veterinaria | En `:veterinariaId` de la ruta | En `veterinariaId` de query. |
| Fechas | Una fecha obligatoria: `fecha` | Rango opcional con `fechaDesde` y `fechaHasta`. |
| Filtro por servicio | Sí, mediante `servicioId` | No se observa en ese controller. |
| Verificación de veterinaria activa | Sí, devuelve `404` si no existe o no está activa | No se observa una comprobación equivalente antes de consultar. |
| Horario de atención | Devuelve `dia` y `horarioAtencion` | No los devuelve. |
| Datos por turno | Servicio, monto y profesional completos en la estructura observada | IDs de servicio y profesional, fecha y horas. |
| Estado consultado | `DIS` | `DIS`. |
| Tope de resultados | No se observa un `take` explícito | `take: 500`. |
| Respuesta sin resultados | Mensaje y estructura contextual de fecha/horario | Objeto con `turnos: []`. |
| Acceso | `verifyToken` | `verifyToken`; el controller de grilla tampoco aplica rol visible. |

La diferencia funcional que sí puede verificarse es que la consulta de
disponibilidad está pensada para una fecha puntual y una presentación con
servicio, profesional y horario de atención, mientras que la grilla devuelve
turnos disponibles para un rango y una estructura más compacta. La intención
de producto definitiva queda **A confirmar: nombre por asignar**.

## Puntos pendientes de prueba o confirmación

- Confirmar si cualquier cuenta autenticada debe consultar disponibilidad de
  cualquier veterinaria: **A confirmar: nombre por asignar**.
- Probar fechas con formato correcto pero calendario inválido y diferencias de
  zona horaria: **A confirmar: nombre por asignar**.
- Confirmar el formato y la existencia esperada de `servicioId`: **A
  confirmar: nombre por asignar**.
- Revisar la diferencia de validación de veterinaria activa entre esta ruta y
  la grilla: **A confirmar: nombre por asignar**.
- Probar listas grandes, ausencia de horario y ausencia de turnos: **A
  confirmar: nombre por asignar**.

Las pruebas de ejecución y las revisiones del equipo siguen pendientes.
