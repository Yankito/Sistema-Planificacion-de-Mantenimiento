import { describe, it, expect } from 'vitest';
import { processFallasDataFromDB } from '../fallasProcessor.js';
import type { FallaRow } from '../../types.js';

describe('fallasProcessor - processFallasDataFromDB', () => {
  it('debe enriquecer correctamente los datos básicos con semana, mes y año ISO', () => {
    const mockDbData: Partial<FallaRow>[] = [
      {
        fecha: new Date(2025, 0, 15),
        planta: 'PF1',
        equipo: 'EQUIPO-01',
        duracionMinutos: 120,
        gasto: 50000,
        perdidaKg: 10
      }
    ];

    const result = processFallasDataFromDB(mockDbData);

    expect(result).toHaveLength(1);
    expect(result[0].semana).toBe(3);
    expect(result[0].anio).toBe(2025);
    expect(result[0].mes).toBe(1); // Enero
    expect(result[0].planta).toBe('PF1');
  });

  it('debe manejar correctamente el cambio de año ISO (29 de diciembre es semana 1 del próximo año)', () => {
    // 29 de Diciembre 2025 es Lunes. Su jueves es 01 de Enero 2026.
    // Por estándar ISO 8601, esta es la Semana 1 de 2026.
    const mockDbData: Partial<FallaRow>[] = [
      {
        fecha: new Date("2025-12-29T12:00:00Z"),
        planta: 'PF2',
        equipo: 'EQUIPO-02',
        duracionMinutos: 120,
        gasto: 50000,
        perdidaKg: 10,
        causa: 'CAUSA-02',
        estadoPedido: 'ESTADO-02',
        tipoPedido: 'TIPO-02',
        tecnico: 'TECNICO-02',
        pedidoTrabajo: 'PEDIDO-02',
        descripcionOperador: 'DESCRIPCION-02',
        area: 'AREA-02',
        linea: 'LINEA-02',
      }
    ];

    // Para 2025-12-29, ISO 8601 devuelve Semana 1 de 2026
    const result = processFallasDataFromDB(mockDbData);

    expect(result[0].semana).toBe(1);
    expect(result[0].anio).toBe(2026);
  });

  it('debe asignar valores por defecto a campos faltantes', () => {
    const mockDbData: Partial<FallaRow>[] = [
      {
        fecha: new Date(2025, 4, 20),
      }
    ];

    const result = processFallasDataFromDB(mockDbData);

    expect(result[0].planta).toBe('S/D');
    expect(result[0].equipo).toBe('Equipo Desconocido');
    expect(result[0].duracionMinutos).toBe(0);
  });

  it('debe asegurar que los valores numéricos sean de tipo Number (por si vienen como string de la DB)', () => {
    const mockDbData: any[] = [
      {
        fecha: '2025-02-10',
        duracionMinutos: '150', // Viene como string
        gasto: '75000'
      }
    ];

    const result = processFallasDataFromDB(mockDbData);

    expect(typeof result[0].duracionMinutos).toBe('number');
    expect(result[0].duracionMinutos).toBe(150);
    expect(result[0].gasto).toBe(75000);
  });
});
