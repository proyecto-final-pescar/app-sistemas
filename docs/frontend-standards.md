# Estándares de Frontend — VeterinariaCentral

Este documento define los estándares que todo el equipo de frontend debe seguir para mantener consistencia en el código a lo largo del proyecto.

---

## Estructura de cada página o componente

Toda página nueva tiene que seguir este orden interno:

```jsx
// 1. Imports
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

// 2. Componente principal
const MiPagina = () => {

  // 3. Hooks siempre primero
  const navigate = useNavigate()
  const { usuario } = useAuth()

  // 4. Estados
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // 5. Funciones y handlers
  const handleSubmit = async () => { ... }

  // 6. Return con el JSX
  return ( ... )
}

export default MiPagina
```

---

## Llamadas a la API

Siempre usar la variable de entorno, nunca hardcodear la URL:

```javascript
// ❌ Mal
fetch('/api/mascotas')
fetch('http://localhost:3000/api/mascotas')

// ✅ Bien
fetch(`${import.meta.env.VITE_API_URL}/api/mascotas`)
```

Siempre incluir el token en los endpoints protegidos:

```javascript
const token = localStorage.getItem('token')

const response = await fetch(`${import.meta.env.VITE_API_URL}/api/mascotas`, {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  }
})
```

---

## Manejo de estados obligatorios

Toda llamada a la API tiene que manejar estos tres estados:

```javascript
const [data, setData] = useState(null)           // los datos que llegaron
const [error, setError] = useState('')            // mensaje de error si falló
const [isLoading, setIsLoading] = useState(false) // mientras espera respuesta
```

Y mostrarlos en el JSX:

```jsx
if (isLoading) return <p>Cargando...</p>
if (error) return <p>{error}</p>
```

---

## Formularios

Todo formulario tiene que tener:
- Estado con todos los campos
- Validaciones antes de llamar a la API
- Mensajes de error claros por campo
- Botón deshabilitado mientras `isLoading` es true
- Manejo del error que viene del backend

```jsx
const [formData, setFormData] = useState({ campo1: '', campo2: '' })
const [errors, setErrors] = useState({})
const [isLoading, setIsLoading] = useState(false)

const validate = () => {
  const newErrors = {}
  if (!formData.campo1) newErrors.campo1 = 'Este campo es requerido'
  return newErrors
}

const handleSubmit = async (e) => {
  e.preventDefault()

  const newErrors = validate()
  if (Object.keys(newErrors).length > 0) {
    setErrors(newErrors)
    return
  }

  setIsLoading(true)
  try {
    // llamada a la API
  } catch (error) {
    setError('Error de conexión con el servidor')
  } finally {
    setIsLoading(false)
  }
}
```

---

## Navegación

Siempre usar `useNavigate` de react-router-dom, nunca `window.location.href`:

```javascript
// ❌ Mal
window.location.href = '/home'

// ✅ Bien
const navigate = useNavigate()
navigate('/home')
```

---

## Ubicación de archivos

```
/src
  /pages          → páginas completas, organizadas por rol
    /auth         → Login.jsx, Register.jsx
    /duenio       → páginas del dueño de mascota
    /mascota      → páginas de gestión de mascotas
    /veterinaria  → páginas de la veterinaria
    /admin        → páginas del administrador
  /components
    /common       → componentes reutilizables en toda la app (Navbar, Footer, Button, etc.)
    /ui           → componentes de interfaz (Modal, Toast, Skeleton)
  /context        → AuthContext.jsx
  /hooks          → useAuth.js y otros hooks custom
  /services       → llamadas a la API organizadas por módulo
  /constants      → valores fijos
  /utils          → funciones auxiliares reutilizables
```

---

## Variables de entorno

El archivo `.env` de la carpeta `/client` tiene que tener:

```
VITE_API_URL=xxxxxxxxxxxxxxx
```

Todas las variables de entorno en el frontend tienen que empezar con `VITE_` para que Vite las exponga correctamente. Sin ese prefijo, la variable no va a estar disponible en el código.

---

## Checklist mínimo antes de hacer el PR

- [ ] URL de la API usando `VITE_API_URL`, sin hardcodear
- [ ] Token incluido en los headers de los endpoints protegidos
- [ ] Estados de `loading`, `error` y `data` implementados
- [ ] Validaciones en formularios antes de llamar a la API
- [ ] Mensajes de error claros para el usuario, sin textos técnicos
- [ ] Navegación con `useNavigate`, sin `window.location.href`
- [ ] Archivo en la carpeta correcta según su tipo
- [ ] Sin `console.log` de debug en el código
- [ ] Variable de entorno `VITE_API_URL` configurada en el `.env`
