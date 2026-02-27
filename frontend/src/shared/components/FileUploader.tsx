import { useState } from "react";
import { FileSpreadsheet, Loader2, CalendarDays, Check } from "lucide-react";
import { UploadCard } from "./UploadCard";
import { MasivoService } from "../services/MasivoService";

export type FileType = 'PLAN' | 'SEGUIMIENTO' | 'FALLAS' | 'MASIVO';



export type UploadEvent = React.ChangeEvent<HTMLInputElement> | { target: { files: FileList | null } };

interface FileUploaderProps {
  onFileUpload: (e: UploadEvent, tipo: FileType, extraData?: { mes?: number, anio?: number }) => void;
  isLoading: boolean;
  status: {
    plan: boolean;
    seguimiento: boolean;
    fallas: boolean;
  };
  highlightedModule: FileType | null;
  targetWeek: string;
  weekOptions: { label: string, value: string }[];
  setTargetWeek: (w: string) => void;
}


export const FileUploader = ({ onFileUpload, isLoading, status, highlightedModule, targetWeek, weekOptions, setTargetWeek }: FileUploaderProps) => {

  const [pendingFile, setPendingFile] = useState<{ event: UploadEvent, tipo: FileType } | null>(null);

  // Estados para Mes/Año (Horarios)
  const currentYear = new Date().getFullYear();
  const [targetMonth, setTargetMonth] = useState(new Date().getMonth() + 1);
  const [targetYear, setTargetYear] = useState(currentYear);

  const cardsConfig = [
    { type: 'MASIVO' as FileType, label: 'Carga Masiva (EAM)', sublabel: 'OTs, Horarios, Técnicos', icon: FileSpreadsheet, color: 'text-purple-600', bg: 'bg-purple-600', active: status.plan || status.seguimiento }
  ];

  // Interceptor de subida
  const handleInternalUpload = (e: UploadEvent, tipo: FileType) => {
    if (tipo === 'SEGUIMIENTO' || tipo === 'MASIVO' || tipo === 'PLAN') { // Dejamos PLAN/SEGUIMIENTO por compatibilidad si se llaman desde fuera, pero no estan en cards
      // Abrimos modal de configuración
      setPendingFile({ event: e, tipo });
    } else {
      onFileUpload(e, tipo);
    }
  };

  const confirmUpload = () => {
    if (pendingFile) {
      onFileUpload(pendingFile.event, pendingFile.tipo, { mes: targetMonth, anio: targetYear });
      setPendingFile(null);
    }
  };

  return (
    <div className="relative scroll-mt-10" id="uploader-section">
      {/* header */}

      {/* MODAL CONFIGURACIÓN */}
      {pendingFile && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white p-8 rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full mx-4 space-y-6">
            <div className="flex items-center gap-4 text-slate-800">
              <div className={`p-3 rounded-2xl ${pendingFile.tipo === 'MASIVO' ? 'bg-purple-50 text-purple-600' : 'bg-blue-50 text-blue-600'}`}>
                <CalendarDays size={32} />
              </div>
              <div>
                <h4 className="text-lg font-black leading-tight">Configuración de Carga</h4>
                <p className="text-xs text-slate-400 font-bold uppercase">
                  {pendingFile.tipo === 'MASIVO' ? 'Carga Unificada / Horarios' :
                    (pendingFile.tipo === 'PLAN' ? 'Carga Horarios (Legacy)' : 'Reporte Seguimiento')}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {/* SELECTOR SEMANA */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block">Semana del Reporte:</label>
                <select
                  value={targetWeek}
                  onChange={(e) => setTargetWeek(e.target.value)}
                  className="w-full text-base font-black text-slate-700 bg-white border border-slate-200 p-3 rounded-xl outline-none focus:ring-2 ring-blue-500/20"
                >
                  {weekOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              {/* SELECTOR MES/AÑO (Solo Masivo para Horarios) */}
              {(pendingFile.tipo === 'MASIVO' || pendingFile.tipo === 'PLAN') && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block">Mes Horario:</label>
                    <select
                      value={targetMonth}
                      onChange={(e) => setTargetMonth(Number(e.target.value))}
                      className="w-full text-sm font-black text-slate-700 bg-white border border-slate-200 p-2 rounded-xl outline-none"
                    >
                      {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                        <option key={m} value={m}>{new Date(2000, m - 1, 1).toLocaleString('es-ES', { month: 'long' }).toUpperCase()}</option>
                      ))}
                    </select>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block">Año:</label>
                    <select
                      value={targetYear}
                      onChange={(e) => setTargetYear(Number(e.target.value))}
                      className="w-full text-sm font-black text-slate-700 bg-white border border-slate-200 p-2 rounded-xl outline-none"
                    >
                      <option value={currentYear - 1}>{currentYear - 1}</option>
                      <option value={currentYear}>{currentYear}</option>
                      <option value={currentYear + 1}>{currentYear + 1}</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* DESCARGA PLANILLA */}
            {pendingFile.tipo === 'MASIVO' && (
              <div className="bg-purple-50 p-3 rounded-xl border border-purple-100 flex items-center justify-between group cursor-pointer hover:bg-purple-100 transition-colors"
                onClick={async () => {
                  try {
                    await MasivoService.descargarPlantillaEAM();
                  } catch (e) {
                    alert("Error al descargar: " + (e as Error).message);
                  }
                }}
              >
                <div className="flex items-center gap-3">
                  <div className="bg-purple-200 text-purple-700 p-2 rounded-lg"><FileSpreadsheet size={16} /></div>
                  <div className="text-left">
                    <span className="block text-[10px] font-black text-purple-800 uppercase leading-none mb-0.5">Plantilla EAM / Horarios</span>
                    <span className="block text-[9px] font-bold text-purple-400">Descargar formato Excel requerido</span>
                  </div>
                </div>
                <div className="bg-white p-1.5 rounded-lg text-purple-400 group-hover:text-purple-600 shadow-sm"><FileSpreadsheet size={12} /></div>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setPendingFile(null)}
                className="flex-1 px-6 py-3 rounded-xl font-black text-xs text-slate-400 hover:bg-slate-100 transition-all uppercase"
              >
                Cancelar
              </button>
              <button
                onClick={confirmUpload}
                className={`flex-[2] text-white px-6 py-3 rounded-xl font-black text-xs shadow-lg hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 uppercase ${pendingFile.tipo === 'MASIVO' ? 'bg-purple-600 hover:bg-purple-700 shadow-purple-200' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-200'}`}
              >
                <Check size={16} /> Procesar Archivo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LOADING */}
      {isLoading && (
        <div className="absolute inset-0 z-50 bg-white/60 backdrop-blur-[2px] rounded-3xl flex flex-col items-center justify-center animate-in fade-in duration-300">
          <div className="bg-white p-6 rounded-2xl shadow-xl flex flex-col items-center border border-slate-100">
            <Loader2 className="text-pf-red animate-spin mb-3" size={40} />
            <p className="font-black text-slate-800 uppercase tracking-widest text-xs">Procesando...</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cardsConfig.map((card) => (
          <UploadCard
            key={card.type}
            type={card.type}
            label={card.label}
            sublabel={card.sublabel}
            icon={card.icon}
            colorClass={card.color}
            bgClass={card.bg}
            isUploaded={card.active}
            isLoading={isLoading}
            isHighlighted={highlightedModule === card.type}
            onUpload={handleInternalUpload}
          />
        ))}
      </div>
    </div>
  );
};