

import { ArrowRight, PlusCircle, CheckCircle2, ArrowRightCircle, AlertCircle } from "lucide-react";
import type { OTFlowResult } from "../types";
import { EvolutionGroup } from "./ui/EvolutionGroup";

interface EvolutionCardProps {
  nuevas: OTFlowResult[];
  finalizadas: OTFlowResult[];
  conAvance: OTFlowResult[];
  semanaActual: string;
  semanaAnterior: string;
}

export const EvolutionDashboard = ({ nuevas, finalizadas, conAvance, semanaActual, semanaAnterior }: EvolutionCardProps) => {
  if (!semanaAnterior) return (
    <div className="p-4 bg-pf-warning-50 text-pf-warning-700 border border-pf-warning-100 rounded-xl text-sm font-bold flex items-center gap-2">
      <AlertCircle size={18} /> Selecciona una semana de comparación para ver la evolución del flujo.
    </div>
  );

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-3 mb-2">
        <ArrowRightCircle className="text-pf-red" />
        <h3 className="text-lg font-black uppercase text-pf-neutral-700 tracking-tight">Flujo de Gestión</h3>
        <span className="text-[10px] font-black bg-pf-neutral-100 text-pf-neutral-600 border border-pf-neutral-200 px-4 py-1 rounded-full flex items-center gap-2 shadow-sm">
          {semanaAnterior} <ArrowRight size={10} className="text-pf-red" /> {semanaActual}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <EvolutionGroup
          title="Nuevas Entradas"
          sublabel="OTs que no existían la semana pasada"
          data={nuevas}
          color="red"
          icon={PlusCircle}
        />
        <EvolutionGroup
          title="Salieron / Finalizadas"
          sublabel="OTs que finalizaron"
          data={finalizadas}
          color="green"
          icon={CheckCircle2}
        />
        <EvolutionGroup
          title="Cambio de Clasificación"
          sublabel="OTs atrasadas que cambiaron de clasificación"
          data={conAvance}
          color="blue"
          icon={ArrowRightCircle}
        />
      </div>
    </div>
  );
};