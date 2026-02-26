// Dashboard Principal - Vista simplificada con indicadores generales
// No carga datos de planificación ni seguimiento automáticamente
import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/useAuth';
import { toast } from 'sonner';
import * as AuthService from '../../auth/services/AuthService';
import type { DashboardIndicadores } from '../../auth/types';
import {
  Factory, Users, AlertTriangle, Wrench, BarChart2,
  ClipboardList, Clock, TrendingUp, ArrowRight, Building2, Lock,
  type LucideIcon
} from 'lucide-react';
import { FileUploader, type FileType, type UploadEvent } from '../../../shared/components/FileUploader';
import { getWeekOptions } from '../../../shared/utils/dateUtils';
import { usePlanificacionManager } from '../../planificacion/hooks/usePlanificacionManager';
import { useSeguimientoData } from '../../seguimiento/hooks/useSeguimientoData';
import { useFallasManager } from '../../fallas/hooks/useFallasManager';

const PERMISOS_MODULOS: Record<string, string[]> = {
  programador: ['planificacion', 'gastos', 'seguimiento-planta'],
  analista: ['seguimiento-global', 'fallas', 'gastos-consolidado'],
  supervisor: ['planificacion', 'gastos', 'seguimiento-global', 'seguimiento-planta', 'fallas', 'gastos-consolidado'],
};

interface DashboardViewProps {
  setActiveTab: (tab: string) => void;
}

export const DashboardView = ({ setActiveTab }: DashboardViewProps) => {
  const { user } = useAuth();
  const planning = usePlanificacionManager();
  const seguimiento = useSeguimientoData();
  const fallas = useFallasManager();

  const [indicadores, setIndicadores] = useState<DashboardIndicadores | null>(null);
  const [loading, setLoading] = useState(true);
  const [targetUploadWeek, setTargetUploadWeek] = useState(getWeekOptions().default);
  const [highlightedModule] = useState<FileType | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const fetchIndicadores = async () => {
      try {
        const data = await AuthService.getIndicadores();
        setIndicadores(data);
      } catch (err) {
        console.error('Error cargando indicadores:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchIndicadores();
  }, []);

  // Determinar módulos accesibles según roles del usuario
  const modulosAccesibles = new Set<string>();
  user?.roles.forEach(rol => {
    PERMISOS_MODULOS[rol]?.forEach(m => modulosAccesibles.add(m));
  });

  const tieneAcceso = (modulo: string) => modulosAccesibles.has(modulo);

  const handleFileProcess = async (e: UploadEvent, tipo: FileType, extraData?: { mes?: number, anio?: number }) => {
    const file = (e as UploadEvent).target?.files?.[0];
    if (!file) return;
    setIsProcessing(true);
    try {
      if (tipo === 'MASIVO') {
        const { MasivoService } = await import('../../../shared/services/MasivoService');
        const res = await MasivoService.uploadExcel(file, targetUploadWeek, extraData?.mes, extraData?.anio);
        toast.success(
          <div className="flex flex-col gap-1">
            <span className="font-bold">Carga Masiva Exitosa:</span>
            <ul className="text-xs text-slate-500 list-disc list-inside">
              <li>Empleados: {res.counts.empleados}</li>
              <li>Activos: {res.counts.activos}</li>
              <li>Horarios: {res.counts.horarios}</li>
              <li>Pedidos: {res.counts.pedidos}</li>
              <li>Fallas: {res.counts.fallas}</li>
            </ul>
          </div>
        );
        setTimeout(() => window.location.reload(), 2000);
      }
    } catch (err) {
      const error = err as Error;
      console.error('Error procesando archivo', error);
      toast.error('Error al procesar el archivo: ' + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const contadores = indicadores?.contadores;

  return (
    <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tighter uppercase italic">
            Control Industrial <span className="text-pf-red">PF</span>
          </h2>
          <p className="text-slate-400 font-medium text-sm">
            Bienvenido, <span className="text-slate-600 font-bold">{user?.primerNombre} {user?.primerApellido}</span>
            <span className="ml-2 text-[10px] bg-pf-red/10 text-pf-red font-black px-2 py-0.5 rounded-lg uppercase">
              {user?.roles[0]}
            </span>
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {user?.plantas.map(p => (
            <span key={p} className="text-[10px] font-black px-2.5 py-1 rounded-full uppercase
              bg-slate-100 text-slate-600 border border-slate-200">
              {p}
            </span>
          ))}
        </div>
      </div>

      {/* INDICADORES GENERALES */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-100 p-6 animate-pulse">
              <div className="h-4 bg-slate-100 rounded w-20 mb-3" />
              <div className="h-8 bg-slate-100 rounded w-16" />
            </div>
          ))}
        </div>
      ) : contadores && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <IndicadorCard
            icon={Wrench}
            label="Órdenes de Trabajo"
            value={contadores.totalOTs}
            color="text-blue-600"
            bgColor="bg-blue-50"
          />
          <IndicadorCard
            icon={Users}
            label="Técnicos Activos"
            value={contadores.totalTecnicos}
            color="text-green-600"
            bgColor="bg-green-50"
          />
          <IndicadorCard
            icon={AlertTriangle}
            label="Fallas Registradas"
            value={contadores.totalFallas}
            color="text-amber-600"
            bgColor="bg-amber-50"
          />
          <IndicadorCard
            icon={Factory}
            label="Activos Registrados"
            value={contadores.totalActivos}
            color="text-purple-600"
            bgColor="bg-purple-50"
          />
          <IndicadorCard
            icon={Building2}
            label="Plantas Activas"
            value={contadores.plantasActivas}
            color="text-pf-red"
            bgColor="bg-red-50"
          />
        </div>
      )}

      {/* MÓDULOS RÁPIDOS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* PLANIFICACIÓN - Solo programadores y supervisores */}
        {(tieneAcceso('planificacion')) ? (
          <ModuloCard
            icon={ClipboardList}
            title="Planificación"
            desc="Gestión de OTs, horarios y asignaciones técnicas de tus plantas."
            color="text-pf-red"
            bgColor="bg-pf-red/10"
            onClick={() => setActiveTab('planificacion')}
          />
        ) : (
          <ModuloCardLocked title="Planificación" desc="Sin acceso según tu rol actual." />
        )}

        {/* SEGUIMIENTO KPI - Analistas ven global, Programadores ven su planta */}
        {(tieneAcceso('seguimiento-global') || tieneAcceso('seguimiento-planta')) ? (
          <ModuloCard
            icon={BarChart2}
            title="Seguimiento / KPI"
            desc={tieneAcceso('seguimiento-global')
              ? 'Visión global de todas las plantas.'
              : 'Seguimiento operativo de tus plantas asignadas.'
            }
            color="text-blue-600"
            bgColor="bg-blue-50"
            onClick={() => setActiveTab('atrasos')}
          />
        ) : (
          <ModuloCardLocked title="Seguimiento / KPI" desc="Sin acceso según tu rol actual." />
        )}

        {/* FALLAS - Solo analistas y supervisores */}
        {tieneAcceso('fallas') ? (
          <ModuloCard
            icon={AlertTriangle}
            title="Fallas y Análisis"
            desc="Acceso completo al módulo de fallas y análisis de activos."
            color="text-amber-500"
            bgColor="bg-amber-50"
            onClick={() => setActiveTab('fallas')}
          />
        ) : (
          <ModuloCardLocked title="Fallas y Análisis" desc="Sin acceso según tu rol actual." />
        )}
      </div>

      {/* FILA 2: GASTOS + DISTRIBUCIÓN */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CONTROL DE GASTOS */}
        {(tieneAcceso('gastos') || tieneAcceso('gastos-consolidado')) ? (
          <ModuloCard
            icon={TrendingUp}
            title="Control de Gastos"
            desc={tieneAcceso('gastos')
              ? 'Carga y gestión del presupuesto mensual.'
              : 'Visualización del estado presupuestario consolidado.'
            }
            color="text-emerald-600"
            bgColor="bg-emerald-50"
            onClick={() => setActiveTab('gastos')}
          />
        ) : (
          <ModuloCardLocked title="Control de Gastos" desc="Sin acceso según tu rol actual." />
        )}

        {/* DISTRIBUCIÓN POR PLANTA */}
        {indicadores && indicadores.tecnicosPorPlanta.length > 0 && (
          <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6 hover:shadow-md transition-all">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-slate-100 rounded-xl">
                <Users size={18} className="text-slate-500" />
              </div>
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-tighter">
                Técnicos por Planta
              </h3>
            </div>
            <div className="space-y-2">
              {indicadores.tecnicosPorPlanta.map(item => {
                const maxVal = Math.max(...indicadores.tecnicosPorPlanta.map(t => t.CANTIDAD));
                const pct = maxVal > 0 ? (item.CANTIDAD / maxVal) * 100 : 0;
                return (
                  <div key={item.PLANTA} className="flex items-center gap-3">
                    <span className="text-[10px] font-black text-slate-500 uppercase w-12 text-right">
                      {item.PLANTA}
                    </span>
                    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full transition-all duration-1000"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-xs font-black text-slate-700 w-8 text-right">
                      {item.CANTIDAD}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* OTs POR ESTADO */}
      {indicadores && indicadores.otsPorEstado.length > 0 && (
        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6 hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-50 rounded-xl">
                <Clock size={18} className="text-blue-500" />
              </div>
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-tighter">
                Distribución OTs por Estado
              </h3>
            </div>
            <button
              onClick={() => setActiveTab('atrasos')}
              className="p-2 bg-slate-100 rounded-xl text-slate-400 hover:bg-blue-600 hover:text-white transition-all"
            >
              <ArrowRight size={16} />
            </button>
          </div>
          <div className="flex gap-3 flex-wrap">
            {indicadores.otsPorEstado.map(item => (
              <div key={item.ESTADO} className="flex-1 min-w-[120px] bg-slate-50 rounded-2xl p-4 border border-slate-100 text-center">
                <span className="block text-[9px] font-black text-slate-400 uppercase tracking-wider truncate">
                  {item.ESTADO || 'SIN ESTADO'}
                </span>
                <span className="block text-2xl font-black text-slate-800 mt-1">{item.CANTIDAD}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* FILE UPLOADER - Solo para programadores y supervisores */}
      {(tieneAcceso('planificacion')) && (
        <FileUploader
          onFileUpload={handleFileProcess}
          isLoading={isProcessing}
          status={{
            plan: planning.planResult.length > 0,
            seguimiento: seguimiento.dataActual.length > 0,
            fallas: fallas.data.length > 0
          }}
          highlightedModule={highlightedModule}
          targetWeek={targetUploadWeek}
          setTargetWeek={setTargetUploadWeek}
          weekOptions={getWeekOptions().options}
        />
      )}
    </div>
  );
};

// ===== COMPONENTES AUXILIARES =====

const IndicadorCard = ({ icon: Icon, label, value, color, bgColor }: {
  icon: LucideIcon; label: string; value: number; color: string; bgColor: string;
}) => (
  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:shadow-md transition-all group">
    <div className="flex items-center gap-3 mb-3">
      <div className={`p-2 ${bgColor} rounded-xl group-hover:scale-110 transition-transform`}>
        <Icon size={18} className={color} />
      </div>
    </div>
    <span className="block text-[10px] font-black text-slate-400 uppercase tracking-wider">{label}</span>
    <span className={`block text-3xl font-black ${color} mt-1`}>{value.toLocaleString()}</span>
  </div>
);

const ModuloCard = ({ icon: Icon, title, desc, color, bgColor, onClick }: {
  icon: LucideIcon; title: string; desc: string; color: string; bgColor: string; onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6 text-left
      hover:shadow-md hover:border-slate-200 transition-all group w-full"
  >
    <div className="flex justify-between items-start mb-4">
      <div className={`p-3 ${bgColor} rounded-2xl ${color} group-hover:scale-110 transition-transform`}>
        <Icon size={24} />
      </div>
      <ArrowRight size={18} className="text-slate-300 group-hover:text-slate-600 group-hover:translate-x-1 transition-all" />
    </div>
    <h3 className="text-lg font-black text-slate-800 uppercase tracking-tighter mb-1">{title}</h3>
    <p className="text-xs text-slate-400 font-medium">{desc}</p>
  </button>
);

const ModuloCardLocked = ({ title, desc }: { title: string; desc: string }) => (
  <div className="bg-slate-50 rounded-[2rem] border border-slate-100 p-6 opacity-50 cursor-not-allowed">
    <div className="p-3 bg-slate-100 rounded-2xl text-slate-400 w-fit mb-4">
      <Lock size={24} />
    </div>
    <h3 className="text-lg font-black text-slate-500 uppercase tracking-tighter mb-1">{title}</h3>
    <p className="text-xs text-slate-400 font-medium">{desc}</p>
  </div>
);


