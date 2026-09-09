import prisma from '../../prisma/client.js';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const esUuidValido = (id) => UUID_REGEX.test(id || '');

export const mapearFichaMedicaLegible = (ficha) => {
  if (!ficha) return null;
  return {
    _id: ficha.ficha_medica_id,
    mascotaId: ficha.mascota_id,
    colorPelaje: ficha.color_pelaje,
    microchip: ficha.microchip,
    enfermedadesCronicas: ficha.enfermedades_cronicas,
    cirugiasPrevias: ficha.cirugias_previas,
    medicamentosHabituales: ficha.medicamentos_habituales
  };
};

export const obtenerFichaMedica = async (req, res) => {
  try {
    const { mascotaId } = req.params;
    if (!esUuidValido(mascotaId)) {
      return res.status(400).json({ success: false, message: 'El id de la mascota no es válido' });
    }

    const fichaMedica = await prisma.ficha_medica.findUnique({
      where: { mascota_id: mascotaId }
    });

    if (!fichaMedica) {
      return res.status(200).json({
        success: true,
        data: null,
        message: 'Esta mascota todavía no tiene ficha médica'
      });
    }

    return res.status(200).json({ success: true, data: mapearFichaMedicaLegible(fichaMedica) });
  } catch (error) {
    console.error('Error en obtenerFichaMedica:', error);
    return res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
};

export const actualizarFichaMedica = async (req, res) => {
  try {
    const { mascotaId } = req.params;
    if (!esUuidValido(mascotaId)) {
      return res.status(400).json({ success: false, message: 'El id de la mascota no es válido' });
    }

    const {
      colorPelaje, microchip, enfermedadesCronicas, cirugiasPrevias, medicamentosHabituales
    } = req.body;

    const data = {};
    if (colorPelaje !== undefined) data.color_pelaje = colorPelaje?.trim();
    if (microchip !== undefined) data.microchip = microchip?.trim();
    if (enfermedadesCronicas !== undefined) data.enfermedades_cronicas = enfermedadesCronicas?.trim();
    if (cirugiasPrevias !== undefined) data.cirugias_previas = cirugiasPrevias?.trim();
    if (medicamentosHabituales !== undefined) data.medicamentos_habituales = medicamentosHabituales?.trim();

    const fichaMedica = await prisma.ficha_medica.upsert({
      where: { mascota_id: mascotaId },
      update: data,
      create: { mascota_id: mascotaId, ...data }
    });

    return res.status(200).json({ success: true, data: mapearFichaMedicaLegible(fichaMedica) });
  } catch (error) {
    if (error.code === 'P2003') {
      return res.status(404).json({ success: false, message: 'Mascota no encontrada' });
    }
    console.error('Error en actualizarFichaMedica:', error);
    return res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
};