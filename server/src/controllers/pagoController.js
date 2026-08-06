import { Preference } from 'mercadopago';

import client from '../config/mercadopago.js';
import Turno from '../models/Turno.js';
import Pago from '../models/Pago.js';

export const crearPreferenciaPago = async (req, res) => {
  let pagoCreado = null;

  try {
    const { turnoId } = req.body;

    if (!turnoId) {
      return res.status(400).json({
        message: 'El turnoId es requerido'
      });
    }

    const turno = await Turno.findById(turnoId)
      .populate('mascotaId', 'nombre especie')
      .populate('veterinariaId', 'nombre servicios');

    if (!turno) {
      return res.status(404).json({
        message: 'Turno no encontrado'
      });
    }

    if (turno.usuarioId.toString() !== req.user.id) {
      return res.status(403).json({
        message: 'No tenés permisos para pagar este turno'
      });
    }

    if (['cancelado', 'atendido'].includes(turno.estado)) {
      return res.status(400).json({
        message: 'Este turno no se encuentra disponible para pago'
      });
    }

    if (turno.pagoId) {
      return res.status(400).json({
        message: 'Este turno ya tiene un pago asociado'
      });
    }

    const veterinaria = turno.veterinariaId;

    if (!veterinaria) {
      return res.status(404).json({
        message: 'La veterinaria asociada al turno no existe'
      });
    }

    const servicio = veterinaria.servicios.id(turno.servicioId);

    if (!servicio) {
      return res.status(404).json({
        message: 'El servicio asociado al turno no existe'
      });
    }

    const monto = Number(turno.montoServicio);

    if (!Number.isFinite(monto) || monto <= 0) {
      return res.status(400).json({
        message: 'El monto del servicio no es válido'
      });
    }

    pagoCreado = await Pago.create({
      turnoId: turno._id,
      userId: turno.usuarioId,
      monto,
      moneda: 'ARS',
      estado: 'pendiente'
    });

    const preference = new Preference(client);

    const resultado = await preference.create({
      body: {
        items: [
          {
            id: servicio._id.toString(),
            title: `${servicio.nombre} - ${veterinaria.nombre}`,
            quantity: 1,
            unit_price: monto,
            currency_id: 'ARS'
          }
        ],

        back_urls: {
          success: `${process.env.CLIENT_URL}/pago-exitoso`,
          failure: `${process.env.CLIENT_URL}/pago-fallido`,
          pending: `${process.env.CLIENT_URL}/pago-pendiente`
        },

        notification_url:
          `${process.env.PUBLIC_BACKEND_URL}/api/pagos/webhook`,

        external_reference: turno._id.toString(),

        metadata: {
          turnoId: turno._id.toString(),
          pagoId: pagoCreado._id.toString(),
          mascotaId: turno.mascotaId._id.toString()
        },

        //auto_return: 'approved'
      }
    });

    turno.pagoId = pagoCreado._id;
    await turno.save();

    return res.status(201).json({
      success: true,
      data: {
        init_point: resultado.init_point
      }
    });

  } catch (error) {
    if (pagoCreado?._id) {
      await Pago.findByIdAndDelete(pagoCreado._id).catch((rollbackError) => {
        console.error(
          'No se pudo eliminar el pago pendiente luego del error:',
          rollbackError
        );
      });
    }

    if (error.name === 'CastError') {
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