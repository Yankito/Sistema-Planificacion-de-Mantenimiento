import { describe, it, expect } from 'vitest';
import * as XLSX from 'xlsx-js-style';
import { processFallasData } from '../fallasProcessor.js';

// Helper
const crearHoja = (data: any[]) => XLSX.utils.json_to_sheet(data);

describe('Fallas Processor (MTBF)', () => {

    it('debe procesar correctamente un listado de avisos (Hoja: Detalle MTBF MTTR)', () => {
        const rawData = [
            {
                "Fecha": 45325, // Fecha Excel
                "Planta": "PF1",
                "Equipo Nombre": "BOMBA-01",
                "Descripcion Causa": "Fuga de aceite",
                "Duración Paro Oracle [min]": 150,
                "Gasto OM [$]": "$50.000",
                "Pérdida por Paro [kg]": "100,5"
            }
        ];

        // IMPORTANTE: Usamos el nombre exacto que busca tu código
        const sheets = { "Detalle MTBF MTTR": crearHoja(rawData) };
        
        const resultados = processFallasData(sheets);

        expect(resultados).toHaveLength(1);
        const falla = resultados[0];

        // Validaciones
        expect(falla.planta).toBe("PF1");
        expect(falla.equipo).toBe("BOMBA-01");
        expect(falla.duracionMinutos).toBe(150);
        
        // Validación de limpieza de dinero
        expect(falla.gasto).toBe(50000); 
        
        // Validación de decimales con coma
        expect(falla.perdidaKg).toBe(100.5); 
        
        // Validación de cálculo de semana
        expect(falla.semana).toBeGreaterThan(0);
    });

    it('debe filtrar filas con fecha inválida', () => {
        const rawData = [
            { "Fecha": "FECHA_MALA", "Equipo Nombre": "BOMBA-02" }
        ];
        const sheets = { "Detalle MTBF MTTR": crearHoja(rawData) };
        
        const resultados = processFallasData(sheets);
        expect(resultados).toHaveLength(0);
    });

    it('debe retornar vacío si la hoja no existe', () => {
        const sheets = { "HojaIncorrecta": crearHoja([]) };
        const resultados = processFallasData(sheets);
        expect(resultados).toHaveLength(0);
    });
});