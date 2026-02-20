import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ExecutionMonitor } from '../components/ExecutionMonitor';
import * as useControlGastosHook from '../hooks/useControlGastos';

vi.mock('../hooks/useControlGastos', () => ({
    useControlGastos: vi.fn()
}));

describe('ExecutionMonitor Component', () => {
    const mockGetPresupuesto = vi.fn();
    const mockGetGastosConsolidados = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        (useControlGastosHook.useControlGastos as any).mockReturnValue({
            getPresupuesto: mockGetPresupuesto,
            getGastosConsolidados: mockGetGastosConsolidados
        });
    });

    it('debe renderizar datos correctamente en el mes actual', async () => {
        const mesActual = new Date().getMonth() + 1;

        mockGetPresupuesto.mockResolvedValue([
            { activo: 'ACT-UNICO', centroCosto: '(0001)', tipoFila: 'Mensual', mes: mesActual, montoBodega: 1000 }
        ]);
        mockGetGastosConsolidados.mockResolvedValue([
            { nroActivo: 'ACT-UNICO', tipoGasto: 'BODEGA', costoTrx: 500, mes: mesActual, centroCosto: '(0001)', esHito: false }
        ]);

        render(<ExecutionMonitor selectedYear={2026} selectedPlanta="PF3" />);

        // Esperar a que el loading desaparezca y aparezca el CC
        const group = await screen.findByText(/(0001)/i);
        expect(group).toBeDefined();

        // El grupo ya viene expandido por defecto en el componente
        // fireEvent.click(group); // Esto lo colapsaría

        // Verificar activo
        expect(await screen.findByText(/ACT-UNICO/i)).toBeDefined();

        // Verificar real 500 (aparece en el total del CC, en el activo y en el detalle)
        const montos = await screen.findAllByText(/500/);
        expect(montos.length).toBeGreaterThan(0);
    });
});
