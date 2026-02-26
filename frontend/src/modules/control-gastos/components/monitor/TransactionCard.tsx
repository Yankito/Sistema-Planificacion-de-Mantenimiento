import { AlertCircle, ExternalLink } from 'lucide-react';
import type { GastoConsolidadoRow } from '../../types';

const getGastoStyles = (tipo?: string) => {
  const t = (tipo || '').toUpperCase();
  if (t === 'BODEGA') return {
    bg: 'bg-pf-blue-50',
    border: 'border-pf-blue-100',
    text: 'text-pf-blue-700',
    dot: 'bg-pf-blue-500',
    label: 'text-pf-blue-600',
    checkbox: 'border-pf-blue-300'
  };
  if (t === 'SERV_EXT') return {
    bg: 'bg-pf-success-50',
    border: 'border-pf-success-100',
    text: 'text-pf-success-700',
    dot: 'bg-pf-success-500',
    label: 'text-pf-success-600',
    checkbox: 'border-pf-success-300'
  };
  if (t === 'CORRECTIVO') return {
    bg: 'bg-pf-red-50',
    border: 'border-pf-red-100',
    text: 'text-pf-red-700',
    dot: 'bg-pf-red',
    label: 'text-pf-red-600',
    checkbox: 'border-pf-red-300'
  };
  return {
    bg: 'bg-pf-neutral-50',
    border: 'border-pf-neutral-100',
    text: 'text-pf-neutral-700',
    dot: 'bg-pf-neutral-500',
    label: 'text-pf-neutral-600',
    checkbox: 'border-pf-neutral-300'
  };
};

interface TransactionCardProps {
  trx: GastoConsolidadoRow;
  isSelected: boolean;
  onToggle: () => void;
  formatCurrency: (val: number) => string;
}


export const TransactionCard: React.FC<TransactionCardProps> = ({ trx, isSelected, onToggle, formatCurrency }) => {
  const styles = getGastoStyles(trx.tipoGasto);

  return (
    <div
      onClick={onToggle}
      className={`bg-white border rounded-[1.25rem] overflow-hidden shadow-sm group/card hover:shadow-lg hover:scale-[1.01] transition-all cursor-pointer relative ${isSelected ? 'ring-2 ring-pf-blue-500/20 border-pf-blue-500' : styles.border}`}
    >
      <div className={`px-4 py-2 border-b flex justify-between items-center ${styles.bg} ${styles.border}`}>
        <div className="flex items-center gap-3">
          <div className={`w-4 h-4 rounded-lg border flex items-center justify-center transition-all ${isSelected ? 'bg-pf-blue-600 border-pf-blue-600 rotate-12 scale-110 shadow-md' : 'bg-white ' + styles.checkbox}`}>
            {isSelected && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full shadow-sm ${styles.dot}`}></div>
            <span className={`text-[10px] font-black uppercase tracking-[0.15em] ${styles.label}`}>
              {trx.tipoGasto}
            </span>
          </div>
        </div>
        <span className="text-[10px] font-black text-pf-neutral-400 uppercase tracking-widest bg-white/50 px-2 py-0.5 rounded-md">
          OT: {trx.numeroOt || 'SIN ID'}
        </span>
      </div>

      <div className="p-2">
        <div className="flex justify-between items-start">
          <h4 className="text-sm font-black text-pf-neutral-800 flex-1 leading-tight tracking-tight line-clamp-2">{trx.descripcionArticulo}</h4>
          <div className="flex flex-col items-end shrink-0">
            <span className={`text-base font-black tracking-tighter ${isSelected ? 'text-pf-blue-600' : 'text-black'}`}>
              {formatCurrency(trx.costoTrx)}
            </span>
            <span className="text-[8px] font-black text-pf-neutral-300 uppercase tracking-[0.2em]">Costo</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-y-3 gap-x-4 border-t border-pf-neutral-50 pt-1">
          <div className="flex flex-col">
            <span className="text-[9px] text-pf-neutral-400 uppercase font-black tracking-widest mb-1">OT</span>
            <div className="flex items-center gap-2 text-xs font-bold text-pf-neutral-700 select-text">
              {trx.numeroOt || 'N/A'}
              {trx.numeroOt && <ExternalLink size={10} className="text-pf-neutral-300 opacity-0 group-hover/card:opacity-100 transition-opacity cursor-help" />}
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-[9px] text-pf-neutral-400 uppercase font-black tracking-widest mb-1">Categoría OT</span>
            <div className="flex items-center gap-1 text-xs font-bold text-pf-neutral-700 select-text">
              {trx.tipoOt || 'N/A'}
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-[9px] text-pf-neutral-400 uppercase font-black tracking-widest mb-1">Estado OT</span>
            <div className={`flex items-center gap-1 text-[9px] font-black px-1.5 py-0.5 rounded-md w-fit border uppercase tracking-widest shadow-sm ${trx.estadoTrabajo === 'LIBERADO' ? 'bg-pf-success-50 text-pf-success-600 border-pf-success-100' :
              trx.estadoTrabajo === 'Liberado' ? 'bg-pf-blue-50 text-pf-blue-600 border-pf-blue-100' :
                trx.estadoTrabajo === 'Finalizar - Sin Cargos' ? 'bg-pf-neutral-50 text-pf-neutral-400 border-pf-neutral-100' :
                  'bg-white text-pf-neutral-600 border-pf-neutral-100'
              }`}>
              {trx.estadoTrabajo || 'N/A'}
            </div>
          </div>
          <div className="flex gap-4">
            <div className="flex flex-col">
              <span className="text-[9px] text-pf-neutral-400 uppercase font-black tracking-widest mb-1">Fecha Prog.</span>
              <span className={`text-xs font-bold ${trx.alertaFecha === 1 ? 'text-pf-blue-500' : 'text-pf-neutral-600'}`}>
                {trx.fechaOtPro ? new Date(trx.fechaOtPro).toLocaleDateString('es-CL') : 'N/A'}
              </span>
            </div>

            <div className="flex flex-col">
              <span className="text-[9px] text-pf-neutral-400 uppercase font-black tracking-widest mb-1">Registro Gasto</span>
              <span className="text-xs font-bold text-pf-neutral-600 select-text">
                {trx.fechaTrx ? new Date(trx.fechaTrx).toLocaleDateString('es-CL') : 'N/A'}
              </span>
            </div>

          </div>
        </div>
        <div className="flex flex-col bg-pf-neutral-50/50 p-2 rounded-xl mt-1 col-span-1 border border-pf-neutral-100/50">
          <span className="text-[9px] text-pf-neutral-400 uppercase font-black tracking-widest mb-1">Descripción de Trabajo</span>
          <span className="text-xs text-pf-neutral-500 select-text">
            {trx.descripcionOt || 'Descripción de OT no disponible.'}
          </span>
        </div>

        {trx.alertaFecha === 1 && (
          <div className="mt-3 flex items-center gap-2 bg-pf-blue-50 text-pf-blue-700 px-3 py-1.5 rounded-lg border border-pf-blue-100 text-[9px] font-black uppercase tracking-widest shadow-sm">
            <AlertCircle size={12} className="animate-pulse" />
            Desfase Temporal.
          </div>
        )}
      </div>
    </div>
  );
};
