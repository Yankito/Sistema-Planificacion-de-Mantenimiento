// src/logic/__tests__/technicianAnalysis.test.ts
import { describe, it, expect } from 'vitest';
import { analyzeTechnicians, prepareTechProfile } from '../technicianAnalysis.js';
import { MOCK_DATA_ANALISIS } from '../../../../test/mocks.js';

describe('Technician Analysis', () => {

    it('debe calcular correctamente la efectividad de los técnicos', () => {
        // Simulamos Data: 
        // Juan Perez: 1 pendiente
        // Ana Gomez: 1 finalizada
        const stats = analyzeTechnicians(MOCK_DATA_ANALISIS, []); // Sin data cumplimiento extra

        const juan = stats.find(t => t.nombre === "JUAN PEREZ");
        const ana = stats.find(t => t.nombre === "ANA GOMEZ");

        expect(juan).toBeDefined();
        expect(juan?.totalAsignado).toBe(1);
        expect(juan?.pendientes).toBe(1);
        expect(juan?.efectividad).toBe(0); // 0%

        expect(ana).toBeDefined();
        expect(ana?.totalAsignado).toBe(1);
        expect(ana?.finalizadas).toBe(1);
        expect(ana?.efectividad).toBe(100); // 100%
    });

    it('debe unificar técnicos si aparecen en múltiples plantas', () => {
        // Creamos un caso donde Juan Perez trabaja en PF1 y PF2
        const multiPlantaData = [
            ...MOCK_DATA_ANALISIS,
            {
                planta: "PF2",
                ot: "OT-999",
                descripcion: "Otra",
                estado: "PENDIENTE",
                clasificacion: "TECNICO / SERVICIO" as const,
                periodo: "2025",
                semana: "2025-S01",
                esOB: false,
                detallesTecnicos: [{ tecnico: { nombre: "JUAN PEREZ", rol: "M", planta: "PF2" }, opFinalizada: true }],
                nroOrden: "999",
                equipo: "Equipo 4"
            }
        ];

        const stats = analyzeTechnicians(multiPlantaData, []);
        const juan = stats.find(t => t.nombre === "JUAN PEREZ");

        expect(juan?.totalAsignado).toBe(2); // 1 de antes + 1 nueva
        expect(juan?.plantas).toContain("PF1");
        expect(juan?.plantas).toContain("PF2");
        expect(juan?.efectividad).toBe(50); // 1 pendiente, 1 lista = 50%
    });
});

describe('prepareTechProfile (Detalle Individual)', () => {
    it('debe filtrar correctamente las órdenes de un solo tecnico', () => {
        const result = prepareTechProfile(
            "JUAN PEREZ",
            MOCK_DATA_ANALISIS,
            ["TODAS", "PF1", "PF2"]
        );

        expect(result.techName).toBe("JUAN PEREZ");
        expect(result.orders).toHaveLength(1);
        expect(result.orders[0].ot).toBe("OT-100");
        expect(result.stats.pendientes).toBe(1);
    });

    it('debe marcar como pendiente si OP_FINALIZADA es NO, aunque la OT exista en cumplimiento', () => {
        const dataConPendiente = [
            {
                ot: "OT-TEST-01",
                planta: "PF1",
                descripcion: "Tarea de prueba",
                estado: "Liberado",
                detallesTecnicos: [{ tecnico: { nombre: "PEDRO SOTO", rol: "M", planta: "PF1" }, opFinalizada: false }], // Operación NO finalizada
                clasificacion: "TECNICO / SERVICIO" as const,
                periodo: "2026",
                semana: "2026-S06",
                esOB: false,
                nroOrden: "TEST-01",
                equipo: "Equipo 5"
            }
        ];

        const stats = analyzeTechnicians([], dataConPendiente);
        const pedro = stats.find(t => t.nombre === "PEDRO SOTO");

        expect(pedro?.finalizadas).toBe(0);
        expect(pedro?.pendientes).toBe(1);
        expect(pedro?.efectividad).toBe(0);
    });
});