#Documentación Base de Colecciones MongoDB (MVP)
Este documento define la primera versión del modelo de datos para el MVP de MyPet
El sistema principal es: 
- Permitir a los dueños encontrar veterinarias cercanas,
- Visualizar clínicas abiertas y disponibles para urgencias
- Gestionar mascotas.
- Gestionar turnos.
- Registrar consultas e historial clínico.
- Registrar vacunas.
- Mostrar servicios ofrecidos por las clínicas.
- Permitir valoraciones de clínicas (en revisión)

####Consideraciones
Este documento debe considerarse como una guía inicial para la implementación de las colecciones en Mongo.
Es posible agregar, modificar o eliminar campos durante el desarrollo siempre que:
- Exista una necesidad funcional clara
- Se mantenga consistencia entre colecciones
- Los cambios sean discutidos (en lo posible) con el equipo.

##Colecciones
________________________________________
###usuarios
{
  "_id": ObjectId,

  "nombre": String,

  "email": String,

  "passwordHash": String,

  "rol": String,

  "telefono": String,

  "estado": String,

  "createdAt": Date,

  "updatedAt": Date
}

#####Índices
db.usuarios.createIndex(
  { email: 1 },
  { unique: true }
)
________________________________________
###profesionales
{
  "_id": ObjectId,

  "usuarioId": ObjectId,

  "matricula": String,

  "especialidades": [
    String
  ],

  "clinicaId": ObjectId,

  "createdAt": Date,

  "updatedAt": Date
}
#####Índices
db.profesionales.createIndex({
  usuarioId: 1
})

db.profesionales.createIndex({
  clinicaId: 1
})

________________________________________
###clinicas
{
  "_id": ObjectId,

  "nombre": String,

  "descripcion": String,

  "telefono": String,

  "email": String,

"activo" : Boolean

  "direccion": {
    "street": String,
    "city": String,
    "province": String,

    "location": {
      "type": "Point",
      "coordinates": [
        Number(longitud),
        Number(latitud)
      ]
    }
  },

  "horarios": [
    {
      "dia": String,
      "apertura": String,
      "cierre": String
    }
  ],

  "urgencias": Boolean,

  "activa": Boolean,

  "createdAt": Date,
  
  "deletedAt": Date

  "updatedAt": Date
}
#####Índices
Geoespacial (obligatorio)
db.clinicas.createIndex({
  "direccion.location": "2dsphere"
})
Búsqueda por ciudad
db.clinicas.createIndex({
  "direccion.city": 1
})
Clínicas activas
db.clinicas.createIndex({
  activa: 1
})
________________________________________
###mascotas
{
  "_id": ObjectId,

  "nombre": String,

  "especie": String,

  "raza": String,

  "sexo": String,

  "pesoActual": Number,

  "fechaNacimiento": Date,

  "propietarioId": ObjectId,

  "estado": String,

  "createdAt": Date,

  "updatedAt": Date
}
#####Índices
db.mascotas.createIndex({
  propietarioId: 1
})
________________________________________
###turnos
{
  "_id": ObjectId,

  "mascotaId": ObjectId,

  "clinicaId": ObjectId,

  "profesionalId": ObjectId,

  "fechaTurno": Date,

  "motivo": String,

  "estado": String,

  "createdAt": Date,

  "updatedAt": Date
}
#####Índices
Agenda del profesional
db.turnos.createIndex({
  profesionalId: 1,
  fechaTurno: 1
})
Turnos por clínica
db.turnos.createIndex({
  clinicaId: 1,
  fechaTurno: 1
})
Historial de mascota
db.turnos.createIndex({
  mascotaId: 1
})
________________________________________
###consultas
Representa la historia clínica.
{
  "_id": ObjectId,

  "mascotaId": ObjectId,

  "profesionalId": ObjectId,

  "clinicaId": ObjectId,

  "fecha": Date,

  "tipoServicio": String,

  "motivo": String,

  "diagnostico": String,

  "tratamiento": String,

  "peso": Number,

  "observaciones": String,

  "createdAt": Date,

  "updatedAt": Date
}
#####Índices
db.consultas.createIndex({
  mascotaId: 1,
  fecha: -1
})
db.consultas.createIndex({
  profesionalId: 1
})
________________________________________
###vacunas
{
  "_id": ObjectId,

  "mascotaId": ObjectId,

  "nombre": String,

  "fechaAplicacion": Date,

  "fechaVencimiento": Date,

  "profesionalId": ObjectId,

  "createdAt": Date,

  "updatedAt": Date
}
#####Índices
db.vacunas.createIndex({
  mascotaId: 1
})
db.vacunas.createIndex({
  fechaVencimiento: 1
})
________________________________________
###servicios
{
  "_id": ObjectId,

  "clinicaId": ObjectId,

  "nombre": String,

  "descripcion": String,

  "precioReferencia": Number,

  "duracionMinutos": Number,

  "activo": Boolean,

  "createdAt": Date,

  "updatedAt": Date
}
#####Índices
db.servicios.createIndex({
  clinicaId: 1
})
________________________________________
###reseñas
{
  "_id": ObjectId,

  "usuarioId": ObjectId,

  "clinicaId": ObjectId,

  "puntaje": Number,

  "comentario": String,

  "createdAt": Date,

  "updatedAt": Date
}
#####Índices
db.reseñas.createIndex({
  clinicaId: 1
})
db.reseñas.createIndex({
  usuarioId: 1
})
________________________________________
