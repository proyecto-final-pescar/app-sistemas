# Estándares de Backend — VeterinariaCentral

Este documento define los estándares que todo el equipo de backend debe seguir para mantener consistencia en el código a lo largo del proyecto.

---

## Estructura de cada controller

Todo controller tiene que seguir este orden interno:

```javascript
// 1. Imports
import Modelo from '../models/Modelo.js'

// 2. Exportar la función con nombre descriptivo
export const accion = async (req, res) => {
  try {

    // 3. Destructurar los datos del request
    const { campo1, campo2 } = req.body

    // 4. Validaciones antes de tocar la base de datos
    if (!campo1 || !campo2) {
      return res.status(400).json({ message: 'Todos los campos son requeridos' })
    }

    // 5. Lógica de negocio (consultas a la base de datos, etc.)
    const resultado = await Modelo.findOne({ campo1 })

    // 6. Respuesta exitosa
    res.status(200).json({
      success: true,
      data: resultado
    })

  } catch (error) {
    // 7. Manejo de errores — siempre al final
    console.error('Error en accion:', error)
    res.status(500).json({ message: 'Error interno del servidor' })
  }
}
```

---

## Validaciones

Las validaciones siempre van antes de cualquier consulta a la base de datos. El orden correcto es:

```javascript
// 1. Campos requeridos
if (!campo1 || !campo2) {
  return res.status(400).json({ message: 'Todos los campos son requeridos' })
}

// 2. Formato de email
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
if (!emailRegex.test(email)) {
  return res.status(400).json({ message: 'Email inválido' })
}

// 3. Longitud de contraseña
if (password.length < 8) {
  return res.status(400).json({ message: 'La contraseña debe tener mínimo 8 caracteres' })
}

// 4. Verificar duplicados en la base de datos
const existingUser = await User.findOne({ email })
if (existingUser) {
  return res.status(409).json({ message: 'El email ya está registrado' })
}
```

---

## Orden de operaciones en controllers

Cuando hay que crear un recurso y generar un token, el orden importa. Primero guardar en la base de datos, después generar el token:

```javascript
// ❌ Mal — genera el token antes de guardar
const token = jwt.sign(...)
await user.save()

// ✅ Bien — primero guardar, después generar el token
await user.save()
const token = jwt.sign(...)
```

Si el `save()` falla después de generar el token, se devolvería un token de un recurso que no existe en la base de datos.

---

## Formato de respuestas

Todas las respuestas tienen que seguir el mismo formato para que el frontend las pueda manejar consistentemente:

**Respuesta exitosa:**
```javascript
res.status(200).json({
  success: true,
  data: resultado
})

// Para creación de recursos
res.status(201).json({
  success: true,
  data: {
    token,
    user: { id: user._id, name: user.name, email: user.email, role: user.role }
  }
})
```

**Respuesta de error:**
```javascript
// Error de validación
res.status(400).json({ message: 'Mensaje claro para el usuario' })

// No autenticado
res.status(401).json({ message: 'No estás autenticado. Por favor iniciá sesión.' })

// Prohibido (sin permisos)
res.status(403).json({ message: 'No tenés permisos para realizar esta acción.' })

// No encontrado
res.status(404).json({ message: 'El recurso no existe.' })

// Conflicto (duplicado)
res.status(409).json({ message: 'El email ya está registrado.' })

// Error interno
res.status(500).json({ message: 'Error interno del servidor' })
```

---

## Códigos de estado HTTP

| Código | Cuándo usarlo |
|---|---|
| 200 | Consulta o actualización exitosa |
| 201 | Creación exitosa (POST que crea un recurso) |
| 400 | Error de validación o datos incorrectos |
| 401 | No autenticado (sin token o token inválido) |
| 403 | Autenticado pero sin permisos (rol incorrecto) |
| 404 | Recurso no encontrado |
| 409 | Conflicto (email duplicado, turno ya reservado) |
| 500 | Error interno del servidor |

---


## Estructura de rutas

Cada módulo tiene su propio archivo de rutas. El archivo solo define las rutas y las conecta con su controller, sin lógica de negocio:

```javascript
// /src/routes/moduloRoutes.js
import { Router } from 'express'
import { accion1, accion2 } from '../controllers/moduloController.js'
import verifyToken from '../middleware/auth.js'

const router = Router()

// Rutas públicas
router.post('/register', accion1)

// Rutas protegidas — siempre agregar verifyToken
router.get('/', verifyToken, accion2)

export default router
```

Y registrarlas en `server.js`:
```javascript
import moduloRoutes from './src/routes/moduloRoutes.js'
app.use('/api/modulo', moduloRoutes)
```

---

## Middleware de autenticación

Toda ruta que requiera que el usuario esté logueado tiene que usar `verifyToken`. Si no se agrega, cualquier persona puede acceder sin token:

```javascript
// ❌ Ruta desprotegida
router.get('/mascotas', getMascotas)

// ✅ Ruta protegida
router.get('/mascotas', verifyToken, getMascotas)
```

Dentro del controller, los datos del usuario logueado están disponibles en `req.user`:
```javascript
const { id, email, role } = req.user
```

---

## Variables de entorno

Nunca hardcodear valores sensibles en el código. Todo va en el `.env`:

```javascript
// ❌ Mal
const token = jwt.sign(payload, 'secreto123', { expiresIn: '24h' })

// ✅ Bien
const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN })
```

Variables de entorno del backend:
```
PORT=3000
MONGODB_URI=mongodb+srv://...
JWT_SECRET=...
JWT_EXPIRES_IN=...
CLIENT_URL...
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
```

---

## Checklist mínimo antes de hacer el PR

- [ ] Validaciones completas antes de tocar la base de datos
- [ ] Campos requeridos, formato de email y longitud de contraseña validados
- [ ] Orden correcto: guardar primero, generar token después
- [ ] Códigos de estado HTTP correctos en todas las respuestas
- [ ] Formato de respuesta consistente con `success` y `data`
- [ ] Rutas protegidas con `verifyToken` donde corresponde
- [ ] Variables sensibles en `.env`, sin hardcodear
- [ ] Sin `console.log` de debug (solo `console.error` en el catch)
- [ ] `.env.example` actualizado si se agregaron variables nuevas
