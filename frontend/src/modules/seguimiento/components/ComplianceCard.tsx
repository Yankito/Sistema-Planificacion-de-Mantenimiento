import { Factory, CheckCircle2, AlertCircle } from "lucide-react";
import type { AtrasoRow } from "../types";

interface ComplianceCardProps {
  planta: string;
  esOB: boolean;
  dataSemanaActual: AtrasoRow[];
  onClick: () => void;
}

export const ComplianceCard = ({ planta, esOB, dataSemanaActual, onClick }: ComplianceCardProps) => {
  const universoRaw = dataSemanaActual.filter(d => d.planta === planta && d.esOB === esOB);
  const universoKPI = universoRaw.filter(d => !d.descripcion.toUpperCase().startsWith("MOB"));

  const total = universoKPI.length;
  const cumplidas = universoKPI.filter(d => d.clasificacion === "FINALIZADA").length;
  const pendientes = total - cumplidas;

  const porcentaje = total > 0 ? Math.round((cumplidas / total) * 100) : 0;

  let colorBar = "bg-pf-red-500";
  let colorText = "text-pf-red-600";
  let bgCard = "bg-white border-pf-red-100";
  let iconBg = "bg-pf-red-50";

  if (porcentaje >= 80) {
    colorBar = "bg-pf-success-500";
    colorText = "text-pf-success-600";
    bgCard = "bg-white border-pf-success-100";
    iconBg = "bg-pf-success-50";
  } else if (porcentaje >= 50) {
    colorBar = "bg-pf-warning-500";
    colorText = "text-pf-warning-600";
    bgCard = "bg-white border-pf-warning-100";
    iconBg = "bg-pf-warning-50";
  }

  if (total === 0) return null;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      className={`p-5 rounded-2xl border-2 shadow-sm hover:shadow-md transition-all cursor-pointer group ${bgCard} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pf-red/40`}
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${iconBg} group-hover:scale-110 transition-transform`}>
            <Factory size={20} className="text-pf-neutral-600" />
          </div>
          <div>
            <h4 className="font-black text-lg text-pf-neutral-800">{planta}</h4>
            <span className="text-[10px] font-bold text-pf-neutral-400 uppercase tracking-wider">{esOB ? 'INFRAESTRUCTURA' : 'MANTENCION'}</span>
          </div>
        </div>
        <div className={`flex flex-col items-end ${colorText}`}>
          <span className="text-3xl font-black">{porcentaje}%</span>
        </div>
      </div>

      <div className="w-full h-3 bg-pf-neutral-100 rounded-full overflow-hidden mb-3">
        <div className={`h-full ${colorBar} transition-all duration-1000 ease-out`} style={{ width: `${porcentaje}%` }} />
      </div>

      <div className="flex justify-between items-center text-xs font-bold text-pf-neutral-500">
        <div className="flex items-center gap-1"><CheckCircle2 size={12} className="text-pf-success-600" /><span>{cumplidas} OK</span></div>
        <div className="flex items-center gap-1"><AlertCircle size={12} className="text-pf-red" /><span>{pendientes} Pend.</span></div>
        <div className="text-pf-neutral-300">|</div><span>Total: {total}</span>
      </div>
    </div>
  );
};