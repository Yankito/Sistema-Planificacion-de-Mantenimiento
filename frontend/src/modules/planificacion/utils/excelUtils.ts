/**
 * Normaliza una clave eliminando ceros a la izquierda y espacios extra.
 * Crítico para comparar RUTs o códigos de activo.
 */
export const limpiarKey = (valor: string | number | null | undefined): string => {
  if (valor === null || valor === undefined) return "";
  return String(valor)
    .toUpperCase()
    .trim()
    .replace(/^0+/, '')         // Elimina ceros a la izquierda
    .replace(/\s\s+/g, ' ');    // Reduce espacios múltiples a uno solo
};

/**
 * Busca de forma inteligente la columna que contiene el nombre del técnico
 * ignorando columnas de metadatos (quien creó la OT, etc).
 */
export const buscarNombreEnFila = (fila: Record<string, unknown>): string => {
  const keys = Object.keys(fila);
  const keyNombre = keys.find(k => {
    const cleanK = k.toUpperCase();
    return (
      (cleanK.includes("EMPLEADO") || cleanK.includes("TECNICO") || cleanK.includes("RESPONSABLE")) &&
      !cleanK.includes("SOLICITA") &&
      !cleanK.includes("CREADO")
    );
  });

  if (keyNombre && fila[keyNombre]) {
    return String(fila[keyNombre]).trim().toUpperCase();
  }
  return "";
};

/**
 * Traduce los departamentos del sistema central a las siglas de planta de PF.
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