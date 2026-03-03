// components/Sidebar.tsx
import { useState, useEffect, useMemo, useRef } from "react";
import {
  LayoutDashboard, Calendar, CalendarCheck, Clock,
  ClipboardList, BarChart2, ChevronLeft, ChevronRight, Briefcase, ChevronDown, CircleDollarSign,
  LogOut, User, type LucideIcon
} from "lucide-react";
import { toast } from "sonner";

interface MenuItem {
  type?: 'link' | 'group';
  id: string;
  label: string;
  icon: LucideIcon;
  path?: string;
  locked?: boolean;
  children?: MenuItem[];
}
import { SidebarItem } from "./SidebarItem";
import { useAuth } from "../../context/useAuth";

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  userRoles?: string[];
}

interface SidebarGroupProps {
  item: MenuItem;
  isCollapsed: boolean;
  activeTab: string;
  openGroups: string[];
  toggleGroup: (id: string) => void;
  handleNav: (id: string) => void;
}

const SidebarGroup = ({
  item,
  isCollapsed,
  activeTab,
  openGroups,
  toggleGroup,
  handleNav,
}: SidebarGroupProps) => {
  const isOpen = openGroups.includes(item.id);
  const hasActiveChild = item.children?.some((c: MenuItem) => c.id === activeTab);

  return (
    <div className="mb-2">
      {/* Cabecera del Grupo */}
      <button
        onClick={() => !item.locked && toggleGroup(item.id)}
        disabled={item.locked}
        className={`
          flex items-center w-full p-3 rounded-xl transition-all duration-200 group relative
          ${isCollapsed ? 'justify-center' : 'justify-between'}
          ${item.locked ? 'opacity-40 cursor-not-allowed grayscale' : 'hover:bg-pf-neutral-100'}
          ${hasActiveChild && !isOpen ? 'bg-pf-neutral-50 text-pf-red' : 'text-pf-neutral-600'}
        `}
      >
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'space-x-4'}`}>
          <item.icon size={20} className={hasActiveChild ? 'text-pf-red' : ''} />
          <span className={`font-black text-sm uppercase tracking-tight transition-all duration-300 ${isCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100 ml-4'}`}>
            {item.label}
          </span>
        </div>
        {!isCollapsed && !item.locked && (
          <ChevronDown size={14} className={`text-pf-neutral-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        )}
      </button>

      {/* Hijos del Grupo */}
      <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen && !isCollapsed ? 'max-h-96 opacity-100 mt-1' : 'max-h-0 opacity-0'}`}>
        <div className="ml-4 pl-2 border-l-2 border-pf-neutral-100 space-y-1 mt-1">
          {item.children?.map((child: MenuItem) => (
            <SidebarItem
              key={child.id}
              to={child.path}
              label={child.label}
              icon={child.icon}
              isCollapsed={false}
              onClick={() => handleNav(child.id)}
              className="py-2 text-xs font-medium"
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export const Sidebar = ({
  activeTab, setActiveTab, userRoles = []
}: SidebarProps) => {

  const { user, logout } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(window.innerWidth < 1024);
  const [openGroups, setOpenGroups] = useState<string[]>([]);
  const _K = {
    _m1: "RGVzYXJyb2xsYWRvIHBvciBZYW5rbyBBY3XDsWEgVmlsbGFzZWNh"
  };

  // Determinar acceso por rol
  const esProgramador = userRoles.includes('programador');
  const esAnalista = userRoles.includes('analista');
  const esSupervisor = userRoles.includes('supervisor');

  const puedeVerPlanificacion = esProgramador || esSupervisor;
  const puedeVerSeguimiento = esProgramador || esAnalista || esSupervisor;
  const puedeVerFallas = esAnalista || esSupervisor;
  const puedeVerGastos = esProgramador || esAnalista || esSupervisor;

  const menuStructure = useMemo(() => {
    const items: MenuItem[] = [
      { type: 'link', id: 'dash', label: 'Dashboard', icon: LayoutDashboard, path: '/', locked: false },
    ];

    // Planificación - Solo programadores y supervisores
    if (puedeVerPlanificacion) {
      items.push({
        type: 'group',
        id: 'group-plan',
        label: 'Planificación',
        icon: Briefcase,
        locked: false,
        children: [
          { id: 'plan', label: 'Asignación Horaria', icon: CalendarCheck, path: '/planificacion' },
          { id: 'gantt', label: 'Horarios', icon: Calendar, path: '/gantt' },
          { id: 'carga', label: 'Seguimiento Técnicos', icon: ClipboardList, path: '/seguimiento-tecnicos' },
        ]
      });
    }

    // Seguimiento KPI - Todos los roles autenticados
    if (puedeVerSeguimiento) {
      items.push({
        type: 'link', id: 'seguimiento', label: 'Seguimiento', icon: Clock, path: '/atrasos', locked: false
      });
    }

    // Fallas - Solo analistas y supervisores
    if (puedeVerFallas) {
      items.push({
        type: 'link', id: 'fallas', label: 'Fallas Activos', icon: BarChart2, path: '/fallas', locked: false
      });
    }

    // Control Gastos - Todos los roles
    if (puedeVerGastos) {
      items.push({
        type: 'link', id: 'gastos', label: 'Control Gastos', icon: CircleDollarSign, path: '/gastos', locked: false
      });
    }

    return items;
  }, [puedeVerPlanificacion, puedeVerSeguimiento, puedeVerFallas, puedeVerGastos]);

  // Efecto para auto-abrir grupos
  useEffect(() => {
    menuStructure.forEach((item) => {
      if (item.type === 'group' && item.children?.some((c: MenuItem) => c.id === activeTab)) {
        setOpenGroups(prev => prev.includes(item.id) ? prev : [...prev, item.id]);
      }
    });
  }, [activeTab, menuStructure]);

  const toggleGroup = (groupId: string) => {
    if (isCollapsed) setIsCollapsed(false);
    setOpenGroups(prev => prev.includes(groupId) ? prev.filter(g => g !== groupId) : [...prev, groupId]);
  };

  const _clicks = useRef(0);
  const _timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const _hI = () => {
    if (_timer.current) clearTimeout(_timer.current);

    _clicks.current++;

    if (_clicks.current >= 10) {
      const _d = (s: string) => {
        const b = atob(s);
        const u = new Uint8Array(b.length);
        for (let i = 0; i < b.length; i++) u[i] = b.charCodeAt(i);
        return new TextDecoder().decode(u);
      };

      toast.success(_d(_K._m1), {
        duration: 5000,
        style: { borderRadius: '12px', border: '1px solid #f1f1f1' }
      });

      _clicks.current = 0;
    } else {
      // Al asignar el timeout, TS ahora estará feliz
      _timer.current = setTimeout(() => {
        _clicks.current = 0;
      }, 3000);
    }
  };

  // Cerrar al seleccionar en móvil
  const handleNav = (id: string) => {
    setActiveTab(id);
    if (window.innerWidth < 768) setIsCollapsed(true);
  };


  return (
    <>
      {/* BACKDROP PARA MÓVILES */}
      {!isCollapsed && (
        <button
          type="button"
          aria-label="Cerrar menú"
          className="fixed inset-0 bg-pf-neutral-900/30 backdrop-blur-[2px] z-40 md:hidden transition-opacity duration-300 border-none cursor-default"
          onClick={() => setIsCollapsed(true)}
        />
      )}

      <aside className={`
        bg-pf-sidebar border-r border-pf-border flex flex-col h-full shadow-sm transition-all duration-300 z-50
        ${isCollapsed ? 'w-0 -translate-x-full md:w-20 md:translate-x-0' : 'w-64 translate-x-0 fixed md:relative'}
      `}>

        {/* TOGGLE BUTTON */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={`
            fixed md:absolute top-9 z-[60] bg-white border border-pf-border rounded-full p-1.5 text-pf-neutral-400 hover:text-pf-red shadow-md transition-all
            ${isCollapsed
              ? 'left-4 md:left-auto md:-right-3'
              : 'left-[242px] md:left-auto md:-right-3'}
          `}
        >
          {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>

        <div className={`flex flex-col h-full w-full overflow-hidden transition-opacity duration-200 ${isCollapsed ? 'opacity-0 md:opacity-100' : 'opacity-100'}`}>
          {/* HEADER */}
          <div className={`p-6 flex flex-col items-center transition-all duration-300 ${isCollapsed ? 'px-2' : ''}`}>
            <button
              type="button"
              onClick={_hI}
              className="bg-transparent border-none p-0 focus:outline-none"
            >
              <img
                src="./Logo_PF_Alimentos.png"
                alt="PF Logo - Ir al inicio"
                className={`object-contain transition-all duration-300 cursor-pointer select-none active:scale-95 ${isCollapsed ? 'w-10 h-10' : 'w-32 mb-4'
                  }`}
              />
            </button>
            <div className={`h-0.5 w-16 bg-pf-red/20 rounded-full transition-opacity duration-200 ${isCollapsed ? 'opacity-0 hidden' : 'opacity-100'}`}></div>
            <p className={`text-[10px] text-pf-neutral-400 uppercase tracking-[0.2em] font-bold text-center mt-2 whitespace-nowrap overflow-hidden transition-all duration-300 ${isCollapsed ? 'opacity-0 h-0' : 'opacity-100 h-auto'}`}>
              Control Industrial
            </p>
          </div>

          {/* MENU NAV */}
          <nav className="flex-1 px-3 space-y-1.5 overflow-x-hidden overflow-y-auto custom-scrollbar">
            {menuStructure.map((item) => (
              item.type === 'group' ? (
                <SidebarGroup
                  key={item.id}
                  item={item}
                  isCollapsed={isCollapsed}
                  activeTab={activeTab}
                  openGroups={openGroups}
                  toggleGroup={toggleGroup}
                  handleNav={handleNav}
                />
              ) : (
                <SidebarItem
                  key={item.id}
                  to={item.path}
                  label={item.label}
                  icon={item.icon}
                  isCollapsed={isCollapsed}
                  locked={item.locked}
                  onClick={() => handleNav(item.id)}
                  className="py-2 text-sm font-medium"
                />
              )
            ))}
          </nav>

          {/* FOOTER: USUARIO + LOGOUT */}
          <div className={`border-t border-pf-border transition-all duration-300 ${isCollapsed ? 'p-3' : 'p-4'}`}>
            {/* Info del usuario */}
            <div className={`flex items-center bg-pf-neutral-50 rounded-xl border border-pf-border transition-all duration-300 ${isCollapsed ? 'justify-center p-2 aspect-square' : 'gap-3 p-3'}`}>
              <div className="w-8 h-8 rounded-full bg-pf-red/10 flex items-center justify-center flex-shrink-0">
                <User size={16} className="text-pf-red" />
              </div>
              <div className={`flex flex-col overflow-hidden whitespace-nowrap transition-all duration-300 ${isCollapsed ? 'w-0 opacity-0 hidden' : 'w-auto opacity-100 flex-1 min-w-0'}`}>
                <span className="text-[11px] font-bold text-pf-neutral-700 truncate">
                  {user?.primerNombre} {user?.primerApellido}
                </span>
                <span className="text-[9px] text-pf-neutral-400 font-bold uppercase">
                  {user?.roles[0]}
                </span>
              </div>
            </div>

            {/* Botón Cerrar Sesión */}
            <button
              onClick={logout}
              className={`w-full mt-2 flex items-center rounded-xl text-pf-neutral-400 hover:text-pf-red hover:bg-pf-red-50 transition-all duration-200
            ${isCollapsed ? 'justify-center p-2' : 'gap-3 p-2.5 px-3'}`}
            >
              <LogOut size={16} />
              <span className={`text-[11px] font-bold uppercase tracking-tight transition-all duration-300 ${isCollapsed ? 'w-0 opacity-0 hidden' : 'w-auto opacity-100'}`}>
                Cerrar Sesión
              </span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};