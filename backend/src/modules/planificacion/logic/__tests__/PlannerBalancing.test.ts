// src/logic/__tests__/PlannerBalancing.test.ts
import { describe, it, expect } from 'vitest';
import { PlannerService } from '../PlannerService.js';

describe('PlannerService - Lógica de Balanceo (Peak Shaving)', () => {

    it('debe distribuir la carga en la semana cuando hay exceso de OTs el mismo día', () => {
        // 1. Simulamos 10 OTs para "PF3" que caerían todas el mismo Lunes
        // Usamos las claves reales que espera tu Excel Processor
        const mockAct = Array(10).fill(null).map((_, i) => ({
            "DEPARTAMENTO": "MANTENCION PF3",
            "PEDIDO": `OT-TEST-${i}`,
            "NUMERO DE ACTIVO": "EQ-1",
            "DESCRIPCIÓN": "Mantenimiento Preventivo",
            // Una fecha Excel que cae lunes (ej: 45325 es un número de serie de fecha excel)
            // Ojo: PlannerService usa excelDateToJS internamente o espera fecha JS si ya se procesó.
            // Para este test, asumiremos que ya pasó por el pre-procesador o inyectamos Date directo si tu mock lo permite.
            // Vamos a usar una fecha JS directa para asegurar el lunes.
            "FECHA INICIAL PROGRAMADA": new Date(2026, 1, 2) // Lunes 2 Feb 2026
        }));

        // 2. Ejecutamos el modo BALANCED
        const result = PlannerService.generarPlanificacionEquilibrada(
            mockAct,
            [], // Sin historial anterior
            [], // Sin cumplimiento
            new Map() // Sin tecnicos
        );

        const assigned = result.resultados;
        
        // 3. Validaciones
        expect(assigned.length).toBe(10);

        // Agrupamos por fecha sugerida para ver la distribución
        const distribution: Record<string, number> = {};
        assigned.forEach(r => {
            distribution[r.fechaSugerida] = (distribution[r.fechaSugerida] || 0) + 1;
        });

        // Debug: Para que veas cómo las repartió en la consola si falla
        // console.log("Distribución:", distribution);

        const uniqueDates = Object.keys(distribution).length;

        // SI EL BALANCEO FUNCIONA: 
        // No deberían estar las 10 en la misma fecha. Debería haber usado al menos 2 o 3 días de la semana.
        expect(uniqueDates).toBeGreaterThan(1); 
        
        // Verificamos que sean fechas de la misma semana (misma planta)
        // Como son 10 y el techo por día es ceil(10/5) = 2, debería haber 2 por día idealmente.
        const counts = Object.values(distribution);
        const maxLoad = Math.max(...counts);
        
        // El algoritmo no debería dejar más de 2 o 3 OTs por día si es perfecto
        expect(maxLoad).toBeLessThanOrEqual(3); 
    });
});