import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ExpenseBreakdown } from '../components/ExpenseBreakdown';
import * as useControlGastosHook from '../hooks/useControlGastos';

vi.mock('../hooks/useControlGastos', () => ({
    useControlGastos: vi.fn()
}));

describe('ExpenseBreakdown Component', () => {
    const mockGetPresupuesto = vi.fn();
    const mockGetGastosConsolidados = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(useControlGastosHook.useControlGastos).mockReturnValue({
            getPresupuesto: mockGetPresupuesto,
            getGastosConsolidados: mockGetGastosConsolidados
        } as unknown as ReturnType<typeof useControlGastosHook.useControlGastos>);
    });

    it('debe categorizar como Hito si esHito es true', async () => {
        mockGetPresupuesto.mockResolvedValue([]);
        mockGetGastosConsolidados.mockResolvedValue([
            {
                numeroOt: 'HITO-123',
                descripcionOt: 'Mantenimiento Mayor',
                descripcionArticulo: 'Repuesto X',
                costoTrx: 5000,
                fechaTrx: '2026-02-15',
                esHito: true,
                tipoGasto: 'BODEGA' // Aunque sea bodega, debe primar Hito
            }
        ]);

        render(<ExpenseBreakdown selectedYear={2026} selectedPlanta="PF3" />);

        // Esperar a que el item aparezca en la tabla
        const concepto = await screen.findByText(/Mantenimiento Mayor/i);
        expect(concepto).toBeDefined();

        // Verificar que la categoría mostrada sea Hito (aparece en leyenda y tabla)
        const categoriaTags = await screen.findAllByText(/^Hito$/i);
        expect(categoriaTags.length).toBeGreaterThan(0);
    });
});
