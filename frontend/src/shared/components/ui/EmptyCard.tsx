import { ArrowRight, type LucideIcon } from "lucide-react";

interface EmptyCardProps {
  title: string;
  icon: LucideIcon;
  colorBase: string;
  colorHover: string;
  colorBorder: string;
  onClick: () => void;
  desc: string;
}

export const EmptyCard = ({ title, icon: Icon, colorBase, colorHover, colorBorder, onClick, desc }: EmptyCardProps) => (
  <div
    role="button"
    tabIndex={0}
    onClick={onClick}
    onKeyDown={(e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onClick();
      }
    }}
    aria-label="Subir archivo"
      className={`
      relative overflow-hidden rounded-3xl p-6 border-2 border-dashed border-slate-200 
      ${colorBorder} ${colorHover} 
      transition-all cursor-pointer group h-64 flex flex-col justify-center items-center text-center
      focus:outline-none focus:ring-4 focus:ring-offset-4 focus:ring-blue-400
    `}
  >
    <div className={`mb-4 p-4 rounded-full bg-slate-50 group-hover:bg-white group-hover:shadow-lg transition-all ${colorBase}`}>
      <Icon size={32} />
    </div>
    <h3 className="font-black text-slate-700 uppercase tracking-tight mb-2">{title}</h3>
    <p className="text-xs text-slate-400 font-medium max-w-[200px]">{desc}</p>
    <span className={`mt-6 text-[10px] font-bold uppercase tracking-widest ${colorBase} opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1`}>
      Subir Archivo <ArrowRight size={10} />
    </span>
  </div>
);
