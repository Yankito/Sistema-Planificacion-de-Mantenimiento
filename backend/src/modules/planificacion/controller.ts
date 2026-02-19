import XLSX from "xlsx-js-style";
import { processExcelData } from './logic/excelProcessor.js';
import { PlanificacionRepository } from './repository.js';
import { PlannerService } from './logic/PlannerService.js';
import { query } from "../../db/config.js";

export const PlanificacionController = {

  // NUEVO: Ejecuta el algoritmo usando datos ya existentes en Oracle
  ejecutarPlanificacion: async (req: any, res: any) => {
    try {
      const { periodo, modo, planta } = req.body; // 'periodo' en formato YYYY-MM
      if (!periodo) return res.status(400).json({ error: "Periodo (Mes) no especificado" });

      // 1. Obtener datos crudos de las tablas (filtrando por planta si se especifica)
      const { ots, empleados } = await PlanificacionRepository.getDataParaPlanificar(periodo, planta);

      if (ots.length === 0) {
        return res.status(404).json({ error: `No hay OTs cargadas para esta semana en Seguimiento${planta ? ' para la planta ' + planta : ''}.` });
      }

      // 2. Adaptar datos al formato que espera tu PlannerService (Normalización)
      // Aquí mapeas los campos de Oracle (MAYÚSCULAS) a lo que tu lógica espera
      const datosNormalizados = ots.map(ot => ({
        OT: ot.OT,
        PLANTA: ot.PLANTA,
        DESCRIPCION: ot.DESCRIPCION,
        CLASIFICACION: ot.CLASIFICACION,
        ES_OB: ot.ES_OB === 1
      }));

      const tecnicosMap = new Map();
      empleados.forEach(emp => {
        // Si hay filtro de planta, opcionalmente podríamos filtrar técnicos aquí también
        // Pero PlannerService suele manejarlo con esPlantaCompatible
        tecnicosMap.set(emp.NOMBRE, { planta: emp.PLANTA, rol: emp.ROL });
      });

      // 3. Ejecutar algoritmo
      let resultado;
      if (modo === 'BALANCED') {
        resultado = PlannerService.generarPlanificacionEquilibrada(datosNormalizados, [], [], tecnicosMap);
      } else {
        resultado = PlannerService.generarPlanificacion(datosNormalizados, [], [], tecnicosMap, new Map());
      }

      res.json(resultado);
    } catch (error: any) {
      console.error("Error ejecucion remota:", error);
      res.status(500).json({ error: error.message });
    }
  },

  obtenerPlanificacion: async (req: any, res: any) => {
    try {
      const { periodo, planta } = req.query;
      console.log(`Petición obtenerPlanificacion para periodo: ${periodo}, planta: ${planta || 'TODAS'}`);
      const data = await PlanificacionRepository.getPlanificacion(String(periodo), planta ? String(planta) : undefined);
      if (!data) {
        console.error(`obtenerPlanificacion: Error al obtener datos para periodo ${periodo}`);
        return res.json({ resultados: [], sinAsignar: [] });
      }

      console.log("data", data);

      // Adaptar campos de DB a formato frontend
      const resultados = data.map((ot: any) => ({
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
        periodo: ot.PERIODO || periodo
      }));

      // Separar asignados de sin asignar para el frontend
      const asignados = resultados.filter(ot =>
        ot.tecnicos && ot.tecnicos.length > 0 &&
        ot.tecnicos.some((t: any) => t.nombre && t.nombre !== "VACANTE")
      );

      const sinAsignar = resultados.filter(ot =>
        !ot.tecnicos || ot.tecnicos.length === 0 ||
        ot.tecnicos.every((t: any) => !t.nombre || t.nombre === "VACANTE")
      );

      console.log(`obtenerPlanificacion: Éxito. Asignados: ${asignados.length}, Sin Asignar: ${sinAsignar.length}`);
      res.json({ resultados: asignados, sinAsignar });
    } catch (error: any) {
      console.error("FATAL ERROR in obtenerPlanificacion:", error);
      res.status(500).json({ error: error.message });
    }
  },


  // Mantener para compatibilidad o cargas iniciales
  procesarExcel: async (req: any, res: any) => {
    try {
      if (!req.file) return res.status(400).json({ error: "Archivo requerido" });
      const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
      const modo = req.body.modo || 'STRICT';
      const periodoBody = req.body.periodo || req.body.semana;
      const mesBody = req.body.mes ? Number(req.body.mes) : undefined;
      const anioBody = req.body.anio ? Number(req.body.anio) : undefined;

      console.log("Iniciando procesamiento de Excel...");
      const resultado = processExcelData(workbook.Sheets, modo);
      console.log("Excel procesado en memoria. Determinando periodo...", { periodoBody, mesBody, anioBody });

      const periodo = periodoBody || (resultado.resultados as any[])[0]?.periodo || (resultado.sinAsignar as any[])[0]?.periodo || "2026-02";

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
        const emps = Object.entries(resultado.tecnicosMap).map(([nombre, info]: [string, any]) => ({
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
          await PlanificacionRepository.guardarHorarios(periodo, resultado.horariosCompletos, anioBody, mesBody);
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

    } catch (error: any) {
      console.error("Error procesando excel:", error);
      res.status(500).json({ error: error.message });
    }
  },

  guardarPlanificacion: async (req: any, res: any) => {
    try {
      const { datos, semana } = req.body;
      if (!Array.isArray(datos) || datos.length === 0) {
        return res.status(400).json({ error: "Lista de datos requerida" });
      }

      const asignaciones = datos.map((d: any) => ({
        ot: d.nroOrden || d.OT,
        tecnicos: d.tecnicos,
        periodo: d.periodo || d.semana // Soportar ambos en la transición
      }));

      await PlanificacionRepository.guardarPlanificacion(asignaciones);
      res.json({ success: true, count: asignaciones.length });
    } catch (error: any) {
      console.error("Error guardando planificacion:", error);
      res.status(500).json({ error: error.message });
    }
  },



  listarHorarios: async (req: any, res: any) => {
    try {
      const { periodo, planta } = req.query;
      console.log(`Petición listarHorarios para periodo: ${periodo}, planta: ${planta || 'TODAS'}`);
      const data = await PlanificacionRepository.getHorarios(String(periodo), planta ? String(planta) : null);
      res.json({ periodo, count: data.length, data });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },

  actualizarTurno: async (req: any, res: any) => {
    try {
      const { nombre, turnos, periodo } = req.body;
      await PlanificacionRepository.upsertHorarioManual(periodo, nombre, turnos);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },

  uploadHorarios: async (req: any, res: any) => {
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
        const horariosRaw = XLSX.utils.sheet_to_json(workbook.Sheets[hojaHorariosName], { header: 1 }) as any[][];

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
              const turnos = row.slice(1, 32).map((t: any) => String(t || 'L').trim());
              horariosParaGuardar.push({ nombre, turnos });
            }
          });

          if (horariosParaGuardar.length > 0) {
            await PlanificacionRepository.guardarHorarios(null, horariosParaGuardar, anioHorario, mesHorario);
            counts.horarios = horariosParaGuardar.length;
            console.log(`[HORARIOS] 📅 ${counts.horarios} horarios guardados.`);
          }
        }
      }

      res.json({ success: true, counts });

    } catch (error: any) {
      console.error("Error uploadHorarios:", error);
      res.status(500).json({ error: error.message });
    }
  }
};