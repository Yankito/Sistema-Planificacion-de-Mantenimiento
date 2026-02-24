import type { Request, Response } from 'express';
import XLSX from "xlsx-js-style";
import { processExcelData } from './logic/excelProcessor.js';
import { PlanificacionRepository } from './repository.js';
import { PlannerService } from './logic/PlannerService.js';
import { query } from "../../db/config.js";
import type { OrdenTrabajo, Tecnico } from '../../types.js';

export const PlanificacionController = {

  ejecutarPlanificacion: async (req: Request, res: Response) => {
    try {
      const { mes, anio, modo, planta } = req.body;
      if (!mes || !anio) return res.status(400).json({ error: "Periodo (Mes y Año) no especificado" });

      // 0. Calcular periodo anterior para historial
      let prevMes = Number(mes) - 1;
      let prevAnio = Number(anio);
      if (prevMes === 0) {
        prevMes = 12;
        prevAnio -= 1;
      }

      // 1. Obtener datos crudos de las tablas
      // Actual (OTs a planificar)
      const { ots, empleados } = await PlanificacionRepository.getDataParaPlanificar(Number(mes), Number(anio), planta);
      // Historico (Para continuidad)
      const dfAnt = await PlanificacionRepository.getHistoricoPedidos(prevMes, prevAnio);
      const dfCumplimiento = await PlanificacionRepository.getHistoricoCompliance(prevMes, prevAnio);
      // Horarios (Para validar disponibilidad)
      const horarios = await PlanificacionRepository.getHorarios(Number(mes), Number(anio), planta);

      if (ots.length === 0) {
        return res.status(404).json({ error: `No hay OTs cargadas para este mes en Seguimiento${planta ? ' para la planta ' + planta : ''}.` });
      }

      // 2. Adaptar datos al formato que espera PlannerService
      const datosNormalizados = ots.map(ot => ({
        "NUMERO DE ACTIVO": ot.NRO_ACTIVO,
        "DESCRIPCION": ot.DESCRIPCION,
        "PEDIDO DE TRABAJO": ot.OT,
        "PLANTA": ot.PLANTA,
        "DEPARTAMENTO": ot.PLANTA // Fallback para mapDepartamentoAPlanta
      }));

      const tecnicosMap = new Map<string, { planta: string, rol: string }>();
      empleados.forEach(emp => {
        tecnicosMap.set(emp.NOMBRE.toUpperCase(), { planta: emp.PLANTA, rol: emp.ROL });
      });

      const mapaHorarios = new Map<string, string[]>();
      horarios.forEach(h => {
        mapaHorarios.set(h.nombre.toUpperCase(), h.turnos);
      });

      // 3. Ejecutar algoritmo
      let resultado;
      if (modo === 'BALANCED') {
        resultado = PlannerService.generarPlanificacionEquilibrada(datosNormalizados, dfAnt, dfCumplimiento, tecnicosMap);
      } else {
        // En modo STRICT (Continuidad), pasamos mapaHorarios para validar la noche
        resultado = PlannerService.generarPlanificacion(datosNormalizados, dfAnt, dfCumplimiento, tecnicosMap, mapaHorarios);
      }

      res.json(resultado);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error desconocido";
      console.error("Error ejecucion remota:", message);
      res.status(500).json({ error: message });
    }
  },

  obtenerPlanificacion: async (req: Request, res: Response) => {
    try {
      const { mes, anio, planta } = req.query;
      console.log(`Petición obtenerPlanificacion para periodo: ${mes}-${anio}, planta: ${planta || 'TODAS'}`);
      const data = await PlanificacionRepository.getPlanificacion(Number(mes), Number(anio), planta ? String(planta) : undefined);
      if (!data) {
        console.error(`obtenerPlanificacion: Error al obtener datos para periodo ${mes}-${anio}`);
        return res.json({ resultados: [], sinAsignar: [] });
      }

      console.log("data", data);

      // Adaptar campos de DB a formato frontend
      const resultados: OrdenTrabajo[] = data.map((ot: Record<string, any>) => ({
        nroOrden: ot.OT,
        equipo: ot.NRO_ACTIVO,
        planta: ot.PLANTA,
        descripcion: ot.DESCRIPCION,
        esOB: ot.ES_OB === 1,
        fechaSugerida: ot.FECHA || null, // Columna en DB es FECHA
        tecnicos: typeof ot.DETALLES_TECNICOS === 'string'
          ? JSON.parse(ot.DETALLES_TECNICOS)
          : (ot.DETALLES_TECNICOS || []),
        estado: ot.ESTADO,
        periodo: ot.PERIODO
      }));

      // Separar asignados de sin asignar para el frontend
      const asignados = resultados.filter(ot =>
        ot.tecnicos && ot.tecnicos.length > 0 &&
        ot.tecnicos.some((t: { nombre?: string }) => t.nombre && t.nombre !== "VACANTE")
      );

      const sinAsignar = resultados.filter(ot =>
        !ot.tecnicos || ot.tecnicos.length === 0 ||
        ot.tecnicos.every((t: { nombre?: string }) => !t.nombre || t.nombre === "VACANTE")
      );

      console.log(`obtenerPlanificacion: Éxito. Asignados: ${asignados.length}, Sin Asignar: ${sinAsignar.length}`);
      res.json({ resultados: asignados, sinAsignar });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error desconocido";
      console.error("FATAL ERROR in obtenerPlanificacion:", message);
      res.status(500).json({ error: message });
    }
  },


  // Mantener para compatibilidad o cargas iniciales
  procesarExcel: async (req: Request, res: Response) => {
    try {
      if (!req.file) return res.status(400).json({ error: "Archivo requerido" });
      const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
      const modo = req.body.modo || 'STRICT';
      const mesBody = req.body.mes ? Number(req.body.mes) : undefined;
      const anioBody = req.body.anio ? Number(req.body.anio) : undefined;

      console.log("Iniciando procesamiento de Excel...");
      const resultado = processExcelData(workbook.Sheets, modo);
      console.log("Excel procesado en memoria. Determinando periodo...", { mesBody, anioBody });

      const periodo = mesBody + "-" + anioBody;

      console.log(`Periodo determinado: ${periodo}. Sincronizando con snapshots...`);

      // 1. Snapshot para horarios (usando PF_IM_CORTES_CONTROL)
      await query(`
          MERGE INTO PF_IM_CORTES_CONTROL s
          USING (SELECT :periodo1 as sem, 'SEGUIMIENTO' as tip FROM dual) src
          ON (s.semana = src.sem AND s.tipo = src.tip)
          WHEN MATCHED THEN UPDATE SET fecha_carga = CURRENT_TIMESTAMP
          WHEN NOT MATCHED THEN INSERT (semana, tipo) VALUES (:periodo2, 'SEGUIMIENTO')
      `, { periodo1: periodo, periodo2: periodo });

      console.log(`Buscando snapshot para periodo: ${periodo}`);
      const resSnap = await query("SELECT id FROM PF_IM_CORTES_CONTROL WHERE semana = :periodo AND tipo = 'SEGUIMIENTO'", { periodo });
      const snapshotId = resSnap?.rows?.[0]?.ID || resSnap?.rows?.[0]?.[0];

      if (snapshotId) {
        const emps = Object.entries(resultado.tecnicosMap).map(([nombre, info]: [string, { planta: string, rol: string }]) => ({
          nombre,
          planta: info.planta,
          rol: info.rol
        }));
        console.log(`Snapshot listo (ID: ${snapshotId}). Sincronizando ${emps.length} empleados...`);
        await PlanificacionRepository.upsertEmpleados(emps);

        console.log("Empleados sincronizados.");

        // 3. Guardar horarios
        if (resultado.horariosCompletos && resultado.horariosCompletos.length > 0) {
          console.log(`Guardando ${resultado.horariosCompletos.length} registros de horarios...`);
          await PlanificacionRepository.guardarHorarios(resultado.horariosCompletos, mesBody, anioBody);
        } else {
          console.warn("ADVERTENCIA: No se encontraron horarios en el Excel (hoja 'HORARIOS' vacía o no encontrada).");
        }


        // 4. Guardar pedidos (OTs)
        const todosLosPedidos = [...resultado.resultados, ...resultado.sinAsignar].map(p => ({
          ...p,
          periodo: p.periodo || periodo
        }));
        if (todosLosPedidos.length > 0) {
          console.log(`[INFO] Se encontraron ${todosLosPedidos.length} pedidos en el Excel de planificación, pero NO se guardarán. Utilice la Carga Masiva EAM para actualizar pedidos.`);
        }
        console.log("Proceso de persistencia finalizado con éxito.");
      } else {
        console.error("ERROR CRÍTICO: No se pudo obtener o crear un ID de Snapshot.");
      }


      res.json({
        ...resultado,
        periodo
      });

    } catch (error) {
      const message = error instanceof Error ? error.message : "Error desconocido";
      console.error("Error procesando excel:", message);
      res.status(500).json({ error: message });
    }
  },

  guardarPlanificacion: async (req: Request, res: Response) => {
    try {
      const { datos, semana } = req.body;
      if (!Array.isArray(datos) || datos.length === 0) {
        return res.status(400).json({ error: "Lista de datos requerida" });
      }

      const asignaciones = datos.map((d: Record<string, any>) => ({
        ot: d.nroOrden || d.OT,
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



  listarHorarios: async (req: Request, res: Response) => {
    try {
      const { mes, anio, planta } = req.query;
      console.log(`Petición listarHorarios para periodo: ${mes}-${anio}, planta: ${planta || 'TODAS'}`);
      const data = await PlanificacionRepository.getHorarios(Number(mes), Number(anio), planta ? String(planta) : null);
      res.json({ periodo: `${mes}-${anio}`, count: data.length, data });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error desconocido";
      res.status(500).json({ error: message });
    }
  },

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

  uploadHorarios: async (req: Request, res: Response) => {
    try {
      if (!req.file) return res.status(400).json({ error: "Archivo requerido" });

      console.log(`[HORARIOS] 📁 Iniciando carga específica de técnicos y horarios.`);

      const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
      const sheetNames = workbook.SheetNames;
      const counts = { empleados: 0, horarios: 0 };

      // 1. TECNICOS
      const hojaTecnicosName = sheetNames.find(s => ['EMPLEADOS', 'TECNICOS', 'EMPLEADO', 'TECNICO'].includes(s.trim().toUpperCase()));
      if (hojaTecnicosName) {
        const data = XLSX.utils.sheet_to_json(workbook.Sheets[hojaTecnicosName]);
        const mapped = data.map((e: any) => ({
          nombre: String(e.EMPLEADO || e.Empleado || e.NOMBRE || e.Nombre || e.TECNICO || '').trim().toUpperCase(),
          planta: String(e.PLANTA || e.Planta || '').trim(),
          rol: String(e.ROL || e.Rol || 'M').trim()
        })).filter(e => e.nombre);

        if (mapped.length > 0) {
          await PlanificacionRepository.upsertEmpleados(mapped);
          counts.empleados = mapped.length;
          console.log(`[HORARIOS] 👥 ${counts.empleados} técnicos actualizados.`);
        }
      }

      // 2. HORARIOS
      const hojaHorariosName = sheetNames.find(s => ['HORARIOS', 'TURNOS'].includes(s.trim().toUpperCase()));
      if (hojaHorariosName) {
        const horariosRaw = XLSX.utils.sheet_to_json(workbook.Sheets[hojaHorariosName], { header: 1 }) as unknown[][];

        let anioHorario: number | undefined;
        let mesHorario: number | undefined;

        if (req.body.anio && req.body.mes) {
          anioHorario = Number(req.body.anio);
          mesHorario = Number(req.body.mes);
        }

        if (horariosRaw.length > 1 && anioHorario && mesHorario !== undefined) {
          const tecnicosValidos = await PlanificacionRepository.getAllNombresTecnicos();
          const horariosParaGuardar: { nombre: string, turnos: string[] }[] = [];

          horariosRaw.slice(1).forEach(row => {
            let nombre = String(row[0] || '').trim().toUpperCase();
            if (tecnicosValidos.has(nombre)) {
              const turnos = row.slice(1, 32).map((t) => String(t || 'L').trim());
              horariosParaGuardar.push({ nombre, turnos });
            }
          });

          if (horariosParaGuardar.length > 0) {
            await PlanificacionRepository.guardarHorarios(horariosParaGuardar, anioHorario, mesHorario);
            counts.horarios = horariosParaGuardar.length;
            console.log(`[HORARIOS] 📅 ${counts.horarios} horarios guardados.`);
          }
        }
      }

      res.json({ success: true, counts });

    } catch (error) {
      const message = error instanceof Error ? error.message : "Error desconocido";
      console.error("Error uploadHorarios:", message);
      res.status(500).json({ error: message });
    }
  }
};