import type { Request, Response } from 'express';
import XLSX from "xlsx-js-style";
import { PlanificacionRepository } from './repository.js';
import { PlannerService } from './logic/PlannerService.js';
import type { OrdenTrabajo, Tecnico } from '../../shared/types/index.js';

/**
 * Controlador del módulo de Planificación.
 * Cubre la ejecución del algoritmo de planificación, consulta/guardado de asignaciones,
 * gestión de horarios de técnicos y carga de archivos Excel.
 */
/** Procesa la hoja de técnicos del Excel y los guarda en la base de datos. */
const procesarHojaTecnicos = async (workbook: XLSX.WorkBook, sheetNames: string[]): Promise<number> => {
  const hojaNombre = sheetNames.find(s => ['EMPLEADOS', 'TECNICOS', 'EMPLEADO', 'TECNICO'].includes(s.trim().toUpperCase()));
  if (!hojaNombre) return 0;

  const data = XLSX.utils.sheet_to_json(workbook.Sheets[hojaNombre]);
  const mapped = data.map((e: any) => ({
    nombre: String(e.EMPLEADO || e.Empleado || e.NOMBRE || e.Nombre || e.TECNICO || '').trim().toUpperCase(),
    planta: String(e.PLANTA || e.Planta || '').trim(),
    rol: String(e.ROL || e.Rol || 'M').trim()
  })).filter(e => e.nombre);

  if (mapped.length > 0) {
    await PlanificacionRepository.upsertEmpleados(mapped);
  }
  return mapped.length;
};

/** Procesa la hoja de horarios del Excel y los guarda en la base de datos. */
const procesarHojaHorarios = async (
  workbook: XLSX.WorkBook,
  sheetNames: string[],
  anioHorario: number | undefined,
  mesHorario: number | undefined
): Promise<number> => {
  const hojaNombre = sheetNames.find(s => ['HORARIOS', 'TURNOS'].includes(s.trim().toUpperCase()));
  if (!hojaNombre || !anioHorario || mesHorario === undefined) return 0;

  const horariosRaw: unknown[][] = XLSX.utils.sheet_to_json(workbook.Sheets[hojaNombre], { header: 1 });
  if (horariosRaw.length <= 1) return 0;

  const tecnicosValidos = await PlanificacionRepository.getAllNombresTecnicos();
  const horariosParaGuardar: { nombre: string, turnos: string[] }[] = [];

  // La primera fila es el encabezado; procesamos desde la segunda
  horariosRaw.slice(1).forEach(row => {
    const nombre = String(row[0] || '').trim().toUpperCase();
    if (tecnicosValidos.has(nombre)) {
      const turnos = row.slice(1, 32).map((t) => String(t || 'L').trim());
      horariosParaGuardar.push({ nombre, turnos });
    }
  });

  if (horariosParaGuardar.length > 0) {
    await PlanificacionRepository.guardarHorarios(horariosParaGuardar, anioHorario, mesHorario);
  }
  return horariosParaGuardar.length;
};

export const PlanificacionController = {

  /**
   * POST /api/planificacion/ejecutar
   * Ejecuta el algoritmo de planificación para un período (mes/año) y planta dados.
   * Soporta dos modos:
   *   - STRICT: prioriza continuidad histórica y turnos nocturnos coincidentes.
   *   - BALANCED: distribuye la carga de forma equitativa entre los días de la semana (Peak Shaving).
   * Retorna un objeto con las OTs asignadas y las que quedaron sin asignar.
   */
  ejecutarPlanificacion: async (req: Request, res: Response) => {
    try {
      const { mes, anio, modo, planta } = req.body;
      if (!mes || !anio) return res.status(400).json({ error: "Periodo (Mes y Año) no especificado" });

      // Calcular período anterior para consultar historial de técnicos
      let prevMes = Number(mes) - 1;
      let prevAnio = Number(anio);
      if (prevMes === 0) {
        prevMes = 12;
        prevAnio -= 1;
      }

      // Obtener OTs a planificar y técnicos activos del período actual
      const { ots, empleados } = await PlanificacionRepository.getDataParaPlanificar(Number(mes), Number(anio), planta);
      // Datos del período anterior para aplicar continuidad de técnicos
      const dfAnt = await PlanificacionRepository.getHistoricoPedidos(prevMes, prevAnio);
      const dfCumplimiento = await PlanificacionRepository.getHistoricoCompliance(prevMes, prevAnio);
      // Horarios del mes actual para validar disponibilidad nocturna
      const horarios = await PlanificacionRepository.getHorarios(Number(mes), Number(anio), planta);

      if (ots.length === 0) {
        return res.status(404).json({ error: `No hay OTs cargadas para este mes en Seguimiento${planta ? ' para la planta ' + planta : ''}.` });
      }

      // Normalizar OTs al formato que espera PlannerService
      const datosNormalizados = ots.map(ot => ({
        "NUMERO DE ACTIVO": ot.nroActivo,
        "DESCRIPCION": ot.descripcion,
        "PEDIDO DE TRABAJO": ot.nroOrden,
        "PLANTA": ot.planta,
        "DEPARTAMENTO": ot.planta
      }));

      // Construir mapa de técnicos: nombre -> { planta, rol }
      const tecnicosMap = new Map<string, { planta: string, rol: string }>();
      empleados.forEach(emp => {
        tecnicosMap.set(emp.NOMBRE.toUpperCase(), { planta: emp.PLANTA, rol: emp.ROL });
      });

      // Construir mapa de horarios: nombre -> array de 31 turnos
      const mapaHorarios = new Map<string, string[]>();
      horarios.forEach(h => {
        mapaHorarios.set(h.nombre.toUpperCase(), h.turnos);
      });

      // Ejecutar el algoritmo según el modo seleccionado
      let resultado;
      if (modo === 'BALANCED') {
        resultado = PlannerService.generarPlanificacionEquilibrada(datosNormalizados, dfAnt, dfCumplimiento, tecnicosMap);
      } else {
        // Modo STRICT: requiere el mapa de horarios para validar turnos nocturnos
        resultado = PlannerService.generarPlanificacion(datosNormalizados, dfAnt, dfCumplimiento, tecnicosMap, mapaHorarios);
      }

      res.json(resultado);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error desconocido";
      console.error("Error ejecucion remota:", message);
      res.status(500).json({ error: message });
    }
  },

  /**
   * GET /api/planificacion
   * Obtiene las OTs planificadas para un período y planta dados.
   * Retorna dos listas: OTs con técnicos asignados y OTs sin asignar.
   */
  obtenerPlanificacion: async (req: Request, res: Response) => {
    try {
      const { mes, anio, planta } = req.query;
      const data = await PlanificacionRepository.getPlanificacion(Number(mes), Number(anio), planta ? String(planta) : undefined);
      if (!data) {
        console.error(`obtenerPlanificacion: Error al obtener datos para periodo ${mes}-${anio}`);
        return res.json({ resultados: [], sinAsignar: [] });
      }

      // Transformar campos al formato que espera el frontend.
      // getDataParaPlanificar devuelve alias camelCase definidos en la SQL:
      // nroOrden, nroActivo, descripcion, estado, fecha, PLANTA, detallesTecnicos (ya parseado)
      const resultados: OrdenTrabajo[] = data.map((ot: Record<string, any>) => {
        let tecnicos: Tecnico[];
        if (Array.isArray(ot.detallesTecnicos)) {
          tecnicos = ot.detallesTecnicos;
        } else if (typeof ot.detallesTecnicos === 'string') {
          tecnicos = JSON.parse(ot.detallesTecnicos);
        } else {
          tecnicos = [];
        }
        return {
          nroOrden: ot.nroOrden,
          nroActivo: ot.nroActivo,
          planta: ot.planta,
          descripcion: ot.descripcion,
          esOB: false,
          fechaSugerida: ot.fecha || null,
          tecnicos,
          estado: ot.estado,
          periodo: `${anio}-${mes}`
        };
      });

      // Separar en asignadas (tienen al menos un técnico no-VACANTE) y sin asignar
      const asignados = resultados.filter(ot =>
        ot.tecnicos?.some((t: { nombre?: string }) => t.nombre && t.nombre !== "VACANTE")
      );

      const sinAsignar = resultados.filter(ot =>
        !ot.tecnicos?.some((t: { nombre?: string }) => t.nombre && t.nombre !== "VACANTE")
      );

      res.json({ resultados: asignados, sinAsignar });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error desconocido";
      console.error("FATAL ERROR in obtenerPlanificacion:", message);
      res.status(500).json({ error: message });
    }
  },

  /**
   * POST /api/planificacion/guardar
   * Persiste en la base de datos las asignaciones de técnicos a OTs.
   * Recibe un array de datos con nroOrden, tecnicos, mes y anio.
   */
  guardarPlanificacion: async (req: Request, res: Response) => {
    try {
      const { datos } = req.body;
      if (!Array.isArray(datos) || datos.length === 0) {
        return res.status(400).json({ error: "Lista de datos requerida" });
      }

      // Normalizar al formato que espera el repositorio
      const asignaciones = datos.map((d: Record<string, any>) => ({
        nroOrden: d.nroOrden,
        tecnicos: d.tecnicos,
        mes: d.mes,
        anio: d.anio
      }));

      await PlanificacionRepository.guardarPlanificacion(asignaciones);
      res.json({ success: true, count: asignaciones.length });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error desconocido";
      console.error("Error guardando planificacion:", message);
      res.status(500).json({ error: message });
    }
  },

  /**
   * GET /api/planificacion/horarios
   * Retorna los horarios de turnos de los técnicos para un período y planta dados.
   */
  listarHorarios: async (req: Request, res: Response) => {
    try {
      const { mes, anio, planta } = req.query;
      const data = await PlanificacionRepository.getHorarios(Number(mes), Number(anio), planta ? String(planta) : null);
      res.json({ periodo: `${mes}-${anio}`, count: data.length, data });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error desconocido";
      res.status(500).json({ error: message });
    }
  },

  /**
   * PUT /api/planificacion/turno
   * Actualiza o crea manualmente el turno de un técnico para un período específico.
   * Recibe: nombre, turnos (array de string), mes y anio.
   */
  actualizarTurno: async (req: Request, res: Response) => {
    try {
      const { nombre, turnos, mes, anio } = req.body;
      await PlanificacionRepository.upsertHorarioManual(mes, anio, nombre, turnos);
      res.json({ success: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error desconocido";
      res.status(500).json({ error: message });
    }
  },

  /**
   * POST /api/planificacion/horarios/upload
   * Carga desde un Excel los técnicos (hoja EMPLEADOS/TECNICOS) y sus horarios (hoja HORARIOS).
   * El archivo debe contener el mes y año en el body del request.
   * Solo se persisten los técnicos cuyo nombre ya exista en la tabla PF_SPM_TECNICOS.
   */
  uploadHorarios: async (req: Request, res: Response) => {
    try {
      if (!req.file) return res.status(400).json({ error: "Archivo requerido" });

      const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
      const sheetNames = workbook.SheetNames;

      const anioHorario = req.body.anio ? Number(req.body.anio) : undefined;
      const mesHorario = req.body.mes ? Number(req.body.mes) : undefined;

      const empleados = await procesarHojaTecnicos(workbook, sheetNames);
      const horarios = await procesarHojaHorarios(workbook, sheetNames, anioHorario, mesHorario);

      res.json({ success: true, counts: { empleados, horarios } });

    } catch (error) {
      const message = error instanceof Error ? error.message : "Error desconocido";
      console.error("Error uploadHorarios:", message);
      res.status(500).json({ error: message });
    }
  }
};