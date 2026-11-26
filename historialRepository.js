const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'historial.json');

class HistorialRepository {
  constructor() {
    if (!fs.existsSync(DB_PATH)) {
      fs.writeFileSync(DB_PATH, JSON.stringify([], null, 2));
    }
  }

  guardar(registro) {
    const historial = this.obtenerTodos();
    const nuevoRegistro = {
      id: Date.now(),
      fecha: new Date().toISOString(),
      ...registro
    };
    historial.unshift(nuevoRegistro);
    fs.writeFileSync(DB_PATH, JSON.stringify(historial, null, 2));
    return nuevoRegistro;
  }

  obtenerTodos() {
    const data = fs.readFileSync(DB_PATH, 'utf-8');
    return JSON.parse(data);
  }
}

module.exports = new HistorialRepository();
