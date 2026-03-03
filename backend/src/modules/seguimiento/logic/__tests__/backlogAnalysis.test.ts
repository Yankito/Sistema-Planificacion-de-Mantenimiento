// src/logic/__tests__/backlogAnalysis.test.ts
import { describe, it, expect } from 'vitest';
import { analyzeBacklogFlow } from '../backlogAnalysis.js';
import { type OrdenTrabajo } from '../../../../shared/types/index.js';

describe('Backlog Evolution Analysis', () => {
    const prevWeek: OrdenTrabajo[] = [
        { nroOrden: "OT-OLD-1", nroActivo: "1", clasificacion: "TECNICO / SERVICIO", planta: "PF1", descripcion: "Vieja", estado: "PEND", periodo: "", semana: "", esOB: false },
        { nroOrden: "OT-CHANGE", nroActivo: "2", clasificacion: "TECNICO / SERVICIO", planta: "PF1", descripcion: "Cambia", estado: "PEND", periodo: "", semana: "", esOB: false },
        { nroOrden: "OT-GONE", nroActivo: "3", clasificacion: "TECNICO / SERVICIO", planta: "PF1", descripcion: "Se fue", estado: "PEND", periodo: "", semana: "", esOB: false },
    ];

    const currentWeek: OrdenTrabajo[] = [
        { nroOrden: "OT-OLD-1", nroActivo: "1", clasificacion: "TECNICO / SERVICIO", planta: "PF1", descripcion: "Vieja", estado: "PEND", periodo: "", semana: "", esOB: false },
        { nroOrden: "OT-CHANGE", nroActivo: "2", clasificacion: "PROGRAMADOR", planta: "PF1", descripcion: "Cambia", estado: "PEND", periodo: "", semana: "", esOB: false },
        { nroOrden: "OT-NEW", nroActivo: "4", clasificacion: "TECNICO / SERVICIO", planta: "PF1", descripcion: "Nueva", estado: "PEND", periodo: "", semana: "", esOB: false },
    ];

    const cumplimiento: OrdenTrabajo[] = [
        { nroOrden: "OT-GONE", nroActivo: "3", clasificacion: "FINALIZADA", planta: "PF1", descripcion: "Se fue", estado: "CERRADA", periodo: "", semana: "", esOB: false }
    ];

    it('debe clasificar correctamente el flujo de OTs', () => {
        const stats = analyzeBacklogFlow(currentWeek, prevWeek, cumplimiento);

        // 1. Nuevas
        expect(stats.nuevas).toHaveLength(1);
        expect(stats.nuevas[0].nroOrden).toBe("OT-NEW");

        // 2. Sin Cambios (Persistentes)
        expect(stats.sinCambios).toHaveLength(1);
        expect(stats.sinCambios[0].nroOrden).toBe("OT-OLD-1");

        // 3. Con Avance (Cambio de clasificación)
        expect(stats.conAvance).toHaveLength(1);
        expect(stats.conAvance[0].nroOrden).toBe("OT-CHANGE");
        expect(stats.conAvance[0].estadoAnterior).toBe("TECNICO / SERVICIO");
        expect(stats.conAvance[0].estadoActual).toBe("PROGRAMADOR");

        // 4. Finalizadas (Estaba antes, no ahora, y aparece en cumplimiento)
        expect(stats.finalizadas).toHaveLength(1);
        expect(stats.finalizadas[0].nroOrden).toBe("OT-GONE");

        // 5. Desaparecidas (Estaba antes, no ahora, y NO aparece en cumplimiento)
        // En este mock no pusimos ninguna, pero si quitamos OT-GONE de cumplimiento debería salir aquí.
        expect(stats.desaparecidas).toHaveLength(0);
    });
});