// @vitest-environment happy-dom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Calendario } from '../Calendario';
import '@testing-library/jest-dom';
import type { PlanResult } from '../../types';

describe('Componente Calendario', () => {
  const mockProps = {
    planResult: [{ nroOrden: '1', equipo: 'Equipo 1', descripcion: 'Descripción 1', planta: 'Planta 1', fechaAnterior: '01/01/2026', fechaSugerida: '01/02/2026', tecnicos: [] }] as PlanResult[],
    diaSeleccionado: null,
    setDiaSeleccionado: vi.fn(),
    draggingOT: null,
    handleDragEnter: vi.fn(),
    handleDragOver: vi.fn(),
    handleDrop: vi.fn(),
    isNocheValid: vi.fn(() => true),
    showSuccess: false,
    dragOverDate: null,
    ordenesPorDia: {
      '01/02/2026': [
        { nroOrden: '1', tecnicos: [{ nombre: 'JUAN', rol: 'Mecanico', planta: 'Planta 1' }], fechaSugerida: '01/02/2026', planta: 'Planta 1', equipo: 'Equipo 1', descripcion: 'Descripción 1', fechaAnterior: '01/01/2026', esOB: false } as PlanResult,
        { nroOrden: '2', tecnicos: [{ nombre: 'VACANTE', rol: 'VACANTE', planta: 'Planta 1' }], fechaSugerida: '01/02/2026', planta: 'Planta 1', equipo: 'Equipo 2', descripcion: 'Descripción 2', fechaAnterior: '01/01/2026', esOB: false } as PlanResult
      ]
    } as Record<string, PlanResult[]>,
    mostrarSoloVacantes: false,
    setMostrarSoloVacantes: vi.fn(),
    handleSugerirTodo: vi.fn(),
    periodoSeleccionado: '2026-02',
    mapaHorarios: new Map<string, string[]>(),
    cargandoPlan: false
  };

  it('debe renderizar el mes y el año correctamente basado en los datos', () => {
    render(<Calendario {...mockProps} />);
    // useCalendarioGrid debería procesar 2026-02 como Febrero 2026
    expect(screen.getByText(/FEBRERO 2026/i)).toBeInTheDocument();
  });

  it('debe mostrar el total de OTs del mes', () => {
    render(<Calendario {...mockProps} />);
    const totalBadge = screen.getByText((content, element) => {
      return element?.tagName.toLowerCase() === 'span' && content.includes('2') && content.includes('OTS');
    });
    expect(totalBadge).toBeInTheDocument();
  });

  it('debe llamar a setMostrarSoloVacantes al hacer click en el botón de filtro', () => {
    render(<Calendario {...mockProps} />);
    const btnFiltro = screen.getByRole('button', { name: /Filtrar Sin Técnico/i });
    fireEvent.click(btnFiltro);
    expect(mockProps.setMostrarSoloVacantes).toHaveBeenCalledWith(true);
  });

  it('debe cambiar el texto del botón cuando mostrarSoloVacantes es true', () => {
    render(<Calendario {...mockProps} mostrarSoloVacantes={true} />);
    expect(screen.getByText('Mostrando Incompletas')).toBeInTheDocument();
  });

  it('debe mostrar la notificación de éxito cuando showSuccess es true', () => {
    const mensaje = "Guardado con éxito";
    render(<Calendario {...mockProps} showSuccess={true} mensajeExito={mensaje} />);
    expect(screen.getByText(mensaje)).toBeInTheDocument();
  });

  it('debe resaltar visualmente los días que tienen vacantes', () => {
    render(<Calendario {...mockProps} />);
    // El día 1 tiene una vacante según el mock
    const indicadorVacante = screen.getByTitle('Tiene vacantes');
    expect(indicadorVacante).toBeInTheDocument();
  });

  it('debe llamar a handleSugerirTodo al pulsar el botón de Auto-Completar', () => {
    render(<Calendario {...mockProps} />);
    const btnAuto = screen.getByText(/Auto-Completar Vacantes/i);
    fireEvent.click(btnAuto);
    expect(mockProps.handleSugerirTodo).toHaveBeenCalled();
  });

  it('debe activar la selección de un día al hacer click en el número del día', () => {
    render(<Calendario {...mockProps} />);
    const diaUno = screen.getByText('1').closest('div');
    fireEvent.click(diaUno!);
    expect(mockProps.setDiaSeleccionado).toHaveBeenCalledWith('01/02/2026');
  });

});