import { Loader2 } from "lucide-react";

export const LoadingOverlay = ({ message = "Procesando datos..." }: { message?: string }) => (
  <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center animate-in fade-in duration-200">
    <div className="bg-white p-6 rounded-2xl shadow-2xl border border-slate-100 flex flex-col items-center">
      <Loader2 className="h-10 w-10 text-pf-red animate-spin mb-3" />
      <p className="text-sm font-bold text-slate-600 animate-pulse">{message}</p>
    </div>
  </div>
);