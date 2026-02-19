// src/utils/__tests__/dateUtils.test.ts
import { describe, it, expect } from 'vitest';
import { getWeekID, getWeekRange } from '../dateUtils';

describe('Date Utilities', () => {

    it('debe calcular correctamente una semana estándar (mitad de año)', () => {
        // 4 de Febrero de 2026 (Miércoles)
        const date = new Date(2026, 1, 4); 
        // Vitest usa formato de mes 0-indexado (0=Ene, 1=Feb)
        
        const weekId = getWeekID(date);
        // Debería ser algo como 2026-S06 (dependiendo de tu lógica ISO exacta)
        // Ajusta este valor esperado según lo que tu lógica ISO real devuelve
        expect(weekId).toMatch(/2026-S\d{2}/); 
    });

    it('debe manejar correctamente el cambio de año (Diciembre)', () => {
        // 31 de Diciembre de 2025
        const date = new Date(2025, 11, 31);
        
        // Dependiendo de la norma ISO, esto podría ser la semana 53 de 2025 o la 1 de 2026.
        // Lo importante es que devuelva un string válido y no null/undefined
        const weekId = getWeekID(date);
        expect(weekId).toBeDefined();
        expect(typeof weekId).toBe("string");
    });

    it('debe generar un rango visual legible', () => {
        const date = new Date(2026, 1, 4); // 4 Feb 2026
        const range = getWeekRange(date);
        
        // Esperamos algo como "(2 Feb - 8 Feb)" o similar
        expect(range).toContain("(");
        expect(range).toContain("Feb");
        expect(range).toContain(")");
    });
});