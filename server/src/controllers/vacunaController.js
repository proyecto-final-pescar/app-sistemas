import prisma from '../../prisma/client.js'

const isValidUUID = (id) => {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)
}

const formatearVacuna = (vacuna) => ({
  id: vacuna.vacuna_id,
  mascotaId: vacuna.mascota_id,

  profesionalId: vacuna.profesional_id,
  profesionalNombre: vacuna.profesional
    ? `${vacuna.profesional.nombre} ${vacuna.profesional.apellido}`.trim()
    : null,

  veterinariaId: vacuna.veterinaria_id,
  veterinariaNombre: vacuna.veterinaria?.nombre || null,

  nombre: vacuna.nombre,
  fechaAplicada: vacuna.fecha_aplicada,

  createdAt: vacuna.created_at,
  updatedAt: vacuna.updated_at
})

const relacionesVacuna = {
  profesional: {
    select: {
      profesional_id: true,
      nombre: true,
      apellido: true
    }
  },
  veterinaria: {
    select: {
      veterinaria_id: true,
      nombre: true
    }
  }
}

export const crearVacuna = async (req, res) => {
  try {
    const {
      mascotaId,
      nombre,
      fechaAplicada,
      profesionalId
    } = req.body

    if (!mascotaId || !isValidUUID(mascotaId)) {
      return res.status(400).json({
        success: false,
        message: 'La mascota es inválida'
      })
    }

    if (!profesionalId || !isValidUUID(profesionalId)) {
      return res.status(400).json({
        success: false,
        message: 'El profesional es inválido'
      })
    }

    if (!nombre || typeof nombre !== 'string' || !nombre.trim()) {
      return res.status(400).json({
        success: false,
        message: 'El nombre de la vacuna es requerido'
      })
    }

    if (!fechaAplicada) {
      return res.status(400).json({
        success: false,
        message: 'La fecha de aplicación es requerida'
      })
    }

    const fechaValida = new Date(fechaAplicada)

    if (Number.isNaN(fechaValida.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'La fecha de aplicación no es válida'
      })
    }

    const mascota = await prisma.mascota.findUnique({
      where: {
        mascota_id: mascotaId
      },
      select: {
        mascota_id: true
      }
    })

    if (!mascota) {
      return res.status(404).json({
        success: false,
        message: 'Mascota no encontrada'
      })
    }

    const veterinaria = await prisma.veterinaria.findUnique({
      where: {
        usuario_id: req.user.id
      },
      select: {
        veterinaria_id: true
      }
    })

    if (!veterinaria) {
      return res.status(404).json({
        success: false,
        message: 'No se encontró una veterinaria asociada a este usuario'
      })
    }

    const profesional = await prisma.profesional.findFirst({
      where: {
        profesional_id: profesionalId,
        veterinaria_id: veterinaria.veterinaria_id,
        active: true
      },
      select: {
        profesional_id: true
      }
    })

    if (!profesional) {
      return res.status(404).json({
        success: false,
        message: 'El profesional seleccionado no pertenece a esta veterinaria'
      })
    }

    const vacuna = await prisma.vacuna.create({
      data: {
        mascota_id: mascotaId,
        profesional_id: profesionalId,
        veterinaria_id: veterinaria.veterinaria_id,
        nombre: nombre.trim(),
        fecha_aplicada: fechaValida
      },

      include: relacionesVacuna
    })

    return res.status(201).json({
      success: true,
      data: formatearVacuna(vacuna)
    })
  } catch (error) {
    console.error('Error en crearVacuna:', error)

    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    })
  }
}

export const obtenerVacunasPorMascota = async (req, res) => {
  try {
    const { mascotaId } = req.params

    if (!isValidUUID(mascotaId)) {
      return res.status(400).json({
        success: false,
        message: 'El id de la mascota no es válido'
      })
    }

    const vacunas = await prisma.vacuna.findMany({
      where: {
        mascota_id: mascotaId
      },

      include: relacionesVacuna,

      orderBy: {
        fecha_aplicada: 'desc'
      }
    })

    return res.status(200).json({
      success: true,
      data: vacunas.map(formatearVacuna)
    })
  } catch (error) {
    console.error('Error en obtenerVacunasPorMascota:', error)

    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    })
  }
}

export const obtenerVacunaPorId = async (req, res) => {
  try {
    const { id } = req.params

    if (!isValidUUID(id)) {
      return res.status(400).json({
        success: false,
        message: 'El id de la vacuna no es válido'
      })
    }

    const vacuna = await prisma.vacuna.findUnique({
      where: {
        vacuna_id: id
      },

      include: {
        ...relacionesVacuna,

        mascota: {
          select: {
            mascota_id: true,
            nombre: true,

            raza: {
              select: {
                especie: {
                  select: {
                    nombre: true
                  }
                }
              }
            }
          }
        }
      }
    })

    if (!vacuna) {
      return res.status(404).json({
        success: false,
        message: 'Vacuna no encontrada'
      })
    }

    return res.status(200).json({
      success: true,
      data: {
        ...formatearVacuna(vacuna),

        mascota: {
          id: vacuna.mascota.mascota_id,
          nombre: vacuna.mascota.nombre,
          especie:
            vacuna.mascota.raza?.especie?.nombre || null
        }
      }
    })
  } catch (error) {
    console.error('Error en obtenerVacunaPorId:', error)

    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    })
  }
}

export const actualizarVacuna = async (req, res) => {
  try {
    const { id } = req.params
    const { nombre, fechaAplicada, profesionalId } = req.body

    if (!isValidUUID(id)) {
      return res.status(400).json({
        success: false,
        message: 'El id de la vacuna no es válido'
      })
    }

    const vacuna = await prisma.vacuna.findUnique({
      where: {
        vacuna_id: id
      }
    })

    if (!vacuna) {
      return res.status(404).json({
        success: false,
        message: 'Vacuna no encontrada'
      })
    }

    const veterinaria = await prisma.veterinaria.findUnique({
      where: {
        usuario_id: req.user.id
      },
      select: {
        veterinaria_id: true
      }
    })

    if (
      !veterinaria ||
      vacuna.veterinaria_id !== veterinaria.veterinaria_id
    ) {
      return res.status(403).json({
        success: false,
        message: 'Solo podés editar vacunas de tu veterinaria'
      })
    }

    const dataActualizar = {}

    if (nombre !== undefined) {
      if (typeof nombre !== 'string' || !nombre.trim()) {
        return res.status(400).json({
          success: false,
          message: 'El nombre no puede estar vacío'
        })
      }

      dataActualizar.nombre = nombre.trim()
    }

    if (fechaAplicada !== undefined) {
      const fechaValida = new Date(fechaAplicada)

      if (Number.isNaN(fechaValida.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'La fecha no es válida'
        })
      }

      dataActualizar.fecha_aplicada = fechaValida
    }

    if (profesionalId !== undefined) {
      if (!isValidUUID(profesionalId)) {
        return res.status(400).json({
          success: false,
          message: 'El profesional es inválido'
        })
      }

      const profesional = await prisma.profesional.findFirst({
        where: {
          profesional_id: profesionalId,
          veterinaria_id: veterinaria.veterinaria_id,
          active: true
        }
      })

      if (!profesional) {
        return res.status(404).json({
          success: false,
          message: 'El profesional seleccionado no pertenece a esta veterinaria'
        })
      }

      dataActualizar.profesional_id = profesionalId
    }

    if (Object.keys(dataActualizar).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No se enviaron campos para actualizar'
      })
    }

    dataActualizar.updated_at = new Date()

    const vacunaActualizada = await prisma.vacuna.update({
      where: {
        vacuna_id: id
      },

      data: dataActualizar,

      include: relacionesVacuna
    })

    return res.status(200).json({
      success: true,
      data: formatearVacuna(vacunaActualizada)
    })
  } catch (error) {
    console.error('Error en actualizarVacuna:', error)

    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    })
  }
}

export const eliminarVacuna = async (req, res) => {
  try {
    const { id } = req.params

    if (!isValidUUID(id)) {
      return res.status(400).json({
        success: false,
        message: 'El id de la vacuna no es válido'
      })
    }

    const vacuna = await prisma.vacuna.findUnique({
      where: {
        vacuna_id: id
      }
    })

    if (!vacuna) {
      return res.status(404).json({
        success: false,
        message: 'Vacuna no encontrada'
      })
    }

    const veterinaria = await prisma.veterinaria.findUnique({
      where: {
        usuario_id: req.user.id
      },
      select: {
        veterinaria_id: true
      }
    })

    if (
      !veterinaria ||
      vacuna.veterinaria_id !== veterinaria.veterinaria_id
    ) {
      return res.status(403).json({
        success: false,
        message: 'Solo podés eliminar vacunas de tu veterinaria'
      })
    }

    await prisma.vacuna.delete({
      where: {
        vacuna_id: id
      }
    })

    return res.status(200).json({
      success: true,
      message: 'Vacuna eliminada correctamente'
    })
  } catch (error) {
    console.error('Error en eliminarVacuna:', error)

    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    })
  }
}