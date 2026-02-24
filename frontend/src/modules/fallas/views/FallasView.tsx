import { useState, useMemo, useEffect } from "react";
import { Filter, LayoutDashboard, Table as TableIcon, PieChart, XCircle, ArrowRight } from "lucide-react";
import { getRangoSemana } from "../../../shared/utils/dateUtils";
import { SelectPill } from "../components/ui/SelectPill";
import { AssetDetailView } from "../components/AssetDetailView";
import { DashboardTab } from "../components/DashboardTab";
import { CausasTab } from "../components/CausasTab";
import { TablaTab } from "../components/TablaTab";
import { ExportButton } from "../../../shared/components/ExportButton";
import { useFallasData } from "../hooks/useFallasData";
import { useFallasManager } from "../hooks/useFallasManager";
import { usePlantasAcceso } from "../../../shared/hooks/usePlantasAcceso";



export const FallasView = () => {
    const manager = useFallasManager();
    const { data, loadData } = manager;

    // Carga inicial al entrar a la vista
    useEffect(() => {
        if (data.length === 0) {
            loadData();
        }
    }, [loadData, data.length]);

    // 1. LÓGICA (Hook)
    const {
        datosFiltrados, analytics, timelineStats, timelineStatsPrev, config,
        anioFiltro, setAnioFiltro,
        plantaFiltro, setPlantaFiltro,
        semanaFiltro, setSemanaFiltro,
        filtroDrill, setFiltroDrill,
        topN, setTopN
    } = useFallasData(data);

    // 2. ESTADOS VISUALES (Solo UI)
    const [activeTab, setActiveTab] = useState<'DASH' | 'CAUSAS' | 'TABLA'>('DASH');
    const [activoSeleccionado, setActivoSeleccionado] = useState<string | null>(null);

    // Filtrar plantas del selector por las que el usuario tiene acceso
    const { filtrarPlantas } = usePlantasAcceso();
    const plantasAccesibles = useMemo(() => filtrarPlantas(config.plantas), [config.plantas, filtrarPlantas]);

    // Helper visual
    const rangoTextoHeader = semanaFiltro !== "TODAS"
        ? getRangoSemana(Number(semanaFiltro), anioFiltro)
        : `Año ${anioFiltro}`;

    if (activoSeleccionado) {
        return (
            <AssetDetailView
                assetName={activoSeleccionado}
                data={data.filter(d => d.anio === anioFiltro)}
                onBack={() => setActivoSeleccionado(null)}
            />
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-20 font-sans text-slate-800">

            {/* HEADER Y FILTROS */}
            <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm flex flex-col xl:flex-row justify-between items-center gap-6">
                <div>
                    <div className="flex items-center gap-3">
                        <h2 className="text-2xl font-black text-slate-800 tracking-tight">Dashboard de Activos</h2>
                        {filtroDrill && (
                            <span className="px-3 py-1 bg-pf-red/10 text-pf-red rounded-full text-xs font-bold flex items-center gap-2 cursor-pointer hover:bg-pf-red/20 transition-colors" onClick={() => setFiltroDrill(null)}>
                                <Filter size={12} /> {filtroDrill.valor} <XCircle size={14} />
                            </span>
                        )}
                    </div>

                    <div className="flex items-center gap-4 mt-2">
                        <p className="text-sm text-slate-500 font-medium">
                            Visualizando: <span className="font-bold text-slate-700">{rangoTextoHeader}</span>
                        </p>
                        <p className="text-sm text-slate-500 font-medium">
                            Planta: <span className="font-bold text-slate-700">{plantaFiltro === "TODAS" ? "Todas las Plantas" : plantaFiltro}</span>
                        </p>
                        {filtroDrill?.tipo === 'EQUIPO' && (
                            <button onClick={() => setActivoSeleccionado(filtroDrill.valor)} className="flex items-center gap-2 bg-slate-800 text-white text-xs font-bold px-3 py-1 rounded-lg hover:bg-slate-700 hover:scale-105 transition-all shadow-md animate-in fade-in slide-in-from-left-2">
                                Ver Historial Detallado <ArrowRight size={12} />
                            </button>
                        )}
                    </div>
                </div>

                <div className="flex flex-wrap gap-3 items-center justify-end">
                    <div className="flex items-center bg-slate-100 p-1 rounded-xl">
                        <span className="px-2 text-[10px] font-bold text-slate-400 uppercase">Top:</span>
                        {[5, 10, 20].map(n => (
                            <button key={n} onClick={() => setTopN(n)} className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${topN === n ? 'bg-white text-pf-red shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>{n}</button>
                        ))}
                    </div>

                    <ExportButton
                        elementId="container-reporte-final"
                        fileName={` ${plantaFiltro}_${semanaFiltro === 'TODAS' ? 'Anual' : 'S' + semanaFiltro}`}
                        plantaSeleccionada={plantaFiltro === "TODAS" ? "TODAS LAS PLANTAS" : plantaFiltro}
                        rangoTexto={rangoTextoHeader}
                        semana={semanaFiltro}
                        reportTitle="Reporte de Fallas de Activos"
                    />

                    <div className="h-8 w-[1px] bg-slate-200 hidden sm:block"></div>
                    <div className="bg-slate-100 p-1 rounded-xl flex">
                        <button onClick={() => setActiveTab('DASH')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${activeTab === 'DASH' ? 'bg-white text-pf-red shadow' : 'text-slate-400'}`}><LayoutDashboard size={14} /> <span className="hidden sm:inline">General</span></button>
                        <button onClick={() => setActiveTab('CAUSAS')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${activeTab === 'CAUSAS' ? 'bg-white text-pf-red shadow' : 'text-slate-400'}`}><PieChart size={14} /> <span className="hidden sm:inline">Causas</span></button>
                        <button onClick={() => setActiveTab('TABLA')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${activeTab === 'TABLA' ? 'bg-white text-pf-red shadow' : 'text-slate-400'}`}><TableIcon size={14} /> <span className="hidden sm:inline">Datos</span></button>
                    </div>
                    <div className="flex gap-2">
                        <SelectPill value={semanaFiltro} onChange={setSemanaFiltro} options={config.semanas} label="Semana" allLabel="Todas" />
                        <SelectPill value={plantaFiltro} onChange={setPlantaFiltro} options={plantasAccesibles} label="Planta" allLabel="Todas" />
                        <SelectPill value={anioFiltro} onChange={(val: string | number) => setAnioFiltro(Number(val))} options={config.anios} label="Año" />
                    </div>
                </div>
            </div>

            <div id="container-reporte-final" className="p-1">
                {activeTab === 'DASH' && (
                    <DashboardTab
                        analytics={analytics}
                        timelineStatsPrev={timelineStatsPrev}
                        semanaFiltro={semanaFiltro}
                        setSemanaFiltro={setSemanaFiltro}
                        timelineStats={timelineStats}
                        filtroDrill={filtroDrill}
                        setFiltroDrill={setFiltroDrill}
                        rangoTexto={rangoTextoHeader}
                        topN={topN}
                        anioFiltro={anioFiltro}
                    />
                )}

                {activeTab === 'CAUSAS' && (
                    <CausasTab analytics={analytics} filtroDrill={filtroDrill} setFiltroDrill={setFiltroDrill} />
                )}

                {activeTab === 'TABLA' && <TablaTab data={datosFiltrados} />}
            </div>
        </div>
    );
};