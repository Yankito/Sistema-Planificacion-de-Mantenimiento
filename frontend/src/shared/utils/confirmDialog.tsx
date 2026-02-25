import { toast } from 'sonner';
import { AlertTriangle } from 'lucide-react';

export const confirmDialog = (title: string, description?: string): Promise<boolean> => {
  return new Promise((resolve) => {
    const toastId = toast.custom(
      () => (
        <div className="bg-white border border-slate-100 shadow-xl rounded-2xl p-5 flex flex-col gap-4 w-[400px] pointer-events-auto">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-amber-50 rounded-xl">
              <AlertTriangle className="text-amber-500" size={24} />
            </div>
            <div className="flex-1">
              <h3 className="font-black text-slate-800 leading-tight">{title}</h3>
              {description && <p className="text-xs text-slate-500 mt-1 font-medium">{description}</p>}
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-2">
            <button
              className="px-4 py-2 text-xs font-black text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition-all active:scale-95"
              onClick={() => { toast.dismiss(toastId); resolve(false); }}
            >
              CANCELAR
            </button>
            <button
              className="px-4 py-2 text-xs font-black text-white bg-pf-red rounded-xl hover:bg-red-700 shadow-lg shadow-pf-red/20 transition-all active:scale-95"
              onClick={() => { toast.dismiss(toastId); resolve(true); }}
            >
              CONFIRMAR
            </button>
          </div>
        </div>
      ),
      {
        duration: Infinity, // Se requiere accion manual
        position: 'top-center',
        onDismiss: () => resolve(false),
        onAutoClose: () => resolve(false)
      }
    );
  });
};
