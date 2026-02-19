// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { KpiTile } from '../KpiTile';
import { DollarSign } from 'lucide-react';

describe('KpiTile Component', () => {

  it('debería renderizar título y valor correctamente', () => {
    render(
      <KpiTile 
        title="Total Ventas" 
        value="$1000" 
        icon={DollarSign} 
        color="blue" 
      />
    );

    expect(screen.getByText(/total ventas/i)).toBeInTheDocument();
    expect(screen.getByText('$1000')).toBeInTheDocument();
  });

  it('debería mostrar indicador VERDE si baja y es algo bueno (inverse=false)', () => {
    render(
      <KpiTile 
        title="Ventas" 
        value="150" 
        icon={DollarSign} 
        color="blue"
        previousValue={100}
        currentValue={50} // Bajó 50
      />
    );

    const indicator = screen.getByTestId('kpi-indicator');
    // Verifica clase de color verde
    expect(indicator.className).toContain('bg-emerald-100');
    expect(screen.getByText('50')).toBeInTheDocument();
  });

  it('debería mostrar indicador ROJO si sube y es algo malo (inverse=true)', () => {
    // Caso: Costos o Fallas (si suben es malo)
    render(
      <KpiTile 
        title="Costos" 
        value="$150" 
        icon={DollarSign} 
        color="red"
        previousValue={100}
        currentValue={150} // Subió 50
      />
    );

    const indicator = screen.getByTestId('kpi-indicator');
    // Verifica clase de color rojo
    expect(indicator.className).toContain('bg-red-100');
  });

  it('debería mostrar indicador ROJO si sube y es algo malo (inverse=false)', () => {
    // Caso: Bajaron los costos (Eso es bueno)
    render(
      <KpiTile 
        title="Costos" 
        value="$80" 
        icon={DollarSign} 
        color="red"
        previousValue={100}
        currentValue={120} // Subió 20
        inverse={false}
      />
    );

    const indicator = screen.getByTestId('kpi-indicator');
    expect(indicator.className).toContain('bg-red-100');
    expect(screen.getByText('20')).toBeInTheDocument();
  });

  it('debería formatear la diferencia si se pasa formatter', () => {
    const formatFn = (val: number) => `$${val}.00`;
    
    render(
      <KpiTile 
        title="Test" 
        value="0" 
        icon={DollarSign} 
        color="blue"
        previousValue={100}
        currentValue={200}
        formatter={formatFn}
      />
    );

    expect(screen.getByText('$100.00')).toBeInTheDocument();
  });
});