import React from 'react';
import { X, Search, AlertCircle } from 'lucide-react';

interface RemapAssetModalProps {
  isOpen: boolean;
  onClose: () => void;
  mappingModal: { open: boolean, oldAsset: string | null, cc: string | null };
  suggestedAssets: any[];
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
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div>
            <h3 className="font-bold text-slate-800">Vincular Activo</h3>
            <p className="text-[10px] text-slate-500">Buscando reemplazo para: <span className="text-pf-red font-bold">{mappingModal.oldAsset}</span></p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-200 rounded-lg text-slate-400 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6">
          <div className="mb-6 p-4 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between">
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 tracking-wider">Centro de Costo Vinculado</label>
              <p className="text-xl font-mono font-bold text-slate-700 tracking-widest">{mappingModal.cc}</p>
            </div>
            <div className="p-2 bg-pf-red/10 rounded-lg">
              <Search className="text-pf-red" size={20} />
            </div>
          </div>

          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
            <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 tracking-wider">
              {suggestedAssets.length > 0 ? `Sugerencias (${suggestedAssets.length})` : 'Resultados'}
            </label>

            {suggestedAssets.length === 0 ? (
              <div className="py-8 text-center border-2 border-dashed border-slate-100 rounded-xl">
                <AlertCircle size={32} className="mx-auto text-slate-200 mb-2" />
                <p className="text-xs text-slate-400">No se encontraron activos con el CC {mappingModal.cc} en la base de datos.</p>
              </div>
            ) : (
              suggestedAssets.map(asset => (
                <button
                  key={asset.activo}
                  onClick={() => handleUpdateName(asset.activo)}
                  className="w-full text-left p-3 hover:bg-pf-red/5 border border-slate-100 hover:border-pf-red/30 rounded-xl transition-all group flex justify-between items-center"
                >
                  <div>
                    <p className="text-sm font-bold text-slate-700 group-hover:text-pf-red">{asset.activo}</p>
                    <p className="text-[10px] text-slate-400">{asset.claseContable} • {asset.organizacion}</p>
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-[10px] font-bold text-pf-red uppercase">Vincular</span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-100 text-center">
          <p className="text-[10px] text-slate-400 italic">Al vincular, se actualizarán todas las líneas de presupuesto para este nombre.</p>
        </div>
      </div>
    </div>
  );
};
