import React from "react";
import { useApp } from "../../context/AppContext";
import {
  LayoutDashboard,
  Users,
  CreditCard,
  UserCheck,
  Sparkles,
  ShieldCheck,
  Settings,
  Dumbbell,
  ClipboardList
} from "lucide-react";
import { RolUsuario } from "../../types";

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const { user, configuracion } = useApp();

  if (!user) return null;

  // Navigation Items with RBAC definitions
  const menuItems = [
    {
      id: "dashboard",
      name: "Dashboard",
      icon: LayoutDashboard,
      roles: [RolUsuario.Administrador, RolUsuario.Gerente]
    },
    {
      id: "socios",
      name: "Gestión de Socios",
      icon: Users,
      roles: [RolUsuario.Administrador, RolUsuario.Recepcionista]
    },
    {
      id: "planes",
      name: "Planes / Membresías",
      icon: ClipboardList,
      roles: [RolUsuario.Administrador, RolUsuario.Recepcionista]
    },
    {
      id: "pagos",
      name: "Control de Cuotas",
      icon: CreditCard,
      roles: [RolUsuario.Administrador, RolUsuario.Recepcionista]
    },
    {
      id: "asistencias",
      name: "Control de Asistencias",
      icon: UserCheck,
      roles: [RolUsuario.Administrador, RolUsuario.Recepcionista]
    },
    {
      id: "entrenadores",
      name: "Entrenadores",
      icon: ShieldCheck,
      roles: [RolUsuario.Administrador, RolUsuario.Recepcionista]
    },
    {
      id: "rutinas",
      name: "Rutinas",
      icon: Dumbbell,
      roles: [RolUsuario.Administrador, RolUsuario.Recepcionista]
    },
    {
      id: "configuracion",
      name: "Configuración",
      icon: Settings,
      roles: [RolUsuario.Administrador]
    }
  ];

  return (
    <aside className="w-64 bg-[#0F172A] text-slate-400 flex flex-col h-screen fixed left-0 top-0 z-50 border-r border-slate-800">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-slate-800 space-x-3 bg-[#0F172A]">
        <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center text-white shrink-0 shadow-sm shadow-indigo-500/20">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="m6.5 6.5 11 11"/>
            <path d="m11.5 6.5 6 6"/>
            <path d="m6.5 11.5 6 6"/>
          </svg>
        </div>
        <span className="text-white font-bold text-base tracking-tight truncate">
          {configuracion?.nombre_gimnasio?.replace(/gimnasio/gi, "GYM").toUpperCase() || "GYM PRO"} <span className="text-indigo-400 font-bold">SYS</span>
        </span>
      </div>

      {/* Nav Menu */}
      <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 mb-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
          Menú Principal
        </div>
        {menuItems.map((item) => {
          const hasAccess = item.roles.includes(user.rol);
          const IconComponent = item.icon;

          return (
            <button
              key={item.id}
              onClick={() => {
                if (hasAccess) {
                  setActiveTab(item.id);
                }
              }}
              disabled={!hasAccess}
              className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md text-xs font-medium transition duration-150 relative ${
                activeTab === item.id && hasAccess
                  ? "bg-indigo-600/10 text-indigo-400 border-l-4 border-indigo-500 font-semibold"
                  : hasAccess
                  ? "text-slate-400 hover:bg-slate-800 hover:text-white"
                  : "text-slate-600 cursor-not-allowed opacity-40"
              }`}
            >
              <IconComponent className={`w-4 h-4 shrink-0 ${activeTab === item.id && hasAccess ? "text-indigo-400" : "text-slate-400"}`} />
              <span className="flex-1 text-left truncate">{item.name}</span>
              
              {!hasAccess && (
                <span className="text-[8px] bg-slate-800 text-slate-500 border border-slate-700/50 px-1 py-0.5 rounded font-bold uppercase shrink-0">
                  Bloq
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* User Information Profile Area */}
      <div className="mt-auto p-4 border-t border-slate-800 bg-slate-950/40">
        <div className="flex items-center space-x-3 bg-slate-800/50 p-3 rounded-lg border border-slate-800/40">
          <div className="w-8 h-8 bg-indigo-500/20 text-indigo-300 rounded-full flex items-center justify-center text-xs font-bold shrink-0 border border-indigo-500/30">
            {user.nombre[0]}{user.apellido[0]}
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-xs font-semibold text-white truncate">{user.nombre} {user.apellido}</p>
            <p className="text-[10px] text-slate-500 truncate font-mono uppercase">{user.rol}</p>
          </div>
        </div>
      </div>
    </aside>
  );
};
export default Sidebar;
