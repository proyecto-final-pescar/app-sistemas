# API REST - MyPet

Base URL: `http://localhost:3000`

---

## Estado del servidor

`GET /` — Verifica que el servidor esté corriendo. No requiere autenticación.

---

## Autenticación

`POST /auth/register` — Registra un nuevo usuario. Recibe `name`, `email`, `password` y `role`. Valida los campos, verifica que el email no esté en uso, encripta la contraseña con bcrypt, guarda el usuario y devuelve un token JWT junto con los datos del usuario (sin contraseña).

`POST /auth/login` — Inicia sesión. Recibe `email` y `password`. 

---

## Usuarios

`GET /users/me` — Devuelve el perfil del usuario autenticado. Requiere auth.

`PUT /users/me` — Actualiza los datos del perfil (nombre, teléfono, zona, foto). Requiere auth.

`PUT /users/me/password` — Cambia la contraseña del usuario autenticado. Recibe `currentPassword` y `newPassword`. Requiere auth.

`DELETE /users/me` — Elimina la cuenta del usuario autenticado. Requiere auth.

`GET /users` — Lista todos los usuarios. Solo administrador.

`PUT /users/:id/status` — Activa o desactiva un usuario. Solo administrador.

`DELETE /users/:id` — Elimina un usuario. Solo administrador.

---

## Mascotas

`GET /pets` — Lista las mascotas del usuario autenticado. Requiere auth.

`POST /pets` — Registra una nueva mascota. Recibe nombre, especie, raza, edad, foto y otros datos. Requiere auth con rol `dueno`.

`GET /pets/:id` — Devuelve la ficha completa de una mascota. Requiere auth.

`PUT /pets/:id` — Actualiza los datos de una mascota. Requiere auth con rol `dueno`.

`DELETE /pets/:id` — Elimina una mascota. Requiere auth con rol `dueno`.

---

## Historial Clínico

`GET /pets/:id/history` — Lista los eventos médicos de una mascota con filtros. Requiere auth.

`POST /pets/:id/history` — Registra una nueva consulta en el historial. Requiere auth con rol `veterinaria`.

`GET /pets/:id/history/:entryId` — Devuelve el detalle de una consulta específica. 

---

## Veterinarias

`POST /clinics/register` — Registra una nueva clínica. Requiere auth con rol `veterinaria`.

`GET /clinics` — Lista las veterinarias aprobadas con filtros por zona, especialidad y disponibilidad. 

`GET /clinics/:id` — Devuelve el detalle de una veterinaria: dirección, contacto, profesionales, servicios, precios y grilla de turnos disponibles. 

`PUT /clinics/:id` — Actualiza los datos de la clínica. Requiere auth con rol `veterinaria`.

`POST /clinics/:id/professionals` — Agrega un profesional a la clínica con nombre y especialidad. Requiere auth con rol `veterinaria`.

`DELETE /clinics/:id/professionals/:profId` — Elimina un profesional de la clínica. Requiere auth con rol `veterinaria`.

---

## Turnos

`GET /appointments` — Lista los turnos del usuario autenticado (próximos y pasados).

`POST /appointments` — Reserva un nuevo turno. Recibe clínica, servicio, mascota, fecha y hora. Requiere auth con rol `dueno`.

`GET /appointments/:id` — Devuelve el detalle de un turno. 

`PUT /appointments/:id/cancel` — Cancela un turno. 

`GET /admin/appointments` — Lista global de todos los turnos con detalle de usuario, veterinaria, estado y monto. Solo administrador.

---

## Pagos

`POST /payments/create` — Inicia el proceso de pago con MercadoPago para confirmar un turno. Requiere auth con rol `dueno`.

`POST /payments/webhook` — Webhook que recibe notificaciones de MercadoPago para actualizar el estado del pago. 
---

## Foro de Mascotas Perdidas

`GET /forum` — Lista las publicaciones del foro con filtros por zona y estado (buscando/resuelto). 

`POST /forum` — Crea una nueva publicación con foto, nombre, zona, descripción física y contacto. Requiere auth con rol `dueno`.

`PUT /forum/:id` — Actualiza una publicación. 

`PUT /forum/:id/resolve` — Marca una publicación como resuelta. 

`DELETE /forum/:id` — Elimina una publicación. 

`POST /forum/:id/report` — Reporta una publicación. 

---

## Moderación (Admin)

`GET /admin/forum` — Lista todas las publicaciones del foro con estado y reportes. Solo administrador.

`DELETE /admin/forum/:id` — Elimina una publicación del foro. Solo administrador.

`GET /admin/clinics/pending` — Lista las clínicas pendientes de aprobación. Solo administrador.

`PUT /admin/clinics/:id/approve` — Aprueba el registro de una clínica. Solo administrador.

`PUT /admin/clinics/:id/reject` — Rechaza el registro de una clínica. Solo administrador.

`GET /admin/users` — Lista todos los usuarios con nombre, contacto, mascotas, estado y turnos. Solo administrador.

`PUT /admin/users/:id/status` — Activa o desactiva un usuario. Solo administrador.


## Urgencias

`GET /clinics/emergency` — Lista las clínicas con atención de urgencias 24h cercanas, usando Google Maps. 

## Bot de IA

`POST /ai/consult` — Envía una consulta de salud animal al bot.