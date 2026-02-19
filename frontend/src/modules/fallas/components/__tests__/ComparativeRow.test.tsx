// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ComparativeRow } from '../ComparativeRow';
import type { GrupoMecanicoStats } from '../../types';

// 1. Mock de datos tipado bajo la interfaz real
const mockItem: GrupoMecanicoStats = {
  label: 'MOTOR_A',
  count: 10,       // Actual
  prevCount: 5,    // Anterior (Empeoró: +5 fallas)
  gasto: 1000,     // Actual
  prevGasto: 1200, // Anterior (Mejoró: -$200)
  tiempo: 60,
  prevTiempo: 45,
  prevMttr: 45,
  mttr: 60
};

describe('ComparativeRow Component', () => {
  const formatFn = (v: number) => `${v}`;
  const noop = () => {};

  it('debería renderizar la etiqueta y el valor actual correctamente', () => {
    render(
      <ComparativeRow 
        item={mockItem}
        maxValGlobal={20}
        formatFn={formatFn}
        type="FREQ"
        onClick={noop}
        active={false}
        showComparison={false}
        anioFiltro={2026}
      />
    );

    expect(screen.getByText('MOTOR_A')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
  });

  it('debería mostrar barra ROJA si la frecuencia aumentó (Peor)', () => {
    // FREQ: 5 -> 10 es un aumento de fallas, por lo tanto es negativo (Rojo)
    render(
      <ComparativeRow 
        item={mockItem}
        maxValGlobal={20}
        formatFn={formatFn}
        type="FREQ"
        onClick={noop}
        active={false}
        showComparison={true}
        anioFiltro={2026}
      />
    );

    const progressBar = screen.getByTestId('progress-bar');
    expect(progressBar.className).toContain('bg-red-500');
    // Verificamos que aparezca el indicador de tendencia
    expect(screen.getByText('5')).toBeInTheDocument(); 
  });

  it('debería mostrar barra VERDE si el costo disminuyó (Mejor)', () => {
    // COST: 1200 -> 1000 es una baja en gasto, por lo tanto es positivo (Verde)
    render(
      <ComparativeRow 
        item={mockItem}
        maxValGlobal={2000}
        formatFn={formatFn}
        type="COST"
        onClick={noop}
        active={false}
        showComparison={true}
        anioFiltro={2026}
      />
    );

    const progressBar = screen.getByTestId('progress-bar');
    expect(progressBar.className).toContain('bg-emerald-500');
    expect(screen.getByText('200')).toBeInTheDocument(); // La diferencia absoluta
  });

  it('debería aplicar clase de "active" cuando el prop es true', () => {
    render(
      <ComparativeRow 
        item={mockItem}
        maxValGlobal={20}
        formatFn={formatFn}
        type="FREQ"
        onClick={noop}
        active={true}
        showComparison={false}
        anioFiltro={2026}
      />
    );

    // Seguimos usando screen, que es la mejor práctica recomendada por Testing Library
    const mainDiv = screen.getByRole('button');
    expect(mainDiv.className).toContain('bg-slate-50');
    expect(mainDiv.className).toContain('border-slate-300');
  });

  it('debería usar color PÚRPURA para MTTR cuando no hay comparación', () => {
    render(
      <ComparativeRow 
        item={mockItem}
        maxValGlobal={100}
        formatFn={formatFn}
        type="MTTR"
        onClick={noop}
        active={false}
        showComparison={false}
        anioFiltro={2026}
      />
    );

    const progressBar = screen.getByTestId('progress-bar');
    expect(progressBar.className).toContain('bg-purple-600');
  });
});