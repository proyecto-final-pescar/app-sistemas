import crypto from 'node:crypto';

const obtenerFirmaV1 = (xSignature) => {
  const partes = xSignature.split(',').map((parte) => parte.trim());
  const firma = partes.find((parte) => parte.startsWith('v1='));

  return firma?.slice(3);
};

const firmaEsValida = (recibida, esperada) => {
  const firmaRecibida = Buffer.from(recibida, 'hex');
  const firmaEsperada = Buffer.from(esperada, 'hex');

  return firmaRecibida.length === firmaEsperada.length
    && crypto.timingSafeEqual(firmaRecibida, firmaEsperada);
};

const validarFirmaWebhookMercadoPago = (req, res, next) => {
  const secret = process.env.MP_WEBHOOK_SECRET?.trim();
  if (!secret) {
    return res.status(503).json({ message: 'Webhook de Mercado Pago no configurado' });
  }

  const dataId = req.query?.['data.id'];
  const xSignature = req.get('x-signature');
  const xRequestId = req.get('x-request-id');
  const firmaRecibida = xSignature && obtenerFirmaV1(xSignature);

  if (!dataId || !xRequestId || !firmaRecibida) {
    return res.status(401).json({ message: 'Firma de webhook inválida' });
  }

  const timestamp = xSignature.split(',')
    .map((parte) => parte.trim())
    .find((parte) => parte.startsWith('ts='))
    ?.slice(3);

  if (!timestamp) {
    return res.status(401).json({ message: 'Firma de webhook inválida' });
  }

  const timestampSegundos = Number(timestamp);
  const ahoraSegundos = Math.floor(Date.now() / 1000);
  const antiguedadSegundos = ahoraSegundos - timestampSegundos;
  if (!Number.isInteger(timestampSegundos)
    || antiguedadSegundos < 0
    || antiguedadSegundos > 300) {
    return res.status(401).json({ message: 'Firma de webhook inválida' });
  }

  const manifest = `id:${dataId};request-id:${xRequestId};ts:${timestamp};`;
  const firmaEsperada = crypto
    .createHmac('sha256', secret)
    .update(manifest)
    .digest('hex');

  if (!firmaEsValida(firmaRecibida, firmaEsperada)) {
    return res.status(401).json({ message: 'Firma de webhook inválida' });
  }

  return next();
};

export default validarFirmaWebhookMercadoPago;
