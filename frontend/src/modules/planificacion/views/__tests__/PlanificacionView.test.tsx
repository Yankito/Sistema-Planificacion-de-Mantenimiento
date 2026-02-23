// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PlanificacionView } from '../PlanificacionView';
import { useData } from '../../../../context/PlanificacionContext';
import { usePlanificacionLogic } from '../../hooks/usePlanificacionLogic';

// Mocks de componentes pesados
vi.mock('../../components/Calendario', () => ({ Calendario: () => <div data-testid="calendario" /> }));
vi.mock('../../components/PanelLateral', () => ({ PanelLateral: () => <div data-testid="panel" /> }));

vi.mock('../../../../context/PlanificacionContext', () => ({
  useData: vi.fn()
}));

vi.mock('../../hooks/usePlanificacionLogic', () => ({
  usePlanificacionLogic: vi.fn()
}));

describe('PlanificacionView', () => {
  const mockedUseData = vi.mocked(useData);
  const mockedUseLogic = vi.mocked(usePlanificacionLogic);

  const mockManager = {
    planResult: [],
    setPlanResult: vi.fn(),
    plantaPlan: 'PF3',
    setPlantaPlan: vi.fn(),
    tecnicosMap: new Map(),
    planResultSinAsignar: [],
    mapaHorariosActual: new Map(),
    cargandoPlan: false,
    setOrdenEditando: vi.fn(),
    setModalTecnicoOpen: vi.fn(),
    fechaFoco: null,
    periodoSeleccionado: '2024-02',
    setMesSeleccionado: vi.fn(),
    planFiltrado: [],
    sinAsignarFiltrado: [],
    cargarPlanificacion: vi.fn(),
  };

  const mockLogic = {
    diaSeleccionado: null,
    setDiaSeleccionado: vi.fn(),
    ordenesPorDia: {},
    mostrarSoloVacantes: false,
    setMostrarSoloVacantes: vi.fn(),
    // Otros retornos necesarios
    draggingOT: null,
    dragOverDate: null,
    setDragOverDate: vi.fn(),
    showSuccess: false,
    mensajeExito: "Planificación Actualizada",
    handleSugerirTodo: vi.fn(),
    handleDragStart: vi.fn(),
    handleDragEnd: vi.fn(),
    handleDragEnter: vi.fn(),
    handleDragOver: vi.fn(),
    handleDrop: vi.fn(),
    cargandoPlan: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockedUseData.mockReturnValue({
      planning: mockManager as unknown as ReturnType<typeof useData>['planning'],
      seguimiento: {} as unknown as ReturnType<typeof useData>['seguimiento'],
      fallas: {} as unknown as ReturnType<typeof useData>['fallas'],
      config: { semanaActual: '2024-s01' }
    });
    mockedUseLogic.mockReturnValue(mockLogic as unknown as ReturnType<typeof usePlanificacionLogic>);
  });

  it('debería mostrar el spinner de carga cuando sincroniza con Oracle', () => {
    mockedUseData.mockReturnValue({
      planning: { ...mockManager, cargandoPlan: true } as unknown as ReturnType<typeof useData>['planning'],
      seguimiento: {} as unknown as ReturnType<typeof useData>['seguimiento'],
      fallas: {} as unknown as ReturnType<typeof useData>['fallas'],
      config: { semanaActual: '2024-s01' }
    });

    render(<PlanificacionView />);
    expect(screen.getByText(/Sincronizando Oracle/i)).toBeInTheDocument();
  });

  it('debería renderizar Calendario y Panel Lateral', () => {
    render(<PlanificacionView />);
    expect(screen.getByTestId('calendario')).toBeInTheDocument();
    expect(screen.getByTestId('panel')).toBeInTheDocument();
  });
});