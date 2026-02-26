
// @vitest-environment happy-dom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ComplianceCard } from '../ComplianceCard';
import '@testing-library/jest-dom';
import type { AtrasoRow } from '../../types';

describe('ComplianceCard Component', () => {
    const mockData: AtrasoRow[] = [
        {
            ot: "OT-1",
            planta: "PF1",
            esOB: false,
            clasificacion: "FINALIZADA",
            descripcion: "Tarea 1",
            detallesTecnicos: [],
            periodo: "2026",
            rmd: "N/A",
            rse: "N/A",
            semana: "2026-S08",
            estado: "Cerrada"
        },
        {
            ot: "OT-2",
            planta: "PF1",
            esOB: false,
            clasificacion: "OC / OTRO",
            descripcion: "Tarea 2",
            detallesTecnicos: [],
            periodo: "2026",
            rmd: "N/A",
            rse: "N/A",
            semana: "2026-S08",
            estado: "Pendiente"
        },
        {
            ot: "OT-3",
            planta: "PF1",
            esOB: false,
            clasificacion: "FINALIZADA",
            descripcion: "MOB Tarea 3", // Debería filtrarse por el prefix MOB
            detallesTecnicos: [],
            periodo: "2026",
            rmd: "N/A",
            rse: "N/A",
            semana: "2026-S08",
            estado: "Cerrada"
        }
    ];

    it('debe calcular el porcentaje de cumplimiento correctamente filtrando MOB', () => {
        render(
            <ComplianceCard
                planta="PF1"
                esOB={false}
                dataSemanaActual={mockData}
                onClick={() => { }}
            />
        );

        // Universo KPI (sin MOB): OT-1 (FINALIZADA), OT-2 (PENDIENTE) -> Total 2
        // Cumplidas: 1
        // Porcentaje: 50%
        expect(screen.getByText("50%")).toBeInTheDocument();
        expect(screen.getByText("1 OK")).toBeInTheDocument();
        expect(screen.getByText("1 Pend.")).toBeInTheDocument();
        expect(screen.getByText("Total: 2")).toBeInTheDocument();
    });

    it('debe mostrar 100% si todas están cumplidas', () => {
        const allOk = mockData.map(d => ({ ...d, clasificacion: "FINALIZADA" as const }));
        render(
            <ComplianceCard
                planta="PF1"
                esOB={false}
                dataSemanaActual={allOk}
                onClick={() => { }}
            />
        );

        // OT-1, OT-2 -> 2/2 = 100% (MOB se sigue filtrando)
        expect(screen.getByText("100%")).toBeInTheDocument();
    });

    it('debe retornar null si el total es 0', () => {
        const { container } = render(
            <ComplianceCard
                planta="PF2"
                esOB={false}
                dataSemanaActual={[]}
                onClick={() => { }}
            />
        );
        expect(container.firstChild).toBeNull();
    });

    it('debe llamar a onClick cuando se hace click', () => {
        const handleClick = vi.fn();
        render(
            <ComplianceCard
                planta="PF1"
                esOB={false}
                dataSemanaActual={mockData}
                onClick={handleClick}
            />
        );

        fireEvent.click(screen.getByRole('button'));
        expect(handleClick).toHaveBeenCalled();
    });

    it('debe mostrar la etiqueta correcta según esOB', () => {
        const { rerender } = render(
            <ComplianceCard
                planta="PF1"
                esOB={false}
                dataSemanaActual={mockData}
                onClick={() => { }}
            />
        );
        expect(screen.getByText("MANTENCION")).toBeInTheDocument();

        const dataOB = mockData.map(d => ({ ...d, esOB: true }));
        rerender(
            <ComplianceCard
                planta="PF1"
                esOB={true}
                dataSemanaActual={dataOB}
                onClick={() => { }}
            />
        );
        expect(screen.getByText("INFRAESTRUCTURA")).toBeInTheDocument();
    });
});
