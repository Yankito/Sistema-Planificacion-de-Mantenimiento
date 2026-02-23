
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
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
            getGastosConsolidados: mockGetGastosConsolidados,
            loading: false
        });
    });

    it('debe renderizar datos correctamente y agrupar por Centro de Costo', async () => {
        const mesActual = new Date().getMonth() + 1;
        const ccTest = 'CC-TEST';

        mockGetPresupuesto.mockResolvedValue([
            { activo: 'ACT-01', centroCosto: ccTest, tipoFila: 'Mensual', mes: mesActual, montoBodega: 1000 }
        ]);
        mockGetGastosConsolidados.mockResolvedValue([
            { nroActivo: 'ACT-01', tipoGasto: 'BODEGA', costoTrx: 500, mes: mesActual, centroCosto: ccTest, esHito: false, planta: 'PF1' }
        ]);

        render(<ExecutionMonitor selectedYear={2026} selectedPlanta="PF1" />);

        // Esperar que aparezca el Centro de Costo
        const group = await screen.findByText(ccTest);
        expect(group).toBeTruthy();

        // Expandir
        fireEvent.click(group);
        const asset = await screen.findByText('ACT-01');
        expect(asset).toBeTruthy();
    });

    it('debe filtrar por término de búsqueda', async () => {
        const mesActual = new Date().getMonth() + 1;
        const cc1 = 'ALFA';
        const cc2 = 'BETA';

        mockGetPresupuesto.mockResolvedValue([
            { activo: 'ACT-1', centroCosto: cc1, mes: mesActual, montoBodega: 100 },
            { activo: 'ACT-2', centroCosto: cc2, mes: mesActual, montoBodega: 100 }
        ]);
        mockGetGastosConsolidados.mockResolvedValue([]);

        render(<ExecutionMonitor selectedYear={2026} selectedPlanta="PF1" />);

        await waitFor(() => expect(screen.queryByText(cc1)).not.toBeNull());
        await waitFor(() => expect(screen.queryByText(cc2)).not.toBeNull());

        const input = screen.getByPlaceholderText(/buscar/i);
        fireEvent.change(input, { target: { value: 'ALFA' } });

        await waitFor(() => {
            expect(screen.queryByText(cc1)).not.toBeNull();
            expect(screen.queryByText(cc2)).toBeNull();
        });
    });

    it('debe detectar desviaciones y mostrar alertas críticas', async () => {
        const mesActual = new Date().getMonth() + 1;
        const cc = 'CRIT';

        mockGetPresupuesto.mockResolvedValue([
            { activo: 'ACT-CRIT', centroCosto: cc, mes: mesActual, montoBodega: 100 }
        ]);

        mockGetGastosConsolidados.mockResolvedValue([
            {
                nroActivo: 'ACT-CRIT',
                tipoGasto: 'BODEGA',
                costoTrx: 150,
                mes: mesActual,
                centroCosto: cc,
                estadoTrabajo: 'Liberado'
            }
        ]);

        render(<ExecutionMonitor selectedYear={2026} selectedPlanta="PF1" />);

        // 50% de desviación (aparece en KPIs y en la tabla)
        await waitFor(() => {
            const elements = screen.getAllByText('50.0%');
            expect(elements.length).toBeGreaterThan(0);
        }, { timeout: 3000 });
    });

    it('debe manejar gastos no presupuestados correctamente', async () => {
        const mesActual = new Date().getMonth() + 1;
        const cc = 'EXTRA';

        mockGetPresupuesto.mockResolvedValue([]);
        mockGetGastosConsolidados.mockResolvedValue([
            {
                nroActivo: 'ACT-NUEVO',
                tipoGasto: 'CORRECTIVO',
                costoTrx: 300,
                mes: mesActual,
                centroCosto: cc,
                claseContable: 'MANT'
            }
        ]);

        render(<ExecutionMonitor selectedYear={2026} selectedPlanta="PF1" />);

        const group = await screen.findByText(cc);
        fireEvent.click(group);

        await waitFor(() => expect(screen.queryByText(/No Presupuestado/i)).not.toBeNull(), { timeout: 3000 });
        expect(screen.getByText('ACT-NUEVO')).toBeTruthy();
    });
});
