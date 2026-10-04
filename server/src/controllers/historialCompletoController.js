import prisma from '../../prisma/client.js'

const isValidUUID = (id) => {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)
}

const formatearHora = (hora) => {
  if (!hora) return null
  return hora.toISOString().slice(11, 16)
}

export const obtenerHistorialCompleto = async (req, res) => {
  try {
    const { mascotaId } = req.params

    if (!mascotaId || !isValidUUID(mascotaId)) {
      return res.status(400).json({
        success: false,
        message: 'El id de la mascota no es válido'
      })
    }

    const pageVacunas = Math.max(1, parseInt(req.query.pageVacunas, 10) || 1)
    const limitVacunas = Math.min(50, Math.max(1, parseInt(req.query.limitVacunas, 10) || 10))
    const skipVacunas = (pageVacunas - 1) * limitVacunas

    const pageEstudios = Math.max(1, parseInt(req.query.pageEstudios, 10) || 1)
    const limitEstudios = Math.min(50, Math.max(1, parseInt(req.query.limitEstudios, 10) || 10))
    const skipEstudios = (pageEstudios - 1) * limitEstudios

    const [mascota, totalVacunas, totalEstudios] = await Promise.all([
      prisma.mascota.findUnique({
        where: {
          mascota_id: mascotaId
        },
        include: {
          usuario: {
            select: {
              usuario_id: true,
              nombre: true,
              apellido: true,
              email: true,
              telefono: true
            }
          },
          raza: {
            include: {
              especie: true
            }
          },
          sexo_mascota: true,
          ficha_medica: true,
          consulta: {
            include: {
              veterinaria: {
                select: {
                  veterinaria_id: true,
                  nombre: true,
                  direccion: true
                }
              },
              profesional: {
                select: {
                  profesional_id: true,
                  nombre: true,
                  apellido: true
                }
              },
              categoria_servicio: {
                select: {
                  categoria_servicio_id: true,
                  nombre: true
                }
              }
            },
            orderBy: [
              { fecha: 'desc' },
              { hora: 'desc' }
            ]
          },
          vacuna: {
            skip: skipVacunas,
            take: limitVacunas,
            orderBy: {
              fecha_aplicada: 'desc'
            },
            include: {
              veterinaria: {
                select: {
                  veterinaria_id: true,
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
            }
          },
          estudio: {
            skip: skipEstudios,
            take: limitEstudios,
            orderBy: {
              fecha: 'desc'
            },
            include: {
              veterinaria: {
                select: {
                  veterinaria_id: true,
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
            }
          }
        }
      }),

      prisma.vacuna.count({ where: { mascota_id: mascotaId } }),
      prisma.estudio.count({ where: { mascota_id: mascotaId } })
    ])

    if (!mascota) {
      return res.status(404).json({
        success: false,
        message: 'Mascota no encontrada'
      })
    }

    const fichaMedica = mascota.ficha_medica
      ? {
          id: mascota.ficha_medica.ficha_medica_id,
          mascotaId: mascota.ficha_medica.mascota_id,
          colorPelaje: mascota.ficha_medica.color_pelaje,
          microchip: mascota.ficha_medica.microchip,
          enfermedadesCronicas: mascota.ficha_medica.enfermedades_cronicas,
          cirugiasPrevias: mascota.ficha_medica.cirugias_previas,
          medicamentosHabituales: mascota.ficha_medica.medicamentos_habituales,
          createdAt: mascota.ficha_medica.created_at,
          updatedAt: mascota.ficha_medica.updated_at
        }
      : null

    const historialClinico = mascota.consulta.map((consulta) => ({
      id: consulta.consulta_id,
      mascotaId: consulta.mascota_id,
      profesionalId: consulta.profesional_id,
      profesionalNombre: consulta.profesional
        ? `${consulta.profesional.nombre} ${consulta.profesional.apellido}`.trim()
        : null,
      veterinariaId: consulta.veterinaria_id,
      veterinaria: {
        id: consulta.veterinaria?.veterinaria_id,
        nombre: consulta.veterinaria?.nombre,
        direccion: consulta.veterinaria?.direccion
      },
      turnoId: consulta.turno_id,
      fecha: consulta.fecha,
      hora: formatearHora(consulta.hora),
      categoriaServicio: consulta.categoria_servicio?.nombre || null,
      categoriaServicioId: consulta.categoria_servicio?.categoria_servicio_id || null,
      motivoConsulta: consulta.motivo_consulta,
      anotaciones: consulta.anotaciones,
      monto: consulta.monto !== null ? Number(consulta.monto) : 0,
      urlPdf: consulta.url_pdf,
      createdAt: consulta.created_at,
      updatedAt: consulta.updated_at
    }))

    const vacunas = mascota.vacuna.map((vacuna) => ({
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
    }))

    const estudios = mascota.estudio.map((estudio) => ({
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
    }))

    return res.status(200).json({
      success: true,
      data: {
        mascota: {
          id: mascota.mascota_id,
          nombre: mascota.nombre,
          especie: mascota.raza?.especie?.nombre || null,
          raza: mascota.raza?.nombre || null,
          sexo: mascota.sexo_mascota?.nombre || null,
          fechaNacimiento: mascota.fecha_nacimiento,
          foto: mascota.foto,
          esCastrado: mascota.es_castrado,
          peso: mascota.peso !== null ? Number(mascota.peso) : null,
          dueñoId: mascota.usuario
            ? {
                id: mascota.usuario.usuario_id,
                name: `${mascota.usuario.nombre} ${mascota.usuario.apellido}`.trim(),
                email: mascota.usuario.email,
                telefono: mascota.usuario.telefono
              }
            : null
        },
        fichaMedica,
        historialClinico,
        vacunas,
        estudios,
        pagination: {
          vacunas: {
            page: pageVacunas,
            hasMore: skipVacunas + vacunas.length < totalVacunas,
            total: totalVacunas
          },
          estudios: {
            page: pageEstudios,
            hasMore: skipEstudios + estudios.length < totalEstudios,
            total: totalEstudios
          }
        }
      }
    })
  } catch (error) {
    console.error('Error en obtenerHistorialCompleto:', error)
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    })
  }
}