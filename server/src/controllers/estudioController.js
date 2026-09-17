import prisma from '../../prisma/client.js'

const isValidUUID = (id) => {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)
}

const relacionesEstudio = {
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

const formatearEstudio = (estudio) => ({
  id: estudio.estudio_id,
  mascotaId: estudio.mascota_id,

  profesionalId: estudio.profesional_id,
  profesionalNombre: estudio.profesional
    ? `${estudio.profesional.nombre} ${estudio.profesional.apellido}`.trim()
    : null,

  veterinariaId: estudio.veterinaria_id,
  veterinariaNombre: estudio.veterinaria?.nombre || null,

  nombre: estudio.nombre,
  fecha: estudio.fecha,
  urlArchivo: estudio.url_archivo,

  createdAt: estudio.created_at,
  updatedAt: estudio.updated_at
})

export const crearEstudio = async (req, res) => {
  try {
    const {
      mascotaId,
      nombre,
      fecha,
      urlArchivo,
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
        message: 'El nombre del estudio es requerido'
      })
    }

    if (!fecha) {
      return res.status(400).json({
        success: false,
        message: 'La fecha es requerida'
      })
    }

    const fechaValida = new Date(fecha)

    if (Number.isNaN(fechaValida.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'La fecha no es válida'
      })
    }

    if (urlArchivo) {
      try {
        new URL(urlArchivo)
      } catch {
        return res.status(400).json({
          success: false,
          message: 'La URL del archivo no es válida'
        })
      }
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

    const estudio = await prisma.estudio.create({
      data: {
        mascota_id: mascotaId,
        profesional_id: profesionalId,
        veterinaria_id: veterinaria.veterinaria_id,
        nombre: nombre.trim(),
        fecha: fechaValida,
        url_archivo: urlArchivo?.trim() || null
      },

      include: relacionesEstudio
    })

    return res.status(201).json({
      success: true,
      data: formatearEstudio(estudio)
    })
  } catch (error) {
    console.error('Error en crearEstudio:', error)

    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    })
  }
}

export const obtenerEstudiosPorMascota = async (req, res) => {
  try {
    const { mascotaId } = req.params

    if (!isValidUUID(mascotaId)) {
      return res.status(400).json({
        success: false,
        message: 'El id de la mascota no es válido'
      })
    }

    const estudios = await prisma.estudio.findMany({
      where: {
        mascota_id: mascotaId
      },

      include: relacionesEstudio,

      orderBy: {
        fecha: 'desc'
      }
    })

    return res.status(200).json({
      success: true,
      data: estudios.map(formatearEstudio)
    })
  } catch (error) {
    console.error('Error en obtenerEstudiosPorMascota:', error)

    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    })
  }
}

export const obtenerEstudioPorId = async (req, res) => {
  try {
    const { id } = req.params

    if (!isValidUUID(id)) {
      return res.status(400).json({
        success: false,
        message: 'El id del estudio no es válido'
      })
    }

    const estudio = await prisma.estudio.findUnique({
      where: {
        estudio_id: id
      },

      include: {
        ...relacionesEstudio,

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

    if (!estudio) {
      return res.status(404).json({
        success: false,
        message: 'Estudio no encontrado'
      })
    }

    return res.status(200).json({
      success: true,
      data: {
        ...formatearEstudio(estudio),

        mascota: {
          id: estudio.mascota.mascota_id,
          nombre: estudio.mascota.nombre,
          especie:
            estudio.mascota.raza?.especie?.nombre || null
        }
      }
    })
  } catch (error) {
    console.error('Error en obtenerEstudioPorId:', error)

    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    })
  }
}

export const actualizarEstudio = async (req, res) => {
  try {
    const { id } = req.params
    const { nombre, fecha, urlArchivo, profesionalId } = req.body

    if (!isValidUUID(id)) {
      return res.status(400).json({
        success: false,
        message: 'El id del estudio no es válido'
      })
    }

    const estudio = await prisma.estudio.findUnique({
      where: {
        estudio_id: id
      }
    })

    if (!estudio) {
      return res.status(404).json({
        success: false,
        message: 'Estudio no encontrado'
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
      estudio.veterinaria_id !== veterinaria.veterinaria_id
    ) {
      return res.status(403).json({
        success: false,
        message: 'Solo podés editar estudios de tu veterinaria'
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

    if (fecha !== undefined) {
      const fechaValida = new Date(fecha)

      if (Number.isNaN(fechaValida.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'La fecha no es válida'
        })
      }

      dataActualizar.fecha = fechaValida
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

    if (urlArchivo !== undefined) {
      if (urlArchivo?.trim()) {
        try {
          new URL(urlArchivo.trim())
        } catch {
          return res.status(400).json({
            success: false,
            message: 'La URL del archivo no es válida'
          })
        }

        dataActualizar.url_archivo = urlArchivo.trim()
      } else {
        dataActualizar.url_archivo = null
      }
    }

    if (Object.keys(dataActualizar).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No se enviaron campos para actualizar'
      })
    }

    dataActualizar.updated_at = new Date()

    const estudioActualizado = await prisma.estudio.update({
      where: {
        estudio_id: id
      },

      data: dataActualizar,

      include: relacionesEstudio
    })

    return res.status(200).json({
      success: true,
      data: formatearEstudio(estudioActualizado)
    })
  } catch (error) {
    console.error('Error en actualizarEstudio:', error)

    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    })
  }
}

export const eliminarEstudio = async (req, res) => {
  try {
    const { id } = req.params

    if (!isValidUUID(id)) {
      return res.status(400).json({
        success: false,
        message: 'El id del estudio no es válido'
      })
    }

    const estudio = await prisma.estudio.findUnique({
      where: {
        estudio_id: id
      }
    })

    if (!estudio) {
      return res.status(404).json({
        success: false,
        message: 'Estudio no encontrado'
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
      estudio.veterinaria_id !== veterinaria.veterinaria_id
    ) {
      return res.status(403).json({
        success: false,
        message: 'Solo podés eliminar estudios de tu veterinaria'
      })
    }

    await prisma.estudio.delete({
      where: {
        estudio_id: id
      }
    })

    return res.status(200).json({
      success: true,
      message: 'Estudio eliminado correctamente'
    })
  } catch (error) {
    console.error('Error en eliminarEstudio:', error)

    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    })
  }
}