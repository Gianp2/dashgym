import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import { Shield, Lock, Mail, Dumbbell, UserCheck, ArrowRight } from "lucide-react";

export const IniciarSesion: React.FC = () => {
  const { login } = useApp();
  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!correo || !password) return;
    setSubmitting(true);
    await login(correo, password);
    setSubmitting(false);
  };

  // Quick profiles for testing
  const presets = [
    {
      name: "Franco Gómez",
      role: "Administrador",
      email: "admin@gympro.com",
      pass: "admin123",
      bg: "border-indigo-500/30 hover:border-indigo-500 hover:bg-indigo-950/20",
      text: "text-indigo-400"
    },
    {
      name: "Valentina Martínez",
      role: "Recepcionista",
      email: "recep@gympro.com",
      pass: "recep123",
      bg: "border-emerald-500/30 hover:border-emerald-500 hover:bg-emerald-950/20",
      text: "text-emerald-400"
    },
    {
      name: "Santiago Fernández",
      role: "Gerente",
      email: "gerente@gympro.com",
      pass: "gerente123",
      bg: "border-amber-500/30 hover:border-amber-500 hover:bg-amber-950/20",
      text: "text-amber-400"
    }
  ];

  const applyPreset = (email: string, pass: string) => {
    setCorreo(email);
    setPassword(pass);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col md:flex-row items-center justify-center p-6 md:p-12 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-600/5 rounded-full blur-3xl pointer-events-none"></div>

      {/* Brand & Pitch section */}
      <div className="flex-1 max-w-md text-white space-y-6 md:mr-12 mb-12 md:mb-0 text-center md:text-left">
        <div className="flex items-center justify-center md:justify-start space-x-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg">
            <Dumbbell className="w-6 h-6 text-indigo-100" />
          </div>
          <span className="font-black text-2xl tracking-wider">GYM PRO</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight leading-tight">
          La gestión de tu gimnasio, <span className="bg-gradient-to-r from-indigo-400 to-indigo-200 bg-clip-text text-transparent">al siguiente nivel.</span>
        </h1>
        <p className="text-slate-400 text-sm leading-relaxed">
          Control total de membresías, ingreso automatizado por códigos QR, rutinas personalizadas de entrenamiento y reportes financieros integrados.
        </p>

        {/* Demo profiles picker */}
        <div className="space-y-3">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-widest text-left">
            Ingreso Rápido de Prueba (Demo presets)
          </div>
          <div className="grid grid-cols-1 gap-2.5">
            {presets.map((preset) => (
              <button
                key={preset.email}
                onClick={() => applyPreset(preset.email, preset.pass)}
                className={`border rounded-xl p-3 text-left transition duration-200 cursor-pointer ${preset.bg}`}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-xs font-bold text-white">{preset.name}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{preset.email}</div>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800 font-bold ${preset.text}`}>
                    {preset.role}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Form Card */}
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-xl z-10">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-white">Iniciar Sesión</h2>
          <p className="text-slate-400 text-xs mt-1">Ingrese sus credenciales de acceso al sistema</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email input */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">
              Correo Electrónico
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
              <input
                type="email"
                required
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                placeholder="ejemplo@gympro.com"
                className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl py-2.5 pl-11 pr-4 text-sm text-white placeholder-slate-600 transition"
              />
            </div>
          </div>

          {/* Password input */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">
              Contraseña
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl py-2.5 pl-11 pr-4 text-sm text-white placeholder-slate-600 transition"
              />
            </div>
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 rounded-xl transition text-sm flex items-center justify-center space-x-2 mt-2 cursor-pointer"
          >
            {submitting ? (
              <span>Cargando...</span>
            ) : (
              <>
                <span>Ingresar al Sistema</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-slate-800/80 flex items-center justify-center space-x-2">
          <Shield className="w-3.5 h-3.5 text-slate-500" />
          <span className="text-[10px] text-slate-500 font-mono">Conexión encriptada SSL de nivel bancario</span>
        </div>
      </div>
    </div>
  );
};
export default IniciarSesion;
