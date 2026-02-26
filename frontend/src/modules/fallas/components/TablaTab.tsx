import { useState, useMemo } from "react";
import { clp, num, fechaFmt } from "../../../shared/utils/dateUtils";
import { Search } from "lucide-react";
import type { FallaRow } from "../types";

interface Props {
    data: FallaRow[];
}

export const TablaTab = ({ data }: Props) => {
    const [searchTerm, setSearchTerm] = useState("");

    const filteredData = useMemo(() => {
        if (!searchTerm) return data;
        const lower = searchTerm.toLowerCase();
        return data.filter(r =>
            (r.equipo && r.equipo.toLowerCase().includes(lower)) ||
            (r.causa && r.causa.toLowerCase().includes(lower)) ||
            (r.pedidoTrabajo && r.pedidoTrabajo.toLowerCase().includes(lower))
        );
    }, [data, searchTerm]);

    return (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[600px] animate-in slide-in-from-bottom-2">
            {/* Buscador */}
            <div className="p-4 border-b border-pf-neutral-100 bg-pf-neutral-50/50 flex items-center">
                <div className="relative w-full max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-pf-neutral-400" size={16} />
                    <input
                        type="text"
                        placeholder="Buscar por equipo, causa o pedido..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-white border border-pf-neutral-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-pf-blue-500/20 focus:border-pf-blue-500 transition-all font-medium text-pf-neutral-700 placeholder:text-pf-neutral-400 shadow-sm"
                    />
                </div>
            </div>

            <div className="overflow-auto flex-1 custom-scrollbar">
                <table className="w-full text-left text-sm text-slate-600">
                    <thead className="bg-slate-50 text-xs uppercase font-bold text-slate-400 sticky top-0 z-10 shadow-sm">
                        <tr>
                            <th className="px-6 py-4">Fecha</th>
                            <th className="px-6 py-4">Semana</th>
                            <th className="px-6 py-4">Pedido</th>
                            <th className="px-6 py-4">Equipo</th>
                            <th className="px-6 py-4">Causa</th>
                            <th className="px-6 py-4 text-right">Tiempo</th>
                            <th className="px-6 py-4 text-right">Gasto ($)</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filteredData.map((row, index) => (
                            <tr key={index} className="hover:bg-blue-50/30 transition-colors">
                                <td className="px-6 py-3 font-medium text-slate-500">{fechaFmt(row.fecha)}</td>
                                <td className="px-6 py-3 text-xs font-bold text-slate-400">S{row.semana}</td>
                                <td className="px-6 py-3 font-mono font-bold text-pf-neutral-600">{row.pedidoTrabajo || "-"}</td>
                                <td className="px-6 py-3 font-bold text-slate-700">{row.equipo}</td>
                                <td className="px-6 py-3 text-slate-500 text-xs max-w-xs truncate" title={row.causa}>{row.causa}</td>
                                <td className="px-6 py-3 text-right font-mono font-bold text-amber-600">{num(row.duracionMinutos)}'</td>
                                <td className="px-6 py-3 text-right font-mono font-bold text-pf-red">{clp(row.gasto)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div className="bg-slate-50 border-t border-slate-200 p-3 text-xs text-slate-400 font-bold px-6 flex justify-between items-center">
                {searchTerm ? (
                    <span className="text-pf-blue-500 bg-pf-blue-50 px-2 py-1 rounded shadow-sm border border-pf-blue-100">Búsqueda activa: "{searchTerm}"</span>
                ) : (
                    <span></span>
                )}
                <span>Mostrando {filteredData.length} registros</span>
            </div>
        </div>
    );
};