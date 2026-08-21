import { MercadoPagoConfig } from 'mercadopago';

// Validamos que el token exista en las variables de entorno
if (!process.env.MP_ACCESS_TOKEN) {
  console.error("Falta configurar MP_ACCESS_TOKEN en el archivo .env");
}

// Inicializamos el cliente con las credenciales de prueba
const client = new MercadoPagoConfig({ 
  accessToken: process.env.MP_ACCESS_TOKEN,
  options: { timeout: 5000 }
});

export default client;