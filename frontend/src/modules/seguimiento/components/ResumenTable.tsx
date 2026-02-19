import { Search, TrendingUp, TrendingDown, Minus, CheckCircle } from "lucide-react";
import type { AtrasoRow } from "../types";
import { useMemo } from "react";

interface ResumenProps {
  titulo: string;
  dataset: AtrasoRow[];
  datasetAnt: AtrasoRow[];
  esOB: boolean;
  modoVista: "ATRASOS" | "CUMPLIDAS";
  isGlobal?: boolean;
  showComparison?: boolean;
  onDetail: (cat?: string, periodo?: string) => void;
}

export const ResumenTable = ({ titulo, dataset, datasetAnt, esOB, modoVista, isGlobal, showComparison = false, onDetail }: ResumenProps) => {
  const categorias = ["TECNICO / SERVICIO", "PROGRAMADOR", "OC / OTRO"];

  const sortPeriods = (a: string, b: string) => {
    // Helper para extraer el año de cualquier formato
    const getYear = (val: string) => {
      if (/^\d{4}$/.test(val)) return parseInt(val);
      if (/^[A-Z]{3}-\d{2}$/.test(val)) {
        const parts = val.split('-');
        return parseInt("20" + parts[1]);
      }
      if (/^\d{1,2}\/\d{4}$/.test(val)) return parseInt(val.split('/')[1]);
      if (/^\d{4}-\d{1,2}$/.test(val)) return parseInt(val.split('-')[0]);
      return 0;
    };

    const yearA = getYear(a);
    const yearB = getYear(b);

    if (yearA !== yearB) return yearA - yearB;

    // Si es el mismo año
    const isYearA = /^\d{4}$/.test(a);
    const isYearB = /^\d{4}$/.test(b);

    // El resumen anual (YYYY) va PRIMERO si hay conflicto en el mismo año 
    if (isYearA && !isYearB) return -1;
    if (!isYearA && isYearB) return 1;
    if (isYearA && isYearB) return 0;

    // 2. Ambos son MESES
    const meses: Record<string, number> = { "ENE": 0, "FEB": 1, "MAR": 2, "ABR": 3, "MAY": 4, "JUN": 5, "JUL": 6, "AGO": 7, "SEP": 8, "OCT": 9, "NOV": 10, "DIC": 11 };
    const [mesA, anioA] = a.split('-');
    const [mesB, anioB] = b.split('-');

    if (!anioA || !anioB) return a.localeCompare(b);

    // Comparar años primero
    const fullYearA = parseInt("20" + anioA);
    const fullYearB = parseInt("20" + anioB);

    if (fullYearA !== fullYearB) return fullYearA - fullYearB;

    // Comparar meses
    return (meses[mesA] ?? 0) - (meses[mesB] ?? 0);
  };

  const columnasPeriodo = useMemo(() => {
    const setPeriodos = new Set<string>();
    dataset.forEach(d => {
      if (d.periodo && d.periodo !== "S/A") setPeriodos.add(d.periodo);
    });
    if (showComparison) {
      datasetAnt.forEach(d => { if (d.periodo && d.periodo !== "S/A") setPeriodos.add(d.periodo); });
    }
    return Array.from(setPeriodos).sort(sortPeriods);
  }, [dataset, datasetAnt, showComparison]);

  const renderDiff = (actual: number, anterior: number) => {
    if (!showComparison || !datasetAnt) return null;

    const diff = actual - anterior;
    if (diff === 0) return <span className="text-slate-400 ml-1"><Minus size={10} /></span>;
    const mejoro = modoVista === "CUMPLIDAS" ? diff > 0 : diff < 0;
    const color = mejoro ? "text-green-600" : "text-red-600";
    return (
      <span className={`flex items-center gap-0.5 font-black text-[10px] ml-1 ${color}`}>
        {diff > 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />} {Math.abs(diff)}
      </span>
    );
  };

  const getCount = (data: AtrasoRow[], per: string, cat?: string) => {
    let filtered = data.filter(d => d.periodo === per);
    if (cat) filtered = filtered.filter(d => d.clasificacion === cat);
    return filtered.length;
  };

  return (
    <div className="rounded-xl border overflow-hidden shadow-sm mb-6 bg-white">
      <table className="w-full text-[11px]">
        <thead>
          <tr
            onClick={() => onDetail()}
            className={`${modoVista === 'ATRASOS' ? (isGlobal ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-900') : (isGlobal ? 'bg-green-800 text-white' : 'bg-green-50 text-slate-900')} font-black cursor-pointer group`}
          >
            <td className="px-3 py-2 text-xs uppercase flex items-center justify-between">
              <span className="flex items-center gap-2">{modoVista === 'CUMPLIDAS' && <CheckCircle size={12} />} {titulo} {esOB ? '(OB)' : '(OM)'}</span>
              <Search size={12} className="opacity-20 group-hover:opacity-100" />
            </td>
            {columnasPeriodo.map(p => (
              <td key={p} className="w-24 py-1 text-center border-l border-white/10">
                <div className="flex items-center justify-center">
                  {p}
                </div>
              </td>
            ))}
          </tr>
        </thead>
        <tbody>
          {modoVista === "ATRASOS" ? (
            <>
              <tr className="border-b border-slate-100 bg-slate-50/30 font-black text-slate-900">
                <td
                  onClick={() => onDetail(undefined, undefined)}
                  className="px-3 py-2 uppercase text-left cursor-pointer hover:bg-slate-100"
                >
                  TOTAL ATRASOS
                </td>
                {columnasPeriodo.map(p => (
                  <td
                    key={p}
                    onClick={() => onDetail(undefined, p)} // Filtra por periodo pero sin categoría
                    className="text-center cursor-pointer hover:bg-indigo-50"
                  >
                    <div className="flex items-center justify-center">
                      {getCount(dataset, p)} {renderDiff(getCount(dataset, p), getCount(datasetAnt, p))}
                    </div>
                  </td>
                ))}
              </tr>
              {categorias.map(cat => (
                <tr key={cat} className="border-b border-slate-50 text-slate-600">
                  <td
                    onClick={() => onDetail(cat, undefined)} // Filtra por categoría pero todos los periodos
                    className="px-3 py-1.5 font-bold uppercase text-left pl-6 text-[10px] cursor-pointer hover:bg-slate-100"
                  >
                    {cat}
                  </td>
                  {columnasPeriodo.map(p => (
                    <td
                      key={p}
                      onClick={() => onDetail(cat, p)} // Filtra por categoría Y periodo
                      className="text-center cursor-pointer hover:bg-indigo-50 transition-colors"
                    >
                      <div className="flex items-center justify-center">
                        {getCount(dataset, p, cat)} {renderDiff(getCount(dataset, p, cat), getCount(datasetAnt, p, cat))}
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </>
          ) : (
            <tr className="hover:bg-green-50/50 font-bold text-green-700">
              <td onClick={() => onDetail()} className="px-3 py-3 uppercase text-left cursor-pointer">TOTAL FINALIZADAS</td>
              {columnasPeriodo.map(p => (
                <td key={p} onClick={() => onDetail(undefined, p)} className="text-center cursor-pointer hover:bg-green-100">
                  <div className="flex items-center justify-center text-lg">
                    {getCount(dataset, p)}
                  </div>
                </td>
              ))}
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};