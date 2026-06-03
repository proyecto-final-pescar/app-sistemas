# 🐾 API REST - Sistema de Gestión Veterinaria

## 📋 Descripción

Esta API permite gestionar mascotas y turnos dentro del sistema de la veterinaria.

**Base URL**

```http
http://localhost:3000
```

---

# 🔍 Estado del Servidor

## GET /

Verifica que el backend esté funcionando correctamente.

| Campo | Valor |
|---------|---------|
| Método | GET |
| Ruta | / |
| Autenticación | No |
| Body | No requerido |

### Respuesta Exitosa

```json
{
  "mensaje": "Backend de Veterinaria funcionando ✅"
}
```

---

# 🐶 Gestión de Mascotas

## GET /pets

Obtiene todas las mascotas registradas.

| Campo | Valor |
|---------|---------|
| Método | GET |
| Ruta | /pets |
| Autenticación | Sí |
| Body | No requerido |

### Respuesta

```json
[
  {
    "id": 1,
    "nombre": "Firulais",
    "especie": "Perro",
    "edad": 5
  }
]
```

---

## POST /pets

Registra una nueva mascota.

| Campo | Valor |
|---------|---------|
| Método | POST |
| Ruta | /pets |
| Autenticación | Sí |
| Body | Requerido |

### Body

```json
{
  "nombre": "Firulais",
  "especie": "Perro",
  "edad": 5
}
```

### Respuesta

```json
{
  "mensaje": "Mascota creada correctamente"
}
```

---

## PUT /pets/:id

Actualiza los datos de una mascota existente.

| Campo | Valor |
|---------|---------|
| Método | PUT |
| Ruta | /pets/:id |
| Autenticación | Sí |
| Body | Requerido |

### Body

```json
{
  "nombre": "Firulais Actualizado",
  "edad": 6
}
```

### Respuesta

```json
{
  "mensaje": "Mascota actualizada correctamente"
}
```

---

## DELETE /pets/:id

Elimina una mascota del sistema.

| Campo | Valor |
|---------|---------|
| Método | DELETE |
| Ruta | /pets/:id |
| Autenticación | Sí |
| Body | No requerido |

### Respuesta

```json
{
  "mensaje": "Mascota eliminada correctamente"
}
```

---

# 📅 Gestión de Turnos

## GET /appointments

Obtiene todos los turnos registrados.

| Campo | Valor |
|---------|---------|
| Método | GET |
| Ruta | /appointments |
| Autenticación | Sí |
| Body | No requerido |

### Respuesta

```json
[
  {
    "id": 1,
    "fecha": "2026-06-10",
    "hora": "15:00",
    "mascotaId": 1
  }
]
```

---

## POST /appointments

Crea un nuevo turno.

| Campo | Valor |
|---------|---------|
| Método | POST |
| Ruta | /appointments |
| Autenticación | Sí |
| Body | Requerido |

### Body

```json
{
  "mascotaId": 1,
  "fecha": "2026-06-10",
  "hora": "15:00"
}
```

### Respuesta

```json
{
  "mensaje": "Turno creado correctamente"
}
```

---

## PUT /appointments/:id

Modifica un turno existente.

| Campo | Valor |
|---------|---------|
| Método | PUT |
| Ruta | /appointments/:id |
| Autenticación | Sí |
| Body | Requerido |

### Body

```json
{
  "fecha": "2026-06-15",
  "hora": "16:00"
}
```

### Respuesta

```json
{
  "mensaje": "Turno actualizado correctamente"
}
```

---

## DELETE /appointments/:id

Cancela un turno.

| Campo | Valor |
|---------|---------|
| Método | DELETE |
| Ruta | /appointments/:id |
| Autenticación | Sí |
| Body | No requerido |

### Respuesta

```json
{
  "mensaje": "Turno eliminado correctamente"
}
```

---

# 🔐 Resumen de Endpoints

| Método | Endpoint | Descripción | Auth |
|----------|----------|-------------|--------|
| GET | / | Estado del servidor | ❌ |
| GET | /pets | Listar mascotas | ✅ |
| POST | /pets | Crear mascota | ✅ |
| PUT | /pets/:id | Actualizar mascota | ✅ |
| DELETE | /pets/:id | Eliminar mascota | ✅ |
| GET | /appointments | Listar turnos | ✅ |
| POST | /appointments | Crear turno | ✅ |
| PUT | /appointments/:id | Actualizar turno | ✅ |
| DELETE | /appointments/:id | Eliminar turno | ✅ |

---

## 👨‍💻 Tecnologías

- Node.js
- Express.js
- REST API
- JSON
- Git & GitHub