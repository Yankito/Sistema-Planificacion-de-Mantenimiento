import React from 'react';
import { X, Search, AlertCircle } from 'lucide-react';
import type { ActivoEAM } from '../../../../shared/types';

interface RemapAssetModalProps {
  isOpen: boolean;
  onClose: () => void;
  mappingModal: { open: boolean, oldAsset: string | null, cc: string | null };
  suggestedAssets: ActivoEAM[];
  handleUpdateName: (newName: string) => void;
}

export const RemapAssetModal: React.FC<RemapAssetModalProps> = ({
  isOpen,
  onClose,
  mappingModal,
  suggestedAssets,
  handleUpdateName
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-pf-neutral-900/60 backdrop-blur-md z-[80] flex items-center justify-center p-4">
      <div className="bg-white rounded-[2.5rem] shadow-2xl border border-pf-neutral-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-300">
        <div className="p-6 border-b border-pf-neutral-100 flex justify-between items-center bg-pf-neutral-50/50">
          <div>
            <h3 className="text-xl font-black text-pf-neutral-800 uppercase italic tracking-tight">Vincular Activo EAM</h3>
            <p className="text-[10px] text-pf-neutral-400 font-bold uppercase tracking-widest mt-1">Sincronización Ministerial de Maestros</p>
          </div>
          <button
            onClick={onClose}
            className="p-3 hover:bg-pf-neutral-900 hover:text-white rounded-2xl text-pf-neutral-400 transition-all active:scale-95 border border-transparent hover:border-pf-neutral-900"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-8">
          <div className="mb-8 p-6 bg-pf-neutral-100 rounded-[1.5rem] border border-pf-neutral-800 flex items-center justify-between shadow-xl relative overflow-hidden">
            <div className="absolute right-0 top-0 w-24 h-24 bg-pf-red opacity-10 rounded-bl-full"></div>
            <div className="relative z-10">
              <label className="block text-[10px] font-black uppercase text-pf-neutral-400 mb-2 tracking-[0.2em] opacity-60">Centro de Costo</label>
              <p className="text-2xl font-black text-pf-neutral-900 tracking-[0.15em]">{mappingModal.cc}</p>
            </div>
            <div className="p-3 bg-pf-red shadow-lg shadow-pf-red/20 rounded-xl relative z-10">
              <Search className="text-white" size={24} />
            </div>
          </div>

          <div className="space-y-3 max-h-[350px] overflow-y-auto pr-3 custom-scrollbar">
            <label className="block text-[10px] font-black uppercase text-pf-neutral-400 mb-3 tracking-[0.2em] ml-1">
              {suggestedAssets.length > 0 ? `Maestros Encontrados (${suggestedAssets.length})` : 'Resultados de Búsqueda'}
            </label>

            {suggestedAssets.length === 0 ? (
              <div className="py-12 text-center border-2 border-dashed border-pf-neutral-100 rounded-[2rem] bg-pf-neutral-50/30">
                <AlertCircle size={40} className="mx-auto text-pf-neutral-200 mb-4 animate-pulse" />
                <p className="text-[10px] font-black uppercase tracking-widest text-pf-neutral-300 px-6">No se detectan activos vinculados al CC {mappingModal.cc} en el registro ministerial.</p>
              </div>
            ) : (
              suggestedAssets.map(asset => (
                <button
                  key={asset.activo}
                  onClick={() => handleUpdateName(asset.activo)}
                  className="w-full text-left p-5 hover:bg-pf-red/5 border border-pf-neutral-100 hover:border-pf-red/30 rounded-[1.5rem] transition-all group flex justify-between items-center active:scale-[0.98] bg-white shadow-sm hover:shadow-md"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-base font-black text-pf-neutral-800 group-hover:text-pf-red transition-colors truncate italic">{asset.activo}</p>
                    <p className="text-[10px] font-black uppercase tracking-widest text-pf-neutral-400 mt-0.5">{asset.claseContable} • {asset.organizacion}</p>
                  </div>
                  <div className="ml-4 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                    <span className="text-[10px] font-black text-pf-red uppercase tracking-widest bg-pf-red/10 px-3 py-1.5 rounded-full border border-pf-red/20">Vincular</span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        <div className="p-6 bg-pf-neutral-50/50 border-t border-pf-neutral-100 text-center">
          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-pf-neutral-300 italic">Esta acción remapeará todas las transacciones históricas al nuevo maestro ministerial.</p>
        </div>
      </div>
    </div>
  );
};
