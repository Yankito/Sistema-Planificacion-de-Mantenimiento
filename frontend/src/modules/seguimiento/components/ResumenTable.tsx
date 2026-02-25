import { Search, TrendingUp, TrendingDown, Minus, CheckCircle } from "lucide-react";
import type { AtrasoRow } from "../types";
import { useMemo } from "react";
import { sortPeriods } from "../utils";

interface ResumenProps {
  titulo: string;
  dataset: AtrasoRow[];
  datasetAnt: AtrasoRow[];
  esOB: boolean;
  modoVista: "ATRASOS" | "CUMPLIDAS";
  isGlobal?: boolean;
  showComparison?: boolean;
  onDetail: (cat?: string, periodo?: string) => void;
  columnasExternas?: string[];
}

export const ResumenTable = ({ titulo, dataset, datasetAnt, esOB, modoVista, isGlobal, showComparison = false, onDetail, columnasExternas }: ResumenProps) => {
  const categorias = ["TECNICO / SERVICIO", "PROGRAMADOR", "OC / OTRO"];


  const columnasPeriodo = useMemo(() => {
    if (columnasExternas) return columnasExternas;

    const setPeriodos = new Set<string>();
    dataset.forEach(d => {
      if (d.periodo && d.periodo !== "S/A") setPeriodos.add(d.periodo);
    });
    if (showComparison) {
      datasetAnt.forEach(d => { if (d.periodo && d.periodo !== "S/A") setPeriodos.add(d.periodo); });
    }
    return Array.from(setPeriodos).sort(sortPeriods);
  }, [dataset, datasetAnt, showComparison, columnasExternas]);

  const renderDiff = (actual: number, anterior: number) => {
    if (!showComparison || !datasetAnt) return null;

    const diff = actual - anterior;
    if (diff === 0) return <span className="text-pf-neutral-400 ml-1"><Minus size={10} /></span>;
    const mejoro = modoVista === "CUMPLIDAS" ? diff > 0 : diff < 0;
    const color = mejoro ? "text-pf-success-600" : "text-pf-red-600";
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
    <div className="rounded-xl border border-pf-neutral-200 overflow-hidden shadow-sm mb-6 bg-white">
      <table className="w-full text-[11px]">
        <thead>
          <tr
            onClick={() => onDetail()}
            className={`${modoVista === 'ATRASOS' ? (isGlobal ? 'bg-pf-neutral-800 text-white' : 'bg-pf-neutral-100 text-pf-neutral-900') : (isGlobal ? 'bg-pf-success-800 text-white' : 'bg-pf-success-50 text-pf-neutral-900')} font-black cursor-pointer group`}
          >
            <td className="px-3 py-2 text-xs uppercase flex items-center justify-between">
              <span className="flex items-center gap-2">{modoVista === 'CUMPLIDAS' && <CheckCircle size={12} />} {titulo} {esOB ? '(OB)' : '(OM)'}</span>
              <Search size={12} className="opacity-20 group-hover:opacity-100" />
            </td>
            {columnasPeriodo.map(p => (
              <td key={p} className="w-24 py-1 text-center border-l border-white/10 text-xs">
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
              <tr className="border-b border-pf-neutral-100 bg-pf-neutral-50/30 font-black text-pf-neutral-900">
                <td
                  onClick={() => onDetail(undefined, undefined)}
                  className="px-3 py-2 uppercase text-left cursor-pointer hover:bg-pf-neutral-100"
                >
                  TOTAL ATRASOS
                </td>
                {columnasPeriodo.map(p => (
                  <td
                    key={p}
                    onClick={() => onDetail(undefined, p)} // Filtra por periodo pero sin categoría
                    className="text-center cursor-pointer hover:bg-pf-blue-50"
                  >
                    <div className="flex items-center justify-center">
                      {getCount(dataset, p)} {renderDiff(getCount(dataset, p), getCount(datasetAnt, p))}
                    </div>
                  </td>
                ))}
              </tr>
              {categorias.map(cat => (
                <tr key={cat} className="border-b border-pf-neutral-50 text-pf-neutral-600">
                  <td
                    onClick={() => onDetail(cat, undefined)} // Filtra por categoría pero todos los periodos
                    className="px-3 py-1.5 font-bold uppercase text-left pl-6 text-[10px] cursor-pointer hover:bg-pf-neutral-100"
                  >
                    {cat}
                  </td>
                  {columnasPeriodo.map(p => (
                    <td
                      key={p}
                      onClick={() => onDetail(cat, p)} // Filtra por categoría Y periodo
                      className="text-center cursor-pointer hover:bg-pf-blue-50 transition-colors"
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
            <tr className="hover:bg-pf-success-50/50 font-bold text-pf-success-700">
              <td onClick={() => onDetail()} className="px-3 py-3 uppercase text-left cursor-pointer">TOTAL FINALIZADAS</td>
              {columnasPeriodo.map(p => (
                <td key={p} onClick={() => onDetail(undefined, p)} className="text-center cursor-pointer hover:bg-pf-success-100">
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