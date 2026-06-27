import React, { createContext, useContext, useState, useEffect } from "react";
import { Socio, Plan, Pago, Asistencia, Entrenador, Rutina, Notificacion, Auditoria, Configuracion, Usuario, RolUsuario } from "../types";
import defaultDb from "../db.json";

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

// Local DB Helpers
const getDb = (): any => {
  const stored = localStorage.getItem("gym_db");
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      console.error("Error parsing gym_db from localStorage, resetting to default", e);
    }
  }
  const cloned = JSON.parse(JSON.stringify(defaultDb));
  localStorage.setItem("gym_db", JSON.stringify(cloned));
  return cloned;
};

const saveDb = (db: any) => {
  localStorage.setItem("gym_db", JSON.stringify(db));
};

const logAuditClient = (usuarioId: string, usuarioNombre: string, accion: string, tablaAfectada: string, db: any) => {
  const newLog = {
    id: "aud-" + Date.now() + "-" + Math.floor(Math.random() * 1000),
    usuario_id: usuarioId,
    usuario_nombre: usuarioNombre,
    accion,
    tabla_afectada: tablaAfectada,
    fecha: new Date().toISOString()
  };
  if (!Array.isArray(db.auditoria)) db.auditoria = [];
  db.auditoria.unshift(newLog);
  if (db.auditoria.length > 200) {
    db.auditoria = db.auditoria.slice(0, 200);
  }
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<Usuario | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [theme, setTheme] = useState<"light" | "dark">("light");

  // Gym Entities State
  const [socios, setSocios] = useState<Socio[]>([]);
  const [planes, setPlanes] = useState<Plan[]>([]);
  const [pagos, setPagos] = useState<Pago[]>([]);
  const [asistencias, setAsistencias] = useState<Asistencia[]>([]);
  const [entrenadores, setEntrenadores] = useState<Entrenador[]>([]);
  const [rutinas, setRutinas] = useState<Rutina[]>([]);
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [auditoria, setAuditoria] = useState<Auditoria[]>([]);
  const [configuracion, setConfiguracion] = useState<Configuracion | null>(null);

  // Restore session and load DB on mount
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
      const db = getDb();
      
      const now = new Date();
      let dbChanged = false;

      if (!Array.isArray(db.socios)) db.socios = [];
      if (!Array.isArray(db.pagos)) db.pagos = [];
      if (!Array.isArray(db.notificaciones)) db.notificaciones = [];
      if (!Array.isArray(db.auditoria)) db.auditoria = [];

      // Check member expirations dynamically
      for (const socio of db.socios) {
        if (!socio || !socio.id) continue;

        // Find latest approved payment for this member
        const lastPago = db.pagos
          .filter((p: any) => p && p.socio_id === socio.id && p.estado === "aprobado")
          .sort((a: any, b: any) => {
            const timeA = a.fecha_pago ? new Date(a.fecha_pago).getTime() : 0;
            const timeB = b.fecha_pago ? new Date(b.fecha_pago).getTime() : 0;
            return timeB - timeA;
          })[0];

        if (lastPago && lastPago.fecha_vencimiento) {
          const expirationDate = new Date(lastPago.fecha_vencimiento);
          const diffTime = expirationDate.getTime() - now.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          if (diffTime < 0) {
            // Expired
            if (socio.estado === "activo") {
              socio.estado = "vencido";
              dbChanged = true;
              db.auditoria.unshift({
                id: "aud-" + Date.now() + "-" + Math.random().toString(36).substring(2, 5),
                usuario_id: "u-sys",
                usuario_nombre: "Sistema Automatizado",
                accion: `Socio ${socio.nombre || ""} ${socio.apellido || ""} cambió a estado VENCIDO por expiración de membresía`,
                tabla_afectada: "socios",
                fecha: now.toISOString()
              });
            }

            const hasRecentExpiryNotif = db.notificaciones.some(
              (n: any) => n && n.socio_id === socio.id && n.titulo === "Membresía Vencida" && n.fecha && (now.getTime() - new Date(n.fecha).getTime() < 1000 * 60 * 60 * 24 * 30)
            );

            if (!hasRecentExpiryNotif) {
              const template = db.configuracion && db.configuracion.plantilla_vencimiento;
              const expiredMessage = template
                ? template
                    .replace("{nombre}", socio.nombre || "")
                    .replace("{plan}", lastPago.plan_nombre || "")
                    .replace("{vencimiento}", expirationDate.toLocaleDateString("es-AR"))
                : `El plan ${lastPago.plan_nombre || ""} de ${socio.nombre || ""} ${socio.apellido || ""} ha vencido el ${expirationDate.toLocaleDateString("es-AR")}.`;

              db.notificaciones.unshift({
                id: "not-exp-" + Date.now() + "-" + Math.random().toString(36).substring(2, 5),
                socio_id: socio.id,
                socio_nombre: `${socio.nombre || ""} ${socio.apellido || ""}`,
                titulo: "Membresía Vencida",
                mensaje: expiredMessage,
                leida: false,
                tipo: "email",
                fecha: now.toISOString()
              });
              dbChanged = true;
            }
          } else if (diffDays <= 3 && diffDays >= 0) {
            // Expiring soon warning (within 3 days)
            const hasRecentWarningNotif = db.notificaciones.some(
              (n: any) => n && n.socio_id === socio.id && n.titulo === "Membresía por Vencer" && n.fecha && (now.getTime() - new Date(n.fecha).getTime() < 1000 * 60 * 60 * 24 * 7)
            );

            if (!hasRecentWarningNotif) {
              const warningMessage = `El plan ${lastPago.plan_nombre || ""} de ${socio.nombre || ""} ${socio.apellido || ""} vencerá ${diffDays === 0 ? "hoy" : diffDays === 1 ? "en 1 día" : "en " + diffDays + " días"} (${expirationDate.toLocaleDateString("es-AR")}).`;
              
              db.notificaciones.unshift({
                id: "not-warn-" + Date.now() + "-" + Math.random().toString(36).substring(2, 5),
                socio_id: socio.id,
                socio_nombre: `${socio.nombre || ""} ${socio.apellido || ""}`,
                titulo: "Membresía por Vencer",
                mensaje: warningMessage,
                leida: false,
                tipo: "email",
                fecha: now.toISOString()
              });
              dbChanged = true;
            }
          }
        }
      }

      if (dbChanged) {
        saveDb(db);
      }

      // Sync and render state
      setSocios(db.socios || []);
      setPlanes(db.planes || []);
      setPagos(db.pagos || []);
      setAsistencias(db.asistencias || []);
      setEntrenadores(db.entrenadores || []);
      setRutinas(db.rutinas || []);
      setNotificaciones(db.notificaciones || []);
      setAuditoria(db.auditoria || []);
      setConfiguracion(db.configuracion || null);
    } catch (error) {
      console.error("Failed to load local database state:", error);
    }
  };

  const login = async (correo: string, password: string): Promise<boolean> => {
    try {
      const db = getDb();
      if (!Array.isArray(db.usuarios)) db.usuarios = [];
      
      const matchedUser = db.usuarios.find((u: any) => u.correo.toLowerCase() === correo?.toLowerCase());
      
      if (matchedUser) {
        const prefix = correo.split("@")[0];
        const expectedPass = prefix + "123";
        if (password === expectedPass || password === "admin") {
          logAuditClient(matchedUser.id, matchedUser.nombre + " " + matchedUser.apellido, "Inicio de sesión", "usuarios", db);
          setUser(matchedUser);
          setToken("mock-jwt-token-" + matchedUser.id);
          localStorage.setItem("gym_user", JSON.stringify(matchedUser));
          localStorage.setItem("gym_token", "mock-jwt-token-" + matchedUser.id);
          saveDb(db);
          await refreshData();
          return true;
        }
      }
      throw new Error("Credenciales inválidas. Intente con: admin@gympro.com / admin123, recep@gympro.com / recep123, gerente@gympro.com / gerente123");
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
    
    const db = getDb();
    logAuditClient(updatedUser.id, updatedUser.nombre + " " + updatedUser.apellido, `Cambió su rol a ${rol} (Impersonación Demo)`, "usuarios", db);
    saveDb(db);
    refreshData();
  };

  const toggleTheme = () => {
    const nextTheme = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);
    localStorage.setItem("gym_theme", nextTheme);
  };

  // --- LOCAL PERSISTED ENTITIES ACTIONS ---

  // Socios
  const addSocio = async (socioData: Omit<Socio, "id" | "qr" | "fecha_registro">) => {
    const db = getDb();
    if (!Array.isArray(db.socios)) db.socios = [];
    if (!Array.isArray(db.notificaciones)) db.notificaciones = [];
    
    const nuevoSocio: Socio = {
      ...socioData,
      id: "s-" + Date.now(),
      qr: "socio-s-" + Date.now(),
      fecha_registro: new Date().toISOString()
    };
    db.socios.unshift(nuevoSocio);

    db.notificaciones.unshift({
      id: "not-" + Date.now(),
      socio_id: nuevoSocio.id,
      socio_nombre: `${nuevoSocio.nombre} ${nuevoSocio.apellido}`,
      titulo: "Nuevo Socio Registrado",
      dangerouslySetHtml: undefined,
      mensaje: `El socio ${nuevoSocio.nombre} ${nuevoSocio.apellido} se ha registrado exitosamente. Estado actual: ${nuevoSocio.estado.toUpperCase()}.`,
      leida: false,
      tipo: "sistema",
      fecha: new Date().toISOString()
    });

    logAuditClient(user?.id || "u-anon", user ? `${user.nombre} ${user.apellido}` : "Usuario Anónimo", `Registró nuevo socio: ${nuevoSocio.nombre} ${nuevoSocio.apellido}`, "socios", db);
    saveDb(db);
    await refreshData();
    return nuevoSocio;
  };

  const updateSocio = async (id: string, updates: Partial<Socio>) => {
    const db = getDb();
    if (!Array.isArray(db.socios)) db.socios = [];
    
    const index = db.socios.findIndex((s: any) => s.id === id);
    if (index === -1) throw new Error("Socio no encontrado");
    
    const original = db.socios[index];
    const updatedSocio = {
      ...original,
      ...updates
    };
    delete (updatedSocio as any).id;
    updatedSocio.id = id;

    db.socios[index] = updatedSocio;

    logAuditClient(user?.id || "u-anon", user ? `${user.nombre} ${user.apellido}` : "Usuario Anónimo", `Modificó socio: ${updatedSocio.nombre} ${updatedSocio.apellido}`, "socios", db);
    saveDb(db);
    await refreshData();
    return updatedSocio;
  };

  const deleteSocio = async (id: string) => {
    const db = getDb();
    if (!Array.isArray(db.socios)) db.socios = [];
    
    const index = db.socios.findIndex((s: any) => s.id === id);
    if (index === -1) return false;
    const socio = db.socios[index];
    db.socios.splice(index, 1);

    logAuditClient(user?.id || "u-anon", user ? `${user.nombre} ${user.apellido}` : "Usuario Anónimo", `Eliminó socio ID: ${id} (${socio.nombre} ${socio.apellido})`, "socios", db);
    saveDb(db);
    await refreshData();
    return true;
  };

  // Planes
  const addPlan = async (planData: Omit<Plan, "id">) => {
    const db = getDb();
    if (!Array.isArray(db.planes)) db.planes = [];
    
    const nuevoPlan: Plan = {
      ...planData,
      id: "p-" + Date.now()
    };
    db.planes.push(nuevoPlan);

    logAuditClient(user?.id || "u-anon", user ? `${user.nombre} ${user.apellido}` : "Usuario Anónimo", `Creó nuevo plan: ${nuevoPlan.nombre}`, "planes", db);
    saveDb(db);
    await refreshData();
    return nuevoPlan;
  };

  const updatePlan = async (id: string, updates: Partial<Plan>) => {
    const db = getDb();
    if (!Array.isArray(db.planes)) db.planes = [];
    
    const index = db.planes.findIndex((p: any) => p.id === id);
    if (index === -1) throw new Error("Plan no encontrado");

    const original = db.planes[index];
    const updatedPlan = {
      ...original,
      ...updates
    };
    delete (updatedPlan as any).id;
    updatedPlan.id = id;

    db.planes[index] = updatedPlan;

    logAuditClient(user?.id || "u-anon", user ? `${user.nombre} ${user.apellido}` : "Usuario Anónimo", `Actualizó plan: ${updatedPlan.nombre}`, "planes", db);
    saveDb(db);
    await refreshData();
    return updatedPlan;
  };

  const deletePlan = async (id: string) => {
    const db = getDb();
    if (!Array.isArray(db.planes)) db.planes = [];
    
    const index = db.planes.findIndex((p: any) => p.id === id);
    if (index === -1) return false;
    const plan = db.planes[index];
    db.planes.splice(index, 1);

    logAuditClient(user?.id || "u-anon", user ? `${user.nombre} ${user.apellido}` : "Usuario Anónimo", `Eliminó plan: ${plan.nombre}`, "planes", db);
    saveDb(db);
    await refreshData();
    return true;
  };

  // Pagos
  const addPago = async (socio_id: string, plan_id: string, metodo_pago: string) => {
    const db = getDb();
    if (!Array.isArray(db.socios)) db.socios = [];
    if (!Array.isArray(db.planes)) db.planes = [];
    if (!Array.isArray(db.pagos)) db.pagos = [];
    if (!Array.isArray(db.notificaciones)) db.notificaciones = [];

    const socio = db.socios.find((s: any) => s.id === socio_id);
    const plan = db.planes.find((p: any) => p.id === plan_id);

    if (!socio || !plan) {
      throw new Error("Socio o Plan no encontrado");
    }

    const now = new Date();
    const expirationDate = new Date();
    expirationDate.setDate(now.getDate() + plan.duracion_dias);

    const receiptNum = "REC-2026-" + String(db.pagos.length + 1).padStart(4, "0");

    const nuevoPago: Pago = {
      id: "pay-" + Date.now(),
      socio_id,
      socio_nombre: `${socio.nombre} ${socio.apellido}`,
      plan_id,
      plan_nombre: plan.nombre,
      monto: plan.precio,
      metodo_pago: metodo_pago as any,
      fecha_pago: now.toISOString(),
      fecha_vencimiento: expirationDate.toISOString(),
      estado: "aprobado",
      comprobante_numero: receiptNum
    };

    // Update socio status and active plan
    socio.estado = "activo";
    socio.plan_id = plan_id;

    db.pagos.unshift(nuevoPago);

    const template = db.configuracion && db.configuracion.plantilla_bienvenida;
    const welcomeMessage = template
      ? template
          .replace("{nombre}", socio.nombre)
          .replace("{plan}", plan.nombre)
          .replace("{vencimiento}", expirationDate.toLocaleDateString("es-AR"))
      : `¡Hola ${socio.nombre}! Bienvenido. Tu plan ${plan.nombre} está activo hasta el ${expirationDate.toLocaleDateString("es-AR")}.`;

    db.notificaciones.unshift({
      id: "not-" + Date.now(),
      socio_id: socio.id,
      socio_nombre: `${socio.nombre} ${socio.apellido}`,
      titulo: "Pago Registrado & Membresía Activada",
      mensaje: welcomeMessage,
      leida: false,
      tipo: metodo_pago === "Mercado Pago" ? "sistema" : "email",
      fecha: now.toISOString()
    });

    logAuditClient(user?.id || "u-anon", user ? `${user.nombre} ${user.apellido}` : "Usuario Anónimo", `Registró pago de ${socio.nombre} ${socio.apellido} por $${plan.precio} (${plan.nombre})`, "pagos", db);
    saveDb(db);
    await refreshData();
    return nuevoPago;
  };

  const deletePago = async (id: string) => {
    const db = getDb();
    if (!Array.isArray(db.pagos)) db.pagos = [];
    if (!Array.isArray(db.notificaciones)) db.notificaciones = [];
    
    const index = db.pagos.findIndex((p: any) => p.id === id);
    if (index === -1) return false;

    const pago = db.pagos[index];
    db.pagos.splice(index, 1);

    db.notificaciones.unshift({
      id: "not-" + Date.now(),
      socio_id: pago.socio_id,
      socio_nombre: pago.socio_nombre,
      titulo: "Pago de Cuota Anulado",
      mensaje: `Se ha anulado el pago por $${pago.monto} (${pago.plan_nombre}) del socio ${pago.socio_nombre} (Comprobante: ${pago.comprobante_numero}).`,
      leida: false,
      tipo: "sistema",
      fecha: new Date().toISOString()
    });

    logAuditClient(user?.id || "u-anon", user ? `${user.nombre} ${user.apellido}` : "Usuario Anónimo", `Anuló recibo de pago: ${pago.comprobante_numero} de ${pago.socio_nombre}`, "pagos", db);
    saveDb(db);
    await refreshData();
    return true;
  };

  // Asistencias (Check-in Scanner)
  const registerAsistencia = async (qr_or_id: string, manual_id?: string) => {
    const db = getDb();
    if (!Array.isArray(db.socios)) db.socios = [];
    if (!Array.isArray(db.notificaciones)) db.notificaciones = [];
    if (!Array.isArray(db.asistencias)) db.asistencias = [];

    let socio: any = null;

    if (manual_id) {
      socio = db.socios.find((s: any) => s.id === manual_id);
    } else if (qr_or_id) {
      socio = db.socios.find((s: any) => s.id === qr_or_id || s.qr === qr_or_id || s.dni === qr_or_id);
    }

    if (!socio) {
      return { success: false, mensaje: "Socio no registrado en la base de datos." };
    }

    // Access Denied Check
    if (socio.estado === "vencido" || socio.estado === "deudor") {
      db.notificaciones.unshift({
        id: "not-denied-" + Date.now(),
        socio_id: socio.id,
        socio_nombre: `${socio.nombre} ${socio.apellido}`,
        titulo: "Acceso Denegado en Molinete",
        mensaje: `El socio ${socio.nombre} ${socio.apellido} (DNI: ${socio.dni}) intentó ingresar, pero su membresía está ${socio.estado.toUpperCase()}.`,
        leida: false,
        tipo: "sistema",
        fecha: new Date().toISOString()
      });
      saveDb(db);
      await refreshData();
      return { success: false, mensaje: `Acceso DENEGADO. El socio está ${socio.estado.toUpperCase()}. Por favor, regularizar su cuota en recepción.`, socio };
    }

    const now = new Date();
    const fechaStr = now.toISOString().split("T")[0];
    const horaStr = now.toTimeString().split(" ")[0];

    // Duplication Check (Last 2 hours)
    const recentAsist = db.asistencias.find(
      (a: any) => a.socio_id === socio.id && a.fecha === fechaStr
    );

    if (recentAsist) {
      const [h, m, s] = recentAsist.hora.split(":").map(Number);
      const existingTime = new Date();
      existingTime.setHours(h, m, s);
      const differenceMs = now.getTime() - existingTime.getTime();
      const differenceMinutes = Math.floor(differenceMs / 1000 / 60);

      if (differenceMinutes < 120) {
        return {
          success: false,
          mensaje: `Asistencia ya registrada recientemente hace ${differenceMinutes} minutos.`,
          socio
        };
      }
    }

    const nuevaAsistencia: Asistencia = {
      id: "ast-" + Date.now(),
      socio_id: socio.id,
      socio_nombre: `${socio.nombre} ${socio.apellido}`,
      fecha: fechaStr,
      hora: horaStr
    };

    db.asistencias.unshift(nuevaAsistencia);

    db.notificaciones.unshift({
      id: "not-ok-" + Date.now(),
      socio_id: socio.id,
      socio_nombre: `${socio.nombre} ${socio.apellido}`,
      titulo: "Ingreso de Socio",
      mensaje: `El socio ${socio.nombre} ${socio.apellido} ha registrado su ingreso correctamente a las ${horaStr}.`,
      leida: false,
      tipo: "sistema",
      fecha: now.toISOString()
    });

    logAuditClient(user?.id || "u-scan", user ? `${user.nombre} ${user.apellido}` : "Escáner Molinete", `Ingreso registrado: ${socio.nombre} ${socio.apellido}`, "asistencias", db);
    saveDb(db);
    await refreshData();

    return {
      success: true,
      mensaje: `¡Acceso AUTORIZADO! Bienvenido/a, ${socio.nombre}.`,
      socio,
      asistencia: nuevaAsistencia
    };
  };

  // Entrenadores
  const addEntrenador = async (entrenadorData: Omit<Entrenador, "id">) => {
    const db = getDb();
    if (!Array.isArray(db.entrenadores)) db.entrenadores = [];
    
    const nuevoEnt: Entrenador = {
      ...entrenadorData,
      id: "e-" + Date.now()
    };
    db.entrenadores.push(nuevoEnt);

    logAuditClient(user?.id || "u-anon", user ? `${user.nombre} ${user.apellido}` : "Usuario Anónimo", `Agregó entrenador: ${nuevoEnt.nombre} ${nuevoEnt.apellido}`, "entrenadores", db);
    saveDb(db);
    await refreshData();
    return nuevoEnt;
  };

  const updateEntrenador = async (id: string, updates: Partial<Entrenador>) => {
    const db = getDb();
    if (!Array.isArray(db.entrenadores)) db.entrenadores = [];
    
    const index = db.entrenadores.findIndex((e: any) => e.id === id);
    if (index === -1) throw new Error("Entrenador no encontrado");

    const original = db.entrenadores[index];
    const updated = {
      ...original,
      ...updates
    };
    delete (updated as any).id;
    updated.id = id;

    db.entrenadores[index] = updated;

    logAuditClient(user?.id || "u-anon", user ? `${user.nombre} ${user.apellido}` : "Usuario Anónimo", `Modificó entrenador: ${updated.nombre} ${updated.apellido}`, "entrenadores", db);
    saveDb(db);
    await refreshData();
    return updated;
  };

  const deleteEntrenador = async (id: string) => {
    const db = getDb();
    if (!Array.isArray(db.entrenadores)) db.entrenadores = [];
    
    const index = db.entrenadores.findIndex((e: any) => e.id === id);
    if (index === -1) return false;

    const ent = db.entrenadores[index];
    db.entrenadores.splice(index, 1);

    logAuditClient(user?.id || "u-anon", user ? `${user.nombre} ${user.apellido}` : "Usuario Anónimo", `Eliminó entrenador: ${ent.nombre} ${ent.apellido}`, "entrenadores", db);
    saveDb(db);
    await refreshData();
    return true;
  };

  // Rutinas
  const addRutina = async (rutinaData: Omit<Rutina, "id" | "socio_nombre" | "entrenador_nombre" | "fecha_creacion">) => {
    const db = getDb();
    if (!Array.isArray(db.socios)) db.socios = [];
    if (!Array.isArray(db.entrenadores)) db.entrenadores = [];
    if (!Array.isArray(db.rutinas)) db.rutinas = [];
    if (!Array.isArray(db.notificaciones)) db.notificaciones = [];

    const socio = db.socios.find((s: any) => s.id === rutinaData.socio_id);
    const entrenador = db.entrenadores.find((e: any) => e.id === rutinaData.entrenador_id);

    const nuevaRutina: Rutina = {
      ...rutinaData,
      id: "r-" + Date.now(),
      socio_nombre: socio ? `${socio.nombre} ${socio.apellido}` : "Socio Desconocido",
      entrenador_nombre: entrenador ? `${entrenador.nombre} ${entrenador.apellido}` : "Sin Asignar",
      fecha_creacion: new Date().toISOString()
    };

    db.rutinas.unshift(nuevaRutina);

    db.notificaciones.unshift({
      id: "not-rutina-" + Date.now(),
      socio_id: rutinaData.socio_id,
      socio_nombre: socio ? `${socio.nombre} ${socio.apellido}` : "Socio Desconocido",
      titulo: "Nueva Rutina de Entrenamiento",
      mensaje: `Se le ha asignado la rutina '${rutinaData.nombre}' al socio ${socio ? `${socio.nombre} ${socio.apellido}` : "Socio Desconocido"}.${entrenador ? ` Coach: ${entrenador.nombre} ${entrenador.apellido}.` : ""}`,
      leida: false,
      tipo: "sistema",
      fecha: new Date().toISOString()
    });

    logAuditClient(user?.id || "u-anon", user ? `${user.nombre} ${user.apellido}` : "Usuario Anónimo", `Asignó rutina '${rutinaData.nombre}' al socio ${nuevaRutina.socio_nombre}`, "rutinas", db);
    saveDb(db);
    await refreshData();
    return nuevaRutina;
  };

  const updateRutina = async (id: string, updates: Partial<Rutina>) => {
    const db = getDb();
    if (!Array.isArray(db.rutinas)) db.rutinas = [];

    const index = db.rutinas.findIndex((r: any) => r.id === id);
    if (index === -1) throw new Error("Rutina no encontrada");

    const original = db.rutinas[index];
    const updated = {
      ...original,
      ...updates
    };
    delete (updated as any).id;
    updated.id = id;

    db.rutinas[index] = updated;

    logAuditClient(user?.id || "u-anon", user ? `${user.nombre} ${user.apellido}` : "Usuario Anónimo", `Actualizó rutina: ${updated.nombre}`, "rutinas", db);
    saveDb(db);
    await refreshData();
    return updated;
  };

  const deleteRutina = async (id: string) => {
    const db = getDb();
    if (!Array.isArray(db.rutinas)) db.rutinas = [];

    const index = db.rutinas.findIndex((r: any) => r.id === id);
    if (index === -1) return false;

    const rut = db.rutinas[index];
    db.rutinas.splice(index, 1);

    logAuditClient(user?.id || "u-anon", user ? `${user.nombre} ${user.apellido}` : "Usuario Anónimo", `Eliminó rutina: ${rut.nombre}`, "rutinas", db);
    saveDb(db);
    await refreshData();
    return true;
  };

  // Configuración
  const updateConfiguracion = async (configData: Partial<Configuracion>) => {
    const db = getDb();
    db.configuracion = {
      ...(db.configuracion || {}),
      ...configData
    };

    logAuditClient(user?.id || "u-anon", user ? `${user.nombre} ${user.apellido}` : "Usuario Anónimo", `Actualizó configuración general`, "configuracion", db);
    saveDb(db);
    await refreshData();
    return db.configuracion;
  };

  // Mark all notifications as read
  const markNotificationsAsRead = async () => {
    const db = getDb();
    if (!Array.isArray(db.notificaciones)) db.notificaciones = [];
    
    db.notificaciones.forEach((n: any) => {
      n.leida = true;
    });

    saveDb(db);
    setNotificaciones(prev => prev.map(n => ({ ...n, leida: true })));
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
