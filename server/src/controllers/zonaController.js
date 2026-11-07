import prisma from '../../prisma/client.js'

// GET /zonas: catalogo de zonas para selects 
export const listarZonas = async (req, res) => {
  try {
    const zonas = await prisma.zona.findMany({
      orderBy: { nombre: 'asc' }
    })

    return res.status(200).json({
      success: true,
      data: zonas.map((z) => ({ id: z.zona_id, nombre: z.nombre }))
    })
  } catch (error) {
    console.error('Error en listarZonas:', error)
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor al listar zonas'
    })
  }
}