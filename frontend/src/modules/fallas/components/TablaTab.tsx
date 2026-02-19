import { clp, num, fechaFmt } from "../../../shared/utils/dateUtils";
import type { FallaRow } from "../types";

interface Props {
    data: FallaRow[];
}

export const TablaTab = ({ data }: Props) => {
  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[600px] animate-in slide-in-from-bottom-2">
        <div className="overflow-auto flex-1 custom-scrollbar">
        <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-xs uppercase font-bold text-slate-400 sticky top-0 z-10 shadow-sm">
                <tr>
                    <th className="px-6 py-4">Fecha</th>
                    <th className="px-6 py-4">Semana</th>
                    <th className="px-6 py-4">Equipo</th>
                    <th className="px-6 py-4">Causa</th>
                    <th className="px-6 py-4 text-right">Tiempo</th>
                    <th className="px-6 py-4 text-right">Gasto ($)</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
                {data.map((row, index) => (
                    <tr key={index} className="hover:bg-blue-50/30 transition-colors">
                        <td className="px-6 py-3 font-medium text-slate-500">{fechaFmt(row.fecha)}</td>
                        <td className="px-6 py-3 text-xs font-bold text-slate-400">S{row.semana}</td>
                        <td className="px-6 py-3 font-bold text-slate-700">{row.equipo}</td>
                        <td className="px-6 py-3 text-slate-500 text-xs max-w-xs truncate" title={row.causa}>{row.causa}</td>
                        <td className="px-6 py-3 text-right font-mono font-bold text-amber-600">{num(row.duracionMinutos)}'</td>
                        <td className="px-6 py-3 text-right font-mono font-bold text-pf-red">{clp(row.gasto)}</td>
                    </tr>
                ))}
            </tbody>
        </table>
        </div>
        <div className="bg-slate-50 border-t border-slate-200 p-2 text-xs text-right text-slate-400 font-bold px-6">
            Mostrando {data.length} registros
        </div>
    </div>
  );
};