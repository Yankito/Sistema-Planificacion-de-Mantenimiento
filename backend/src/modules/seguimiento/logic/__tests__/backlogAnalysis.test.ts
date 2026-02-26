// src/logic/__tests__/backlogAnalysis.test.ts
import { describe, it, expect } from 'vitest';
import { analyzeBacklogFlow } from '../backlogAnalysis.js';
import { type OrdenTrabajo } from '../../../../shared/types/index.js';

describe('Backlog Evolution Analysis', () => {
    const prevWeek: OrdenTrabajo[] = [
        { ot: "OT-OLD-1", clasificacion: "TECNICO / SERVICIO", planta: "PF1", descripcion: "Vieja", estado: "PEND", periodo: "", semana: "", esOB: false, nroOrden: "1", equipo: "EQ1" },
        { ot: "OT-CHANGE", clasificacion: "TECNICO / SERVICIO", planta: "PF1", descripcion: "Cambia", estado: "PEND", periodo: "", semana: "", esOB: false, nroOrden: "2", equipo: "EQ2" },
        { ot: "OT-GONE", clasificacion: "TECNICO / SERVICIO", planta: "PF1", descripcion: "Se fue", estado: "PEND", periodo: "", semana: "", esOB: false, nroOrden: "3", equipo: "EQ3" },
    ];

    const currentWeek: OrdenTrabajo[] = [
        { ot: "OT-OLD-1", clasificacion: "TECNICO / SERVICIO", planta: "PF1", descripcion: "Vieja", estado: "PEND", periodo: "", semana: "", esOB: false, nroOrden: "1", equipo: "EQ1" },
        { ot: "OT-CHANGE", clasificacion: "PROGRAMADOR", planta: "PF1", descripcion: "Cambia", estado: "PEND", periodo: "", semana: "", esOB: false, nroOrden: "2", equipo: "EQ2" },
        { ot: "OT-NEW", clasificacion: "TECNICO / SERVICIO", planta: "PF1", descripcion: "Nueva", estado: "PEND", periodo: "", semana: "", esOB: false, nroOrden: "4", equipo: "EQ4" },
    ];

    const cumplimiento: OrdenTrabajo[] = [
        { ot: "OT-GONE", clasificacion: "FINALIZADA", planta: "PF1", descripcion: "Se fue", estado: "CERRADA", periodo: "", semana: "", esOB: false, nroOrden: "3", equipo: "EQ3" }
    ];

    it('debe clasificar correctamente el flujo de OTs', () => {
        const stats = analyzeBacklogFlow(currentWeek, prevWeek, cumplimiento);

        // 1. Nuevas
        expect(stats.nuevas).toHaveLength(1);
        expect(stats.nuevas[0].ot).toBe("OT-NEW");

        // 2. Sin Cambios (Persistentes)
        expect(stats.sinCambios).toHaveLength(1);
        expect(stats.sinCambios[0].ot).toBe("OT-OLD-1");

        // 3. Con Avance (Cambio de clasificación)
        expect(stats.conAvance).toHaveLength(1);
        expect(stats.conAvance[0].ot).toBe("OT-CHANGE");
        expect(stats.conAvance[0].estadoAnterior).toBe("TECNICO / SERVICIO");
        expect(stats.conAvance[0].estadoActual).toBe("PROGRAMADOR");

        // 4. Finalizadas (Estaba antes, no ahora, y aparece en cumplimiento)
        expect(stats.finalizadas).toHaveLength(1);
        expect(stats.finalizadas[0].ot).toBe("OT-GONE");

        // 5. Desaparecidas (Estaba antes, no ahora, y NO aparece en cumplimiento)
        // En este mock no pusimos ninguna, pero si quitamos OT-GONE de cumplimiento debería salir aquí.
        expect(stats.desaparecidas).toHaveLength(0);
    });
});