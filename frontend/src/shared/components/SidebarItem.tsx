import { Lock, type LucideIcon } from "lucide-react";
import { NavLink } from "react-router-dom";

interface SidebarItemProps {
  to?: string;        // Nueva prop para la ruta
  label: string;
  icon: LucideIcon;
  isCollapsed: boolean;
  locked?: boolean;
  onClick?: () => void;
  className?: string;
}

export const SidebarItem = ({
  to, label, icon: Icon, isCollapsed, locked, onClick, className = ""
}: SidebarItemProps) => {
  
  // Estilos base compartidos
  const baseClasses = `
    flex items-center w-full p-2 rounded-xl transition-all duration-200 group relative
    ${isCollapsed ? 'justify-center' : 'justify-between'}
    ${locked ? 'opacity-40 cursor-not-allowed grayscale' : 'hover:bg-slate-100'}
    ${className}
  `;

  const activeClasses = "bg-slate-800 text-white shadow-lg";
  const inactiveClasses = "text-slate-600";

  // Contenido interno del item
  const renderContent = (isActive: boolean) => (
    <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'space-x-4'}`}>
      <Icon 
        size={20} 
        className={`min-w-[20px] transition-colors ${isActive && !locked ? 'text-pf-red' : ''}`} 
      />
      <span className={`
        font-black whitespace-nowrap overflow-hidden transition-all duration-300 uppercase tracking-tight
        ${isCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100 ml-4'}
      `}>
        {label}
      </span>
      {!isCollapsed && locked && <Lock size={12} className="text-slate-400 min-w-[12px] ml-auto" />}
    </div>
  );

  // Si tiene ruta 'to', usamos NavLink de React Router
  if (to && !locked) {
    return (
      <NavLink
        to={to}
        title={isCollapsed ? label : ''}
        className={({ isActive }) => `${baseClasses} ${isActive ? activeClasses : inactiveClasses}`}
      >
        {({ isActive }) => renderContent(isActive)}
      </NavLink>
    );
  }

  // Si no tiene ruta (es un botón de acción como Reset) o está bloqueado
  return (
    <button
      onClick={onClick}
      disabled={locked}
      title={isCollapsed ? label : ''}
      className={`${baseClasses} ${inactiveClasses}`}
    >
      {renderContent(false)}
    </button>
  );
};