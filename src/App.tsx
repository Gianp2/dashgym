import React, { useState } from "react";
import { AppProvider, useApp } from "./context/AppContext";
import { Header } from "./components/layout/Header";
import { Sidebar } from "./components/layout/Sidebar";
import { IniciarSesion } from "./paginas/IniciarSesion";
import { Dashboard } from "./paginas/Dashboard";
import { Socios } from "./paginas/Socios";
import { Planes } from "./paginas/Planes";
import { Pagos } from "./paginas/Pagos";
import { Asistencias } from "./paginas/Asistencias";
import { Entrenadores } from "./paginas/Entrenadores";
import { Rutinas } from "./paginas/Rutinas";
import { Reportes } from "./paginas/Reportes";
import { Configuracion } from "./paginas/Configuracion";
import { RefreshCcw } from "lucide-react";

const MainAppContent: React.FC = () => {
  const { user, loading } = useApp();
  const [activeTab, setActiveTab] = useState("dashboard");

  // Loading state (e.g. initial fetch)
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white space-y-4">
        <RefreshCcw className="w-10 h-10 text-indigo-500 animate-spin" />
        <div className="text-center">
          <h2 className="text-sm font-bold tracking-widest uppercase">GYM PRO</h2>
          <p className="text-slate-500 text-[10px] uppercase font-mono mt-1">Conectando con base de datos...</p>
        </div>
      </div>
    );
  }

  // Auth screen
  if (!user) {
    return <IniciarSesion />;
  }

  // Render the selected view
  const renderView = () => {
    switch (activeTab) {
      case "dashboard":
        return (
          <Dashboard
            setActiveTab={setActiveTab}
            openSocioModal={() => setActiveTab("socios")}
          />
        );
      case "socios":
        return <Socios />;
      case "planes":
        return <Planes />;
      case "pagos":
        return <Pagos />;
      case "asistencias":
        return <Asistencias />;
      case "entrenadores":
        return <Entrenadores />;
      case "rutinas":
        return <Rutinas />;
      case "reportes":
        return <Reportes />;
      case "configuracion":
        return <Configuracion />;
      default:
        return (
          <div className="text-center py-12 text-slate-400">
            Vista en desarrollo o no disponible.
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex transition-colors duration-200">
      {/* Sidebar - fixed left */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main View Area */}
      <div className="flex-1 flex flex-col pl-64 min-h-screen">
        {/* Header - fixed height */}
        <Header />

        {/* Content Panel */}
        <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
          {renderView()}
        </main>

        {/* High Density Footer Info */}
        <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 h-10 px-6 lg:px-8 flex items-center justify-between text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest shrink-0">
          <div className="flex items-center space-x-2">
            <span>CONECTADO A SERVIDOR:</span>
            <span className="text-emerald-500 dark:text-emerald-400 flex items-center">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1 animate-pulse"></span>
              ACTIVO
            </span>
          </div>
          <div>GYM PRO SYS v2.4.0 • SOFTWARE DE GESTIÓN</div>
          <div>LATENCIA: 12ms</div>
        </footer>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainAppContent />
    </AppProvider>
  );
}
