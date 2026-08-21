import cron from 'node-cron'; // revisión automática cada 15 minutos; npm install node-cron
import { liberarTurnosVencidos } from '../controllers/turnoController.js';

export const iniciarJobsTurnos = () => {
  // Corre cada 15 minutos
  cron.schedule('*/15 * * * *', () => {
    liberarTurnosVencidos();
  });
};