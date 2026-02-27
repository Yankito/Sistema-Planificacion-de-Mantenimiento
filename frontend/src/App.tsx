import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import "./App.css";
import { AuthProvider } from "./context/AuthContext.tsx";
import { useAuth } from "./context/useAuth";
import { Toaster } from "sonner";

// Auth
import { LoginView } from "./modules/auth/views/LoginView";
import { DashboardView } from "./modules/auth/views/DashboardView";

// Components
import { Sidebar } from "./shared/components/Sidebar";
import { HorariosView } from "./modules/planificacion/views/HorariosView";
import { PlanificacionView } from "./modules/planificacion/views/PlanificacionView";
import { SeguimientoOTsView } from "./modules/seguimiento/views/SeguimientoOTsView";
import { SeguimientoTecnicosView } from "./modules/planificacion/views/SeguimientoTecnicosView";
import { FallasView } from "./modules/fallas/views/FallasView";
import { ControlGastosView } from "./modules/control-gastos/views/ControlGastosView";



// Contenido principal protegido
const AppContent = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  // Permisos por rol
  const roles = user?.roles || [];
  const esProgramador = roles.includes('programador');
  const esAnalista = roles.includes('analista');
  const esSupervisor = roles.includes('supervisor');

  // Funcionalidades:
  // Programador: planificación, horarios, seguimiento-tecnicos, gastos, seguimiento (su planta)
  // Analista: seguimiento global, fallas, gastos consolidado
  // Supervisor: todo
  const puedeVerPlanificacion = esProgramador || esSupervisor;
  const puedeVerFallas = esAnalista || esSupervisor;
  const puedeVerGastos = esProgramador || esAnalista || esSupervisor;
  const puedeVerSeguimiento = esProgramador || esAnalista || esSupervisor;

  return (
    <div className="flex h-screen bg-pf-light overflow-hidden">
      <Sidebar
        activeTab={location.pathname}
        setActiveTab={(path) => navigate(path)}
        userRoles={roles}
      />
      <main className="flex-1 overflow-y-auto p-4 space-y-12 shadow-inner">
        <Routes>
          <Route path="/" element={
            <DashboardView
              setActiveTab={(path) => navigate(path === 'dash' ? '/' : `/${path}`)}
            />
          } />

          {/* PLANIFICACIÓN - Solo programadores y supervisores */}
          <Route path="/planificacion" element={
            puedeVerPlanificacion
              ? <PlanificacionView />
              : <Navigate to="/" replace />
          } />
          <Route path="/gantt" element={
            puedeVerPlanificacion
              ? <HorariosView />
              : <Navigate to="/" replace />
          } />
          <Route path="/seguimiento-tecnicos" element={
            puedeVerPlanificacion
              ? <SeguimientoTecnicosView
                plantas={user?.plantas || []}
                onNavegar={() => navigate('/planificacion')}
              />
              : <Navigate to="/" replace />
          } />

          {/* SEGUIMIENTO - Todos con acceso (filtrado por planta en el componente) */}
          <Route path="/atrasos" element={
            puedeVerSeguimiento
              ? <SeguimientoOTsView />
              : <Navigate to="/" replace />
          } />

          {/* FALLAS - Solo analistas y supervisores */}
          <Route path="/fallas" element={
            puedeVerFallas
              ? <FallasView />
              : <Navigate to="/" replace />
          } />

          {/* GASTOS - Todos con acceso */}
          <Route path="/gastos" element={
            puedeVerGastos
              ? <ControlGastosView />
              : <Navigate to="/" replace />
          } />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
};

// Componente que decide si mostrar login o la app
const AuthGate = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-pf-light">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-red-500/30 border-t-red-500 rounded-full animate-spin" />
          <p className="text-slate-400 text-sm font-medium">Cargando sistema...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginView />;
  }

  return (
    <AppContent />
  );
};

// Main App Component
const App = () => {
  return (
    <Router>
      <AuthProvider>
        <AuthGate />
        <Toaster richColors position="top-right" />
      </AuthProvider>
    </Router>
  );
};

export default App;