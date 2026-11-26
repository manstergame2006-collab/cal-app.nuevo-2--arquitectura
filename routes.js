const express = require('express');
const router = express.Router();
const calculadoraController = require('./calculadoraController');

router.post('/calcular', (req, res) => calculadoraController.calcular(req, res));
router.get('/historial', (req, res) => calculadoraController.obtenerHistorial(req, res));

module.exports = router;
