import prisma from '../../prisma/client.js'

const formatearHora = (hora) => {
  if (!hora) return null
  return hora.toISOString().slice(11, 16)
}

const isValidUUID = (id) => {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)
}


export const obtenerHistorialClinico = async (req, res) => {
  try {
    const mascotaId = req.params.mascotaId || req.params.id

    const where = {
      mascota_id: mascotaId
    }

    // Si accede una veterinaria, solo puede ver las consultas
    // realizadas por esa veterinaria.
    if (req.historialAccess?.rol === 'veterinaria') {
      where.veterinaria_id = req.historialAccess.veterinariaId
    }

    const consultas = await prisma.consulta.findMany({
      where,
      select: {
        consulta_id: true,
        mascota_id: true,
        profesional_id: true,
        veterinaria_id: true,
        turno_id: true,
        fecha: true,
        hora: true,
        motivo_consulta: true,
        anotaciones: true,
        monto: true,
        url_pdf: true,
        created_at: true,
        updated_at: true,

        categoria_servicio: {
          select: {
            categoria_servicio_id: true,
            nombre: true
          }
        },

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
      },

      orderBy: [
        {
          fecha: 'desc'
        },
        {
          hora: 'desc'
        }
      ]
    })

    const data = consultas.map((consulta) => ({
      id: consulta.consulta_id,

      mascotaId: consulta.mascota_id,

      profesionalId: consulta.profesional_id,
      profesionalNombre: consulta.profesional
        ? `${consulta.profesional.nombre} ${consulta.profesional.apellido}`.trim()
        : null,

      veterinariaId: consulta.veterinaria
        ? {
            id: consulta.veterinaria.veterinaria_id,
            nombre: consulta.veterinaria.nombre
          }
        : null,

      turnoId: consulta.turno_id,

      fecha: consulta.fecha,
      hora: formatearHora(consulta.hora),

      categoriaServicio:
        consulta.categoria_servicio?.nombre || null,

      categoriaServicioId:
        consulta.categoria_servicio?.categoria_servicio_id || null,

      motivoConsulta: consulta.motivo_consulta,
      anotaciones: consulta.anotaciones,

      monto:
        consulta.monto !== null
          ? Number(consulta.monto)
          : 0,

      urlPdf: consulta.url_pdf,

      createdAt: consulta.created_at,
      updatedAt: consulta.updated_at
    }))

    return res.status(200).json({
      success: true,
      data
    })
  } catch (error) {
    console.error(
      'Error en GET /historial/:mascotaId:',
      error
    )

    return res.status(500).json({
      message: 'Error al obtener el historial clínico'
    })
  }
}
export const obtenerEntradaHistorialClinico = async (req, res) => {
  try {
    const entrada = req.entradaHistorial

    const data = {
      id: entrada.consulta_id,
      mascotaId: entrada.mascota_id,
      profesionalId: entrada.profesional_id,
      veterinariaId: entrada.veterinaria_id,
      turnoId: entrada.turno_id,

      fecha: entrada.fecha,
      hora: formatearHora(entrada.hora),

      categoriaServicioId: entrada.categoria_servicio_id,

      motivoConsulta: entrada.motivo_consulta,
      anotaciones: entrada.anotaciones,

      monto:
        entrada.monto !== null
          ? Number(entrada.monto)
          : 0,

      urlPdf: entrada.url_pdf,

      createdAt: entrada.created_at,
      updatedAt: entrada.updated_at
    }

    return res.status(200).json({
      success: true,
      data
    })
  } catch (error) {
    console.error(
      'Error en GET /historial/entrada/:id:',
      error
    )

    return res.status(500).json({
      message: 'Error al obtener la entrada del historial clínico'
    })
  }
}


// Devuelve los turnos de esta mascota, con ESTA veterinaria (la del usuario
// logueado), que están en condiciones de registrar una consulta:
//   - estado 'confirmado' : un turno tiene que estar
//     confirmado para poder registrar la consulta a partir de él
//   - todavía no tienen un HistorialClinico creado con ese turnoId, evita que se haga mas de un registro de consulta para un mismo turno 

export const obtenerTurnosPendientesRegistro = async (req, res) => {
  try {
    const { mascotaId } = req.params

    if (!isValidUUID(mascotaId)) {
      return res.status(400).json({
        message: 'La mascota es inválida'
      })
    }

    // Buscar la veterinaria asociada al usuario logueado
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
        message: 'No se encontró una veterinaria asociada a este usuario'
      })
    }

    const turnos = await prisma.turno.findMany({
      where: {
        mascota_id: mascotaId,
        veterinaria_id: veterinaria.veterinaria_id,

        // Solo turnos confirmados
        estado_turno: {
          is: {
            nombre: {
              equals: 'confirmado',
              mode: 'insensitive'
            }
          }
        },

        // No debe existir una consulta para ese turno
        consulta: {
          is: null
        }
      },

      select: {
        turno_id: true,
        fecha: true,
        hora_inicio: true,
        motivo: true,

        estado_turno: {
          select: {
            nombre: true
          }
        },

        profesional: {
          select: {
            profesional_id: true,
            nombre: true,
            apellido: true
          }
        }
      },

      orderBy: [
        {
          fecha: 'desc'
        },
        {
          hora_inicio: 'desc'
        }
      ]
    })

    const data = turnos.map((turno) => ({
      id: turno.turno_id,
      fecha: turno.fecha,
      hora: formatearHora(turno.hora_inicio),
      estado: turno.estado_turno?.nombre || null,
      motivo: turno.motivo || null,

      profesional: {
        id: turno.profesional?.profesional_id || null,
        nombre: turno.profesional
          ? `${turno.profesional.nombre} ${turno.profesional.apellido}`.trim()
          : 'Sin asignar'
      }
    }))

    return res.status(200).json({
      success: true,
      data
    })
  } catch (error) {
    console.error(
      'Error en GET /historial-clinico/turnos-pendientes/:mascotaId:',
      error
    )

    return res.status(500).json({
      message: 'Error interno del servidor'
    })
  }
}

export const crearHistorialClinico = async (req, res) => {
  try {
    const {
      mascotaId,
      profesionalId,
      turnoId,
      fecha,
      hora,
      categoriaServicio,
      motivoConsulta,
      anotaciones,
      monto,
      urlPdf
    } = req.body

    // Validaciones de IDs
    if (!mascotaId || !isValidUUID(mascotaId)) {
      return res.status(400).json({
        message: 'La mascota es inválida'
      })
    }

    if (!profesionalId || !isValidUUID(profesionalId)) {
      return res.status(400).json({
        message: 'El profesional es inválido'
      })
    }

    if (!turnoId || !isValidUUID(turnoId)) {
      return res.status(400).json({
        message: 'El turno es requerido'
      })
    }

    // Fecha
    if (!fecha) {
      return res.status(400).json({
        message: 'La fecha del turno es requerida'
      })
    }

    const fechaValida = new Date(fecha)

    if (Number.isNaN(fechaValida.getTime())) {
      return res.status(400).json({
        message: 'La fecha ingresada no es válida'
      })
    }

    // Hora
    if (!hora || typeof hora !== 'string') {
      return res.status(400).json({
        message: 'La hora del turno es requerida'
      })
    }

    const formatoHoraValido = /^([01]\d|2[0-3]):([0-5]\d)$/

    if (!formatoHoraValido.test(hora.trim())) {
      return res.status(400).json({
        message: 'La hora debe tener formato HH:MM'
      })
    }

    // Categoría
    if (!categoriaServicio) {
      return res.status(400).json({
        message: 'La categoría del servicio es requerida'
      })
    }

    // Textos
    if (
      !motivoConsulta ||
      typeof motivoConsulta !== 'string' ||
      !motivoConsulta.trim()
    ) {
      return res.status(400).json({
        message: 'El motivo del turno es requerido'
      })
    }

    if (
      !anotaciones ||
      typeof anotaciones !== 'string' ||
      !anotaciones.trim()
    ) {
      return res.status(400).json({
        message: 'Las anotaciones médicas son requeridas'
      })
    }

    // Monto
    if (
      monto === undefined ||
      monto === null ||
      typeof monto !== 'number' ||
      Number.isNaN(monto) ||
      monto < 0
    ) {
      return res.status(400).json({
        message:
          'El monto es requerido y debe ser un número mayor o igual a 0'
      })
    }

    // URL PDF
    if (urlPdf) {
      try {
        new URL(urlPdf)
      } catch {
        return res.status(400).json({
          message: 'La URL del PDF no es válida'
        })
      }
    }

    // Mascota
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
        message: 'Mascota no encontrada'
      })
    }

    // Veterinaria del usuario logueado
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
        message:
          'No se encontró una veterinaria asociada a este usuario'
      })
    }

    // Profesional
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
        message:
          'El profesional seleccionado no pertenece a esta veterinaria'
      })
    }

    // Categoría de servicio
    const categoria = await prisma.categoria_servicio.findFirst({
      where: {
        nombre: {
          equals: categoriaServicio,
          mode: 'insensitive'
        }
      },
      select: {
        categoria_servicio_id: true
      }
    })

    if (!categoria) {
      return res.status(400).json({
        message: 'La categoría de servicio no es válida'
      })
    }

    // Estado "atendido"
    const estadoAtendido = await prisma.estado_turno.findFirst({
      where: {
        nombre: {
          equals: 'atendido',
          mode: 'insensitive'
        }
      },
      select: {
        estado_turno_id: true
      }
    })

    if (!estadoAtendido) {
      return res.status(500).json({
        message:
          'No se encontró el estado atendido configurado en la base de datos'
      })
    }

    // Turno: fuente de verdad de la consulta
    const turno = await prisma.turno.findUnique({
      where: {
        turno_id: turnoId
      },
      select: {
        turno_id: true,
        mascota_id: true,
        veterinaria_id: true,
        profesional_id: true,

        estado_turno: {
          select: {
            nombre: true
          }
        },

        consulta: {
          select: {
            consulta_id: true
          }
        }
      }
    })

    if (
      !turno ||
      turno.veterinaria_id !== veterinaria.veterinaria_id
    ) {
      return res.status(404).json({
        message:
          'El turno no existe o no pertenece a esta veterinaria'
      })
    }

    if (turno.mascota_id !== mascotaId) {
      return res.status(400).json({
        message: 'El turno no corresponde a esta mascota'
      })
    }

    if (
      turno.estado_turno?.nombre?.toLowerCase() !== 'confirmado'
    ) {
      return res.status(400).json({
        message:
          'Solo se puede registrar una consulta a partir de un turno confirmado'
      })
    }

    if (turno.profesional_id !== profesionalId) {
      return res.status(400).json({
        message:
          'El profesional no coincide con el profesional asignado al turno'
      })
    }

    if (turno.consulta) {
      return res.status(409).json({
        message:
          'Ya existe una consulta registrada para este turno'
      })
    }

    // Prisma representa TIME como DateTime
    const horaBD = new Date(
      `1970-01-01T${hora.trim()}:00.000Z`
    )

    // Crear consulta + actualizar turno + crear ficha si falta
    const nuevaConsulta = await prisma.$transaction(
      async (tx) => {
        const consulta = await tx.consulta.create({
          data: {
            mascota_id: mascotaId,
            profesional_id: profesionalId,
            veterinaria_id: veterinaria.veterinaria_id,
            turno_id: turnoId,

            fecha: fechaValida,
            hora: horaBD,

            categoria_servicio_id:
              categoria.categoria_servicio_id,

            motivo_consulta: motivoConsulta.trim(),
            anotaciones: anotaciones.trim(),

            monto,
            url_pdf: urlPdf?.trim() || null
          },

          include: {
            categoria_servicio: true,
            profesional: true,
            veterinaria: true
          }
        })

        await tx.turno.update({
          where: {
            turno_id: turnoId
          },
          data: {
            estado_turno_id:
              estadoAtendido.estado_turno_id
          }
        })

        await tx.ficha_medica.upsert({
          where: {
            mascota_id: mascotaId
          },
          update: {},
          create: {
            mascota_id: mascotaId
          }
        })

        return consulta
      }
    )

    return res.status(201).json({
      success: true,
      message: 'Historial clínico creado correctamente',
      data: {
        id: nuevaConsulta.consulta_id,
        mascotaId: nuevaConsulta.mascota_id,
        profesionalId: nuevaConsulta.profesional_id,
        veterinariaId: nuevaConsulta.veterinaria_id,
        turnoId: nuevaConsulta.turno_id,

        fecha: nuevaConsulta.fecha,
        hora: formatearHora(nuevaConsulta.hora),

        categoriaServicio:
          nuevaConsulta.categoria_servicio.nombre,

        motivoConsulta: nuevaConsulta.motivo_consulta,
        anotaciones: nuevaConsulta.anotaciones,

        monto:
          nuevaConsulta.monto !== null
            ? Number(nuevaConsulta.monto)
            : 0,

        urlPdf: nuevaConsulta.url_pdf
      }
    })
  } catch (error) {
    // turno_id es UNIQUE en consulta
    if (error.code === 'P2002') {
      return res.status(409).json({
        message:
          'Ya existe una consulta registrada para este turno'
      })
    }

    console.error(
      'Error al crear historial clínico:',
      error
    )

    return res.status(500).json({
      message: 'Error interno del servidor'
    })
  }
}

export const actualizarHistorialClinico = async (req, res) => {
  try {
    const { id } = req.params

    const {
      fecha,
      hora,
      categoriaServicio,
      motivoConsulta,
      anotaciones,
      monto,
      urlPdf
    } = req.body

    // Validar id antes de consultar la BD
    if (!isValidUUID(id)) {
      return res.status(400).json({
        success: false,
        message: 'El id de la consulta no es válido'
      })
    }

    const dataActualizar = {}

    // Fecha
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

    // Hora
    if (hora !== undefined) {
      if (
        typeof hora !== 'string' ||
        !hora.trim()
      ) {
        return res.status(400).json({
          success: false,
          message: 'La hora no puede estar vacía'
        })
      }

      const formatoHora = /^([01]\d|2[0-3]):([0-5]\d)$/

      if (!formatoHora.test(hora.trim())) {
        return res.status(400).json({
          success: false,
          message: 'La hora debe tener formato HH:MM'
        })
      }

      dataActualizar.hora = new Date(
        `1970-01-01T${hora.trim()}:00.000Z`
      )
    }

    // Motivo
    if (motivoConsulta !== undefined) {
      if (
        typeof motivoConsulta !== 'string' ||
        !motivoConsulta.trim()
      ) {
        return res.status(400).json({
          success: false,
          message: 'El motivo de consulta no puede estar vacío'
        })
      }

      dataActualizar.motivo_consulta =
        motivoConsulta.trim()
    }

    // Anotaciones
    if (anotaciones !== undefined) {
      if (
        typeof anotaciones !== 'string' ||
        !anotaciones.trim()
      ) {
        return res.status(400).json({
          success: false,
          message: 'Las anotaciones no pueden estar vacías'
        })
      }

      dataActualizar.anotaciones = anotaciones.trim()
    }

    // Monto
    if (monto !== undefined) {
      if (
        typeof monto !== 'number' ||
        Number.isNaN(monto) ||
        monto < 0
      ) {
        return res.status(400).json({
          success: false,
          message: 'El monto debe ser un número mayor o igual a 0'
        })
      }

      dataActualizar.monto = monto
    }

    // URL PDF
    if (urlPdf !== undefined) {
      if (urlPdf && typeof urlPdf !== 'string') {
        return res.status(400).json({
          success: false,
          message: 'La URL del PDF no es válida'
        })
      }

      if (urlPdf?.trim()) {
        try {
          new URL(urlPdf.trim())
        } catch {
          return res.status(400).json({
            success: false,
            message: 'La URL del PDF no es válida'
          })
        }

        dataActualizar.url_pdf = urlPdf.trim()
      } else {
        dataActualizar.url_pdf = null
      }
    }

    // Consulta existente
    const consulta = await prisma.consulta.findUnique({
      where: {
        consulta_id: id
      },
      select: {
        consulta_id: true,
        veterinaria_id: true
      }
    })

    if (!consulta) {
      return res.status(404).json({
        success: false,
        message: 'Consulta no encontrada'
      })
    }

    // Veterinaria del usuario logueado
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
      consulta.veterinaria_id !== veterinaria.veterinaria_id
    ) {
      return res.status(403).json({
        success: false,
        message: 'Solo podés editar consultas de tu veterinaria'
      })
    }

    // Si cambió la categoría, buscar su ID real
    if (categoriaServicio !== undefined) {
      if (
        typeof categoriaServicio !== 'string' ||
        !categoriaServicio.trim()
      ) {
        return res.status(400).json({
          success: false,
          message: 'Categoría de servicio no válida'
        })
      }

      const categoria =
        await prisma.categoria_servicio.findFirst({
          where: {
            nombre: {
              equals: categoriaServicio.trim(),
              mode: 'insensitive'
            }
          },
          select: {
            categoria_servicio_id: true
          }
        })

      if (!categoria) {
        return res.status(400).json({
          success: false,
          message: 'Categoría de servicio no válida'
        })
      }

      dataActualizar.categoria_servicio_id =
        categoria.categoria_servicio_id
    }

    if (Object.keys(dataActualizar).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No se enviaron campos para actualizar'
      })
    }

    // updated_at no tiene @updatedAt en schema.prisma,
    // por eso lo actualizamos manualmente.
    dataActualizar.updated_at = new Date()

    const consultaActualizada =
      await prisma.consulta.update({
        where: {
          consulta_id: id
        },

        data: dataActualizar,

        include: {
          categoria_servicio: true,
          profesional: true,
          veterinaria: true
        }
      })

    return res.status(200).json({
      success: true,
      data: {
        id: consultaActualizada.consulta_id,
        mascotaId: consultaActualizada.mascota_id,
        profesionalId: consultaActualizada.profesional_id,
        profesionalNombre:
          `${consultaActualizada.profesional.nombre} ${consultaActualizada.profesional.apellido}`.trim(),

        veterinariaId: consultaActualizada.veterinaria_id,
        veterinariaNombre:
          consultaActualizada.veterinaria.nombre,

        turnoId: consultaActualizada.turno_id,

        fecha: consultaActualizada.fecha,
        hora: formatearHora(consultaActualizada.hora),

        categoriaServicio:
          consultaActualizada.categoria_servicio.nombre,

        motivoConsulta:
          consultaActualizada.motivo_consulta,

        anotaciones:
          consultaActualizada.anotaciones,

        monto:
          consultaActualizada.monto !== null
            ? Number(consultaActualizada.monto)
            : 0,

        urlPdf: consultaActualizada.url_pdf,

        createdAt: consultaActualizada.created_at,
        updatedAt: consultaActualizada.updated_at
      }
    })
  } catch (error) {
    console.error(
      'Error en actualizarHistorialClinico:',
      error
    )

    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    })
  }
}

export const obtenerHistorialesPorTutor = async (req, res) => {
  try {
    const consultas = await prisma.consulta.findMany({
      where: {
        mascota: {
          is: {
            dueno_id: req.user.id
          }
        }
      },

      select: {
        consulta_id: true,
        mascota_id: true,
        profesional_id: true,
        veterinaria_id: true,
        turno_id: true,

        fecha: true,
        hora: true,

        motivo_consulta: true,
        anotaciones: true,
        monto: true,
        url_pdf: true,

        created_at: true,
        updated_at: true,

        categoria_servicio: {
          select: {
            categoria_servicio_id: true,
            nombre: true
          }
        },

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
        },

        mascota: {
          select: {
            mascota_id: true,
            nombre: true,

            raza: {
              select: {
                nombre: true,

                especie: {
                  select: {
                    nombre: true
                  }
                }
              }
            }
          }
        }
      },

      orderBy: [
        {
          fecha: 'desc'
        },
        {
          hora: 'desc'
        }
      ]
    })

    const historiales = consultas.map((consulta) => ({
      id: consulta.consulta_id,

      mascotaId: consulta.mascota_id,
      mascota: {
        id: consulta.mascota.mascota_id,
        nombre: consulta.mascota.nombre,
        raza: consulta.mascota.raza?.nombre || null,
        especie:
          consulta.mascota.raza?.especie?.nombre || null
      },

      profesionalId: consulta.profesional_id,
      profesionalNombre: consulta.profesional
        ? `${consulta.profesional.nombre} ${consulta.profesional.apellido}`.trim()
        : null,

      veterinariaId: consulta.veterinaria_id,
      veterinaria: {
        id: consulta.veterinaria.veterinaria_id,
        nombre: consulta.veterinaria.nombre
      },

      turnoId: consulta.turno_id,

      fecha: consulta.fecha,
      hora: formatearHora(consulta.hora),

      categoriaServicio:
        consulta.categoria_servicio?.nombre || null,

      categoriaServicioId:
        consulta.categoria_servicio?.categoria_servicio_id || null,

      motivoConsulta: consulta.motivo_consulta,
      anotaciones: consulta.anotaciones,

      monto:
        consulta.monto !== null
          ? Number(consulta.monto)
          : 0,

      urlPdf: consulta.url_pdf,

      createdAt: consulta.created_at,
      updatedAt: consulta.updated_at
    }))

    return res.status(200).json({
      success: true,
      data: {
        historiales
      }
    })
  } catch (error) {
    console.error(
      'Error en obtenerHistorialesPorTutor:',
      error
    )

    return res.status(500).json({
      message: 'Error al obtener los historiales'
    })
  }
}