// src/modules/planificacion/logic/__tests__/turnosLogic.test.ts
import { describe, it, expect } from 'vitest';
import { buscarNocheComun } from '../turnosLogic.js';

describe('Lógica de Turnos (Strict Mode)', () => {

    it('debe encontrar fecha común cuando todos tienen Noche (N)', () => {
        const fechaBase = new Date(2026, 1, 1); // 1 Feb
        
        // Simulamos 2 técnicos
        // Dia 1 (idx 0): M, M (Falla)
        // Dia 2 (idx 1): N, N (Éxito)
        const turnosTec1 = ['M', 'N', 'L'];
        const turnosTec2 = ['M', 'N', 'L'];
        
        const fechaEncontrada = buscarNocheComun(fechaBase, [turnosTec1, turnosTec2]);
        
        expect(fechaEncontrada).toBeDefined();
        // Debería ser el día 2 (index 1 + 1)
        expect(fechaEncontrada?.getDate()).toBe(2);
    });

    it('debe retornar null si uno tiene bloqueo (Licencia) el sábado', () => {
        // Sábado es el día 7 (index 6)
        const fechaBase = new Date(2026, 1, 1); // Feb 2026
        
        // Tec 1: Libre el sábado (L = Bloqueo)
        // Tec 2: Noche el sábado
        const turnosTec1 = Array(10).fill('M'); 
        turnosTec1[6] = 'L'; // Sábado 7 Feb

        const turnosTec2 = Array(10).fill('M');
        turnosTec2[6] = 'N';

        const fechaEncontrada = buscarNocheComun(fechaBase, [turnosTec1, turnosTec2]);
        
        // No debería asignar el sábado porque 'L' es bloqueante
        expect(fechaEncontrada).toBeNull();
    });
});