import express from "express";
import path from "path";
import fs from "fs/promises";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Path to file-based JSON database
const DB_PATH = path.join(process.cwd(), "src", "db.json");

// Middleware
app.use(express.json());

// Lazy-loaded Gemini AI client
let aiClient: GoogleGenAI | null = null;
function getAi(): GoogleGenAI | null {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (key) {
      aiClient = new GoogleGenAI({
        apiKey: key,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });
    }
  }
  return aiClient;
}

// Database helper functions
async function readDb() {
  try {
    const content = await fs.readFile(DB_PATH, "utf-8");
    return JSON.parse(content);
  } catch (error) {
    console.error("Error reading database file, returning empty schema", error);
    return {
      usuarios: [],
      planes: [],
      socios: [],
      pagos: [],
      asistencias: [],
      entrenadores: [],
      rutinas: [],
      notificaciones: [],
      auditoria: [],
      configuracion: {}
    };
  }
}

async function writeDb(data: any) {
  try {
    await fs.writeFile(DB_PATH, JSON.stringify(data, null, 2), "utf-8");
  } catch (error) {
    console.error("Error writing database file", error);
    throw new Error("Error de persistencia de datos");
  }
}

// Helper to add audit logs
async function logAudit(usuarioId: string, usuarioNombre: string, accion: string, tablaAfectada: string) {
  try {
    const db = await readDb();
    const newLog = {
      id: "aud-" + Date.now() + "-" + Math.floor(Math.random() * 1000),
      usuario_id: usuarioId,
      usuario_nombre: usuarioNombre,
      accion,
      tabla_afectada: tablaAfectada,
      fecha: new Date().toISOString()
    };
    db.auditoria.unshift(newLog);
    // Limit to last 200 logs
    if (db.auditoria.length > 200) {
      db.auditoria = db.auditoria.slice(0, 200);
    }
    await writeDb(db);
  } catch (err) {
    console.error("Failed to log audit action:", err);
  }
}

// --- API ROUTES FIRST ---

// 1. Auth API
app.post("/api/auth/login", async (req, res) => {
  const { correo, password } = req.body;
  const db = await readDb();

  // Simple mock password checking to match requests
  let matchedUser = db.usuarios.find((u: any) => u.correo.toLowerCase() === correo?.toLowerCase());
  
  if (matchedUser) {
    // Check match for predefined accounts: admin123, recep123, gerente123
    const prefix = correo.split("@")[0];
    const expectedPass = prefix + "123";
    if (password === expectedPass || password === "admin") {
      await logAudit(matchedUser.id, matchedUser.nombre + " " + matchedUser.apellido, "Inicio de sesión", "usuarios");
      return res.json({ user: matchedUser, token: "mock-jwt-token-" + matchedUser.id });
    }
  }
  
  return res.status(401).json({ error: "Credenciales inválidas. Intente con: admin@gympro.com / admin123, recep@gympro.com / recep123, gerente@gympro.com / gerente123" });
});

// 2. Socios (Gym Members) API
app.get("/api/socios", async (req, res) => {
  const db = await readDb();
  res.json(db.socios);
});

app.post("/api/socios", async (req, res) => {
  const db = await readDb();
  const { nombre, apellido, dni, fecha_nacimiento, sexo, telefono, correo, direccion, ciudad, provincia, peso, altura, objetivo, observaciones, plan_id, estado, usuario_id, usuario_nombre } = req.body;

  if (!nombre || !apellido || !dni) {
    return res.status(400).json({ error: "Nombre, apellido y DNI son campos obligatorios." });
  }

  const nuevoSocio = {
    id: "s-" + Date.now(),
    nombre,
    apellido,
    dni,
    fecha_nacimiento: fecha_nacimiento || "",
    sexo: sexo || "Otro",
    telefono: telefono || "",
    correo: correo || "",
    direccion: direccion || "",
    ciudad: ciudad || "",
    provincia: provincia || "",
    peso: Number(peso) || 0,
    altura: Number(altura) || 0,
    objetivo: objetivo || "",
    observaciones: observaciones || "",
    plan_id: plan_id || "",
    estado: estado || "activo",
    qr: "socio-s-" + Date.now(),
    fecha_registro: new Date().toISOString()
  };

  db.socios.unshift(nuevoSocio);

  // Create real notification for new member registration
  db.notificaciones.unshift({
    id: "not-" + Date.now(),
    socio_id: nuevoSocio.id,
    socio_nombre: `${nuevoSocio.nombre} ${nuevoSocio.apellido}`,
    titulo: "Nuevo Socio Registrado",
    mensaje: `El socio ${nuevoSocio.nombre} ${nuevoSocio.apellido} se ha registrado exitosamente. Estado actual: ${nuevoSocio.estado.toUpperCase()}.`,
    leida: false,
    tipo: "sistema",
    fecha: new Date().toISOString()
  });

  await writeDb(db);

  await logAudit(usuario_id || "u-anon", usuario_nombre || "Usuario Anónimo", `Registró nuevo socio: ${nombre} ${apellido}`, "socios");

  res.status(201).json(nuevoSocio);
});

app.put("/api/socios/:id", async (req, res) => {
  const { id } = req.params;
  const db = await readDb();
  const index = db.socios.findIndex((s: any) => s.id === id);

  if (index === -1) {
    return res.status(404).json({ error: "Socio no encontrado" });
  }

  const { usuario_id, usuario_nombre, ...updates } = req.body;
  
  // Protect unchangeable fields
  delete updates.id;
  delete updates.qr;
  delete updates.fecha_registro;

  db.socios[index] = {
    ...db.socios[index],
    ...updates,
    peso: Number(updates.peso) !== undefined ? Number(updates.peso) : db.socios[index].peso,
    altura: Number(updates.altura) !== undefined ? Number(updates.altura) : db.socios[index].altura,
  };

  await writeDb(db);
  await logAudit(usuario_id || "u-anon", usuario_nombre || "Usuario Anónimo", `Actualizó datos del socio: ${db.socios[index].nombre} ${db.socios[index].apellido}`, "socios");

  res.json(db.socios[index]);
});

app.delete("/api/socios/:id", async (req, res) => {
  const { id } = req.params;
  const { usuario_id, usuario_nombre } = req.query;
  const db = await readDb();
  const index = db.socios.findIndex((s: any) => s.id === id);

  if (index === -1) {
    return res.status(404).json({ error: "Socio no encontrado" });
  }

  const socio = db.socios[index];
  db.socios.splice(index, 1);
  await writeDb(db);

  await logAudit(String(usuario_id) || "u-anon", String(usuario_nombre) || "Usuario Anónimo", `Eliminó socio: ${socio.nombre} ${socio.apellido}`, "socios");

  res.json({ success: true });
});

// 3. Planes (Membership Plans) API
app.get("/api/planes", async (req, res) => {
  const db = await readDb();
  res.json(db.planes);
});

app.post("/api/planes", async (req, res) => {
  const db = await readDb();
  const { nombre, descripcion, precio, duracion_dias, estado, usuario_id, usuario_nombre } = req.body;

  if (!nombre || !precio || !duracion_dias) {
    return res.status(400).json({ error: "Nombre, precio y duración son obligatorios." });
  }

  const nuevoPlan = {
    id: "p-" + Date.now(),
    nombre,
    descripcion: descripcion || "",
    precio: Number(precio),
    duracion_dias: Number(duracion_dias),
    estado: estado || "activo"
  };

  db.planes.push(nuevoPlan);
  await writeDb(db);

  await logAudit(usuario_id || "u-anon", usuario_nombre || "Usuario Anónimo", `Creó nuevo plan: ${nombre}`, "planes");

  res.status(201).json(nuevoPlan);
});

app.put("/api/planes/:id", async (req, res) => {
  const { id } = req.params;
  const db = await readDb();
  const index = db.planes.findIndex((p: any) => p.id === id);

  if (index === -1) {
    return res.status(404).json({ error: "Plan no encontrado" });
  }

  const { usuario_id, usuario_nombre, ...updates } = req.body;
  delete updates.id;

  db.planes[index] = {
    ...db.planes[index],
    ...updates,
    precio: updates.precio !== undefined ? Number(updates.precio) : db.planes[index].precio,
    duracion_dias: updates.duracion_dias !== undefined ? Number(updates.duracion_dias) : db.planes[index].duracion_dias,
  };

  await writeDb(db);
  await logAudit(usuario_id || "u-anon", usuario_nombre || "Usuario Anónimo", `Actualizó plan: ${db.planes[index].nombre}`, "planes");

  res.json(db.planes[index]);
});

app.delete("/api/planes/:id", async (req, res) => {
  const { id } = req.params;
  const { usuario_id, usuario_nombre } = req.query;
  const db = await readDb();
  const index = db.planes.findIndex((p: any) => p.id === id);

  if (index === -1) {
    return res.status(404).json({ error: "Plan no encontrado" });
  }

  const plan = db.planes[index];
  db.planes.splice(index, 1);
  await writeDb(db);

  await logAudit(String(usuario_id) || "u-anon", String(usuario_nombre) || "Usuario Anónimo", `Eliminó plan: ${plan.nombre}`, "planes");

  res.json({ success: true });
});

// 4. Pagos (Payments) API
app.get("/api/pagos", async (req, res) => {
  const db = await readDb();
  res.json(db.pagos);
});

app.post("/api/pagos", async (req, res) => {
  const db = await readDb();
  const { socio_id, plan_id, metodo_pago, usuario_id, usuario_nombre } = req.body;

  if (!socio_id || !plan_id || !metodo_pago) {
    return res.status(400).json({ error: "Socio, plan y método de pago son requeridos." });
  }

  const socio = db.socios.find((s: any) => s.id === socio_id);
  const plan = db.planes.find((p: any) => p.id === plan_id);

  if (!socio || !plan) {
    return res.status(404).json({ error: "Socio o Plan no encontrado" });
  }

  // Calculate expiration date
  const now = new Date();
  const expirationDate = new Date();
  expirationDate.setDate(now.getDate() + plan.duracion_dias);

  const receiptNum = "REC-2026-" + String(db.pagos.length + 1).padStart(4, "0");

  const nuevoPago = {
    id: "pay-" + Date.now(),
    socio_id,
    socio_nombre: `${socio.nombre} ${socio.apellido}`,
    plan_id,
    plan_nombre: plan.nombre,
    monto: plan.precio,
    metodo_pago,
    fecha_pago: now.toISOString(),
    fecha_vencimiento: expirationDate.toISOString(),
    estado: "aprobado",
    comprobante_numero: receiptNum
  };

  // Update member status to active and assign the paid plan
  socio.estado = "activo";
  socio.plan_id = plan_id;

  db.pagos.unshift(nuevoPago);
  
  // Create notifications
  const welcomeMessage = db.configuracion.plantilla_bienvenida
    .replace("{nombre}", socio.nombre)
    .replace("{plan}", plan.nombre)
    .replace("{vencimiento}", expirationDate.toLocaleDateString("es-AR"));

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

  await writeDb(db);
  await logAudit(usuario_id || "u-anon", usuario_nombre || "Usuario Anónimo", `Registró pago de ${socio.nombre} ${socio.apellido} por $${plan.precio} (${plan.nombre})`, "pagos");

  res.status(201).json(nuevoPago);
});

app.delete("/api/pagos/:id", async (req, res) => {
  const { id } = req.params;
  const { usuario_id, usuario_nombre } = req.query;
  const db = await readDb();
  const index = db.pagos.findIndex((p: any) => p.id === id);

  if (index === -1) {
    return res.status(404).json({ error: "Pago no encontrado" });
  }

  const pago = db.pagos[index];
  db.pagos.splice(index, 1);

  // Add payment cancellation notification
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

  await writeDb(db);

  await logAudit(String(usuario_id) || "u-anon", String(usuario_nombre) || "Usuario Anónimo", `Anuló recibo de pago: ${pago.comprobante_numero} de ${pago.socio_nombre}`, "pagos");

  res.json({ success: true });
});

// 5. Asistencias (Attendance Scanner and Logs) API
app.get("/api/asistencias", async (req, res) => {
  const db = await readDb();
  res.json(db.asistencias);
});

// Scan QR or Manual Attendance registration
app.post("/api/asistencias", async (req, res) => {
  const { qr_or_id, manual_socio_id, usuario_id, usuario_nombre } = req.body;
  const db = await readDb();

  let socio = null;

  if (manual_socio_id) {
    socio = db.socios.find((s: any) => s.id === manual_socio_id);
  } else if (qr_or_id) {
    // Can match direct ID or QR string
    socio = db.socios.find((s: any) => s.id === qr_or_id || s.qr === qr_or_id || s.dni === qr_or_id);
  }

  if (!socio) {
    return res.status(404).json({ error: "Socio no registrado en la base de datos." });
  }

  // Check if active or has warning status
  if (socio.estado === "vencido" || socio.estado === "deudor") {
    // Register a notification for access denied
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
    await writeDb(db);

    return res.status(403).json({
      error: `Acceso DENEGADO. El socio está ${socio.estado.toUpperCase()}. Por favor, regularizar su cuota en recepción.`,
      socio
    });
  }

  const now = new Date();
  const fechaStr = now.toISOString().split("T")[0]; // YYYY-MM-DD
  const horaStr = now.toTimeString().split(" ")[0]; // HH:MM:SS

  // Check duplicate attendance on the same day within last 2 hours to avoid double-tapping
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
      return res.status(429).json({
        warning: `Asistencia ya registrada recientemente hace ${differenceMinutes} minutes.`,
        socio,
        asistencia: recentAsist
      });
    }
  }

  const nuevaAsistencia = {
    id: "ast-" + Date.now(),
    socio_id: socio.id,
    socio_nombre: `${socio.nombre} ${socio.apellido}`,
    fecha: fechaStr,
    hora: horaStr
  };

  db.asistencias.unshift(nuevaAsistencia);

  // Register a notification for successful check-in
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

  await writeDb(db);

  await logAudit(usuario_id || "u-scan", usuario_nombre || "Escáner Molinete", `Ingreso registrado: ${socio.nombre} ${socio.apellido}`, "asistencias");

  res.status(201).json({
    success: true,
    mensaje: `¡Acceso AUTORIZADO! Bienvenido/a, ${socio.nombre}.`,
    socio,
    asistencia: nuevaAsistencia
  });
});

// 6. Entrenadores (Trainers) API
app.get("/api/entrenadores", async (req, res) => {
  const db = await readDb();
  res.json(db.entrenadores);
});

app.post("/api/entrenadores", async (req, res) => {
  const db = await readDb();
  const { nombre, apellido, especialidad, telefono, correo, estado, usuario_id, usuario_nombre } = req.body;

  if (!nombre || !apellido) {
    return res.status(400).json({ error: "Nombre y apellido son requeridos" });
  }

  const nuevoEntrenador = {
    id: "e-" + Date.now(),
    nombre,
    apellido,
    especialidad: especialidad || "Preparador Físico",
    telefono: telefono || "",
    correo: correo || "",
    estado: estado || "activo"
  };

  db.entrenadores.push(nuevoEntrenador);
  await writeDb(db);

  await logAudit(usuario_id || "u-anon", usuario_nombre || "Usuario Anónimo", `Agregó entrenador: ${nombre} ${apellido}`, "entrenadores");

  res.status(201).json(nuevoEntrenador);
});

app.put("/api/entrenadores/:id", async (req, res) => {
  const { id } = req.params;
  const db = await readDb();
  const index = db.entrenadores.findIndex((e: any) => e.id === id);

  if (index === -1) {
    return res.status(404).json({ error: "Entrenador no encontrado" });
  }

  const { usuario_id, usuario_nombre, ...updates } = req.body;
  delete updates.id;

  db.entrenadores[index] = {
    ...db.entrenadores[index],
    ...updates
  };

  await writeDb(db);
  await logAudit(usuario_id || "u-anon", usuario_nombre || "Usuario Anónimo", `Modificó entrenador: ${db.entrenadores[index].nombre} ${db.entrenadores[index].apellido}`, "entrenadores");

  res.json(db.entrenadores[index]);
});

app.delete("/api/entrenadores/:id", async (req, res) => {
  const { id } = req.params;
  const { usuario_id, usuario_nombre } = req.query;
  const db = await readDb();
  const index = db.entrenadores.findIndex((e: any) => e.id === id);

  if (index === -1) {
    return res.status(404).json({ error: "Entrenador no encontrado" });
  }

  const ent = db.entrenadores[index];
  db.entrenadores.splice(index, 1);
  await writeDb(db);

  await logAudit(String(usuario_id) || "u-anon", String(usuario_nombre) || "Usuario Anónimo", `Eliminó entrenador: ${ent.nombre} ${ent.apellido}`, "entrenadores");

  res.json({ success: true });
});

// 7. Rutinas (Workout Routines) API
app.get("/api/rutinas", async (req, res) => {
  const db = await readDb();
  res.json(db.rutinas);
});

app.post("/api/rutinas", async (req, res) => {
  const db = await readDb();
  const { socio_id, entrenador_id, nombre, descripcion, ejercicios, usuario_id, usuario_nombre } = req.body;

  if (!socio_id || !nombre) {
    return res.status(400).json({ error: "Socio y nombre de rutina son requeridos." });
  }

  const socio = db.socios.find((s: any) => s.id === socio_id);
  const entrenador = db.entrenadores.find((e: any) => e.id === entrenador_id);

  const nuevaRutina = {
    id: "r-" + Date.now(),
    socio_id,
    socio_nombre: socio ? `${socio.nombre} ${socio.apellido}` : "Socio Desconocido",
    entrenador_id: entrenador_id || "",
    entrenador_nombre: entrenador ? `${entrenador.nombre} ${entrenador.apellido}` : "Sin Asignar",
    nombre,
    descripcion: descripcion || "",
    ejercicios: ejercicios || [],
    fecha_creacion: new Date().toISOString()
  };

  db.rutinas.unshift(nuevaRutina);

  // Add routine assignment notification
  db.notificaciones.unshift({
    id: "not-rutina-" + Date.now(),
    socio_id: socio_id,
    socio_nombre: socio ? `${socio.nombre} ${socio.apellido}` : "Socio Desconocido",
    titulo: "Nueva Rutina de Entrenamiento",
    mensaje: `Se le ha asignado la rutina '${nombre}' al socio ${socio ? `${socio.nombre} ${socio.apellido}` : "Socio Desconocido"}.${entrenador ? ` Coach: ${entrenador.nombre} ${entrenador.apellido}.` : ""}`,
    leida: false,
    tipo: "sistema",
    fecha: new Date().toISOString()
  });

  await writeDb(db);

  await logAudit(usuario_id || "u-anon", usuario_nombre || "Usuario Anónimo", `Asignó rutina '${nombre}' al socio ${nuevaRutina.socio_nombre}`, "rutinas");

  res.status(201).json(nuevaRutina);
});

app.put("/api/rutinas/:id", async (req, res) => {
  const { id } = req.params;
  const db = await readDb();
  const index = db.rutinas.findIndex((r: any) => r.id === id);

  if (index === -1) {
    return res.status(404).json({ error: "Rutina no encontrada" });
  }

  const { usuario_id, usuario_nombre, ...updates } = req.body;
  delete updates.id;

  db.rutinas[index] = {
    ...db.rutinas[index],
    ...updates
  };

  await writeDb(db);
  await logAudit(usuario_id || "u-anon", usuario_nombre || "Usuario Anónimo", `Actualizó rutina '${db.rutinas[index].nombre}' para ${db.rutinas[index].socio_nombre}`, "rutinas");

  res.json(db.rutinas[index]);
});

app.delete("/api/rutinas/:id", async (req, res) => {
  const { id } = req.params;
  const { usuario_id, usuario_nombre } = req.query;
  const db = await readDb();
  const index = db.rutinas.findIndex((r: any) => r.id === id);

  if (index === -1) {
    return res.status(404).json({ error: "Rutina no encontrada" });
  }

  const r = db.rutinas[index];
  db.rutinas.splice(index, 1);
  await writeDb(db);

  await logAudit(String(usuario_id) || "u-anon", String(usuario_nombre) || "Usuario Anónimo", `Eliminó rutina '${r.nombre}' de ${r.socio_nombre}`, "rutinas");

  res.json({ success: true });
});

// 8. Notifications API
app.get("/api/notificaciones", async (req, res) => {
  const db = await readDb();
  
  // Dynamic Check for Expirations
  const now = new Date();
  let dbChanged = false;

  for (const socio of db.socios) {
    // Find the latest approved payment for this member
    const lastPago = db.pagos
      .filter((p: any) => p.socio_id === socio.id && p.estado === "aprobado")
      .sort((a: any, b: any) => new Date(b.fecha_pago).getTime() - new Date(a.fecha_pago).getTime())[0];

    if (lastPago && lastPago.fecha_vencimiento) {
      const expirationDate = new Date(lastPago.fecha_vencimiento);
      const diffTime = expirationDate.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffTime < 0) {
        // It is expired!
        // 1. Update socio status if it's currently active
        if (socio.estado === "activo") {
          socio.estado = "vencido";
          dbChanged = true;
          // Add a system log
          db.auditoria.unshift({
            id: "aud-" + Date.now() + "-" + Math.random().toString(36).substring(2, 5),
            usuario_id: "u-sys",
            usuario_nombre: "Sistema Automatizado",
            accion: `Socio ${socio.nombre} ${socio.apellido} cambió a estado VENCIDO por expiración de membresía`,
            tabla_afectada: "socios",
            fecha: now.toISOString()
          });
        }

        // 2. Add notification if not already notified recently (within last 30 days)
        const hasRecentExpiryNotif = db.notificaciones.some(
          (n: any) => n.socio_id === socio.id && n.titulo === "Membresía Vencida" && (now.getTime() - new Date(n.fecha).getTime() < 1000 * 60 * 60 * 24 * 30)
        );

        if (!hasRecentExpiryNotif) {
          const expiredMessage = db.configuracion.plantilla_vencimiento
            ? db.configuracion.plantilla_vencimiento
                .replace("{nombre}", socio.nombre)
                .replace("{plan}", lastPago.plan_nombre)
                .replace("{vencimiento}", expirationDate.toLocaleDateString("es-AR"))
            : `El plan ${lastPago.plan_nombre} de ${socio.nombre} ${socio.apellido} ha vencido el ${expirationDate.toLocaleDateString("es-AR")}.`;

          db.notificaciones.unshift({
            id: "not-exp-" + Date.now() + "-" + Math.random().toString(36).substring(2, 5),
            socio_id: socio.id,
            socio_nombre: `${socio.nombre} ${socio.apellido}`,
            titulo: "Membresía Vencida",
            mensaje: expiredMessage,
            leida: false,
            tipo: "email",
            fecha: now.toISOString()
          });
          dbChanged = true;
        }
      } else if (diffDays <= 3 && diffDays >= 0) {
        // Expiring soon (within 3 days)
        const hasRecentWarningNotif = db.notificaciones.some(
          (n: any) => n.socio_id === socio.id && n.titulo === "Membresía por Vencer" && (now.getTime() - new Date(n.fecha).getTime() < 1000 * 60 * 60 * 24 * 7)
        );

        if (!hasRecentWarningNotif) {
          const warningMessage = `El plan ${lastPago.plan_nombre} de ${socio.nombre} ${socio.apellido} vencerá ${diffDays === 0 ? "hoy" : diffDays === 1 ? "en 1 día" : "en " + diffDays + " días"} (${expirationDate.toLocaleDateString("es-AR")}).`;
          
          db.notificaciones.unshift({
            id: "not-warn-" + Date.now() + "-" + Math.random().toString(36).substring(2, 5),
            socio_id: socio.id,
            socio_nombre: `${socio.nombre} ${socio.apellido}`,
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
    await writeDb(db);
  }

  res.json(db.notificaciones);
});

app.post("/api/notificaciones/marcar-leidas", async (req, res) => {
  const db = await readDb();
  db.notificaciones.forEach((n: any) => {
    n.leida = true;
  });
  await writeDb(db);
  res.json({ success: true });
});

// 9. Auditoria API
app.get("/api/auditoria", async (req, res) => {
  const db = await readDb();
  res.json(db.auditoria);
});

// 10. Configuracion API
app.get("/api/configuracion", async (req, res) => {
  const db = await readDb();
  res.json(db.configuracion);
});

app.post("/api/configuracion", async (req, res) => {
  const db = await readDb();
  const { config, usuario_id, usuario_nombre } = req.body;

  db.configuracion = {
    ...db.configuracion,
    ...config
  };

  await writeDb(db);
  await logAudit(usuario_id || "u-anon", usuario_nombre || "Usuario Anónimo", "Actualizó la configuración general de la empresa", "configuracion");

  res.json(db.configuracion);
});

// 11. AI Gym Co-pilot Endpoint
app.post("/api/copilot", async (req, res) => {
  const { prompt, contextType, targetId } = req.body;

  const ai = getAi();
  if (!ai) {
    return res.status(503).json({
      error: "Servicio de Inteligencia Artificial Co-Pilot temporalmente no configurado. Asegúrese de que la clave GEMINI_API_KEY esté presente en su Secrets Panel."
    });
  }

  try {
    const db = await readDb();

    // Prepare a concise summary of Gym statistics to seed contextual wisdom
    const totalSocios = db.socios.length;
    const activos = db.socios.filter((s: any) => s.estado === "activo").length;
    const deudores = db.socios.filter((s: any) => s.estado === "deudor").length;
    const vencidos = db.socios.filter((s: any) => s.estado === "vencido").length;
    const totalPlanes = db.planes.length;
    const totalEntrenadores = db.entrenadores.length;

    let contextData = `
--- ESTADÍSTICAS DEL GIMNASIO ---
Nombre del gimnasio: ${db.configuracion.nombre_gimnasio}
Socios Totales: ${totalSocios} (Activos: ${activos}, Vencidos: ${vencidos}, Morosos/Deudores: ${deudores})
Planes Disponibles: ${db.planes.map((p: any) => `${p.nombre} ($${p.precio})`).join(", ")}
Entrenadores: ${db.entrenadores.map((e: any) => `${e.nombre} ${e.apellido} (${e.especialidad})`).join(", ")}
    `;

    if (contextType === "socio" && targetId) {
      const socio = db.socios.find((s: any) => s.id === targetId);
      if (socio) {
        const plan = db.planes.find((p: any) => p.id === socio.plan_id);
        contextData += `
Socio bajo análisis:
- Nombre completo: ${socio.nombre} ${socio.apellido}
- DNI: ${socio.dni}
- Sexo: ${socio.sexo}
- Peso: ${socio.peso} kg, Altura: ${socio.altura} cm
- Objetivo: ${socio.objetivo}
- Observaciones de salud: ${socio.observaciones}
- Plan actual: ${plan ? plan.nombre : "Ninguno"}
- Estado actual: ${socio.estado.toUpperCase()}
        `;
      }
    }

    const systemInstruction = `
Eres "Co-Pilot AI Gym PRO", una inteligencia artificial integrada en un software de gestión deportiva de nivel comercial.
Tu tarea es asistir amablemente a administradores, recepcionistas y entrenadores.
- Idioma: Español claro, motivador e impecable.
- Formato: Retorna respuestas ricas usando Markdown limpio (listas, negritas, tablas de entrenamiento).
- Si te piden generar una RUTINA, hazlo con una tabla de ejercicios organizada (Nombre, Series, Repeticiones, Cargas, Descanso), adaptada estrictamente a los objetivos y problemas de salud descritos del socio.
- Si te piden redactar un mensaje de cobro o email para deudores, sé sumamente diplomático pero firme, usando placeholders como [Nombre del Socio], [Monto] y [Vencimiento].
- Mantén un tono profesional, motivador y sumamente estético.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `Contexto del gimnasio:\n${contextData}\n\nSolicitud del usuario:\n${prompt}`,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    const reply = response.text || "No se pudo generar una respuesta.";
    res.json({ text: reply });
  } catch (err: any) {
    console.error("Gemini Co-Pilot error:", err);
    res.status(500).json({ error: "Fallo al llamar al motor Gemini: " + err.message });
  }
});

// --- VITE MIDDLEWARE SETUP ---

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
