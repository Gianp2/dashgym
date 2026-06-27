import React, { useState, useRef, useEffect } from "react";
import { useApp } from "../context/AppContext";
import { Search, UserCheck, Volume2, ShieldAlert, Laptop, UserMinus, RefreshCcw, CheckCircle2, XCircle, Clock, Users } from "lucide-react";
import { Socio } from "../types";

export const Asistencias: React.FC = () => {
  const { registerAsistencia, socios, asistencias } = useApp();
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Scan feedback outcome state
  const [scanResult, setScanResult] = useState<{
    status: "idle" | "success" | "denied" | "warning";
    mensaje: string;
    socio?: Socio;
  }>({ status: "idle", mensaje: "" });

  const audioContextRef = useRef<AudioContext | null>(null);

  // Audio synthesizer for sound effect
  const playSound = (type: "success" | "error") => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioContextRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === "success") {
        // High pleasant beep
        osc.frequency.setValueAtTime(880, ctx.currentTime); // A5 note
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        osc.start();
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
        osc.stop(ctx.currentTime + 0.15);
      } else {
        // Dual flat low alert tone
        osc.frequency.setValueAtTime(220, ctx.currentTime); // A3 note
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        osc.start();
        osc.frequency.exponentialRampToValueAtTime(110, ctx.currentTime + 0.3);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        osc.stop(ctx.currentTime + 0.3);
      }
    } catch (err) {
      console.warn("Audio Context playback ignored due to browser constraints:", err);
    }
  };

  const handleCheckIn = async (code: string) => {
    if (!code.trim()) return;
    setLoading(true);
    try {
      const response = await registerAsistencia(code);
      if (response.success) {
        playSound("success");
        setScanResult({
          status: "success",
          mensaje: response.mensaje,
          socio: response.socio
        });
      } else {
        playSound("error");
        setScanResult({
          status: "denied",
          mensaje: response.mensaje,
          socio: response.socio
        });
      }
    } catch (err: any) {
      playSound("error");
      setScanResult({
        status: "error" as any,
        mensaje: "Error de conexión con el servidor de control de accesos."
      });
    } finally {
      setLoading(false);
      setInputValue("");
    }
  };

  // Filtered list of members for the quick-actions grid
  const filteredSocios = socios.filter(s => 
    `${s.nombre} ${s.apellido} ${s.dni}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Title & Description Header */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center space-y-2 md:space-y-0 transition-colors duration-200">
        <div>
          <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200 font-display uppercase tracking-wider">Control de Asistencias</h2>
          <p className="text-slate-400 dark:text-slate-500 text-[11px] mt-0.5 font-sans">Gestione y registre los ingresos de socios de forma manual, rápida y eficiente</p>
        </div>
        <div className="flex items-center space-x-2 text-slate-400 dark:text-slate-500 text-[10px] font-bold uppercase font-mono">
          <Volume2 className="w-4 h-4 text-indigo-500" />
          <span>Alertas de Sonido Activas</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* Left Column: Quick Check-in Registry */}
        <div className="lg:col-span-5 flex flex-col space-y-6">
          
          {/* Manual Input Form */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider font-display">Registrar Ingreso Manual</h3>
            <p className="text-[10px] text-slate-400 dark:text-slate-500">Ingrese el DNI, ID de socio o código de credencial para procesar el ingreso de inmediato.</p>
            
            <div className="space-y-2.5">
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400 dark:text-slate-500" />
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCheckIn(inputValue)}
                  placeholder="DNI, ID o código..."
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl py-2.5 pl-10 pr-4 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600 transition font-mono"
                />
              </div>
              <button
                onClick={() => handleCheckIn(inputValue)}
                disabled={loading || !inputValue.trim()}
                className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl text-xs transition cursor-pointer shadow-sm shadow-indigo-600/10"
              >
                {loading ? "Registrando..." : "Confirmar Ingreso"}
              </button>
            </div>
          </div>

          {/* Banco de Pruebas / Registro en un Click */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex-1 flex flex-col min-h-[300px]">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider font-display">Registro rápido por socio</h3>
              <span className="text-[9px] bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-bold px-2 py-0.5 rounded-md uppercase font-mono">Buscador</span>
            </div>
            
            <div className="relative mb-3">
              <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Filtrar por nombre o DNI..."
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-lg py-1.5 pl-9 pr-3 text-[11px] text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600 transition"
              />
            </div>

            <div className="flex-1 overflow-y-auto max-h-[320px] divide-y divide-slate-100 dark:divide-slate-800/60 pr-1">
              {filteredSocios.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">Ningún socio coincide con la búsqueda</div>
              ) : (
                filteredSocios.map((s) => (
                  <div key={s.id} className="py-2.5 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition px-1 rounded-lg">
                    <div className="min-w-0 pr-2">
                      <p className="font-bold text-xs text-slate-800 dark:text-slate-200 truncate">{s.nombre} {s.apellido}</p>
                      <div className="flex items-center space-x-2 mt-0.5">
                        <span className="text-[9px] text-slate-400 dark:text-slate-500 font-mono">DNI: {s.dni}</span>
                        <span className={`text-[8px] font-extrabold uppercase px-1 rounded ${
                          s.estado === "activo"
                            ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400"
                            : s.estado === "vencido"
                            ? "bg-rose-50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-400"
                            : "bg-amber-50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400"
                        }`}>
                          {s.estado}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleCheckIn(s.qr)}
                      className={`text-[10px] font-bold px-2.5 py-1.5 rounded-lg border transition cursor-pointer shrink-0 ${
                        s.estado === "activo"
                          ? "bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 border-emerald-500/10"
                          : s.estado === "vencido"
                          ? "bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-950/20 dark:text-rose-400 border-rose-500/10"
                          : "bg-amber-50 text-amber-600 hover:bg-amber-100 dark:bg-amber-950/20 dark:text-amber-400 border-amber-500/10"
                      }`}
                    >
                      Registrar
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Outcomes & Live Feed */}
        <div className="lg:col-span-7 flex flex-col space-y-6">
          
          {/* Scan result display panel */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl flex flex-col items-center justify-center text-center shadow-sm relative min-h-[220px]">
            {scanResult.status === "idle" ? (
              <div className="space-y-3 py-4">
                <div className="w-12 h-12 rounded-full bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 flex items-center justify-center mx-auto">
                  <Laptop className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-slate-700 dark:text-slate-300 text-xs uppercase tracking-wider font-display">En espera de registros</h3>
                <p className="text-slate-400 dark:text-slate-500 text-xs max-w-xs leading-relaxed">
                  Utilice el panel izquierdo o el buscador de socios para registrar un nuevo ingreso y ver los resultados aquí.
                </p>
              </div>
            ) : scanResult.status === "success" && scanResult.socio ? (
              <div className="space-y-4 py-2 w-full">
                <div className="w-14 h-14 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto ring-4 ring-emerald-500/10">
                  <CheckCircle2 className="w-8 h-8 animate-bounce" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-black text-emerald-600 dark:text-emerald-400 tracking-wider uppercase font-display">
                    Ingreso Registrado
                  </h4>
                  <p className="text-slate-800 dark:text-slate-100 font-extrabold text-base">
                    {scanResult.socio.nombre} {scanResult.socio.apellido}
                  </p>
                  <p className="text-slate-400 dark:text-slate-500 text-[10px] font-mono">DNI: {scanResult.socio.dni} • SOCIO #{scanResult.socio.id.slice(0, 6).toUpperCase()}</p>
                </div>

                <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 p-3.5 rounded-xl text-left max-w-sm mx-auto text-xs space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-400 dark:text-slate-500 uppercase text-[9px] font-mono">Objetivo:</span>
                    <span className="text-slate-700 dark:text-slate-300 font-semibold truncate max-w-[200px]">{scanResult.socio.objetivo}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-400 dark:text-slate-500 uppercase text-[9px] font-mono">Peso / Altura:</span>
                    <span className="text-slate-700 dark:text-slate-300 font-bold">{scanResult.socio.peso}kg / {scanResult.socio.altura}cm</span>
                  </div>
                  {scanResult.socio.observaciones && (
                    <div className="pt-2 border-t border-slate-200 dark:border-slate-800/80 text-amber-600 dark:text-amber-400 font-semibold text-[9px]">
                      Aviso Médico: {scanResult.socio.observaciones}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-4 py-2 w-full">
                <div className="w-14 h-14 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto ring-4 ring-rose-500/10">
                  <XCircle className="w-8 h-8" />
                </div>
                <div className="space-y-1 max-w-sm mx-auto">
                  <h4 className="text-sm font-black text-rose-600 dark:text-rose-400 tracking-wider uppercase font-display">
                    Ingreso Denegado
                  </h4>
                  {scanResult.socio && (
                    <p className="text-slate-800 dark:text-slate-100 font-extrabold text-sm">
                      {scanResult.socio.nombre} {scanResult.socio.apellido}
                    </p>
                  )}
                  <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed font-semibold">
                    {scanResult.mensaje}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Recent attendances live logger list */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm flex-1 flex flex-col">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider font-display">Ingresos de Hoy</h3>
              <div className="flex items-center space-x-1.5 text-[9px] text-slate-400 font-bold uppercase font-mono">
                <Clock className="w-3.5 h-3.5 text-indigo-500" />
                <span>Tiempo Real</span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto max-h-[220px] divide-y divide-slate-100 dark:divide-slate-800/60 pr-1">
              {asistencias.length === 0 ? (
                <div className="text-center py-12 text-slate-400 dark:text-slate-500 text-xs">Aún no se registraron asistencias hoy.</div>
              ) : (
                asistencias.map((a) => (
                  <div key={a.id} className="py-2.5 flex items-center justify-between">
                    <div className="flex items-center space-x-3 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs shrink-0">
                        {a.socio_nombre ? a.socio_nombre[0] : "?"}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-xs text-slate-800 dark:text-slate-200 truncate">{a.socio_nombre}</p>
                        <p className="text-[9px] text-slate-400 dark:text-slate-500 font-mono">DNI o ID: {a.socio_id.slice(0, 8).toUpperCase()}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono font-bold bg-slate-100 dark:bg-slate-800/80 px-2 py-1 rounded">
                        {a.hora}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default Asistencias;
