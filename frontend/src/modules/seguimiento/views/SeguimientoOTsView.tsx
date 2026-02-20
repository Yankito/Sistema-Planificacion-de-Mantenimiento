
import { useState, useMemo, useCallback } from "react";
import type { AtrasoRow } from "../types";
import { BarChart3, PieChart, Factory, FileText } from "lucide-react";
import { ResumenTable } from "../components/ResumenTable";
import { ExportButton } from "../../../shared/components/ExportButton";

import { SeguimientoHeader } from "../components/SeguimientoHeader";
import { ComplianceCard } from "../components/ComplianceCard";
import { SeguimientoModal } from "../components/SeguimientoModal";
import { AnalysisDashboard } from "../components/AnalysisDashboard";
import { EvolutionDashboard } from "../components/EvolutionDashboard";
import { LoadingOverlay } from "../../../shared/components/ui/LoadingOverlay";
import * as SeguimientoService from "../services/SeguimientoService";

import { useData } from "../../../context/PlanificacionContext";

export const SeguimientoOTsView = () => {
  const { seguimiento: seguimientoData } = useData();

  const {
    dataActual,
    dataAnterior,
    serverStats,
    reporteActual,
    semanaComparar,
    isLoading
  } = seguimientoData;

  // CONSTANTES
  const PLANTAS_COMPLEJO = useMemo(() => ["PF3", "PF4", "PF5", "PF6", "CDT", "OTROS", "DC", "VENTAS"], []);
  const PLANTAS_PF_ALIMENTOS = useMemo(() => ["PF1", "PF2", ...PLANTAS_COMPLEJO], [PLANTAS_COMPLEJO]);
  const LISTA_PLANTAS_INDIVIDUALES = useMemo(() => ["PF1", "PF2", "PF3", "PF4", "PF5", "PF6", "CDT", "OTROS", "MPS", "DC", "VENTAS"], []);
  const LISTA_CUMPLIMIENTO = useMemo(() => LISTA_PLANTAS_INDIVIDUALES, [LISTA_PLANTAS_INDIVIDUALES]);

  const [modoVista, setModoVista] = useState<"ATRASOS" | "CUMPLIDAS">("ATRASOS");
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [selectedYear, setSelectedYear] = useState<string>("TODOS");
  const [selectedSemana, setSelectedSemana] = useState("TODAS");

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
  const handleExportarExcelCompleto = async () => {
    if (!reporteActual) return;
    try {
      await SeguimientoService.descargarExcel(reporteActual, modoVista, semanaComparar || "");
    } catch (error) {
      console.error("Error exportando", error);
      alert("Error al descargar archivo.");
    }
  };

  // Opciones para filtros internos
  const yearsInRows = useMemo(() => {
    const aniosUnicos = Array.from(new Set(dataActual.map(d => d.semana.split('-')[0])));
    aniosUnicos.sort((a, b) => b.localeCompare(a, undefined, { numeric: true }));
    return ["TODAS", ...aniosUnicos];
  }, [dataActual]);

  const semanasInRows = useMemo(() => {
    const filas = selectedYear === "TODOS" ? dataActual : dataActual.filter(d => d.semana.startsWith(selectedYear));
    return ["TODAS", ...Array.from(new Set(filas.map(d => d.semana))).sort((a, b) => b.localeCompare(a))];
  }, [dataActual, selectedYear]);

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

        {/* NIVEL 2: FILTROS Y EXPORTACIÓN */}
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
                  <ResumenTable
                    titulo="COMPLEJO"
                    dataset={dataFiltrada.filter(d => (!!d.esOB === tipo.es) && PLANTAS_COMPLEJO.includes(d.planta))}
                    datasetAnt={dataAnteriorFiltrada.filter(d => (!!d.esOB === tipo.es) && PLANTAS_COMPLEJO.includes(d.planta))}
                    esOB={tipo.es} modoVista={modoVista} isGlobal showComparison={!!semanaComparar}
                    onDetail={(cat, periodo) => setViewDetail({ id: "COMPLEJO", esOB: tipo.es, cat, periodo, isGlobal: true })}
                  />
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
        periodoLabel={`${semanaComparar || 'Inicio'} -> ${reporteActual}`}
        flowStats={serverStats.flowStats}
        techStats={serverStats.techStats}
        plantasDisponibles={LISTA_PLANTAS_INDIVIDUALES}
        currentData={dataActual}
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