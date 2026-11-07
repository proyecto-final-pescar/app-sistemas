# Informe de pruebas — S18-02 Consultas e historial clínico (Dueño)

**Entorno probado:** deploy `mypet.ar`\
**Resultado general:** parcial.

## Datos de prueba

- Dueña: Sofía Gómez.
- Mascota con historial: Jack.
- Mascotas sin historial: Lili, Lola y Patacón.
- Se registraron en Jack una consulta veterinaria general con anotación extensa y una consulta de vacunación antirrábica.

## Pruebas realizadas

- **Registro de consultas como veterinaria:** aprobado con observación. Las consultas se registraron y visualizaron en el historial de Jack. La anotación larga se mostró completa, sin cortes ni superposiciones, aunque genera tarjetas extensas.
- **Historial Médico desde el sidebar como dueña:** aprobado con observaciones. Se visualizaron las consultas cargadas y sus motivos; el detalle muestra fecha, hora y anotaciones completas.
- **Filtro por mascota:** aprobado parcialmente. Al filtrar por Jack, el listado se actualizó y mostró únicamente sus consultas, sin mezclar información con las demás mascotas. No fue posible validarlo entre dos mascotas con historial.
- **Detalle de consulta:** aprobado con observaciones. Las anotaciones extensas se ven completas. El detalle no muestra explícitamente la veterinaria ni el profesional responsable.
- **Historial desde ficha individual:** aprobado parcialmente. La ficha de Jack muestra métricas, vacunas y estudios, pero no el listado ni detalle de consultas como el historial general.
- **Vacunas y estudios existentes:** aprobado con observaciones. Se muestran nombre, fecha y profesional.
- **Archivo adjunto de estudio:** aprobado. El botón “Ver resultado” funciona y abre el archivo correspondiente al estudio existente.
- **Mascota sin historial:** aprobado. Se muestran mensajes claros: “Sin consultas”, “Todavía no hay vacunas registradas” y “Todavía no hay estudios registrados”.
- **Carga de vacunas nuevas:** bloqueada. El selector obligatorio de profesional no ofrece opciones y no permite guardar.
- **Carga de estudios nuevos con y sin archivo:** bloqueada por el mismo motivo. Se pudo seleccionar un PNG, pero no completar la carga.
- **Formatos de adjuntos:** parcial. La interfaz indica imágenes de hasta 5 MB; se contemplan JPG/JPEG, PNG y WEBP. No se pudo confirmar la carga final por el bloqueo de profesional.

## Hallazgos

### Bloqueante — no se pueden crear vacunas ni estudios

Al crear una vacuna o estudio, el campo obligatorio “Profesional” no muestra opciones. La validación impide guardar el registro.

Esto bloquea la prueba de carga de estudios nuevos con y sin adjunto y la validación completa de formatos.

### Alta prioridad — desfase de un día en las fechas

Las fechas mostradas en el historial aparecen un día antes respecto de la fecha seleccionada en la consulta/turno; la hora se conserva correctamente.

Ejemplos observados:

- Consulta cargada para 22/09/2026 a las 10:15: se muestra como 21/09/2026 a las 10:15.
- Consulta cargada para 21/09/2026 a las 13:00: se muestra como 20/09/2026 a las 13:00.

El comportamiento también se observa en vacunas y estudios existentes. Probablemente se relacione con el manejo de zona horaria.

### Media — ficha individual incompleta

Desde la ficha individual de Jack se muestran métricas de consultas, vacunas y estudios, pero no se puede acceder al listado ni detalle de consultas. Para verlas, la dueña debe volver al Historial Médico general.

### Media — faltan datos en el detalle de consulta

El modal muestra fecha, hora, servicio/motivo y anotaciones, pero no muestra de forma explícita la veterinaria ni el profesional responsable.

### Secundaria — formatos limitados a imágenes

El campo de estudios está orientado a imágenes de hasta 5 MB: JPG/JPEG, PNG y WEBP. Es coherente para evidencia visual, pero limita la carga de informes clínicos en PDF.

### Limitación de cobertura

No fue posible repetir la carga clínica con otra mascota de la misma dueña. Las mascotas nuevas no aparecieron en la vista de la veterinaria al no contar con un turno asociado, y no se pudo completar ese flujo durante la prueba.

## Conclusión

El historial clínico del dueño permite consultar registros existentes, filtrar por mascota, abrir detalles de consultas, visualizar estados vacíos y acceder a archivos adjuntos existentes.

Se recomienda corregir el selector de profesional en vacunas y estudios, el desfase de fechas y la falta de detalle de consultas en la ficha individual.

---
