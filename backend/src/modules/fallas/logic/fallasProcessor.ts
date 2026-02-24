// src/logic/fallasProcessor.ts
import XLSX from "xlsx-js-style";
import { type FallaRow } from "../types.js";

// Helper para limpiar dinero: "$510.164" -> 510164
const parseDineroLocal = (valor: unknown): number => {
  if (typeof valor === 'number') return valor;
  if (!valor) return 0;

  const str = String(valor);
  const limpio = str
    .replace(/\$/g, '')
    .replace(/\s/g, '')
    .replace(/\./g, '')
    .replace(',', '.');

  const numero = parseFloat(limpio);
  return isNaN(numero) ? 0 : numero;
};

// Helper para fecha corregido y robusto
const parseFechaLocal = (valor: unknown): Date | null => {
  if (!valor) return null;

  let fecha: Date | null = null;

  // Caso 1: Excel Serial (Número puro)
  if (typeof valor === 'number') {
    // Ajuste Excel (Base 1900) - 25569 días offset unix
    fecha = new Date(Math.round((valor - 25569) * 86400 * 1000));
  }
  // Caso 2: String que parece número (ej: "45321")
  else if (typeof valor === 'string' && !isNaN(Number(valor)) && !valor.includes('/') && !valor.includes('-')) {
    fecha = new Date(Math.round((Number(valor) - 25569) * 86400 * 1000));
  }
  // Caso 3: String con formato DD/MM/YYYY o YYYY-MM-DD
  else if (typeof valor === 'string') {
    // Intento DD/MM/YYYY
    if (valor.includes('/')) {
      const partes = valor.split('/');
      if (partes.length === 3) {
        // Asumimos DD/MM/YYYY
        const dia = parseInt(partes[0], 10);
        const mes = parseInt(partes[1], 10) - 1;
        const anio = parseInt(partes[2], 10);
        // Si el año es de 2 dígitos (ej: 24), asumimos 2000
        const anioFull = anio < 100 ? 2000 + anio : anio;
        fecha = new Date(anioFull, mes, dia);
      }
    }
    // Intento ISO YYYY-MM-DD
    else if (valor.includes('-')) {
      fecha = new Date(valor);
    }
    // Intento estándar
    else {
      fecha = new Date(valor);
    }
  }

  // Validación final: Si es inválida o NaN, devolvemos null (NO devuelve "new Date()" para no falsear datos)
  if (fecha && !isNaN(fecha.getTime())) {
    fecha.setHours(0, 0, 0, 0);
    return fecha;
  }

  return null;
};

// --- CÁLCULO DE SEMANA ESTÁNDAR (ISO 8601 Compatible) ---
// Esto asegura consistencia entre años (Lunes a Domingo)
const calcularSemana = (d: Date): number => {
  // Copiamos fecha para no mutar original
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  // Establecer al jueves más cercano: current date + 4 - current day number
  // Hace que el domingo sea 7
  date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
  // Obtener primer día del año
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  // Calcular número de semanas completas hasta la fecha
  const weekNo = Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return weekNo;
};

export const processFallasData = (sheets: XLSX.WorkBook['Sheets']): FallaRow[] => {
  const sheetName = "Detalle MTBF MTTR";
  const sheet = sheets[sheetName];

  if (!sheet) {
    console.error(`La hoja "${sheetName}" no se encuentra en el archivo.`);
    return [];
  }

  const rawData = XLSX.utils.sheet_to_json(sheet) as Record<string, unknown>[];
  const rowsProcesadas: FallaRow[] = [];

  rawData.forEach((row) => {
    const fechaObj = parseFechaLocal(row["Fecha"]);

    // SI LA FECHA ES INVÁLIDA, SALTAMOS LA FILA
    // Esto evita que datos corruptos aparezcan como "hoy"
    if (!fechaObj) {
      // Opcional: Log para depurar qué filas fallan
      // console.warn(`Fila tiene fecha inválida:`, row["Fecha"]);
      return;
    }

    const semana = calcularSemana(fechaObj);
    const duracion = parseDineroLocal(row["Duración Paro Oracle [min]"]);
    const gasto = parseDineroLocal(row["Gasto OM [$]"]);
    const perdida = parseDineroLocal(row["Pérdida por Paro [kg]"]);

    rowsProcesadas.push({
      fecha: fechaObj,
      anio: fechaObj.getFullYear(),
      mes: fechaObj.getMonth(),
      semana: semana,
      planta: String(row["Planta"] || "S/D").trim().toUpperCase(),
      area: String(row["Descripcion Area"] || "").trim().toUpperCase(),
      linea: String(row["Nombre Línea Prod"] || "").trim().toUpperCase(),
      equipo: String(row["Equipo Nombre"] || "Equipo Desconocido").trim().toUpperCase(),
      causa: String(row["Descripcion Causa"] || "").trim().toUpperCase(),
      estadoPedido: String(row["Estado Pedido"] || ""),
      tipoPedido: String(row["Tipo Pedido Trabajo"] || ""),
      tecnico: String(row["Técnico"] || ""),
      duracionMinutos: duracion,
      gasto: gasto,
      perdidaKg: perdida,
      descripcionOperador: String(row["Descripción Operador"] || ""),
    });
  });

  // Ordenamos por fecha descendente para ver lo más reciente primero
  return rowsProcesadas.sort((a, b) => b.fecha.getTime() - a.fecha.getTime());
};