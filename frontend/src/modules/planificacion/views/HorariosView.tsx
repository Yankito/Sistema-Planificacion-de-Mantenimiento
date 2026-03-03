import { useRef, useEffect } from "react";
import { HorarioView } from "../components/HorarioView";
import { Wrench, Zap, Users, Info, CalendarDays, FileSpreadsheet, Download } from "lucide-react";
import { usePlanificacionManager } from "../hooks/usePlanificacionManager";
import { getMonthOptions } from "../../../shared/utils/dateUtils";
import { usePlantasAcceso } from "../../../shared/hooks/usePlantasAcceso";
import { confirmDialog } from "../../../shared/utils/confirmDialog";
import { toast } from "sonner";
import { MasivoService } from "../../../shared/services/MasivoService";
import { LoadingOverlay } from "../../../shared/components/ui/LoadingOverlay";
import { uploadHorarios } from "../services/PlanificacionService";

/**
 * Vista principal para la gestión y visualización de Horarios (Disponibilidad de Técnicos).
 * 
 * Funcionalidades principales:
 * - Consulta de disponibilidad mensual distribuida en un calendario (Gantt).
 * - Carga masiva de horarios mediante archivos Excel.
 * - Filtros por Planta y Mes para dimensionar correctamente a los equipos (Mecánicos/Eléctricos, etc).
 */
export const HorariosView = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Custom hook que concentra toda la lógica de estado global (datos devueltos por la API, filtros seleccionados)
  const manager = usePlanificacionManager();
  const {
    horariosResult,
    plantaPlan,
    setPlantaPlan,
    cargandoPlan,
    handleCambioTurno,
    periodoSeleccionado,
    setPeriodoSeleccionado,
    cargarHorarios
  } = manager;

  // React hook para mantener la vista sincronizada con el backend ante cambios en los filtros clave
  useEffect(() => {
    cargarHorarios(periodoSeleccionado, plantaPlan);
  }, [cargarHorarios, periodoSeleccionado, plantaPlan]);

  /** 
   * Manejador del evento de subida de archivos Excel.
   * Utiliza la API `uploadHorarios` para parsear y guardar el periodo elegido.
   * 
   * @param {React.ChangeEvent<HTMLInputElement>} e - Evento del input type file oculto.
   */
  const handleUploadHorarios = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const confirmed = await confirmDialog(`¿Cargar horarios para ${periodoSeleccionado}?`, '(Requiere plantilla Horarios)');
    if (!confirmed) {
      e.target.value = '';
      return;
    }

    try {
      const parts = periodoSeleccionado.split('-');
      const anio = Number(parts[0]);
      const mes = Number(parts[1]);

      await uploadHorarios(file, mes, anio);
      toast.success("Carga completada.");
      setTimeout(() => window.location.reload(), 1500);
    } catch (err) {
      const error = err as Error;
      toast.error("Error: " + error.message);
    } finally {
      if (e.target) e.target.value = '';
    }
  };

  const { plantasPlanificacion: plantas } = usePlantasAcceso();
  const mesOpts = getMonthOptions().options;

  const totalMecanicos = horariosResult.filter(h =>
    h.rol?.toLowerCase() === 'm' || h.rol?.toLowerCase() === 'mecanico'
  ).length;

  const totalElectricos = horariosResult.filter(h =>
    h.rol?.toLowerCase() === 'e' || h.rol?.toLowerCase() === 'electrico'
  ).length;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">

      {/* HEADER */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center bg-white p-8 rounded-[2.5rem] border border-pf-border shadow-sm gap-6">
        <div className="flex items-center space-x-6">
          <div className="bg-pf-red p-4 rounded-3xl shadow-lg shadow-pf-red/20 text-white">
            <Users size={28} />
          </div>
          <div>
            <h3 className="text-2xl font-black text-slate-900 tracking-tight leading-none">
              Disponibilidad de Técnicos
            </h3>
            <div className="flex items-center gap-4 mt-3">
              <div className="flex items-center bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                <Wrench size={12} className="mr-2 text-blue-600" />
                <span className="text-[10px] font-black text-blue-700 uppercase">{totalMecanicos} Mecánicos</span>
              </div>
              <div className="flex items-center bg-yellow-50 px-3 py-1 rounded-full border border-yellow-100">
                <Zap size={12} className="mr-2 text-yellow-600" />
                <span className="text-[10px] font-black text-yellow-700 uppercase">{totalElectricos} Eléctricos</span>
              </div>
            </div>
          </div>
        </div>

        {/* SELECTORES: PLANTA Y Mes */}
        <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto">
          <div className="flex flex-col w-full sm:w-64">
            <label className="text-[10px] font-black text-slate-400 uppercase mb-1 px-1 flex items-center gap-1">
              <CalendarDays size={12} /> Mes
            </label>
            <select
              value={periodoSeleccionado}
              onChange={(e) => setPeriodoSeleccionado(e.target.value)}
              disabled={cargandoPlan}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 font-bold text-slate-700 outline-none focus:ring-2 focus:ring-pf-red/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {mesOpts.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col w-full sm:w-48">
            <label className="text-[10px] font-black text-slate-400 uppercase mb-1 px-1">Planta</label>
            <select
              value={plantaPlan}
              onChange={(e) => setPlantaPlan(e.target.value)}
              disabled={cargandoPlan}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 font-bold text-slate-700 outline-none focus:ring-2 focus:ring-pf-red/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {plantas.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>

          {/* BOTONES CARGA */}
          <div className="flex items-end gap-2 h-full pt-4 lg:pt-0">
            <input type="file" ref={fileInputRef} className="hidden" accept=".xlsx,.xls" onChange={handleUploadHorarios} />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={cargandoPlan}
              className="bg-pf-red hover:bg-pf-red/80 text-white p-3 rounded-2xl transition-all shadow-lg shadow-pf-red/20 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              title="Cargar Horarios"
            >
              <FileSpreadsheet size={20} /> Carga de Horarios
            </button>
            <button
              onClick={async () => {
                try {
                  await MasivoService.descargarPlantillaHorarios();
                } catch (e) {
                  toast.error("Error al descargar: " + (e as Error).message);
                }
              }}
              disabled={cargandoPlan}
              className="bg-white border border-slate-200 text-slate-400 p-3 rounded-2xl hover:text-pf-red hover:border-pf-red/20 transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              title="Descargar Plantilla Horarios"
            >
              <Download size={20} /> Plantilla de Horarios
            </button>
          </div>
        </div>
      </div>

      {/* LEYENDA */}
      <div className="flex justify-between items-center px-4">
        <div className="flex flex-wrap gap-6 px-2 py-2">
          {[
            { label: 'Mañana', color: 'bg-blue-500', code: 'M' },
            { label: 'Tarde', color: 'bg-orange-500', code: 'T' },
            { label: 'Noche', color: 'bg-slate-800', code: 'N' },
            { label: 'Vacaciones', color: 'bg-emerald-500', code: 'V' }
          ].map(item => (
            <div key={item.code} className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${item.color}`}></div>
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">{item.label} ({item.code})</span>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2 text-slate-400">
          <Info size={14} />
          <span className="text-[10px] font-bold uppercase">Haz clic en una celda para cambiar turno</span>
        </div>
      </div>

      {/* GANTT CHRT */}
      <div className="bg-white rounded-[3rem] border border-pf-border shadow-md overflow-hidden min-h-[400px] relative">
        {cargandoPlan ? (
          <LoadingOverlay message="Consultando Oracle..." />
        ) : horariosResult.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-4">
            <CalendarDays size={64} className="opacity-20" />
            <p className="font-bold text-sm">No hay horarios cargados para la semana y planta seleccionada.</p>
          </div>
        ) : (
          <HorarioView
            horarios={horariosResult}
            onCambioTurno={handleCambioTurno}
          />
        )}
      </div>
    </div>
  );
};
