export enum RolUsuario {
  Administrador = "Administrador",
  Recepcionista = "Recepcionista",
  Gerente = "Gerente"
}

export interface Usuario {
  id: string;
  nombre: string;
  apellido: string;
  correo: string;
  rol: RolUsuario;
  estado: "activo" | "inactivo";
  fecha_creacion: string;
}

export interface Plan {
  id: string;
  nombre: string;
  descripcion: string;
  precio: number;
  duracion_dias: number;
  estado: "activo" | "inactivo";
}

export interface Socio {
  id: string;
  nombre: string;
  apellido: string;
  dni: string;
  fecha_nacimiento: string;
  sexo: "Masculino" | "Femenino" | "Otro";
  telefono: string;
  correo: string;
  direccion: string;
  ciudad: string;
  provincia: string;
  foto?: string;
  qr: string; // Base64 or text representation for scanning
  peso: number; // in kg
  altura: number; // in cm
  objetivo: string;
  observaciones?: string;
  plan_id: string; // Linked Plan ID
  estado: "activo" | "vencido" | "deudor";
  fecha_registro: string;
}

export interface Pago {
  id: string;
  socio_id: string;
  socio_nombre: string; // denormalized for easy display
  plan_id: string;
  plan_nombre: string; // denormalized
  monto: number;
  metodo_pago: "Efectivo" | "Tarjeta de Crédito" | "Tarjeta de Débito" | "Transferencia" | "Mercado Pago";
  fecha_pago: string;
  fecha_vencimiento: string;
  estado: "aprobado" | "pendiente" | "rechazado";
  comprobante_numero: string;
}

export interface Asistencia {
  id: string;
  socio_id: string;
  socio_nombre: string; // denormalized
  fecha: string; // YYYY-MM-DD
  hora: string; // HH:MM:SS
}

export interface Entrenador {
  id: string;
  nombre: string;
  apellido: string;
  especialidad: string;
  telefono: string;
  correo: string;
  estado: "activo" | "inactivo";
}

export interface Ejercicio {
  id: string;
  ejercicio: string;
  series: number;
  repeticiones: string; // e.g. "12", "10-12-15", "al fallo"
  peso: string; // e.g. "20kg", "80% RM"
  descanso: string; // e.g. "60s", "2m"
}

export interface Rutina {
  id: string;
  socio_id: string;
  socio_nombre: string; // denormalized
  entrenador_id: string;
  entrenador_nombre: string; // denormalized
  nombre: string; // e.g., "Hipertrofia Tren Superior"
  descripcion: string;
  ejercicios: Ejercicio[];
  fecha_creacion: string;
}

export interface Notificacion {
  id: string;
  socio_id?: string;
  socio_nombre?: string;
  titulo: string;
  mensaje: string;
  leida: boolean;
  tipo: "email" | "whatsapp" | "sistema";
  fecha: string;
}

export interface Auditoria {
  id: string;
  usuario_id: string;
  usuario_nombre: string;
  accion: string;
  tabla_afectada: string;
  fecha: string;
}

export interface Configuracion {
  nombre_gimnasio: string;
  cuit: string;
  telefono: string;
  correo: string;
  direccion: string;
  moneda: string; // e.g. "ARS", "USD"
  mercado_pago_sandbox: boolean;
  notificaciones_email_activas: boolean;
  notificaciones_whatsapp_activas: boolean;
  plantilla_bienvenida: string;
  plantilla_vencimiento: string;
}
