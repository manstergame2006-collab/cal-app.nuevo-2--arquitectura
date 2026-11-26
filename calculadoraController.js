const calcularUseCase = require('../application/calcularFlujoUseCase');

class CalculadoraController {
  calcular(req, res) {
    try {
      const { expresion } = req.body;
      const registro = calcularUseCase.ejecutarCalculo(expresion);
      
      return res.status(200).json({
        exito: true,
        datos: registro
      });
    } catch (error) {
      return res.status(400).json({
        exito: false,
        error: error.message
      });
    }
  }

  obtenerHistorial(req, res) {
    try {
      const historial = calcularUseCase.consultarHistorial();
      return res.status(200).json({
        exito: true,
        datos: historial
      });
    } catch (error) {
      return res.status(500).json({
        exito: false,
        error: 'Error interno al consultar el historial.'
      });
    }
  }
}

module.exports = new CalculadoraController();
