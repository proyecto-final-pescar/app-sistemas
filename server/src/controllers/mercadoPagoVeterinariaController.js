import crypto from 'node:crypto';

import jwt from 'jsonwebtoken';

import prisma from '../../prisma/client.js';
import { obtenerJwtSecret } from '../config/security.js';
import {
  calcularExpiracionToken,
  cifrarCredencial,
  crearUrlAutorizacion,
  intercambiarCodigoOAuth
} from '../services/mercadoPagoOAuthService.js';

const MP_OAUTH_STATE_COOKIE = 'mp_oauth_state';
const MP_OAUTH_STATE_MAX_AGE_MS = 10 * 60 * 1000;

const atributosCookieState = () => ({
  httpOnly: true,
  path: '/api/veterinarias/mercadopago/callback',
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production'
});

const obtenerCookie = (req, nombre) => {
  const entrada = req.get('cookie')
    ?.split(';')
    .map((parte) => parte.trim())
    .find((parte) => parte.startsWith(`${nombre}=`));
  if (!entrada) return null;
  try {
    return decodeURIComponent(entrada.slice(nombre.length + 1));
  } catch {
    return null;
  }
};

const estadosCoinciden = (recibido, esperado) => {
  if (typeof recibido !== 'string' || typeof esperado !== 'string') return false;
  const recibidoBuffer = Buffer.from(recibido);
  const esperadoBuffer = Buffer.from(esperado);
  return recibidoBuffer.length === esperadoBuffer.length
    && crypto.timingSafeEqual(recibidoBuffer, esperadoBuffer);
};

const obtenerVeterinariaPropia = (usuarioId) => prisma.veterinaria.findUnique({
  where: { usuario_id: usuarioId },
  select: { veterinaria_id: true }
});

const detalleSeguroError = (error) => ({
  code: error?.code,
  message: error?.message,
  status: error?.status
});

const urlCliente = (resultado) => {
  const base = (process.env.CLIENT_URL || 'http://localhost:5173').split(',')[0].trim();
  const url = new URL('/mi-veterinaria', base);
  url.searchParams.set('mercadopago', resultado);
  return url.toString();
};

export const obtenerMetodoCobro = async (req, res) => {
  try {
    const veterinaria = await obtenerVeterinariaPropia(req.user.id);
    if (!veterinaria) {
      return res.status(404).json({ message: 'No tenés una veterinaria registrada.' });
    }
    const configuracion = await prisma.veterinaria_mercadopago.findUnique({
      where: { veterinaria_id: veterinaria.veterinaria_id },
      select: { mp_user_id: true, token_expira_en: true, updated_at: true }
    });

    return res.status(200).json({
      success: true,
      data: {
        proveedor: 'mercadopago',
        conectado: Boolean(configuracion),
        cuenta: configuracion
          ? `•••• ${configuracion.mp_user_id.slice(-4)}`
          : null,
        tokenExpiraEn: configuracion?.token_expira_en || null,
        actualizadoEn: configuracion?.updated_at || null
      }
    });
  } catch (error) {
    console.error('Error en GET /veterinarias/mia/metodo-cobro:', detalleSeguroError(error));
    return res.status(500).json({ message: 'No se pudo consultar el método de cobro.' });
  }
};

export const iniciarConexionMercadoPago = async (req, res) => {
  try {
    const veterinaria = await obtenerVeterinariaPropia(req.user.id);
    if (!veterinaria) {
      return res.status(404).json({ message: 'No tenés una veterinaria registrada.' });
    }
    const state = jwt.sign(
      {
        purpose: 'mercadopago-veterinaria',
        usuarioId: req.user.id,
        veterinariaId: veterinaria.veterinaria_id
      },
      obtenerJwtSecret(),
      {
        algorithm: 'HS256',
        audience: 'mercadopago-oauth',
        expiresIn: '10m',
        issuer: 'mypet-api',
        jwtid: crypto.randomUUID()
      }
    );
    res.cookie(MP_OAUTH_STATE_COOKIE, state, {
      ...atributosCookieState(),
      maxAge: MP_OAUTH_STATE_MAX_AGE_MS
    });

    return res.status(200).json({
      success: true,
      data: { authorizationUrl: crearUrlAutorizacion(state) }
    });
  } catch (error) {
    console.error('Error al iniciar OAuth de Mercado Pago:', detalleSeguroError(error));
    const status = error.code === 'MP_CONFIG_ERROR' ? 503 : 500;
    return res.status(status).json({ message: 'Mercado Pago no está configurado en el servidor.' });
  }
};

export const finalizarConexionMercadoPago = async (req, res) => {
  try {
    const { code, state } = req.query;
    if (!code || !state) return res.redirect(urlCliente('error'));

    const stateEsperado = obtenerCookie(req, MP_OAUTH_STATE_COOKIE);
    res.clearCookie(MP_OAUTH_STATE_COOKIE, atributosCookieState());
    if (!estadosCoinciden(state, stateEsperado)) {
      return res.redirect(urlCliente('error'));
    }

    const payload = jwt.verify(state, obtenerJwtSecret(), {
      algorithms: ['HS256'],
      audience: 'mercadopago-oauth',
      issuer: 'mypet-api'
    });
    if (payload.purpose !== 'mercadopago-veterinaria') {
      return res.redirect(urlCliente('error'));
    }

    const veterinaria = await prisma.veterinaria.findFirst({
      where: {
        veterinaria_id: payload.veterinariaId,
        usuario_id: payload.usuarioId,
        usuario: { rol: { nombre: 'veterinaria' } }
      },
      select: { veterinaria_id: true }
    });
    if (!veterinaria) return res.redirect(urlCliente('error'));

    const credenciales = await intercambiarCodigoOAuth(code);
    if (!credenciales.access_token || !credenciales.refresh_token || !credenciales.user_id) {
      throw new Error('Mercado Pago devolvió credenciales incompletas.');
    }

    await prisma.veterinaria_mercadopago.upsert({
      where: { veterinaria_id: veterinaria.veterinaria_id },
      create: {
        veterinaria_id: veterinaria.veterinaria_id,
        mp_user_id: String(credenciales.user_id),
        access_token: cifrarCredencial(credenciales.access_token),
        refresh_token: cifrarCredencial(credenciales.refresh_token),
        public_key: credenciales.public_key || '',
        token_expira_en: calcularExpiracionToken(credenciales.expires_in),
        updated_at: new Date()
      },
      update: {
        mp_user_id: String(credenciales.user_id),
        access_token: cifrarCredencial(credenciales.access_token),
        refresh_token: cifrarCredencial(credenciales.refresh_token),
        public_key: credenciales.public_key || '',
        token_expira_en: calcularExpiracionToken(credenciales.expires_in),
        updated_at: new Date()
      }
    });

    return res.redirect(urlCliente('conectado'));
  } catch (error) {
    console.error('Error al finalizar OAuth de Mercado Pago:', detalleSeguroError(error));
    return res.redirect(urlCliente('error'));
  }
};

export const desconectarMercadoPago = async (req, res) => {
  try {
    const veterinaria = await obtenerVeterinariaPropia(req.user.id);
    if (!veterinaria) {
      return res.status(404).json({ message: 'No tenés una veterinaria registrada.' });
    }
    await prisma.veterinaria_mercadopago.deleteMany({
      where: { veterinaria_id: veterinaria.veterinaria_id }
    });
    return res.status(200).json({ success: true, message: 'Cuenta de Mercado Pago desconectada.' });
  } catch (error) {
    console.error('Error al desconectar Mercado Pago:', detalleSeguroError(error));
    return res.status(500).json({ message: 'No se pudo desconectar la cuenta de Mercado Pago.' });
  }
};
