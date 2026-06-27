import React, { useState, useEffect } from "react";
import { useApp } from "../../context/AppContext";
import { Bell, LogOut, Sun, Moon, UserCheck, Clock } from "lucide-react";
import { RolUsuario } from "../../types";

export const Header: React.FC = () => {
  const { user, logout, impersonateRole, theme, toggleTheme, notificaciones, markNotificationsAsRead } = useApp();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showRoleSwitcher, setShowRoleSwitcher] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const unreadCount = notificaciones.filter(n => !n.leida).length;

  const handleMarkRead = async () => {
    await markNotificationsAsRead();
  };

  if (!user) return null;

  return (
    <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 px-6 flex items-center justify-between sticky top-0 z-40 transition-colors duration-200">
      {/* Title / Current Workspace Indicator */}
      <div className="flex items-center space-x-3">
        <Clock className="w-5 h-5 text-slate-400 dark:text-slate-500" />
        <span className="text-sm font-mono text-slate-500 dark:text-slate-400 hidden sm:inline">
          {currentTime.toLocaleTimeString("es-AR")} - {currentTime.toLocaleDateString("es-AR", { weekday: 'long', day: 'numeric', month: 'short' })}
        </span>
      </div>

      {/* Control Buttons */}
      <div className="flex items-center space-x-4">
        {/* Theme Toggler */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
          title="Cambiar tema"
        >
          {theme === "light" ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
        </button>

        {/* Demo Impersonation Switcher */}
        <div className="relative">
          <button
            onClick={() => {
              setShowRoleSwitcher(!showRoleSwitcher);
              setShowNotifications(false);
            }}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 rounded-lg text-xs font-semibold hover:bg-indigo-100 dark:hover:bg-indigo-950/60 transition"
            title="Cambiar rol de prueba"
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Rol: {user.rol}</span>
          </button>

          {showRoleSwitcher && (
            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl shadow-lg py-1.5 z-50 text-xs">
              <div className="px-3 py-1 text-slate-400 font-medium">Impersonar de prueba:</div>
              {Object.values(RolUsuario).map((role) => (
                <button
                  key={role}
                  onClick={() => {
                    impersonateRole(role);
                    setShowRoleSwitcher(false);
                  }}
                  className={`w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 font-medium transition ${
                    user.rol === role ? "text-indigo-600 dark:text-indigo-400 bg-slate-50 dark:bg-slate-700/50" : "text-slate-600 dark:text-slate-300"
                  }`}
                >
                  {role}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Notifications Tray */}
        <div className="relative">
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowRoleSwitcher(false);
              if (unreadCount > 0) {
                handleMarkRead();
              }
            }}
            className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition relative"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl shadow-lg z-50 overflow-hidden">
              <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
                <span className="font-semibold text-sm text-slate-700 dark:text-slate-200">Notificaciones Recientes</span>
                {unreadCount > 0 && (
                  <span className="text-[10px] bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 font-semibold px-2 py-0.5 rounded-full">
                    Nuevas
                  </span>
                )}
              </div>
              <div className="max-h-64 overflow-y-auto divide-y divide-slate-50 dark:divide-slate-700/50">
                {notificaciones.length === 0 ? (
                  <div className="p-4 text-center text-slate-400 text-xs">No hay notificaciones</div>
                ) : (
                  notificaciones.map((notif) => (
                    <div key={notif.id} className="p-3 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition text-xs">
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-bold text-slate-700 dark:text-slate-200">{notif.titulo}</span>
                        <span className="text-[9px] text-slate-400">
                          {new Date(notif.fecha).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                      <p className="text-slate-600 dark:text-slate-300 line-clamp-2">{notif.mensaje}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="h-6 w-px bg-slate-200 dark:bg-slate-700"></div>

        {/* User profile dropdown and logout */}
        <div className="flex items-center space-x-3">
          <div className="hidden md:flex flex-col text-right">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{user.nombre} {user.apellido}</span>
            <span className="text-[10px] text-indigo-500 font-medium uppercase tracking-wider">{user.rol}</span>
          </div>
          <div className="w-9.5 h-9.5 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-sm shadow-sm ring-2 ring-slate-100 dark:ring-slate-800">
            {user.nombre[0]}{user.apellido[0]}
          </div>
          <button
            onClick={logout}
            className="p-2 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition"
            title="Cerrar sesión"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
};
export default Header;
