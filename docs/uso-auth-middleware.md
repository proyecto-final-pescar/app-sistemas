# Middleware de autenticación JWT

El middleware de verificación JWT ya está listo en `server/src/middleware/auth.js`.

## ¿Cómo usarlo?

Cuando creen rutas que requieran usuario logueado, tienen que importarlo y usarlo así:

```js
import verifyToken from '../middleware/auth.js';

// Agregarlo entre la ruta y el controller
router.get('/ruta-protegida', verifyToken, tuController);
```

## Ejemplo 

```js
router.post('/mascotas', verifyToken, crearMascota);

```

