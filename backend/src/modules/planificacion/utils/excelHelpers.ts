/**
 * Normaliza el valor de un campo de activo/descripción para comparación robusta:
 * convierte a mayúsculas, elimina espacios extremos, quita ceros a la izquierda
 * y colapsa espacios dobles.
 */
export const limpiarKey = (valor: any): string => {
  if (!valor) return "";
  return String(valor).toUpperCase().trim().replace(/^0+/, '').replace(/\s\s+/g, ' ');
};

/**
 * Busca en los campos de una fila de historial el nombre del técnico responsable.
 * Busca columnas que contengan 'EMPLEADO', 'TECNICO' o 'RESPONSABLE'
 * (excluyendo 'SOLICITA' y 'CREADO' para evitar falsos positivos).
 * Retorna el nombre en mayúsculas o string vacío si no se encuentra.
 */
export const buscarNombreEnFila = (fila: any): string => {
  const keys = Object.keys(fila);
  const keyNombre = keys.find(k => {
    const cleanK = k.toUpperCase();
    return (cleanK.includes("EMPLEADO") || cleanK.includes("TECNICO") || cleanK.includes("RESPONSABLE"))
      && !cleanK.includes("SOLICITA") && !cleanK.includes("CREADO");
  });
  if (keyNombre && fila[keyNombre]) return String(fila[keyNombre]).trim().toUpperCase();
  return "";
};

/**
 * Mapea el nombre del departamento de propiedad de una OT a su código de planta interno.
 * Evalúa palabras clave del nombre del departamento para identificar la planta correcta.
 * Retorna 'OTROS' si no coincide con ningún patrón conocido.
 */
export const mapDepartamentoAPlanta = (deptoRaw: string): string => {
  const d = String(deptoRaw || "").trim().toUpperCase();
  if (!d) return "OTROS";
  if (d.includes("SADEMA")) return "SADEMA";
  if (d.includes("PF1")) return "PF1";
  if (d.includes("PF2")) return "PF2";
  if (d.includes("PF3")) return "PF3";
  if (d.includes("PF4")) return "PF4";
  if (d.includes("PF5")) return "PF5";
  if (d.includes("PF6")) return "PF6";
  if (d.includes("JAMON") || d.includes("JAMÓN")) return "PF4";
  if (d.includes("PIZZA")) return "PF5";
  if (d.includes("PLATO")) return "PF6";
  if (d.includes("MANTENCION") || d.includes("MANTENCIÓN") || d.includes("MANT.")) return "PF3";
  if (d.includes("VENTAS") || d.includes("DATA") || d.includes("LOGISTICA") || d.includes("CDT")) return "CDT";
  return "OTROS";
};