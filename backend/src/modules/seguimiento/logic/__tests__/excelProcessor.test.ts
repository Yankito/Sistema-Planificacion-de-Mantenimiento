// src/logic/__tests__/excelProcessor.test.ts
import { describe, it, expect } from 'vitest';
import { normalizarColumnas } from '../../../planificacion/logic/excelProcessor.js';

describe('Excel Processor - Normalization', () => {
    
    it('debe eliminar espacios y convertir claves a mayúsculas', () => {
        const rawInput = [
            { "  Numero OT ": "100", "descripcion ": "Falla" },
            { "Numero OT": "200", "Descripcion": "Ajuste" }
        ];

        const result = normalizarColumnas(rawInput);

        // Verificamos la primera fila
        expect(result[0]).toHaveProperty("NUMERO OT");
        expect(result[0]["NUMERO OT"]).toBe("100");
        
        // Verificamos que 'descripcion ' se convirtió a 'DESCRIPCION'
        expect(result[0]).toHaveProperty("DESCRIPCION");
    });

    it('debe manejar arrays vacíos sin explotar', () => {
        const result = normalizarColumnas([]);
        expect(result).toEqual([]);
    });

    it('debe mantener los valores originales (solo normaliza las claves)', () => {
        const rawInput = [{ "Estado": "Pendiente" }]; // Valor con mayúscula/minúscula mixta
        const result = normalizarColumnas(rawInput);
        
        expect(result[0]["ESTADO"]).toBe("Pendiente"); // El valor no debe cambiar a mayúsculas
    });
});