const math = require('mathjs');
const historialRepository = require('../persistence/historialRepository');

class CalcularFlujoUseCase {
  ejecutarCalculo(expresion) {
    // 1. Validación de regla de negocio
    if (!expresion || typeof expresion !== 'string' || expresion.trim() === '') {
      throw new Error('La expresión matemática es obligatoria.');
    }

    let resultado;
    try {
      // 2. Evaluación matemática (reemplaza la lógica de calc.worker.js)
      resultado = math.evaluate(expresion);
    } catch (error) {
      throw new Error(`Error de sintaxis en la expresión: ${error.message}`);
    }

    // 3. Validación de resultados inválidos (ej. división por cero)
    if (resultado === undefined || resultado === null || Number.isNaN(resultado) || !Number.isFinite(resultado)) {
      throw new Error('La operación produce un resultado indefinido o infinito (ej. división por cero).');
    }

    const resultadoFormateado = typeof resultado === 'object' ? resultado.toString() : resultado;

    // 4. Persistencia del flujo
    return historialRepository.guardar({
      expresion: expresion.trim(),
      resultado: resultadoFormateado
    });
  }

  consultarHistorial() {
    return historialRepository.obtenerTodos();
  }
}

module.exports = new CalcularFlujoUseCase();
