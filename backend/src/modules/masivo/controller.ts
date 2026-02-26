import type { Request, Response } from 'express';
import XLSX from "xlsx-js-style";
import { query } from '../../db/config.js';

/**
 * Controlador para carga masiva de datos
 * Procesa un Excel que contiene múltiples hojas con datos de:
 * - Empleados
 * - Horarios
 * - Activos
 * - Pedidos de trabajo (OTs)
 * - Fallas
 */
import { generarBufferPlantilla } from '../seguimiento/logic/templateGenerator.js';
import { EamRepository } from '../eam/repository.js';
// Helper para convertir fecha Excel o String DD/MM/YYYY a String ISO o compatible DB
// Helper para convertir fecha Excel o String a objeto Date de JavaScript
const parseFecha = (val: unknown): Date | null => {
    if (!val) return null;
    if (val instanceof Date) return val;

    if (typeof val === 'number') {
        const date = XLSX.SSF.parse_date_code(val);
        return new Date(date.y, date.m - 1, date.d, date.H, date.M, date.S);
    }

    const strVal = String(val).trim();
    if (!strVal) return null;

    // Detectar si es YYYY-MM-DD
    const isoMatch = strVal.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (isoMatch) {
        return new Date(Number(isoMatch[1]), Number(isoMatch[2]) - 1, Number(isoMatch[3]));
    }

    // Detectar si es DD/MM/YYYY o DD/MM/YYYY HH:mm:ss
    const match = strVal.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{1,2}):(\d{1,2}))?$/);
    if (match) {
        const [_, d, m, y, h, min, s] = match;
        return new Date(Number(y), Number(m) - 1, Number(d), Number(h || 0), Number(min || 0), Number(s || 0));
    }

    const parsed = new Date(strVal);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
};

// Helper SOLO FECHA (DD/MM/YYYY) para Cumplimiento y Masivo
// Helper SOLO FECHA para Cumplimiento y Masivo (pone hora a 00:00:00)
const parseFechaDateOnly = (val: unknown): Date | null => {
    const d = parseFecha(val);
    if (!d) return null;
    d.setHours(0, 0, 0, 0);
    return d;
};

const parseDineroLocal = (valor: unknown): number => {
    if (typeof valor === 'number') return valor;
    if (!valor) return 0;

    const str = String(valor);
    const limpio = str
        .replace(/\$/g, '')
        .replace(/\s/g, '')
        .replace(/\./g, '')
        .replace(',', '.');

    const numero = Number.parseFloat(limpio);
    return Number.isNaN(numero) ? 0 : numero;
};

export const MassiveController = {
    uploadMassive: async (req: Request, res: Response) => {
        try {
            if (!req.file) {
                return res.status(400).json({ error: "Archivo requerido" });
            }

            const { targetWeek } = req.body;
            console.log(`[MASIVO] 📁 Iniciando carga masiva para semana: ${targetWeek}`);

            const workbook = XLSX.read(req.file.buffer, { type: 'buffer', cellDates: true });
            const sheetNames = workbook.SheetNames;
            console.log(`[MASIVO] 📊 Hojas detectadas: ${sheetNames.join(', ')}`);

            const counts = { empleados: 0, horarios: 0, activos: 0, pedidos: 0, fallas: 0 };

            // DETECCIÓN DE SIMULACIÓN EAM
            const hojasPedidosPosibles = ['PF1', 'PF2', 'MP3', 'MPS'];
            const hojasPedidosEncontradas = sheetNames.filter(s => hojasPedidosPosibles.includes(s.trim().toUpperCase()));
            const hojaActivos = sheetNames.find(s => s.trim().toUpperCase() === 'ACTIVOS');

            const isEamSimulation = hojasPedidosEncontradas.length > 0 || !!hojaActivos || sheetNames.some(s => s.toUpperCase() === 'CUMPLIMIENTO');

            if (isEamSimulation) {
                console.log("[MASIVO] 🚀 Detectada simulación EAM completa. Usando tablas PF_EAM_...");
                await EamRepository.truncateTables();

                // 1. Cargar PEDIDOS (Múltiples hojas)
                let totalPedidos = 0;
                for (const hojaNombre of hojasPedidosEncontradas) {
                    console.log(`[MASIVO] 📊 Procesando hoja ${hojaNombre} con pedidos...`);
                    const pedidosRaw = XLSX.utils.sheet_to_json(workbook.Sheets[hojaNombre]) as Record<string, unknown>[];
                    const pedidosMapped = pedidosRaw.map((r) => ({
                        pedido_trabajo: String(r['Pedido de Trabajo'] || r['PEDIDO_DE_TRABAJO'] || '').trim(),
                        numero_activo: String(r['Número de Activo'] || r['NUMERO_DE_ACTIVO'] || '').trim(),
                        grupo_activos: String(r['Grupo de Activos'] || r['GRUPO_DE_ACTIVOS'] || '').trim(),
                        descripcion: String(r['Descripción'] || r['DESCRIPCION'] || '').trim(),
                        fecha_inicial_programada: parseFecha(r['Fecha Inicial Programada'] || r['FECHA_INICIAL_PROGRAMADA']),
                        duracion_horas: Number(r['Duración(horas)'] || r['DURACION_HORAS'] || 0),
                        departamento_propiedad: String(r['Departamento de Propiedad'] || r['DEPARTAMENTO_PROPIEDAD'] || '').trim(),
                        estado: String(r['Estado'] || r['ESTADO'] || '').trim()
                    })).filter(p => p.pedido_trabajo);

                    if (pedidosMapped.length > 0) {
                        await EamRepository.insertarPedidos(pedidosMapped);
                        totalPedidos += pedidosMapped.length;
                    }
                }
                console.log(`[MASIVO-EAM] Insertados ${totalPedidos} pedidos totales.`);
                counts.pedidos = totalPedidos;

                // 1.5 Cargar ACTIVOS
                if (hojaActivos) {
                    const activosRaw = XLSX.utils.sheet_to_json(workbook.Sheets[hojaActivos]) as Record<string, unknown>[];
                    const activosMapped = activosRaw.map((r) => ({
                        grupo_de_activo: String(r['GRUPO_DE_ACTIVO'] || '').trim(),
                        desc_grupo_de_activo: String(r['DESC_GRUPO_DE_ACTIVO'] || '').trim(),
                        nro_de_serie: String(r['NRO_DE_SERIE'] || '').trim(),
                        mantenible: String(r['MANTENIBLE'] || '').trim(),
                        cc: String(r['CC'] || '').trim(),
                        nro_de_activo: String(r['NRO_DE_ACTIVO'] || '').trim(),
                        desc_nro_de_activo: String(r['DESC_NRO_DE_ACTIVO'] || '').trim(),
                        nro_de_activo_padre: String(r['NRO_DE_ACTIVO_PADRE'] || '').trim(),
                        organizacion: String(r['ORGANIZACION'] || '').trim(),
                        clase_contable: String(r['CLASE_CONTABLE'] || '').trim(),
                        planta: String(r['PLANTA'] || '').trim()
                    })).filter(a => a.nro_de_activo);

                    if (activosMapped.length > 0) {
                        console.log(`[MASIVO-EAM] Insertando ${activosMapped.length} activos...`);
                        await EamRepository.insertarActivos(activosMapped);
                        counts.activos = activosMapped.length;
                    }
                }

                // 2. Cargar CUMPLIMIENTO
                if (sheetNames.includes('CUMPLIMIENTO')) {
                    const cumplimientoRaw = XLSX.utils.sheet_to_json(workbook.Sheets['CUMPLIMIENTO']) as Record<string, unknown>[];
                    const cumplimientoMapped = cumplimientoRaw.map((r) => ({
                        planta: String(r['PLANTA'] || '').trim(),
                        empleado: String(r['EMPLEADO'] || '').trim(),
                        nro_ot: String(r['NRO_OT'] || '').trim(),
                        tipo: String(r['TIPO'] || '').trim(),
                        estado_om: String(r['ESTADO_OM'] || '').trim(),
                        fecha_programada_inicio: parseFechaDateOnly(r['FECHA_PROGRAMADA_INICIO']),
                        nro_operacion: String(r['NRO_OPERACION'] || '').trim(),
                        nro_seq_recurso: String(r['NRO_SEQ_RECURSO'] || '').trim(),
                        op_finalizada: String(r['OP_FINALIZADA'] || '').trim()
                    })).filter(c => c.nro_ot);

                    console.log(`[MASIVO-EAM] Insertando ${cumplimientoMapped.length} registros de cumplimiento...`);
                    await EamRepository.insertarCumplimiento(cumplimientoMapped);
                }

                // 3. Cargar MASIVO
                if (sheetNames.includes('MASIVO')) {
                    const masivoRaw = XLSX.utils.sheet_to_json(workbook.Sheets['MASIVO']) as Record<string, unknown>[];
                    const masivoMapped = masivoRaw.map((r) => ({
                        numero: String(r['Número'] || r['NUMERO'] || '').trim(),
                        activo: String(r['Activo'] || r['ACTIVO'] || '').trim(),
                        descripcion: String(r['Descripción'] || r['DESCRIPCION'] || '').trim(),
                        tpt: String(r['TPT'] || '').trim(),
                        fecha_progr: parseFechaDateOnly(r['Fecha Progr.'] || r['FECHA_PROGR']),
                        anx: String(r['Anx'] || '').trim(),
                        art_inv: String(r['Art. Inv.'] || '').trim(),
                        art_dir: String(r['Art. Dir.'] || '').trim(),
                        n_sol: String(r['N° Sol.'] || '').trim(),
                        serv_ex: String(r['Serv. Ex.'] || '').trim(),
                        horas: (() => {
                            const val = r['Horas'];
                            if (val === undefined || val === null || String(val).trim() === '') return 0;
                            // Reemplazar coma por punto por si viene formato europeo
                            const clean = String(val).replace(',', '.');
                            const num = Number(clean);
                            return Number.isNaN(num) ? 0 : num;
                        })(),
                        rmd: (() => {
                            // Si son numéricos en DB, mejor pasar número o null. Si son string, pasar string.
                            // Asumiendo que pueden ser numéricos por el error reportado, trataremos de limpiar.
                            const val = r['RMD'];
                            if (val === undefined || val === null || String(val).trim() === '') return null; // Enviar null si está vacío
                            return String(val).trim();
                        })(),
                        rse: (() => {
                            const val = r['RSE'];
                            if (val === undefined || val === null || String(val).trim() === '') return null;
                            return String(val).trim();
                        })()
                    })).filter(m => m.numero);

                    const uniqueMasivo = Array.from(
                        new Map(masivoMapped.map(item => [item.numero, item])).values()
                    );

                    console.log(`[MASIVO-EAM] Insertando ${uniqueMasivo.length} registros masivos (de ${masivoMapped.length} originales)...`);
                    await EamRepository.insertarMasivo(uniqueMasivo);
                }

                // 4. SINCRONIZAR A APP
                // Necesitamos un snapshot ID para asociar los pedidos
                // Usaremos la targetWeek y 'SEGUIMIENTO' como tipo
                if (targetWeek) {
                    console.log(`[MASIVO-EAM] Sincronizando hacia App (Snapshot para ${targetWeek})...`);

                    console.log(`[MASIVO-EAM] Datos cargados en tablas PF_EAM_*. Listos para consumo.`);
                }

            } else {
                console.warn("[MASIVO] ⚠️ No se detectó hoja 'Pedido de Trabajo'. Omitiendo carga de OTs (Requiere formato EAM).");
                const seguimientoSheets = ['CUMPLIMIENTO', 'MASIVO'];
                if (sheetNames.some(s => seguimientoSheets.includes(s))) {
                    console.warn("[MASIVO] ⚠️ Se detectaron hojas antiguas (CUMPLIMIENTO/MASIVO) sin cabecera de Pedidos. Actualice el formato a EAM Simulation.");
                }
            }





            // 4. Procesar FALLAS (Común)
            if (sheetNames.includes('Detalle MTBF MTTR')) {
                console.log(`[MASIVO] ⚠️ Procesando fallas...`);
                try { await query("TRUNCATE TABLE PF_EAM_FALLAS"); } catch (e) { console.warn("Tabla fallas no existe o error truncate", e); }

                // Usamos targetWeek o calculamos una por defecto si no viene

                console.log(`[MASIVO] 💾 Guardando fallas...`);
                const sheetName = "Detalle MTBF MTTR";
                const sheet = workbook.Sheets[sheetName];
                if (!sheet) {
                    console.error(`La hoja "${sheetName}" no se encuentra en el archivo.`);
                    return [];
                }

                const fallasData = XLSX.utils.sheet_to_json(sheet) as Record<string, unknown>[];

                const fallasMapped = fallasData.map((r) => ({
                    fecha: parseFechaDateOnly(r["Fecha"]),
                    planta: String(r["Planta"]),
                    area: String(r["Descripcion Area"]),
                    linea: String(r["Nombre Línea Prod"]),
                    equipo: String(r["Equipo Nombre"]),
                    causa: String(r["Descripcion Causa"]),
                    pedidoTrabajo: String(r["Pedido Trabajo"] || ""),
                    estadoPedido: String(r["Estado Pedido"] || ""),
                    tipoPedido: String(r["Tipo Pedido Trabajo"] || ""),
                    tecnico: String(r["Técnico"] || ""),
                    duracionMinutos: parseDineroLocal(r["Duración Paro Oracle [min]"]),
                    gasto: parseDineroLocal(r["Gasto OM [$]"]),
                    perdidaKg: parseDineroLocal(r["Pérdida por Paro [kg]"]),
                    descripcionOperador: String(r["Descripción Operador"] || ""),
                }));

                console.log(fallasMapped);

                if (fallasMapped.length > 0) {
                    console.log(`[MASIVO-EAM] Insertando ${fallasMapped.length} fallas...`);
                    await EamRepository.insertarFallas(fallasMapped);
                    counts.fallas = fallasMapped.length;
                }
                console.log(`[MASIVO] ✅ ${counts.fallas} registros de fallas guardados`);
            }

            console.log(`[MASIVO] ✅ Carga masiva completada exitosamente`);
            res.json({
                success: true,
                message: "Carga masiva completada",
                counts
            });

        } catch (error) {
            const message = error instanceof Error ? error.message : "Error desconocido";
            console.error("[MASIVO] ❌ Error en carga masiva:", message);
            res.status(500).json({ error: message });
        }
    },
    descargarPlantillaEAM: async (req: Request, res: Response) => {
        try {
            const buffer = generarBufferPlantilla('MASIVO_EAM');
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', 'attachment; filename=plantilla_carga_masiva_eam.xlsx');
            res.send(buffer);
        } catch (error) {
            const message = error instanceof Error ? error.message : "Error desconocido";
            console.error("Error generando plantilla:", message);
            res.status(500).json({ error: message });
        }
    },

    descargarPlantillaHorarios: async (req: Request, res: Response) => {
        try {
            const buffer = generarBufferPlantilla('HORARIOS_EAM');
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', 'attachment; filename=plantilla_horarios_eam.xlsx');
            res.send(buffer);
        } catch (error) {
            const message = error instanceof Error ? error.message : "Error desconocido";
            console.error("Error generando plantilla horarios:", message);
            res.status(500).json({ error: message });
        }
    }
};
