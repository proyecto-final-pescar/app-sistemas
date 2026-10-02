import prisma from '../../prisma/client.js'

const isValidUUID = (id) => {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)
}

export const obtenerFichaMedica = async (req, res) => {
  try {
    const { mascotaId } = req.params

    if (!isValidUUID(mascotaId)) {
      return res.status(400).json({
        message: 'El id de la mascota no es válido'
      })
    }

    const fichaMedica = await prisma.ficha_medica.findUnique({
      where: {
        mascota_id: mascotaId
      },

      include: {
        mascota: {
          select: {
            mascota_id: true,

            usuario: {
              select: {
                usuario_id: true,
                nombre: true,
                apellido: true,
                email: true
              }
            }
          }
        }
      }
    })

    // No tener ficha todavía sigue sin ser un error
    if (!fichaMedica) {
      return res.status(200).json({
        success: true,
        data: null,
        message: 'Esta mascota todavía no tiene ficha médica'
      })
    }

    const data = {
      id: fichaMedica.ficha_medica_id,
      mascotaId: fichaMedica.mascota_id,

      colorPelaje: fichaMedica.color_pelaje,
      microchip: fichaMedica.microchip,
      enfermedadesCronicas:
        fichaMedica.enfermedades_cronicas,
      cirugiasPrevias:
        fichaMedica.cirugias_previas,
      medicamentosHabituales:
        fichaMedica.medicamentos_habituales,

      dueno: fichaMedica.mascota?.usuario
        ? {
            id: fichaMedica.mascota.usuario.usuario_id,
            nombre: fichaMedica.mascota.usuario.nombre,
            apellido: fichaMedica.mascota.usuario.apellido,
            email: fichaMedica.mascota.usuario.email
          }
        : null,

      createdAt: fichaMedica.created_at,
      updatedAt: fichaMedica.updated_at
    }

    return res.status(200).json({
      success: true,
      data
    })
  } catch (error) {
    console.error('Error en obtenerFichaMedica:', error)

    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    })
  }
}

export const actualizarFichaMedica = async (req, res) => {
  try {
    const { mascotaId } = req.params

    const {
      colorPelaje,
      microchip,
      enfermedadesCronicas,
      cirugiasPrevias,
      medicamentosHabituales
    } = req.body

    if (!isValidUUID(mascotaId)) {
      return res.status(400).json({
        message: 'El id de la mascota no es válido'
      })
    }

    // Confirmamos que la mascota exista
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

    const datosFicha = {}

    if (colorPelaje !== undefined) {
      datosFicha.color_pelaje =
        typeof colorPelaje === 'string'
          ? colorPelaje.trim()
          : colorPelaje
    }

    if (microchip !== undefined) {
      datosFicha.microchip =
        typeof microchip === 'string'
          ? microchip.trim()
          : microchip
    }

    if (enfermedadesCronicas !== undefined) {
      datosFicha.enfermedades_cronicas =
        typeof enfermedadesCronicas === 'string'
          ? enfermedadesCronicas.trim()
          : enfermedadesCronicas
    }

    if (cirugiasPrevias !== undefined) {
      datosFicha.cirugias_previas =
        typeof cirugiasPrevias === 'string'
          ? cirugiasPrevias.trim()
          : cirugiasPrevias
    }

    if (medicamentosHabituales !== undefined) {
      datosFicha.medicamentos_habituales =
        typeof medicamentosHabituales === 'string'
          ? medicamentosHabituales.trim()
          : medicamentosHabituales
    }

    if (Object.keys(datosFicha).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No se enviaron campos para actualizar'
      })
    }

    const fichaMedica = await prisma.ficha_medica.upsert({
      where: {
        mascota_id: mascotaId
      },

      update: {
        ...datosFicha,
        updated_at: new Date()
      },

      create: {
        mascota_id: mascotaId,
        ...datosFicha
      }
    })

    const data = {
      id: fichaMedica.ficha_medica_id,
      mascotaId: fichaMedica.mascota_id,
      colorPelaje: fichaMedica.color_pelaje,
      microchip: fichaMedica.microchip,
      enfermedadesCronicas:
        fichaMedica.enfermedades_cronicas,
      cirugiasPrevias:
        fichaMedica.cirugias_previas,
      medicamentosHabituales:
        fichaMedica.medicamentos_habituales,
      createdAt: fichaMedica.created_at,
      updatedAt: fichaMedica.updated_at
    }

    return res.status(200).json({
      success: true,
      data
    })
  } catch (error) {
    console.error('Error en actualizarFichaMedica:', error)

    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    })
  }
}