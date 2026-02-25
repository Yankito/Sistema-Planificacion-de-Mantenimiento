import { describe, it, expect } from 'vitest';
import { excelDateToJS, evitarDomingo, getMonday, getWeekId } from '../dateUtils';

describe('Date Utilities', () => {

  it('debería convertir un serial de Excel a una fecha JS válida', () => {
    const serial = 46064;
    const fecha = excelDateToJS(serial);

    expect(fecha.getFullYear()).toBe(2026);
    expect(fecha.getMonth() + 1).toBe(2); // Febrero
    expect(fecha.getDate()).toBe(11);
  });

  it('debería mover un Domingo al Lunes siguiente', () => {
    const domingo = new Date(2026, 1, 1); // 01/02/2026 es Domingo
    const corregida = evitarDomingo(domingo);

    expect(corregida.getDay()).toBe(1); // 1 = Lunes
    expect(corregida.getDate()).toBe(2);
  });

  it('debería obtener el Lunes de cualquier semana', () => {
    const miercoles = new Date(2026, 1, 11); // 11/02/2026
    const lunes = getMonday(miercoles);

    expect(lunes.getDay()).toBe(1);
    expect(lunes.getDate()).toBe(9);
  });

  it('debería generar un ID de semana consistente (YYYY-SXX)', () => {
    const fecha = new Date(2026, 1, 11);
    const id = getWeekId(fecha);

    // Debería ser algo como 2026-S06 o S07 dependiendo del lunes inicial
    expect(id).toMatch(/^2026-S\d{2}$/);
  });
});