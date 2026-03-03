// @vitest-environment happy-dom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { OTCard } from '../OTCard'; // Asegúrate que la ruta sea correcta
import '@testing-library/jest-dom';
import type { AtrasoRow } from '../../types';

describe('OTCard Component (UI)', () => {

    // Mock acorde a tu interfaz AtrasoRow
    const mockItem: AtrasoRow = {
        nroOrden: "OT-500",
        nroActivo: "1",
        clasificacion: "PROGRAMADOR", // Debería pintar verde
        descripcion: "Falla crítica en línea 1",
        detallesTecnicos: [
            { tecnico: { nombre: "JUAN PEREZ", rol: "M", planta: "PF1" }, opFinalizada: false }
        ],
        periodo: "2026",
        planta: "PF1",
        rmd: "SI",
        rse: "NO", // Probamos uno mixto
        semana: "2026-S05",
        estado: "Liberado",
        esOB: false
    };

    it('debe mostrar la etiqueta NUEVA si isNew es true', () => {
        render(<OTCard item={mockItem} isNew={true} />);
        const badge = screen.getByText("NUEVA");
        expect(badge).toBeInTheDocument();
        expect(badge).toHaveClass("bg-pf-red-600");
    });

    it('debe renderizar indicadores RMD (Verde) y RSE (Rojo) correctamente', () => {
        render(<OTCard item={mockItem} />);

        // Buscamos el contenedor de RMD (SI -> Verde)
        const rmdValue = screen.getByText("SI");
        // El padre del texto "SI" debería tener clase verde
        expect(rmdValue.parentElement).toHaveClass("bg-pf-success-50");

        // Buscamos el contenedor de RSE (NO -> Rojo)
        const rseValue = screen.getByText("NO");
        expect(rseValue.parentElement).toHaveClass("bg-pf-red-50");
    });

    it('debe permitir seleccionar un técnico al hacer click', () => {
        const handleSelect = vi.fn(); // Mock function
        render(<OTCard item={mockItem} onSelectTech={handleSelect} />);

        // Buscamos al técnico
        const techElement = screen.getByText("JUAN PEREZ");
        fireEvent.click(techElement);

        // Verificamos que la función se llamó con el nombre correcto
        expect(handleSelect).toHaveBeenCalledWith("JUAN PEREZ");
    });

    it('debe mostrar la clasificación con el color correcto (Programador = Morado)', () => {
        render(<OTCard item={mockItem} />);
        const badge = screen.getByText("PROGRAMADOR");
        expect(badge).toHaveClass("bg-pf-blue-100");
    });
});