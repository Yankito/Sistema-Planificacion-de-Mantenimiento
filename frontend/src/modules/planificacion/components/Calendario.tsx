import { Moon, CheckCircle2, UserX, Users, Wand2, Loader2 } from "lucide-react";
import { useCalendarioGrid } from "../hooks/useCalendarioGrid";
import { type PlanResult } from "../types";
import { type Tecnico } from "../../../shared/types";

interface CalendarioProps {
  planResult: PlanResult[];
  diaSeleccionado: string | null;
  setDiaSeleccionado: (dia: string | null) => void;
  draggingOT: PlanResult | null;
  handleDragEnter: (e: React.DragEvent, fecha: string) => void;
  handleDragOver: (e: React.DragEvent) => void;
  handleDrop: (e: React.DragEvent, fecha: string) => void;
  isNocheValid: (tecnicos: Tecnico[], fecha: string) => boolean;
  showSuccess: boolean;
  dragOverDate: string | null;
  ordenesPorDia: Record<string, PlanResult[]>; // Tipado para el objeto de agrupación
  mostrarSoloVacantes: boolean;
  setMostrarSoloVacantes: (v: boolean) => void;
  mensajeExito?: string;
  handleSugerirTodo: () => void;
  mesSeleccionado: string;
  cargandoPlan?: boolean;
}

export const Calendario = ({
  planResult,
  diaSeleccionado,
  setDiaSeleccionado,
  draggingOT,
  handleDragEnter,
  handleDragOver,
  handleDrop,
  isNocheValid,
  showSuccess,
  dragOverDate,
  ordenesPorDia,
  mostrarSoloVacantes,
  setMostrarSoloVacantes,
  mensajeExito = "Planificación Actualizada",
  handleSugerirTodo,
  mesSeleccionado,
  cargandoPlan
}: CalendarioProps) => {

  // USAMOS EL HOOK (Lógica de Fechas extraída)
  const { semanas, nombreMes, totalOrdenesMes, anioActual } = useCalendarioGrid(planResult, ordenesPorDia, mesSeleccionado);

  return (
    <div className="flex-1 space-y-6 relative">
      {/* Notificación Dinámica */}
      {showSuccess && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-[100] bg-green-600 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-top duration-300">
          <CheckCircle2 size={20} />
          <span className="font-black uppercase text-xs tracking-widest">{mensajeExito}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-pf-border shadow-sm">
        <div className="flex items-center space-x-6">
          <h3 className="text-xl font-black text-slate-900 uppercase italic">Planificación</h3>

          {/* BOTÓN FILTRO */}
          <button
            onClick={() => setMostrarSoloVacantes(!mostrarSoloVacantes)}
            className={`
               flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border shadow-sm w-56
               ${mostrarSoloVacantes
                ? 'bg-amber-100 text-amber-700 border-amber-300 ring-2 ring-amber-200'
                : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50 hover:text-slate-700'}
            `}
          >
            {mostrarSoloVacantes ? <UserX size={14} /> : <Users size={14} />}
            <span>{mostrarSoloVacantes ? 'Mostrando OTs Incompletas' : 'Filtrar Sin Técnico'}</span>
          </button>

          <div className="flex items-center gap-3 px-4 border-l border-slate-100">
            <div className="text-right hidden xl:block">
              <span className="text-[12px] font-black text-slate-700 uppercase tracking-widest block">{nombreMes} {anioActual}</span>
            </div>
            <div className="bg-pf-red text-white px-3 py-1 rounded-lg shadow-sm shadow-pf-red/20">
              <span className="text-xs font-black uppercase tracking-wider">{totalOrdenesMes} OTS</span>
            </div>
          </div>
          {/* BARRA DE ACCIONES SUPERIOR */}
          <div className="flex justify-end relative z-20 px-6 pointer-events-none">
            <button
              onClick={handleSugerirTodo}
              className="pointer-events-auto bg-pf-red hover:bg-pf-red-dark text-white px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 shadow-lg shadow-pf-red/20 transition-all transform hover:scale-105 active:scale-95"
            >
              <Wand2 size={16} />
              Auto-Completar Vacantes
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white p-8 rounded-[3rem] border border-pf-border shadow-sm relative overflow-hidden">
        {cargandoPlan && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center gap-3">
            <Loader2 size={40} className="text-pf-red animate-spin" />
            <p className="font-bold text-xs uppercase tracking-widest text-slate-500 animate-pulse">Cargando Planificación...</p>
          </div>
        )}
        <div className="grid grid-cols-7 gap-3 mb-2 pl-6">
          {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map(d => (
            <div key={d} className="text-center text-[10px] font-black text-slate-300 uppercase tracking-widest">{d}</div>
          ))}
        </div>

        <div className="space-y-4">
          {semanas.map((sem, idx) => {
            const isWeekActive = diaSeleccionado === sem.idSemana;

            return (
              <div key={idx} className="relative group/semana">
                <div className="absolute -left-2 top-1/2 -translate-y-1/2 -translate-x-full pr-2">
                  <button
                    onClick={() => setDiaSeleccionado(isWeekActive ? null : sem.idSemana)}
                    className={`
                      text-[10px] font-black uppercase tracking-tighter transition-all hover:scale-110
                      ${isWeekActive ? 'text-pf-red underline scale-110' : 'text-slate-300 hover:text-pf-red'}
                    `}
                  >
                    S{sem.numero}
                  </button>
                </div>

                <div className={`grid grid-cols-7 gap-3 p-2 rounded-3xl transition-colors duration-300 ${isWeekActive ? 'bg-pf-red/[0.03]' : ''}`}>
                  {sem.dias.map((fecha, i) => {
                    if (!fecha) return <div key={`e-${idx}-${i}`} className="aspect-square" />;

                    const ordenesDelDia = ordenesPorDia[fecha] || [];
                    const totalCount = ordenesDelDia.length;

                    const vacantesCount = ordenesDelDia.filter((ot) =>
                      ot.tecnicos.some((t) => t.nombre === 'VACANTE')
                    ).length;

                    const countDisplay = mostrarSoloVacantes ? vacantesCount : totalCount;
                    const isActive = countDisplay > 0;
                    const estaFiltrado = mostrarSoloVacantes && !isActive && totalCount > 0;
                    const hasAnyVacancy = vacantesCount > 0;

                    const diaNum = parseInt(fecha.split('/')[0]);
                    const esNocheOk = draggingOT && isNocheValid(draggingOT.tecnicos.map(t => ({ ...t, planta: draggingOT.planta })), fecha);
                    const isHovered = dragOverDate === fecha;
                    const isDaySelected = diaSeleccionado === fecha;

                    return (
                      <div
                        key={fecha}
                        onDragEnter={(e) => handleDragEnter(e, fecha)}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, fecha)}
                        onClick={() => setDiaSeleccionado(isDaySelected ? null : fecha)}
                        className={`aspect-square group rounded-[2rem] border-2 transition-all duration-200 flex flex-col items-center justify-center p-2 cursor-pointer relative
                          ${isDaySelected ? 'border-pf-red bg-pf-red/[0.02]' : 'border-slate-50'}
                          ${isWeekActive && !isDaySelected ? 'border-pf-red/10 bg-white' : ''}
                          ${isHovered ? 'bg-slate-100 ring-4 ring-pf-red/20 scale-110 z-20' : ''} 
                          ${esNocheOk && !isHovered ? 'bg-pf-red/5 border-pf-red/30' : ''}
                          ${draggingOT && !esNocheOk && !isHovered ? 'opacity-30 blur-[1px]' : 'opacity-100'}
                          
                          ${estaFiltrado ? 'opacity-20 grayscale border-transparent' : ''}
                          ${hasAnyVacancy && !isDaySelected && !mostrarSoloVacantes ? 'border-amber-200' : ''}

                          hover:border-slate-200
                        `}
                      >
                        {esNocheOk && <Moon size={14} className="absolute top-3 right-3 text-pf-red fill-pf-red animate-pulse" />}

                        {hasAnyVacancy && !mostrarSoloVacantes && (
                          <div className="absolute top-3 right-3 w-2 h-2 bg-amber-500 rounded-full animate-pulse shadow-sm" title="Tiene vacantes" />
                        )}

                        <span className={`text-2xl font-black ${isActive ? 'text-slate-800' : 'text-slate-200'}`}>{diaNum}</span>

                        {isActive && (
                          <div className={`mt-1 px-2 py-0.5 text-white rounded-full font-black text-[9px] uppercase shadow-sm transition-all
                             ${mostrarSoloVacantes ? 'bg-amber-500 scale-110' : (hasAnyVacancy ? 'bg-slate-800' : 'bg-pf-red')}
                          `}>
                            {countDisplay} {mostrarSoloVacantes ? 'INC' : 'OTS'}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};