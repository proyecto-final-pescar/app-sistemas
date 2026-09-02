import { Preference } from 'mercadopago';

import client from '../config/mercadopago.js';
import prisma from '../../prisma/client.js';

export const crearPreferenciaPago = async (req, res) => {
  let pagoCreado = null;

  try {
    const { turnoId } = req.body;

    if (!turnoId) {
      return res.status(400).json({
        message: 'El turnoId es requerido'
      });
    }
const turno = await prisma.turno.findUnique({
  where: {
    turno_id: turnoId
  },
  include: {
    mascota: true,
    veterinaria: true,
    servicio: true,
    estado_turno: true,
    pago: {
      orderBy: {
        created_at: 'desc'
      },
      include: {
        estado_pago: true
      }
    }
  }
});

    if (!turno) {
      return res.status(404).json({
        message: 'Turno no encontrado'
      });
    }

   if (!turno.mascota || turno.mascota.dueno_id !== req.user.id) {
  return res.status(403).json({
    message: 'No tenés permisos para pagar este turno'
  });
}

if (['cancelado', 'atendido'].includes(turno.estado_turno.nombre)) {
  return res.status(400).json({
    message: 'Este turno no se encuentra disponible para pago'
  });
}

const pagoExistente = turno.pago[0];

const bloqueaNuevoPago =
  pagoExistente &&
  !['rechazado', 'cancelado'].includes(
    pagoExistente.estado_pago?.nombre
  );

if (bloqueaNuevoPago) {
  return res.status(400).json({
    message: 'Este turno ya tiene un pago asociado'
  });
}

const veterinaria = turno.veterinaria;
const servicio = turno.servicio;

if (!veterinaria) {
  return res.status(404).json({
    message: 'La veterinaria asociada al turno no existe'
  });
}

if (!servicio) {
  return res.status(404).json({
    message: 'El servicio asociado al turno no existe'
  });
}

const monto = Number(turno.monto_servicio);

    if (!Number.isFinite(monto) || monto <= 0) {
      return res.status(400).json({
        message: 'El monto del servicio no es válido'
      });
    }

   pagoCreado = await prisma.pago.create({
    data: {
    turno_id: turno.turno_id,
    monto,
    estado_pago_id: 'PEN'
  }
});

    const preference = new Preference(client);

    const resultado = await preference.create({
      body: {
       items: [
          {
            id: servicio.servicio_id,
            title: `${servicio.nombre} - ${veterinaria.nombre}`,
            quantity: 1,
            unit_price: monto,
            currency_id: 'ARS'
          }
        ],

        back_urls: {
          success: `${process.env.CLIENT_URL}/pago-exitoso?turnoId=${turno.turno_id}`,
          failure: `${process.env.CLIENT_URL}/pago-fallido?turnoId=${turno.turno_id}`,
          pending: `${process.env.CLIENT_URL}/pago-pendiente?turnoId=${turno.turno_id}`
        },

        notification_url:
          `${process.env.PUBLIC_BACKEND_URL}/api/pagos/webhook`,

        external_reference: turno.turno_id,

        metadata: {
          turnoId: turno.turno_id,
          pagoId: pagoCreado.pago_id,
          mascotaId: turno.mascota_id
        },
        // Comentar para probar en local y descomentar antes de mergear
        auto_return: 'approved'
      }
    });

    return res.status(201).json({
      success: true,
      data: {
        init_point: resultado.init_point
      }
    });

  } catch (error) {
    if (pagoCreado?.pago_id) {
  await prisma.pago.delete({
    where: {
      pago_id: pagoCreado.pago_id
    }
  }).catch((rollbackError) => {
    console.error(
      'No se pudo eliminar el pago pendiente luego del error:',
      rollbackError
    );
  });
}
    if (error.code === 'P2023') {
      return res.status(400).json({
        message: 'El turnoId no es válido'
      });
    }

    console.error('Error al crear la preferencia de pago:', error);

    return res.status(500).json({
      message: 'No se pudo crear la preferencia de pago'
    });
  }
};

export const obtenerEstadoPago = async (req, res) => {
  try {
    const { turnoId } = req.params;

   const pago = await prisma.pago.findFirst({
    where: {
    turno_id: turnoId
  },
  orderBy: {
    created_at: 'desc'
  },
  include: {
    estado_pago: true,
    turno: {
      include: {
        mascota: true
      }
    }
  }
});

    if (!pago) {
      return res.status(404).json({ message: 'No se encontró un pago para este turno' });
    }

   if (!pago.turno.mascota || pago.turno.mascota.dueno_id !== req.user.id) {
  return res.status(403).json({
    message: 'No tenés permisos para ver este pago'
  });
}
    return res.status(200).json({
      success: true,
      data: {
       estado: pago.estado_pago.nombre,
       monto: Number(pago.monto),
       fechaAprobacion: pago.fecha_aprobacion
     }
    });
    
} catch (error) {

  if (error.code === 'P2023') {
  return res.status(400).json({
    message: 'El turnoId no es válido'
  });
}

  console.error('Error en obtenerEstadoPago:', error);
  return res.status(500).json({ message: 'Error interno del servidor' });
}
};