import { describe, it, expect } from 'vitest';
import { PlannerService } from '../PlannerService.js';

describe('PlannerService - Modo Estricto (Turnos)', () => {

    // --- 1. FACTORY FUNCTION: Centraliza la creación de datos ---
    const setupPlannerTest = (customHorarios?: Map<string, string[]>) => {
        const mapaHorarios = customHorarios || new Map<string, string[]>();
        
        // Si no se pasan horarios, creamos uno base
        if (!customHorarios) {
            mapaHorarios.set("JUAN", Array(31).fill("L"));
            mapaHorarios.set("PEDRO", Array(31).fill("L"));
        }

        const tecnicosMap = new Map();
        tecnicosMap.set("JUAN", { rol: "MEC" });
        tecnicosMap.set("PEDRO", { rol: "ELE" });

        const dfAct = [{
            "PEDIDO": "OT-TEST", 
            "NÚMERO DE ACTIVO": "BOMBA-01",
            "DESCRIPCIÓN": "MANTENIMIENTO PREVENTIVO",
            "DEPARTAMENTO": "MANTENCION PF1"
        }];

        const dfAnt = [{
            "NÚMERO DE ACTIVO": "BOMBA-01",
            "DESCRIPCIÓN": "MANTENIMIENTO PREVENTIVO",
            "PEDIDO": "OT-VIEJA-123",
            "FECHA INICIAL PROGRAMADA": new Date(2026, 0, 1) 
        }];

        const dfCumplimiento = [
            { "NRO_OT": "OT-VIEJA-123", "EMPLEADO": "JUAN" },
            { "NRO_OT": "OT-VIEJA-123", "EMPLEADO": "PEDRO" }
        ];

        return { dfAct, dfAnt, dfCumplimiento, tecnicosMap, mapaHorarios };
    };

    it('debe encontrar una fecha donde TODOS los técnicos tengan turno Noche (N)', () => {
        // Configuramos solo la diferencia
        const horarios = new Map<string, string[]>();
        horarios.set("JUAN", Array(31).fill("L").map((v, i) => i === 1 ? "N" : "M"));
        horarios.set("PEDRO", Array(31).fill("L").map((v, i) => i === 1 ? "N" : "T"));

        const { dfAct, dfAnt, dfCumplimiento, tecnicosMap, mapaHorarios } = setupPlannerTest(horarios);

        const result = PlannerService.generarPlanificacion(dfAct, dfAnt, dfCumplimiento, tecnicosMap, mapaHorarios);

        const asignacion = result.resultados[0];
        expect(asignacion).toBeDefined();
        expect(asignacion.fechaSugerida).toBe("02/02/2026");
        expect(asignacion.tecnicos.map(t => t.nombre)).toContain("JUAN");
    });

    it('debe enviar a Sin Asignar si no hay coincidencia de turnos', () => {
        // Configuramos bloqueo: Juan siempre libre ("L")
        const horarios = new Map<string, string[]>();
        horarios.set("JUAN", Array(31).fill("L"));
        horarios.set("PEDRO", Array(31).fill("N"));

        const params = setupPlannerTest(horarios);

        const result = PlannerService.generarPlanificacion(
            params.dfAct, params.dfAnt, params.dfCumplimiento, params.tecnicosMap, params.mapaHorarios
        );

        expect(result.resultados).toHaveLength(0);
        expect(result.sinAsignar).toHaveLength(1);
    });
});