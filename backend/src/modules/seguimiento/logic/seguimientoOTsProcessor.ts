import XLSX from "xlsx-js-style";
import { normalizarColumnas } from "../../planificacion/logic/excelProcessor.js";
import type { OrdenTrabajo, TecnicoEstado } from "../../../types.js";
import type { MasivoRow, CumplimientoRow, ActivoRow } from "../types.js";

const getWeekLabel = (d: Date): string => {
  const date = new Date(d.getTime());
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
  const week1 = new Date(date.getFullYear(), 0, 4);
  const weekNumber = 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
  return `${date.getFullYear()}-S${weekNumber.toString().padStart(2, '0')}`;
};

const getPeriodoLabel = (d: Date): string => {
  const year = d.getFullYear();
  const currentYear = new Date().getFullYear();

  if (year < currentYear) return year.toString();

  const meses = ["ENE", "FEB", "MAR", "ABR", "MAY", "JUN", "JUL", "AGO", "SEP", "OCT", "NOV", "DIC"];
  return `${meses[d.getMonth()]}-${year.toString().substring(2)}`;
};

export const processSeguimientoOTs = (sheets: { [key: string]: XLSX.WorkSheet }) => {
  console.log("Hojas detectadas en el archivo:", Object.keys(sheets).join(", "));

  const resultados: OrdenTrabajo[] = [];
  const listaActivos: ActivoRow[] = [];
  const rawMasivoData: MasivoRow[] = [];
  const rawCumplimientoData: CumplimientoRow[] = [];


  if (!sheets["CUMPLIMIENTO"] || !sheets["MASIVO"]) {
    throw new Error("El archivo no contiene las pestañas CUMPLIMIENTO o MASIVO");

  }
  console.log("Procesando hoja de CUMPLIMIENTO");

  // CUMPLIMIENTO
  console.log("Leyendo datos de CUMPLIMIENTO");

  // Leemos como matriz primero para depurar
  const rows = XLSX.utils.sheet_to_json(sheets["CUMPLIMIENTO"], { header: 1 }) as unknown[][];
  console.log("Primeras 2 filas de CUMPLIMIENTO:", rows.slice(0, 2));

  // Leemos normalizado
  const rawCumplimiento = XLSX.utils.sheet_to_json(sheets["CUMPLIMIENTO"], { defval: "" }) as Record<string, unknown>[];
  const dataCumplimientoNorm = normalizarColumnas(rawCumplimiento);

  const mapaCumplimiento = new Map<string, { total: boolean, tecnicos: TecnicoEstado[] }>();

  dataCumplimientoNorm.forEach((r: Record<string, unknown>) => {
    // Intenta buscar la OT con diferentes nombres posibles por si la normalización falla
    const ot = String(r["NRO_OT"] || r["OT"] || r["NUMERO_OT"] || "").trim();
    if (!ot) return;

    rawCumplimientoData.push({
      planta: String(r["PLANTA"] || ""),
      tecnico: String(r["EMPLEADO"] || ""),
      nro_ot: ot,
      tipo: String(r["TIPO"] || ""),
      estado_om: String(r["ESTADO_OM"] || ""),
      fecha_programada: String(r["FECHA_PROGRAMADA_INICIO"] || ""),
      op_finalizada: String(r["OP_FINALIZADA"] || "")
    });

    const tecnico = String(r["EMPLEADO"] || "").trim();
    const planta = String(r["PLANTA"] || "").trim();
    const opFin = String(r["OP_FINALIZADA"] || "").toUpperCase().trim();
    const finalizada = opFin === "SI";

    if (!mapaCumplimiento.has(ot)) { mapaCumplimiento.set(ot, { total: true, tecnicos: [] }); }
    const info = mapaCumplimiento.get(ot)!;
    const tec = info.tecnicos.find(t => t.tecnico.nombre === tecnico);
    if (!tec) info.tecnicos.push({ tecnico: { nombre: tecnico, rol: "TECNICO", planta: planta }, opFinalizada: finalizada });
    else if (!finalizada) tec.opFinalizada = false;
    if (!finalizada) info.total = false;
  });
  console.log("Procesando hoja de MASIVO");

  // PROCESAMIENTO DE MASIVO 
  // { defval: "" } obliga a leer TODAS las columnas del encabezado, 
  const dataMasivo = normalizarColumnas(XLSX.utils.sheet_to_json(sheets["MASIVO"], { defval: "" }) as Record<string, unknown>[]);
  const masivoLookup = new Map<string, { rmd: string, rse: string }>();

  dataMasivo.forEach((r: Record<string, unknown>) => {
    const ot = String(r["NÚMERO"] || r["NUMERO"] || r["NUMBER"] || "").trim();
    if (!ot) return;

    const valRmd = String(r["RMD"] || "").trim().toUpperCase();
    const valRse = String(r["RSE"] || "").trim().toUpperCase();

    rawMasivoData.push({
      numero_ot: ot,
      activo: String(r["ACTIVO"] || "").trim(),
      descripcion: String(r["DESCRIPCIÓN"] || r["DESCRIPCION"] || "").trim(),
      tpt: String(r["TPT"] || "").trim(),
      fecha_progr: String(r["FECHA PROGR."] || "").trim(),
      horas: Number(r["HORAS"]) || 0,
      rmd: valRmd,
      rse: valRse
    });

    masivoLookup.set(ot, { rmd: valRmd, rse: valRse });
  });

  // ACTIVOS
  const dfActivos = sheets["ACTIVOS"] ? normalizarColumnas(XLSX.utils.sheet_to_json(sheets["ACTIVOS"], { defval: "" })) : [];
  if (dfActivos.length > 0) {
    dfActivos.forEach((a: Record<string, unknown>) => {
      const cc = String(a["CC"] || "").replace(/[()]/g, "").trim();
      if (cc) {
        listaActivos.push({
          codigo: cc,
          descripcion: String(a["DESC_NRO_DE_ACTIVO"] || "").trim(),
          planta: String(a["PLANTA"] || "").trim().toUpperCase(),
          ubicacion: String(a["DESC_GRUPO_DE_ACTIVO"] || "").trim()
        });
      }
    });
  }

  // CRUCE FINAL
  const hojasPlantas = ["PF1", "PF2", "MP3", "MPS"];
  const estadosFinalizados = ["Finalizado", "Finalizado Sin Cargos", "Finalizar - Sin Cargos"];
  const estadosInteres = ["Liberado", ...estadosFinalizados];
  const otsProcesadasEnCiclo = new Set<string>();

  console.log("Procesando hojas de plantas:", hojasPlantas.join(", "));
  hojasPlantas.forEach(nombreHoja => {
    if (!sheets[nombreHoja]) return;
    const dfPlanta = normalizarColumnas(XLSX.utils.sheet_to_json(sheets[nombreHoja], { defval: "" }));

    dfPlanta.forEach((fila: Record<string, unknown>) => {
      const nroOT = String(fila["PEDIDO DE TRABAJO"] || "").trim();
      if (!nroOT || otsProcesadasEnCiclo.has(nroOT)) return;

      const estado = String(fila["ESTADO"] || "").trim();
      if (!estadosInteres.includes(estado)) return;

      const descripcion = String(fila["DESCRIPCIÓN"] || "").trim();
      const nroActivo = String(fila["NÚMERO DE ACTIVO"] || "").trim();

      otsProcesadasEnCiclo.add(nroOT);

      const infoCumple = mapaCumplimiento.get(nroOT);
      const infoMasivo = masivoLookup.get(nroOT);

      const valRmd = infoMasivo ? infoMasivo.rmd : "N/A";
      const valRse = infoMasivo ? infoMasivo.rse : "N/A";

      // Lógica de clasificación
      let clasificacion: OrdenTrabajo['clasificacion'];
      if (estadosFinalizados.includes(estado)) {
        clasificacion = "CUMPLIDA";
      } else {
        if (!infoCumple) {
          clasificacion = "OC / OTRO";
        } else if (!infoCumple.total) {
          clasificacion = "TECNICO / SERVICIO";
        } else if (!infoMasivo) {
          clasificacion = "OC / OTRO";
        } else {
          const rmdOk = valRmd === "SI" || valRmd === "" || valRmd === "0";
          const rseOk = valRse === "SI" || valRse === "" || valRse === "0";
          clasificacion = (rmdOk && rseOk) ? "PROGRAMADOR" : "OC / OTRO";
        }
      }

      // Lógica de Planta Real (MP3 -> Activos)
      let plantaReal = nombreHoja;
      if (nombreHoja === "MP3") {
        const matchCC = nroActivo.match(/\((\d)(\d{3})\)/);
        if (matchCC) {
          const ccPuro = matchCC[1] + matchCC[2];
          const activoFound = listaActivos.find(a => a.codigo === ccPuro);
          if (activoFound && activoFound.planta) plantaReal = activoFound.planta;
          else {
            const mapeo: { [key: string]: string } = { "1": "PF1", "2": "PF2", "3": "PF3", "4": "PF4", "5": "PF5", "6": "PF6" };
            plantaReal = mapeo[matchCC[1]] || "OTROS";
          }
        }
      }

      const fechaRaw = fila["FECHA INICIAL PROGRAMADA"];
      let periodo = "S/A";
      let semana = "S/D";
      let fechaFormateada = "";

      if (fechaRaw) {
        let dateObj: Date;
        if (typeof fechaRaw === 'number') {
          dateObj = new Date((fechaRaw - 25569) * 86400 * 1000);
        } else {
          // Si viene como string "14/05/2025 9:42:15", limpiamos la hora
          const dateStr = String(fechaRaw).split(" ")[0];
          const [d, m, y] = dateStr.split("/");
          dateObj = new Date(Number(y), Number(m) - 1, Number(d));
        }

        if (!isNaN(dateObj.getTime())) {
          semana = getWeekLabel(dateObj);
          periodo = getPeriodoLabel(dateObj);
          fechaFormateada = dateObj.toLocaleDateString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
          });
        }
      }

      // Lógica para identificar Infraestructura (OB)
      // Si empieza con "OB"
      const tienePrefijoOB = nroOT.toUpperCase().startsWith("OB");

      // Si no tiene prefijo pero la descripción dice "(INFRA)"
      const contieneTagInfra = /INFRA/i.test(descripcion);

      const esOB = tienePrefijoOB || contieneTagInfra;

      resultados.push({
        planta: plantaReal,
        ot: nroOT,
        nroOrden: nroOT,
        nroActivo: nroActivo,
        equipo: nroActivo,
        descripcion,
        estado,
        clasificacion,
        periodo,
        semana,
        esOB,
        fecha: fechaFormateada,
        detallesTecnicos: infoCumple?.tecnicos || [],
        rmd: valRmd,
        rse: valRse
      });
    });
  });
  console.log(`Total OTs procesadas: ${resultados.length}`);
  return {
    actual: resultados,
    activos: listaActivos,
    masivoRaw: rawMasivoData,
    cumplimientoRaw: rawCumplimientoData
  };
};