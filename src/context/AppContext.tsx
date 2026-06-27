import React, { createContext, useContext, useState, useEffect } from "react";
import { Socio, Plan, Pago, Asistencia, Entrenador, Rutina, Notificacion, Auditoria, Configuracion, Usuario, RolUsuario } from "../types";

interface AppContextType {
  user: Usuario | null;
  token: string | null;
  loading: boolean;
  socios: Socio[];
  planes: Plan[];
  pagos: Pago[];
  asistencias: Asistencia[];
  entrenadores: Entrenador[];
  rutinas: Rutina[];
  notificaciones: Notificacion[];
  auditoria: Auditoria[];
  configuracion: Configuracion | null;
  theme: "light" | "dark";
  login: (correo: string, password: string) => Promise<boolean>;
  logout: () => void;
  impersonateRole: (rol: RolUsuario) => void;
  refreshData: () => Promise<void>;
  
  // Socios actions
  addSocio: (socio: Omit<Socio, "id" | "qr" | "fecha_registro">) => Promise<any>;
  updateSocio: (id: string, updates: Partial<Socio>) => Promise<any>;
  deleteSocio: (id: string) => Promise<boolean>;

  // Planes actions
  addPlan: (plan: Omit<Plan, "id">) => Promise<any>;
  updatePlan: (id: string, updates: Partial<Plan>) => Promise<any>;
  deletePlan: (id: string) => Promise<boolean>;

  // Pagos actions
  addPago: (socio_id: string, plan_id: string, metodo_pago: string) => Promise<any>;
  deletePago: (id: string) => Promise<boolean>;

  // Asistencias actions
  registerAsistencia: (qr_or_id: string, manual_id?: string) => Promise<{ success: boolean; mensaje: string; socio?: Socio }>;

  // Entrenadores actions
  addEntrenador: (entrenador: Omit<Entrenador, "id">) => Promise<any>;
  updateEntrenador: (id: string, updates: Partial<Entrenador>) => Promise<any>;
  deleteEntrenador: (id: string) => Promise<boolean>;

  // Rutinas actions
  addRutina: (rutina: Omit<Rutina, "id" | "socio_nombre" | "entrenador_nombre" | "fecha_creacion">) => Promise<any>;
  updateRutina: (id: string, updates: Partial<Rutina>) => Promise<any>;
  deleteRutina: (id: string) => Promise<boolean>;

  // Settings action
  updateConfiguracion: (config: Partial<Configuracion>) => Promise<any>;
  toggleTheme: () => void;
  markNotificationsAsRead: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<Usuario | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [theme, setTheme] = useState<"light" | "dark">("light");

  // Gym Entities
  const [socios, setSocios] = useState<Socio[]>([]);
  const [planes, setPlanes] = useState<Plan[]>([]);
  const [pagos, setPagos] = useState<Pago[]>([]);
  const [asistencias, setAsistencias] = useState<Asistencia[]>([]);
  const [entrenadores, setEntrenadores] = useState<Entrenador[]>([]);
  const [rutinas, setRutinas] = useState<Rutina[]>([]);
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [auditoria, setAuditoria] = useState<Auditoria[]>([]);
  const [configuracion, setConfiguracion] = useState<Configuracion | null>(null);

  // Restore session on load
  useEffect(() => {
    const savedUser = localStorage.getItem("gym_user");
    const savedToken = localStorage.getItem("gym_token");
    const savedTheme = localStorage.getItem("gym_theme");

    if (savedUser && savedToken) {
      setUser(JSON.parse(savedUser));
      setToken(savedToken);
    }
    if (savedTheme) {
      setTheme(savedTheme as "light" | "dark");
    }
    refreshData().finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  const refreshData = async () => {
    try {
      const [
        resSocios,
        resPlanes,
        resPagos,
        resAsistencias,
        resEntrenadores,
        resRutinas,
        resNotificaciones,
        resAuditoria,
        resConfig
      ] = await Promise.all([
        fetch("/api/socios"),
        fetch("/api/planes"),
        fetch("/api/pagos"),
        fetch("/api/asistencias"),
        fetch("/api/entrenadores"),
        fetch("/api/rutinas"),
        fetch("/api/notificaciones"),
        fetch("/api/auditoria"),
        fetch("/api/configuracion")
      ]);

      if (resSocios.ok) setSocios(await resSocios.json());
      if (resPlanes.ok) setPlanes(await resPlanes.json());
      if (resPagos.ok) setPagos(await resPagos.json());
      if (resAsistencias.ok) setAsistencias(await resAsistencias.json());
      if (resEntrenadores.ok) setEntrenadores(await resEntrenadores.json());
      if (resRutinas.ok) setRutinas(await resRutinas.json());
      if (resNotificaciones.ok) setNotificaciones(await resNotificaciones.json());
      if (resAuditoria.ok) setAuditoria(await resAuditoria.json());
      if (resConfig.ok) setConfiguracion(await resConfig.json());
    } catch (error) {
      console.error("Fallo al recargar datos de la API del gimnasio:", error);
    }
  };

  const login = async (correo: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ correo, password })
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        setToken(data.token);
        localStorage.setItem("gym_user", JSON.stringify(data.user));
        localStorage.setItem("gym_token", data.token);
        await refreshData();
        return true;
      } else {
        const err = await response.json();
        throw new Error(err.error || "Error de inicio de sesión");
      }
    } catch (err: any) {
      alert(err.message);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("gym_user");
    localStorage.removeItem("gym_token");
  };

  // Helper role switcher for demo and presentation purposes
  const impersonateRole = (rol: RolUsuario) => {
    if (!user) return;
    const mockUserNames: Record<RolUsuario, { nombre: string; apellido: string; email: string }> = {
      [RolUsuario.Administrador]: { nombre: "Franco", apellido: "Gómez", email: "admin@gympro.com" },
      [RolUsuario.Recepcionista]: { nombre: "Valentina", apellido: "Martínez", email: "recep@gympro.com" },
      [RolUsuario.Gerente]: { nombre: "Santiago", apellido: "Fernández", email: "gerente@gympro.com" }
    };

    const details = mockUserNames[rol];
    const updatedUser: Usuario = {
      ...user,
      nombre: details.nombre,
      apellido: details.apellido,
      correo: details.email,
      rol: rol
    };

    setUser(updatedUser);
    localStorage.setItem("gym_user", JSON.stringify(updatedUser));
    
    // Write audit log about role change
    fetch("/api/auditoria", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        usuario_id: updatedUser.id,
        usuario_nombre: updatedUser.nombre + " " + updatedUser.apellido,
        accion: `Cambió su rol a ${rol} (Impersonación Demo)`,
        tabla_afectada: "usuarios"
      })
    }).then(() => refreshData());
  };

  const toggleTheme = () => {
    const nextTheme = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);
    localStorage.setItem("gym_theme", nextTheme);
  };

  // --- ENTITIES ACTIONS ---

  // Socios
  const addSocio = async (socioData: Omit<Socio, "id" | "qr" | "fecha_registro">) => {
    const res = await fetch("/api/socios", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...socioData,
        usuario_id: user?.id,
        usuario_nombre: user ? `${user.nombre} ${user.apellido}` : "u-anon"
      })
    });
    const newSocio = await res.json();
    await refreshData();
    return newSocio;
  };

  const updateSocio = async (id: string, updates: Partial<Socio>) => {
    const res = await fetch(`/api/socios/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...updates,
        usuario_id: user?.id,
        usuario_nombre: user ? `${user.nombre} ${user.apellido}` : "u-anon"
      })
    });
    const updated = await res.json();
    await refreshData();
    return updated;
  };

  const deleteSocio = async (id: string) => {
    const res = await fetch(`/api/socios/${id}?usuario_id=${user?.id || "u-anon"}&usuario_nombre=${encodeURIComponent(user ? `${user.nombre} ${user.apellido}` : "u-anon")}`, {
      method: "DELETE"
    });
    if (res.ok) {
      await refreshData();
      return true;
    }
    return false;
  };

  // Planes
  const addPlan = async (planData: Omit<Plan, "id">) => {
    const res = await fetch("/api/planes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...planData,
        usuario_id: user?.id,
        usuario_nombre: user ? `${user.nombre} ${user.apellido}` : "u-anon"
      })
    });
    const newPlan = await res.json();
    await refreshData();
    return newPlan;
  };

  const updatePlan = async (id: string, updates: Partial<Plan>) => {
    const res = await fetch(`/api/planes/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...updates,
        usuario_id: user?.id,
        usuario_nombre: user ? `${user.nombre} ${user.apellido}` : "u-anon"
      })
    });
    const updated = await res.json();
    await refreshData();
    return updated;
  };

  const deletePlan = async (id: string) => {
    const res = await fetch(`/api/planes/${id}?usuario_id=${user?.id || "u-anon"}&usuario_nombre=${encodeURIComponent(user ? `${user.nombre} ${user.apellido}` : "u-anon")}`, {
      method: "DELETE"
    });
    if (res.ok) {
      await refreshData();
      return true;
    }
    return false;
  };

  // Pagos
  const addPago = async (socio_id: string, plan_id: string, metodo_pago: string) => {
    const res = await fetch("/api/pagos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        socio_id,
        plan_id,
        metodo_pago,
        usuario_id: user?.id,
        usuario_nombre: user ? `${user.nombre} ${user.apellido}` : "u-anon"
      })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "No se pudo registrar el pago");
    }
    const newPago = await res.json();
    await refreshData();
    return newPago;
  };

  const deletePago = async (id: string) => {
    const res = await fetch(`/api/pagos/${id}?usuario_id=${user?.id || "u-anon"}&usuario_nombre=${encodeURIComponent(user ? `${user.nombre} ${user.apellido}` : "u-anon")}`, {
      method: "DELETE"
    });
    if (res.ok) {
      await refreshData();
      return true;
    }
    return false;
  };

  // Asistencias
  const registerAsistencia = async (qr_or_id: string, manual_id?: string) => {
    const res = await fetch("/api/asistencias", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        qr_or_id,
        manual_socio_id: manual_id,
        usuario_id: user?.id,
        usuario_nombre: user ? `${user.nombre} ${user.apellido}` : "u-anon"
      })
    });
    
    const data = await res.json();
    await refreshData();
    
    if (res.ok) {
      return { success: true, mensaje: data.mensaje, socio: data.socio };
    } else {
      return { success: false, mensaje: data.error || "Error al procesar acceso.", socio: data.socio };
    }
  };

  // Entrenadores
  const addEntrenador = async (entrenadorData: Omit<Entrenador, "id">) => {
    const res = await fetch("/api/entrenadores", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...entrenadorData,
        usuario_id: user?.id,
        usuario_nombre: user ? `${user.nombre} ${user.apellido}` : "u-anon"
      })
    });
    const newEnt = await res.json();
    await refreshData();
    return newEnt;
  };

  const updateEntrenador = async (id: string, updates: Partial<Entrenador>) => {
    const res = await fetch(`/api/entrenadores/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...updates,
        usuario_id: user?.id,
        usuario_nombre: user ? `${user.nombre} ${user.apellido}` : "u-anon"
      })
    });
    const updated = await res.json();
    await refreshData();
    return updated;
  };

  const deleteEntrenador = async (id: string) => {
    const res = await fetch(`/api/entrenadores/${id}?usuario_id=${user?.id || "u-anon"}&usuario_nombre=${encodeURIComponent(user ? `${user.nombre} ${user.apellido}` : "u-anon")}`, {
      method: "DELETE"
    });
    if (res.ok) {
      await refreshData();
      return true;
    }
    return false;
  };

  // Rutinas
  const addRutina = async (rutinaData: Omit<Rutina, "id" | "socio_nombre" | "entrenador_nombre" | "fecha_creacion">) => {
    const res = await fetch("/api/rutinas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...rutinaData,
        usuario_id: user?.id,
        usuario_nombre: user ? `${user.nombre} ${user.apellido}` : "u-anon"
      })
    });
    const newRutina = await res.json();
    await refreshData();
    return newRutina;
  };

  const updateRutina = async (id: string, updates: Partial<Rutina>) => {
    const res = await fetch(`/api/rutinas/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...updates,
        usuario_id: user?.id,
        usuario_nombre: user ? `${user.nombre} ${user.apellido}` : "u-anon"
      })
    });
    const updated = await res.json();
    await refreshData();
    return updated;
  };

  const deleteRutina = async (id: string) => {
    const res = await fetch(`/api/rutinas/${id}?usuario_id=${user?.id || "u-anon"}&usuario_nombre=${encodeURIComponent(user ? `${user.nombre} ${user.apellido}` : "u-anon")}`, {
      method: "DELETE"
    });
    if (res.ok) {
      await refreshData();
      return true;
    }
    return false;
  };

  // Config
  const updateConfiguracion = async (configData: Partial<Configuracion>) => {
    const res = await fetch("/api/configuracion", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        config: configData,
        usuario_id: user?.id,
        usuario_nombre: user ? `${user.nombre} ${user.apellido}` : "u-anon"
      })
    });
    const updated = await res.json();
    await refreshData();
    return updated;
  };

  const markNotificationsAsRead = async () => {
    const res = await fetch("/api/notificaciones/marcar-leidas", {
      method: "POST"
    });
    if (res.ok) {
      setNotificaciones(prev => prev.map(n => ({ ...n, leida: true })));
    }
  };

  return (
    <AppContext.Provider
      value={{
        user,
        token,
        loading,
        socios,
        planes,
        pagos,
        asistencias,
        entrenadores,
        rutinas,
        notificaciones,
        auditoria,
        configuracion,
        theme,
        login,
        logout,
        impersonateRole,
        refreshData,
        addSocio,
        updateSocio,
        deleteSocio,
        addPlan,
        updatePlan,
        deletePlan,
        addPago,
        deletePago,
        registerAsistencia,
        addEntrenador,
        updateEntrenador,
        deleteEntrenador,
        addRutina,
        updateRutina,
        deleteRutina,
        updateConfiguracion,
        toggleTheme,
        markNotificationsAsRead
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
};
