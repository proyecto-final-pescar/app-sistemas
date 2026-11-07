import crypto from 'node:crypto';

import { MercadoPagoConfig } from 'mercadopago';

import prisma from '../../prisma/client.js';

const URL_AUTORIZACION = 'https://auth.mercadopago.com/authorization';
const URL_TOKEN = 'https://api.mercadopago.com/oauth/token';
const MARGEN_RENOVACION_MS = 5 * 60 * 1000;

const errorConfiguracion = (variable) => {
  const error = new Error(`Falta configurar ${variable}.`);
  error.code = 'MP_CONFIG_ERROR';
  return error;
};

const obtenerVariable = (nombre) => {
  const valor = process.env[nombre]?.trim();
  if (!valor) throw errorConfiguracion(nombre);
  return valor;
};

const obtenerClaveCifrado = () => {
  const secreto = obtenerVariable('MP_CREDENTIALS_ENCRYPTION_KEY');
  if (secreto.length < 32) {
    throw errorConfiguracion('MP_CREDENTIALS_ENCRYPTION_KEY (mínimo 32 caracteres)');
  }
  return crypto.scryptSync(secreto, 'mypet-mercadopago-oauth-v1', 32);
};

export const calcularExpiracionToken = (expiresIn) => {
  const segundos = Number(expiresIn);
  if (!Number.isFinite(segundos) || segundos <= 0) {
    throw new Error('Mercado Pago devolvió una expiración de token inválida.');
  }
  return new Date(Date.now() + segundos * 1000);
};

export const cifrarCredencial = (valor) => {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', obtenerClaveCifrado(), iv);
  const cifrado = Buffer.concat([cipher.update(valor, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv, tag, cifrado].map((parte) => parte.toString('base64url')).join('.');
};

export const descifrarCredencial = (valor) => {
  const partes = String(valor || '').split('.');
  if (partes.length !== 3) throw new Error('La credencial de Mercado Pago tiene un formato inválido.');
  const [iv, tag, cifrado] = partes.map((parte) => Buffer.from(parte, 'base64url'));
  const decipher = crypto.createDecipheriv('aes-256-gcm', obtenerClaveCifrado(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(cifrado), decipher.final()]).toString('utf8');
};

const solicitarToken = async (body) => {
  const respuesta = await fetch(URL_TOKEN, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(body)
  });
  const data = await respuesta.json().catch(() => ({}));
  if (!respuesta.ok) {
    const error = new Error(data.message || 'Mercado Pago rechazó la solicitud OAuth.');
    error.status = respuesta.status;
    throw error;
  }
  return data;
};

export const crearUrlAutorizacion = (state) => {
  const parametros = new URLSearchParams({
    client_id: obtenerVariable('MP_CLIENT_ID'),
    response_type: 'code',
    platform_id: 'mp',
    state,
    redirect_uri: obtenerVariable('MP_REDIRECT_URI')
  });
  return `${URL_AUTORIZACION}?${parametros.toString()}`;
};

export const intercambiarCodigoOAuth = (code) => solicitarToken({
  client_secret: obtenerVariable('MP_CLIENT_SECRET'),
  client_id: obtenerVariable('MP_CLIENT_ID'),
  grant_type: 'authorization_code',
  code,
  redirect_uri: obtenerVariable('MP_REDIRECT_URI')
});

const renovarCredenciales = async (configuracion) => {
  const data = await solicitarToken({
    client_secret: obtenerVariable('MP_CLIENT_SECRET'),
    client_id: obtenerVariable('MP_CLIENT_ID'),
    grant_type: 'refresh_token',
    refresh_token: descifrarCredencial(configuracion.refresh_token)
  });

  const accessToken = data.access_token;
  const refreshToken = data.refresh_token
    ? data.refresh_token
    : descifrarCredencial(configuracion.refresh_token);
  if (!accessToken) throw new Error('Mercado Pago no devolvió un access token al renovarlo.');

  return prisma.veterinaria_mercadopago.update({
    where: { veterinaria_id: configuracion.veterinaria_id },
    data: {
      access_token: cifrarCredencial(accessToken),
      refresh_token: cifrarCredencial(refreshToken),
      public_key: data.public_key || configuracion.public_key,
      token_expira_en: calcularExpiracionToken(data.expires_in),
      updated_at: new Date()
    }
  });
};

export const obtenerClienteMercadoPago = async (veterinariaId) => {
  let configuracion = await prisma.veterinaria_mercadopago.findUnique({
    where: { veterinaria_id: veterinariaId }
  });
  if (!configuracion) {
    const error = new Error('La veterinaria todavía no conectó una cuenta de Mercado Pago.');
    error.code = 'MP_NOT_CONNECTED';
    throw error;
  }

  if (configuracion.token_expira_en.getTime() <= Date.now() + MARGEN_RENOVACION_MS) {
    try {
      configuracion = await renovarCredenciales(configuracion);
    } catch (error) {
      // Otra solicitud puede haber rotado el refresh token mientras esta renovación estaba en curso.
      const recargada = await prisma.veterinaria_mercadopago.findUnique({
        where: { veterinaria_id: veterinariaId }
      });
      const fueRenovadaEnParalelo = recargada
        && recargada.updated_at.getTime() > configuracion.updated_at.getTime()
        && recargada.token_expira_en.getTime() > Date.now() + MARGEN_RENOVACION_MS;
      if (!fueRenovadaEnParalelo) throw error;
      configuracion = recargada;
    }
  }

  return new MercadoPagoConfig({
    accessToken: descifrarCredencial(configuracion.access_token),
    options: { timeout: 5000 }
  });
};
