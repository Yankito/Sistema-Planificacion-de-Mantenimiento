import { Loader2 } from "lucide-react";

interface LoadingOverlayProps {
  message?: string;
  variant?: 'fullscreen' | 'absolute';
}

export const LoadingOverlay = ({
  message = "Sincronizando...",
  variant = 'absolute'
}: LoadingOverlayProps) => {
  const containerClasses = variant === 'fullscreen'
    ? "fixed inset-0 bg-white/80 backdrop-blur-sm z-[999]"
    : "absolute inset-0 bg-white/70 backdrop-blur-md z-[200] rounded-[3rem]";

  return (
    <div className={`${containerClasses} flex flex-col items-center justify-center gap-4 transition-all animate-in fade-in duration-300`}>
      <div className="relative">
        <Loader2 className="animate-spin text-pf-red" size={variant === 'fullscreen' ? 64 : 48} />
        <div className="absolute inset-0 animate-ping opacity-20 bg-pf-red rounded-full" />
      </div>
      <p className="text-pf-neutral-600 font-black uppercase tracking-[0.3em] text-[11px] animate-pulse">
        {message}
      </p>
    </div>
  );
};