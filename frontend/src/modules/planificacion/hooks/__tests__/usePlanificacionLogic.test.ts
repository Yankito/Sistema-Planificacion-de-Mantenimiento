// @vitest-environment happy-dom
import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useModalAsignacion } from '../useModalAsignacion';
import type { PlanResult, Tecnico } from '../../types';

// --- DATA MOCK TIPADA ---
const mockTecnicos: Tecnico[] = [
    { nombre: 'JUAN', rol: 'M', planta: 'PF1' },      // Mecánico PF1 (OK)
    { nombre: 'PEDRO', rol: 'M', planta: 'PF1' },     // Mecánico PF1 (Mañana)
    { nombre: 'ANA', rol: 'E', planta: 'PF1' },       // Eléctrico (Rol NO)
    { nombre: 'LUIS', rol: 'M', planta: 'PF2' },      // Mecánico PF2 (Planta NO)
    { nombre: 'JEFE', rol: 'SUPERVISOR', planta: 'PF1' } // Exento
];

const mockHorarios = new Map<string, string[]>();
const emptyMonth = Array(31).fill('L');

// JUAN: Noche el día 2 (Index 1)
const turnosJuan = [...emptyMonth]; turnosJuan[1] = 'N'; 
mockHorarios.set('JUAN', turnosJuan);

// PEDRO: Mañana el día 2 (Index 1)
const turnosPedro = [...emptyMonth]; turnosPedro[1] = 'M';
mockHorarios.set('PEDRO', turnosPedro);

// JEFE: Mañana pero exento
const turnosJefe = [...emptyMonth]; turnosJefe[1] = 'M';
mockHorarios.set('JEFE', turnosJefe);

describe('useModalAsignacion Hook', () => {
    
    const mockOnAsignar = vi.fn();
    const ordenBase: PlanResult = {
        nroOrden: 'OT-100',
        equipo: 'EQUIPO_1',
        descripcion: 'TEST',
        planta: 'PF1',
        fechaSugerida: '02/02/2026',
        fechaAnterior: 'N/A',
        tecnicos: [
            { nombre: 'VACANTE', rol: 'M' } 
        ]
    };

    it('debería identificar el sábado para aplicar bloqueos de turno especiales', () => {
        const { result } = renderHook(() => useModalAsignacion({
            orden: ordenBase,
            fecha: '07/02/2026', // Sábado
            tecnicos: [],
            mapaHorarios: new Map(),
            onAsignar: mockOnAsignar
        }));

        expect(result.current.esSabado).toBe(true);
    });

    it('debería filtrar candidatos disponibles según compatibilidad de Planta y Rol', () => {
        const { result } = renderHook(() => useModalAsignacion({
            orden: ordenBase,
            fecha: '02/02/2026', 
            tecnicos: mockTecnicos,
            mapaHorarios: mockHorarios,
            onAsignar: mockOnAsignar
        }));

        const candidatos = result.current.getCandidatosParaSlot('M', 'VACANTE');
        const nombres = candidatos.map(c => c.nombre);

        expect(nombres).toContain('JUAN');
        expect(nombres).toContain('PEDRO');
        expect(nombres).not.toContain('LUIS'); // Falla por planta PF2
    });

    it('debería marcar disponibilidad falsa si el técnico no tiene turno de Noche ("N")', () => {
        const { result } = renderHook(() => useModalAsignacion({
            orden: ordenBase,
            fecha: '02/02/2026', 
            tecnicos: mockTecnicos,
            mapaHorarios: mockHorarios,
            onAsignar: mockOnAsignar
        }));

        const candidatos = result.current.getCandidatosParaSlot('M', 'VACANTE');
        
        const juan = candidatos.find(c => c.nombre === 'JUAN');
        const pedro = candidatos.find(c => c.nombre === 'PEDRO');

        expect(juan?.estaDisponible).toBe(true);  // Turno N
        expect(pedro?.estaDisponible).toBe(false); // Turno M
    });

    it('debería permitir la asignación de Supervisores ignorando la validación de turno', () => {
        const ordenSup: PlanResult = { 
            ...ordenBase, 
            tecnicos: [{ nombre: 'VACANTE', rol: 'SUPERVISOR' }] 
        };

        const { result } = renderHook(() => useModalAsignacion({
            orden: ordenSup,
            fecha: '02/02/2026',
            tecnicos: mockTecnicos,
            mapaHorarios: mockHorarios,
            onAsignar: mockOnAsignar
        }));

        const candidatos = result.current.getCandidatosParaSlot('SUPERVISOR', 'VACANTE');
        const jefe = candidatos.find(c => c.nombre === 'JEFE');

        expect(jefe?.estaDisponible).toBe(true); // Exento
    });

    it('debería marcar como "yaEnUso" si un técnico ya fue seleccionado en otro slot de la misma OT', () => {
        const ordenOcupada: PlanResult = {
            ...ordenBase,
            tecnicos: [
                { nombre: 'JUAN', rol: 'M' },   
                { nombre: 'VACANTE', rol: 'M' } 
            ]
        };

        const { result } = renderHook(() => useModalAsignacion({
            orden: ordenOcupada,
            fecha: '02/02/2026',
            tecnicos: mockTecnicos,
            mapaHorarios: mockHorarios,
            onAsignar: mockOnAsignar
        }));

        const candidatos = result.current.getCandidatosParaSlot('M', 'VACANTE');
        const juan = candidatos.find(c => c.nombre === 'JUAN');

        expect(juan?.yaEnUso).toBe(true); // No se puede duplicar a Juan en la misma OT
    });

    it('debería ejecutar la sugerencia automática eligiendo al técnico óptimo', () => {
        const { result } = renderHook(() => useModalAsignacion({
            orden: ordenBase,
            fecha: '02/02/2026',
            tecnicos: mockTecnicos,
            mapaHorarios: mockHorarios,
            onAsignar: mockOnAsignar
        }));

        act(() => {
            result.current.sugerirTecnicosFaltantes();
        });

        // Debe elegir a JUAN (Cumple: Planta, Rol y Turno)
        expect(mockOnAsignar).toHaveBeenCalledWith(
            'OT-100', 
            0,        
            'JUAN',   
            true      
        );
    });
});