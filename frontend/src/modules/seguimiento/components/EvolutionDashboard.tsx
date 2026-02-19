

import { ArrowRight, PlusCircle, CheckCircle2, ArrowRightCircle } from "lucide-react";
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
  if (!semanaAnterior) return <div className="p-4 bg-yellow-50 text-yellow-700 rounded-xl text-sm font-bold">Selecciona una semana de comparación en el filtro superior para ver la evolución.</div>;

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-2 mb-2">
        <ArrowRightCircle className="text-pf-red" />
        <h3 className="text-lg font-black uppercase text-slate-700">Flujo de OTs</h3>
        <span className="text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200 px-3 py-0.5 rounded-full flex items-center gap-2">
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