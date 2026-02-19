import { describe, it, expect } from 'vitest';
import { limpiarKey, buscarNombreEnFila, mapDepartamentoAPlanta } from '../excelUtils';

describe('Limpieza y Mapeo de Datos', () => {

  it('debería limpiar claves eliminando ceros y espacios redundantes', () => {
    expect(limpiarKey("  0001234  ")).toBe("1234");
    expect(limpiarKey("MOTOR   XYZ")).toBe("MOTOR XYZ");
    expect(limpiarKey(null)).toBe("");
  });

  it('debería encontrar el nombre del técnico en una fila de Excel con nombres variables', () => {
    const fila = {
      "ID": 1,
      "TECNICO_ASIGNADO": "Juan Perez",
      "USUARIO_CREADO": "Admin"
    };
    expect(buscarNombreEnFila(fila)).toBe("JUAN PEREZ");
  });

  it('debería mapear departamentos a plantas correctamente (PF Alimentos Logic)', () => {
    expect(mapDepartamentoAPlanta("ELABORACION JAMONES")).toBe("PF4");
    expect(mapDepartamentoAPlanta("MANTENCION PF3")).toBe("PF3"); // Mantención centralizada en PF3
    expect(mapDepartamentoAPlanta("LOGISTICA CENTRAL")).toBe("CDT");
    expect(mapDepartamentoAPlanta("CUALQUIER COSA")).toBe("OTROS");
  });
});