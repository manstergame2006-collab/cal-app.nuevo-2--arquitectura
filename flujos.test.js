import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';

describe('Flujos Principales de la Calculadora - API REST', () => {
  
  // --- FLUJO 1: REALIZAR CÁLCULOS ---
  describe('POST /api/calcular', () => {
    it('debe calcular una expresión aritmética válida y retornar 200', async () => {
      const response = await request(app)
        .post('/api/calcular')
        .send({ expresion: '2 + 3 * 4' });

      expect(response.status).toBe(200);
      expect(response.body.exito).toBe(true);
      expect(response.body.datos).toBeDefined();
      expect(response.body.datos.expresion).toBe('2 + 3 * 4');
      expect(response.body.datos.resultado).toBe(14);
    });

    it('debe calcular funciones científicas válidas (sqrt) y retornar 200', async () => {
      const response = await request(app)
        .post('/api/calcular')
        .send({ expresion: 'sqrt(16) + 6' });

      expect(response.status).toBe(200);
      expect(response.body.exito).toBe(true);
      expect(response.body.datos.resultado).toBe(10);
    });

    it('debe retornar error 400 cuando la expresión está vacía', async () => {
      const response = await request(app)
        .post('/api/calcular')
        .send({ expresion: '' });

      expect(response.status).toBe(400);
      expect(response.body.exito).toBe(false);
      expect(response.body.error).toBe('La expresión matemática es obligatoria.');
    });

    it('debe retornar error 400 cuando hay un error de sintaxis matemática', async () => {
      const response = await request(app)
        .post('/api/calcular')
        .send({ expresion: '2 + * 5' });

      expect(response.status).toBe(400);
      expect(response.body.exito).toBe(false);
      expect(response.body.error).toContain('Error de sintaxis');
    });

    it('debe retornar error 400 en división por cero (resultado infinito)', async () => {
      const response = await request(app)
        .post('/api/calcular')
        .send({ expresion: '10 / 0' });

      expect(response.status).toBe(400);
      expect(response.body.exito).toBe(false);
      expect(response.body.error).toContain('indefinido o infinito');
    });
  });

  // --- FLUJO 2: CONSULTAR HISTORIAL ---
  describe('GET /api/historial', () => {
    it('debe retornar la lista del historial persistido con estado 200', async () => {
      const response = await request(app).get('/api/historial');

      expect(response.status).toBe(200);
      expect(response.body.exito).toBe(true);
      expect(Array.isArray(response.body.datos)).toBe(true);
      expect(response.body.datos.length).toBeGreaterThan(0);
    });
  });
});
