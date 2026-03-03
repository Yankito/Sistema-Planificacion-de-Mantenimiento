// @vitest-environment happy-dom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TrendChart } from '../TrendChart';

describe('TrendChart Component', () => {
  const mockTimelineStats = {
    chartData: [
      { semana: 1, count: 5, rango: '01/01 - 07/01' },
      { semana: 2, count: 10, rango: '08/01 - 14/01' }
    ],
    maxVal: 10
  };

  const mockTimelineStatsPrev = {
    chartData: [
      { semana: 1, count: 8, rango: '01/01 - 07/01' },
      { semana: 2, count: 4, rango: '08/01 - 14/01' }
    ],
    maxVal: 8
  };

  const defaultProps = {
    timelineStats: mockTimelineStats,
    semanaFiltro: "TODAS",
    setSemanaFiltro: vi.fn(),
    filtroDrill: null,
    setFiltroDrill: vi.fn(),
  };

  it('debería renderizar el título correctamente', () => {
    render(<TrendChart {...defaultProps} />);
    expect(screen.getByText('Tendencia Anual Global')).toBeInTheDocument();
  });

  it('debería renderizar el título con filtroDrill', () => {
    render(<TrendChart {...defaultProps} filtroDrill={{ tipo: 'ACTIVO', valor: 'MOTOR_1' }} />);
    expect(screen.getByText('Tendencia: MOTOR_1')).toBeInTheDocument();
  });

  it('debería manejar click en una semana', () => {
    const setSemanaFiltroMock = vi.fn();
    render(<TrendChart {...defaultProps} setSemanaFiltro={setSemanaFiltroMock} />);

    const weekButton = screen.getByRole('button', { name: "Semana 1: 5 fallas" });
    fireEvent.click(weekButton);
    expect(setSemanaFiltroMock).toHaveBeenCalledWith("1");
  });

  it('debería renderizar comparativa correctamente', () => {
    render(
      <TrendChart
        {...defaultProps}
        timelineStatsPrev={mockTimelineStatsPrev}
        showComparison={true}
      />
    );
    expect(screen.getByRole('button', { name: "Semana 1: 5 fallas" })).toBeInTheDocument();
  });
});
