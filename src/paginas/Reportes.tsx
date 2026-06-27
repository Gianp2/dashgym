import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import {
  FileBarChart,
  ShieldCheck,
  TrendingUp,
  AlertTriangle,
  History,
  Send,
  MessageSquare,
  ClipboardList,
  UserX
} from "lucide-react";
import { RolUsuario } from "../types";

export const Reportes: React.FC = () => {
  const { pagos, socios, auditorias, user } = useApp();
  
  // Notification generator state
  const [selectedDebtorId, setSelectedDebtorId] = useState("");
  const [remindResponse, setRemindResponse] = useState("");
  const [remindLoading, setRemindLoading] = useState(false);

  // 1. RBAC Safeguard
  if (user?.rol !== RolUsuario.Administrador && user?.rol !== RolUsuario.Gerente) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-12 text-center text-xs space-y-4 max-w-md mx-auto my-12">
        <ShieldCheck className="w-12 h-12 text-rose-500 mx-auto" />
        <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-sm">Acceso No Autorizado</h3>
        <p className="text-slate-400 leading-relaxed">
          Este panel de control administrativo y reportes consolidados requiere el rol de **Administrador** o **Gerente**.
        </p>
      </div>
    );
  }

  // 2. Calculations
  const totalPagado = pagos
    .filter(p => p.estado === "aprobado")
    .reduce((sum, p) => sum + p.monto, 0);

  const deudores = socios.filter(s => s.estado === "deudor" || s.estado === "vencido");

  // Draft payment reminder with built-in template generator
  const handleDraftReminder = () => {
    if (!selectedDebtorId) {
      alert("Por favor seleccione un socio moroso o vencido.");
      return;
    }
    setRemindLoading(true);
    setRemindResponse("");

    const debtor = socios.find(s => s.id === selectedDebtorId);
    if (!debtor) {
      setRemindLoading(false);
      return;
    }

    setTimeout(() => {
      const goalText = debtor.objetivo || "mejorar tu condición física y salud";
      const message = `Estimado/a *${debtor.nombre} ${debtor.apellido}*,\n\nTe saludamos desde el equipo de administración de GYM PRO. Esperamos que estés muy bien.\n\nTe contactamos para recordarte de forma atenta que tu membresía actual se encuentra con saldo pendiente o vencida (DNI: ${debtor.dni}).\n\nSabemos lo importante que es para ti tu objetivo de *"${goalText}"*, por lo que queremos brindarte todas las facilidades para que no pierdas tu ritmo de entrenamiento ni tus avances físicos.\n\nSi deseas regularizar tu cuota o conocer los medios de pago digitales disponibles, por favor comunícate con nosotros por este medio o visítanos en la recepción. ¡Estamos aquí para ayudarte a seguir entrenando!\n\nAtentamente,\n*Administración de GYM PRO*`;
      
      setRemindResponse(message);
      setRemindLoading(false);
    }, 200);
  };

  return (
    <div className="space-y-6 text-xs">
      {/* Description header */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-sm transition-colors duration-200">
        <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200">Reportes Ejecutivos & Auditoría</h2>
        <p className="text-slate-400 text-[11px] mt-0.5">Monitoreo de recaudación consolidada, auditoría del personal de recepción e informes de morosidad</p>
      </div>

      {/* Financial ledger summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Statistics info */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-5 rounded-2xl shadow-sm space-y-4">
          <h3 className="font-bold text-slate-700 dark:text-slate-200 text-sm">Resumen de Liquidación</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100/50 dark:border-indigo-500/15 p-4 rounded-xl">
              <span className="font-bold text-slate-400 uppercase text-[9px]">Total Facturado Histórico</span>
              <div className="font-mono text-base font-black text-indigo-600 dark:text-indigo-400 mt-1">
                ${totalPagado.toLocaleString("es-AR")}
              </div>
            </div>

            <div className="bg-rose-50/50 dark:bg-rose-950/20 border border-rose-100/50 dark:border-rose-500/15 p-4 rounded-xl">
              <span className="font-bold text-slate-400 uppercase text-[9px]">Miembros Alertas / Morosos</span>
              <div className="font-mono text-base font-black text-rose-600 dark:text-rose-400 mt-1">
                {deudores.length} alumnos
              </div>
            </div>
          </div>

          <div className="p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl space-y-1">
            <div className="font-bold text-slate-700 dark:text-slate-300">Auditoría del Personal Activo:</div>
            <p className="text-slate-400 text-[10px] leading-relaxed">
              Las acciones críticas (alta de cobros, borrado de socios, check-ins autorizados) generan firmas criptográficas locales registradas en el libro diario de auditoría a la derecha.
            </p>
          </div>
        </div>

        {/* Debtor Payment reminder template generator */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-lg space-y-3.5 relative overflow-hidden">
          {/* Accent decoration */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none"></div>

          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-600/40 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-black text-white text-xs uppercase tracking-wider">Generador de Avisos de Pago</h4>
              <p className="text-[10px] text-slate-400 font-medium">Redactor de recordatorios para WhatsApp</p>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-slate-400 font-bold mb-1 uppercase text-[9px]">Socio Deudor a contactar *</label>
              <select
                value={selectedDebtorId}
                onChange={(e) => setSelectedDebtorId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg p-2 focus:border-indigo-500"
              >
                <option value="" disabled>Seleccione deudor...</option>
                {deudores.map(d => (
                  <option key={d.id} value={d.id}>{d.nombre} {d.apellido} (DNI: {d.dni} - Estado: {d.estado})</option>
                ))}
              </select>
            </div>

            <button
              onClick={handleDraftReminder}
              disabled={remindLoading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold py-2 rounded-lg transition text-xs flex items-center justify-center space-x-1.5 cursor-pointer"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>{remindLoading ? "Redactando recordatorio..." : "Generar Recordatorio de Pago"}</span>
            </button>
          </div>

          {/* Display drafted message template */}
          {remindResponse ? (
            <div className="bg-slate-950 border border-slate-850 p-3.5 rounded-xl max-h-[160px] overflow-y-auto text-[11px] text-slate-300 leading-relaxed font-sans whitespace-pre-wrap">
              {remindResponse}
            </div>
          ) : remindLoading ? (
            <div className="p-6 text-center text-slate-500 border border-slate-850 border-dashed rounded-xl font-medium animate-pulse">
              Generando recordatorio personalizado...
            </div>
          ) : (
            <div className="p-6 text-center text-slate-500 border border-slate-850 border-dashed rounded-xl">
              Seleccione un socio y presione el botón para redactar un mensaje cordial de recordatorio de pago listo para ser enviado.
            </div>
          )}
        </div>
      </div>

      {/* Audit telemetries trail log */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center space-x-2">
            <History className="w-4 h-4 text-slate-500" />
            <h3 className="font-bold text-slate-700 dark:text-slate-200 text-sm">Historial de Auditoría & Trazabilidad</h3>
          </div>
          <span className="text-[10px] font-mono bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-500 dark:text-slate-400">
            Libro Diario de Control
          </span>
        </div>

        <div className="space-y-2 max-h-[300px] overflow-y-auto font-mono text-[10px] pr-1">
          {auditorias.map((log) => {
            const isCritical = log.accion.toLowerCase().includes("eliminado") || log.accion.toLowerCase().includes("anulado");
            
            return (
              <div
                key={log.id}
                className="py-2.5 px-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-150/50 dark:border-slate-800/60 rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-1.5 sm:space-y-0"
              >
                <div className="flex items-center space-x-2.5">
                  <span className="text-slate-400 font-bold">[{log.fecha_hora}]</span>
                  <span className={`px-2 py-0.5 rounded font-black text-[9px] uppercase tracking-wider ${
                    isCritical
                      ? "bg-rose-50 dark:bg-rose-950/20 text-rose-600"
                      : log.accion.toLowerCase().includes("cobro") || log.accion.toLowerCase().includes("pago")
                      ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600"
                      : "bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600"
                  }`}>
                    {log.usuario_rol}
                  </span>
                  <span className="font-bold text-slate-700 dark:text-slate-300">{log.usuario_nombre}</span>
                  <span className="text-slate-500 dark:text-slate-400">{log.accion}</span>
                </div>
                <div className="text-slate-400 font-semibold text-[9px] uppercase tracking-wider">
                  Ref ID: {log.id}
                </div>
              </div>
            );
          })}

          {auditorias.length === 0 && (
            <div className="text-center py-12 text-slate-400">
              No se registran eventos de auditoría en la sesión actual.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default Reportes;
