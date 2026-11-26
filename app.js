const express = require('express');
const path = require('path');
const apiRoutes = require('./presentation/routes');

const app = express();

app.use(express.json());
// Sirve tu interfaz visual (index.html, style.css, script.js) desde la carpeta public/
app.use(express.static(path.join(__dirname, '../public')));

// Conecta las rutas de la capa de presentación
app.use('/api', apiRoutes);

module.exports = app;
