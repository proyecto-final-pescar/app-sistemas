const express = require('express'); // Importé el framework Express para manejar el servidor
const router = express.Router(); // Creé un enrutador para las rutas de mascotas

// 1. Importar el middleware de autenticación
const authMiddleware = require('../middleware/auth');

// 2. Importar el modelo de Mascota
const Mascota = require('../models/Mascota');