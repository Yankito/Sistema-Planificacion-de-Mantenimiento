import { useState, useMemo, useCallback, useEffect } from "react";
import { toast } from "sonner";
import type { AtrasoRow, BacklogStats, TechStats } from "../types";
import { BarChart3, PieChart, Factory, FileText, Search, Calendar as CalendarIcon, RotateCcw } from "lucide-react";
import { ResumenTable } from "../components/ResumenTable";
import { ExportButton } from "../../../shared/components/ExportButton";
import {
  toISODate,
  getStartOfPreviousYear,
  getCurrentDate
} from "../../../shared/utils/dateUtils";

import { SeguimientoHeader } from "../components/SeguimientoHeader";
import { ComplianceCard } from "../components/ComplianceCard";
import { SeguimientoModal } from "../components/SeguimientoModal";
import { AnalysisDashboard } from "../components/AnalysisDashboard";
import { EvolutionDashboard } from "../components/EvolutionDashboard";
import { LoadingOverlay } from "../../../shared/components/ui/LoadingOverlay";
import { useSeguimientoData } from "../hooks/useSeguimientoData";
import { usePlantasAcceso } from "../../../shared/hooks/usePlantasAcceso";
import * as SeguimientoService from "../services/SeguimientoService";

export const SeguimientoOTsView = () => {
  // Plantas filtradas según acceso del usuario
  const { plantasIndividuales, plantasComplejo, plantasPFAlimentos } = usePlantasAcceso();
  const PLANTAS_COMPLEJO = useMemo(() => plantasComplejo, [plantasComplejo]);
  const PLANTAS_PF_ALIMENTOS = useMemo(() => plantasPFAlimentos, [plantasPFAlimentos]);
  const LISTA_PLANTAS_INDIVIDUALES = useMemo(() => plantasIndividuales, [plantasIndividuales]);
  const LISTA_CUMPLIMIENTO = useMemo(() => LISTA_PLANTAS_INDIVIDUALES, [LISTA_PLANTAS_INDIVIDUALES]);

  const {
    dataActual,
    dataAnterior,
    serverStats,
    reporteActual,
    semanaComparar,
    isLoading,
    cargarDatos
  } = useSeguimientoData();

  const [modoVista, setModoVista] = useState<"ATRASOS" | "CUMPLIDAS">("ATRASOS");
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [selectedYear, setSelectedYear] = useState<string>("TODOS");
  const [selectedSemana, setSelectedSemana] = useState("TODAS");

  const [fechaInicio, setFechaInicio] = useState<string>(toISODate(getStartOfPreviousYear()));
  const [fechaFin, setFechaFin] = useState<string>(toISODate(getCurrentDate()));

  // Carga inicial al entrar a la vista
  useEffect(() => {
    cargarDatos(fechaInicio, fechaFin);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cargarDatos]);

  // NORMALIZACIÓN DE PERIODOS: Comprime años anteriores en una sola columna
  const normalizeData = useCallback((data: AtrasoRow[]) => {
    const currentYear = new Date().getFullYear();

    return data.map(row => {
      // Si ya es año completo (YYYY), ignoramos
      if (/^\d{4}$/.test(row.periodo)) return row;

      let year = 0;

      // Caso 1: MMM-YY (ENE-25)
      if (/^[A-Z]{3}-\d{2}$/.test(row.periodo)) {
        const parts = row.periodo.split('-');
        const yy = parseInt(parts[1], 10);
        year = 2000 + yy;
      }
      // Caso 2: MM/YYYY (01/2025)
      else if (/^\d{1,2}\/\d{4}$/.test(row.periodo)) {
        const parts = row.periodo.split('/');
        year = parseInt(parts[1], 10);
      }
      // Caso 3: YYYY-MM (2025-01)
      else if (/^\d{4}-\d{1,2}$/.test(row.periodo)) {
        const parts = row.periodo.split('-');
        year = parseInt(parts[0], 10);
      }

      // Si detectamos un año y es menor al actual, lo comprimimos
      if (year > 0 && year < currentYear) {
        return { ...row, periodo: year.toString() };
      }

      return row;
    });
  }, []);

  const dataActualNorm = useMemo(() => normalizeData(dataActual), [dataActual, normalizeData]);
  const dataAnteriorNorm = useMemo(() => normalizeData(dataAnterior), [dataAnterior, normalizeData]);

  const [viewDetail, setViewDetail] = useState<{ id: string, esOB: boolean, cat?: string, isGlobal?: boolean, periodo?: string } | null>(null);

  const filtrarDataset = useCallback((dataset: AtrasoRow[], aplicarFiltroModo: boolean) => {
    return dataset.filter(d => {
      if (selectedYear !== "TODOS" && !d.semana.startsWith(selectedYear)) return false;
      if (selectedSemana !== "TODAS" && d.semana !== selectedSemana) return false;
      if (aplicarFiltroModo) {
        if (modoVista === "CUMPLIDAS") return d.clasificacion === "CUMPLIDA";
        return d.clasificacion !== "CUMPLIDA";
      }
      return true;
    });
  }, [selectedYear, selectedSemana, modoVista]);

  const dataFiltrada = useMemo(() => filtrarDataset(dataActualNorm, true), [dataActualNorm, filtrarDataset]);
  const dataDashboard = useMemo(() => filtrarDataset(dataActualNorm, false), [dataActualNorm, filtrarDataset]);

  const dataAnteriorFiltrada = useMemo(() => {
    if (!semanaComparar || dataAnteriorNorm.length === 0) return [];
    return filtrarDataset(dataAnteriorNorm, true);
  }, [dataAnteriorNorm, semanaComparar, filtrarDataset]);

  // HANDLERS
  const handleBuscarPorFecha = () => {
    cargarDatos(fechaInicio || undefined, fechaFin || undefined);
  };

  const handleResetFiltros = () => {
    const start = toISODate(getStartOfPreviousYear());
    const end = toISODate(getCurrentDate());
    setFechaInicio(start);
    setFechaFin(end);
    cargarDatos(start, end);
  };

  const handleExportarExcelCompleto = async () => {
    if (!reporteActual) return;
    try {
      console.log("Exportando Excel completo...");
      console.log("Reporte actual:", reporteActual);
      console.log("Modo vista:", modoVista);
      console.log("Semana comparar:", semanaComparar);
      await SeguimientoService.descargarExcel(reporteActual, modoVista, semanaComparar || "");
    } catch (error) {
      console.error("Error exportando", error);
      toast.error("Error al descargar archivo.");
    }
  };

  // Opciones para filtros internos
  const yearsInRows = useMemo(() => {
    const aniosUnicos = Array.from(new Set(dataActual.map(d => d.semana.split('-')[0])));
    aniosUnicos.sort((a, b) => b.localeCompare(a, undefined, { numeric: true }));
    return ["TODOS", ...aniosUnicos];
  }, [dataActual]);

  const semanasInRows = useMemo(() => {
    const filas = selectedYear === "TODOS" ? dataActual : dataActual.filter(d => d.semana.startsWith(selectedYear));
    return ["TODAS", ...Array.from(new Set(filas.map(d => d.semana))).sort((a, b) => b.localeCompare(a))];
  }, [dataActual, selectedYear]);

  // --- ANALÍTICA FILTRADA PARA EL CENTRO DE ANÁLISIS ---
  const filteredAnalysisStats = useMemo(() => {
    if (!serverStats.flowStats || !serverStats.techStats) return { flow: null, tech: [] };

    // Si no hay filtros aplicados (AÑO=TODOS y SEMANA=TODAS), usamos los del servidor
    if (selectedYear === "TODOS" && selectedSemana === "TODAS") {
      return { flow: serverStats.flowStats, tech: serverStats.techStats };
    }

    // 1. Filtrar Flow Stats (Evolución)
    // Conservamos solo los movimientos de OTs que están en el dataset filtrado actual
    const otsVisibles = new Set(dataDashboard.map(d => d.ot));
    const filteredFlow: BacklogStats = {
      nuevas: serverStats.flowStats.nuevas.filter(ot => otsVisibles.has(ot.ot)),
      finalizadas: serverStats.flowStats.finalizadas.filter(ot => otsVisibles.has(ot.ot)),
      sinCambios: serverStats.flowStats.sinCambios.filter(ot => otsVisibles.has(ot.ot)),
      conAvance: serverStats.flowStats.conAvance.filter(ot => otsVisibles.has(ot.ot)),
      desaparecidas: serverStats.flowStats.desaparecidas.filter(ot => otsVisibles.has(ot.ot)),
    };

    // 2. Recalcular Tech Stats (Técnicos)
    // Es mucho más preciso recalcularlos desde los datos visibles que filtrar los agregados del servidor
    const techMap = new Map<string, TechStats>();
    dataDashboard.forEach(row => {
      row.detallesTecnicos?.forEach(det => {
        const name = det.tecnico.nombre;
        if (!techMap.has(name)) {
          techMap.set(name, {
            nombre: name, totalAsignado: 0, finalizadas: 0, pendientes: 0, efectividad: 0, plantas: []
          });
        }
        const stat = techMap.get(name)!;
        stat.totalAsignado++;
        if (det.opFinalizada || row.clasificacion === 'CUMPLIDA') stat.finalizadas++;
        else stat.pendientes++;
        if (!stat.plantas.includes(row.planta)) stat.plantas.push(row.planta);
      });
    });

    const filteredTech = Array.from(techMap.values())
      .map(s => ({
        ...s,
        efectividad: s.totalAsignado > 0 ? Math.round((s.finalizadas / s.totalAsignado) * 100) : 0
      }))
      .sort((a, b) => b.totalAsignado - a.totalAsignado);

    return { flow: filteredFlow, tech: filteredTech };
  }, [serverStats, dataDashboard, selectedYear, selectedSemana]);

  return (
    <div className="relative p-6 h-full overflow-y-auto bg-slate-50/50 flex flex-col gap-4">
      {isLoading && <LoadingOverlay message="Procesando datos..." />}

      {/* CABECERA PRINCIPAL */}
      <header className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col gap-6">

        {/* NIVEL 1: GESTIÓN DE REPORTES */}
        <div className="flex justify-between items-center pb-4 border-b border-slate-100">
          <div className="flex items-center gap-6">
            <div>
              <h1 className="text-xl font-black text-slate-800 uppercase tracking-tight">Seguimiento OTs</h1>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Control de Gestión Operativa (Tiempo Real)</p>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-[9px] font-black text-slate-400 uppercase bg-slate-100 px-3 py-1 rounded-full">
                DATA EN VIVO
              </span>
            </div>
          </div>

          {/* BOTÓN ANÁLISIS (ACCION PRINCIPAL) */}
          <button
            onClick={() => setShowAnalysis(true)}
            className="flex items-center gap-2 bg-pf-red text-white px-6 py-3 rounded-2xl shadow-lg shadow-pf-red/20 hover:bg-pf-red-hover hover:-translate-y-0.5 active:translate-y-0 transition-all font-black text-xs"
          >
            <BarChart3 size={18} />
            CENTRO DE ANÁLISIS
          </button>
        </div>

        {/* NIVEL 2: FILTROS DE FECHA (CALENDARIO Y ATAJOS) */}
        <div className="flex flex-wrap items-end gap-6 pb-2 border-b border-slate-50">
          <div className="flex items-center gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <CalendarIcon size={12} className="text-pf-red" /> Fecha Inicio
              </label>
              <input
                type="date"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl px-3 py-2 outline-none focus:border-pf-red focus:ring-1 focus:ring-pf-red/20 transition-all"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <CalendarIcon size={12} className="text-pf-red" /> Fecha Fin
              </label>
              <input
                type="date"
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl px-3 py-2 outline-none focus:border-pf-red focus:ring-1 focus:ring-pf-red/20 transition-all"
              />
            </div>
            <button
              onClick={handleBuscarPorFecha}
              className="mt-auto bg-slate-800 text-white p-2.5 rounded-xl hover:bg-black transition-colors shadow-sm active:scale-95"
              title="Buscar"
            >
              <Search size={16} />
            </button>
            <button
              onClick={handleResetFiltros}
              className="mt-auto bg-slate-100 text-slate-500 p-2.5 rounded-xl hover:bg-slate-200 transition-colors shadow-sm active:scale-95 border border-slate-200"
              title="Limpiar Filtros"
            >
              <RotateCcw size={16} />
            </button>
          </div>
        </div>

        {/* NIVEL 3: FILTROS INTERNOS Y EXPORTACIÓN */}
        <div className="flex justify-between items-center">
          <SeguimientoHeader
            modoVista={modoVista}
            setModoVista={setModoVista}
            selectedYear={selectedYear}
            setSelectedYear={setSelectedYear}
            yearsInRows={yearsInRows}
            selectedSemana={selectedSemana}
            setSelectedSemana={setSelectedSemana}
            semanasInRows={semanasInRows}
            resetViewDetail={() => setViewDetail(null)}
          />

          <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
            {/* EXPORTAR IMAGEN (Dashboard) */}
            <ExportButton
              elementId="dashboard-atrasos-container"
              fileName={`Dashboard_${modoVista}_${reporteActual}`}
              plantaSeleccionada="CONSOLIDADO"
              rangoTexto={reporteActual}
              semana={reporteActual}
              reportTitle={modoVista === "ATRASOS" ? "Tablero de Atrasos" : "Tablero de Cumplimiento"}
            />

            <div className="w-px h-6 bg-slate-200 mx-1" />

            {/* EXPORTAR EXCEL (Datos) */}
            {modoVista === "ATRASOS" && (
              <button
                onClick={handleExportarExcelCompleto}

                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl transition-all shadow-lg active:scale-95 border border-slate-800 bg-slate-900 text-white hover:bg-black hover:shadow-pf-red/20`}
              >
                <FileText size={14} />
                DESCARGAR EXCEL
              </button>
            )}
          </div>
        </div>
      </header>

      <div id="dashboard-atrasos-container" className="p-2 bg-slate-50/50">
        {modoVista === "ATRASOS" ? (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12 animate-in fade-in duration-500">
              {[{ t: "OM", es: false }, { t: "OB", es: true }].map(tipo => (
                <div key={tipo.t}>
                  <h3 className="text-sm font-black mb-4 uppercase text-pf-red">Consolidado {tipo.t}</h3>
                  <ResumenTable
                    titulo="PF ALIMENTOS"
                    dataset={dataFiltrada.filter(d => (!!d.esOB === tipo.es) && PLANTAS_PF_ALIMENTOS.includes(d.planta))}
                    datasetAnt={dataAnteriorFiltrada.filter(d => (!!d.esOB === tipo.es) && PLANTAS_PF_ALIMENTOS.includes(d.planta))}
                    esOB={tipo.es} modoVista={modoVista} isGlobal showComparison={!!semanaComparar}
                    onDetail={(cat, periodo) => setViewDetail({ id: "PF ALIMENTOS", esOB: tipo.es, cat, periodo, isGlobal: true })}
                  />
                  {plantasComplejo.length > 0 && (
                    <ResumenTable
                      titulo="COMPLEJO"
                      dataset={dataFiltrada.filter(d => (!!d.esOB === tipo.es) && PLANTAS_COMPLEJO.includes(d.planta))}
                      datasetAnt={dataAnteriorFiltrada.filter(d => (!!d.esOB === tipo.es) && PLANTAS_COMPLEJO.includes(d.planta))}
                      esOB={tipo.es} modoVista={modoVista} isGlobal showComparison={!!semanaComparar}
                      onDetail={(cat, periodo) => setViewDetail({ id: "COMPLEJO", esOB: tipo.es, cat, periodo, isGlobal: true })}
                    />
                  )}
                </div>
              ))}
            </div>

            {!isLoading && serverStats.flowStats && (
              <div className="mb-12 border-t border-slate-200 pt-8">
                <EvolutionDashboard
                  nuevas={serverStats.flowStats.nuevas}
                  finalizadas={serverStats.flowStats.finalizadas}
                  conAvance={serverStats.flowStats.conAvance}
                  semanaActual={reporteActual}
                  semanaAnterior={semanaComparar}
                />
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in duration-700 delay-100">
              {[{ t: "OM", es: false }, { t: "OB", es: true }].map(tipo => (
                <div key={tipo.t}>
                  <h3 className="text-xs font-black text-slate-400 mb-4 uppercase flex items-center gap-2"><Factory size={14} /> Plantas ({tipo.t})</h3>
                  {LISTA_PLANTAS_INDIVIDUALES.map(p => (
                    <ResumenTable
                      key={p} titulo={p}
                      dataset={dataFiltrada.filter(d => d.planta === p && (!!d.esOB === tipo.es))}
                      datasetAnt={dataAnteriorFiltrada.filter(d => d.planta === p && (!!d.esOB === tipo.es))}
                      esOB={tipo.es} modoVista={modoVista} showComparison={!!semanaComparar}
                      onDetail={(cat, periodo) => setViewDetail({ id: p, esOB: tipo.es, cat, periodo })}
                    />
                  ))}
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="animate-in zoom-in-95 duration-300">
            <div className="flex items-center gap-2 mb-6">
              <PieChart className="text-green-600" />
              <h3 className="text-lg font-black uppercase text-slate-700">Tablero de Cumplimiento</h3>
              <span className="text-sm font-bold text-slate-400">({selectedSemana === "TODAS" ? "Consolidado" : selectedSemana})</span>
            </div>
            <div className="mb-10">
              <h4 className="text-sm font-black text-slate-500 mb-4 uppercase border-b pb-2">Mantención (OM)</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {LISTA_CUMPLIMIENTO.map(p => (
                  <ComplianceCard key={`om-${p}`} planta={p} esOB={false} dataSemanaActual={dataDashboard} onClick={() => setViewDetail({ id: p, esOB: false })} />
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-sm font-black text-slate-500 mb-4 uppercase border-b pb-2">Infraestructura (OB)</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {LISTA_CUMPLIMIENTO.map(p => (
                  <ComplianceCard key={`ob-${p}`} planta={p} esOB={true} dataSemanaActual={dataDashboard} onClick={() => setViewDetail({ id: p, esOB: true })} />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <AnalysisDashboard
        isOpen={showAnalysis}
        onClose={() => setShowAnalysis(false)}
        periodoLabel={`${selectedSemana === 'TODAS' ? (selectedYear === 'TODOS' ? 'Histórico' : selectedYear) : selectedSemana}`}
        flowStats={filteredAnalysisStats.flow}
        techStats={filteredAnalysisStats.tech}
        plantasDisponibles={LISTA_PLANTAS_INDIVIDUALES}
        currentData={dataDashboard}
      />

      {viewDetail && (
        <SeguimientoModal
          viewDetail={viewDetail}
          onClose={() => setViewDetail(null)}
          dataModo={modoVista === "CUMPLIDAS" ? dataDashboard : dataFiltrada}
          dataAnterior={modoVista === "ATRASOS" ? dataAnteriorFiltrada : []}
          selectedSemana={selectedSemana}
          LISTA_PLANTAS_INDIVIDUALES={LISTA_PLANTAS_INDIVIDUALES}
          PLANTAS_COMPLEJO={PLANTAS_COMPLEJO}
          PLANTAS_PF_ALIMENTOS={PLANTAS_PF_ALIMENTOS}
          modoVista={modoVista}
        />
      )}
    </div>
  );
};