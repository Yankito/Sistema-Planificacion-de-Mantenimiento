import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import "./App.css";
import { PlanificacionProvider } from "./context/PlanificacionProvider";

// Components
import { Sidebar } from "./shared/components/Sidebar";
import { DashboardView } from "./shared/views/DashboardView";
import { HorariosView } from "./modules/planificacion/views/HorariosView";
import { PlanificacionView } from "./modules/planificacion/views/PlanificacionView";
import { SeguimientoOTsView } from "./modules/seguimiento/views/SeguimientoOTsView";
import { SeguimientoTecnicosView } from "./modules/planificacion/views/SeguimientoTecnicosView";
import { FallasView } from "./modules/fallas/views/FallasView";
import { ControlGastosView } from "./modules/control-gastos/views/ControlGastosView";

import { useData } from "./context/PlanificacionContext";

// App Content Component
const AppContent = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const { planning, seguimiento, fallas, config } = useData();

  const handleNavegarPlanificacion = (planta: string) => {
    if (planta) planning.setPlantaPlan(planta);
    // Podríamos setear la fecha si el context lo soportara, pero por ahora vamos a la vista
    navigate('/planificacion');
  };

  return (
    <div className="flex h-screen bg-pf-light overflow-hidden">
      <Sidebar
        activeTab={location.pathname}
        setActiveTab={(path) => navigate(path)}
        onLimpiar={() => window.location.reload()}
      />
      <main className="flex-1 overflow-y-auto p-10 space-y-12 shadow-inner">
        <Routes>
          <Route path="/" element={
            <DashboardView
              planResult={planning.planResult}
              seguimientoResult={seguimiento.dataActual}
              seguimientoPrevio={seguimiento.dataAnterior}
              fallasResult={fallas.data}
              onEjecutarPlan={planning.ejecutarPlanificacion}
              setActiveTab={(path) => navigate(path === 'dash' ? '/' : `/${path}`)}
              archivoCargado={planning.planResult.length > 0}
              reporteActual={seguimiento.reporteActual || config.semanaActual}
              semanaComparar={seguimiento.semanaComparar}
            />
          } />

          <Route path="/planificacion" element={<PlanificacionView />} />
          <Route path="/gantt" element={<HorariosView />} />
          <Route path="/seguimiento-tecnicos" element={
            <SeguimientoTecnicosView
              planResult={planning.planResult}
              plantas={["PF3", "PF4", "PF5", "PF6", "CDT", "CI", "OTROS"]}
              onNavegar={handleNavegarPlanificacion}
              mes={planning.mes}
            />
          } />
          <Route path="/atrasos" element={<SeguimientoOTsView />} />
          <Route path="/fallas" element={<FallasView />} />
          <Route path="/gastos" element={<ControlGastosView />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
};

// Main App Component
const App = () => {
  return (
    <Router>
      <PlanificacionProvider>
        <AppContent />
      </PlanificacionProvider>
    </Router>
  );
};

export default App;