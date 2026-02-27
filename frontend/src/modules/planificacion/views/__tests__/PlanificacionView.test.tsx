// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PlanificacionView } from '../PlanificacionView';
import { usePlanificacionManager } from '../../hooks/usePlanificacionManager';
import { usePlanificacionLogic } from '../../hooks/usePlanificacionLogic';

// Mocks de componentes pesados
vi.mock('../../components/Calendario', () => ({ Calendario: () => <div data-testid="calendario" /> }));
vi.mock('../../components/PanelLateral', () => ({ PanelLateral: () => <div data-testid="panel" /> }));

vi.mock('../../hooks/usePlanificacionManager', () => ({
  usePlanificacionManager: vi.fn()
}));

vi.mock('../../hooks/usePlanificacionLogic', () => ({
  usePlanificacionLogic: vi.fn()
}));

// Mock del contexto Auth (requerido por usePlantasAcceso)
vi.mock('../../../../context/useAuth', () => ({
  useAuth: vi.fn(() => ({
    user: {
      usuario: 'testuser',
      roles: ['supervisor'],
      plantas: ['PF1', 'PF2', 'PF3', 'PF4', 'PF5', 'PF6', 'CDT', 'OTROS'],
      nombreCompleto: 'Test User',
      primerNombre: 'Test',
      primerApellido: 'User',
      tieneCI: true,
    },
    token: 'fake-token',
    isAuthenticated: true,
    isLoading: false,
    error: null,
    login: vi.fn(),
    logout: vi.fn(),
    sessionExpiresAt: Date.now() + 8 * 60 * 60 * 1000,
  })),
}));

describe('PlanificacionView', () => {
  const mockedUseManager = vi.mocked(usePlanificacionManager);
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
    cargarHorarios: vi.fn()
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
    mockedUseManager.mockReturnValue(mockManager as unknown as ReturnType<typeof usePlanificacionManager>);
    mockedUseLogic.mockReturnValue(mockLogic as unknown as ReturnType<typeof usePlanificacionLogic>);
  });

  it('debería mostrar el spinner de carga cuando sincroniza con Oracle', () => {
    mockedUseManager.mockReturnValue({ ...mockManager, cargandoPlan: true } as unknown as ReturnType<typeof usePlanificacionManager>);

    render(<PlanificacionView />);
    expect(screen.getByText(/Sincronizando con Oracle/i)).toBeInTheDocument();
  });

  it('debería renderizar Calendario y Panel Lateral', () => {
    render(<PlanificacionView />);
    expect(screen.getByTestId('calendario')).toBeInTheDocument();
    expect(screen.getByTestId('panel')).toBeInTheDocument();
  });
});