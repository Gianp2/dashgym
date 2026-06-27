import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import { Settings, Save, AlertTriangle, ShieldCheck, Landmark } from "lucide-react";
import { RolUsuario } from "../types";

export const Configuracion: React.FC = () => {
  const { configuracion, updateConfiguracion, user } = useApp();
  const [loading, setLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    nombre_gimnasio: configuracion?.nombre_gimnasio || "GIMNASIO PRO",
    telefono: configuracion?.telefono || "+54 11 5555-1234",
    cuit: configuracion?.cuit || "30-71829302-9",
    direccion: configuracion?.direccion || "Av. Corrientes 1540, CABA",
    ciudad: configuracion?.ciudad || "Capital Federal",
    provincia: configuracion?.provincia || "Buenos Aires"
  });

  // 1. RBAC Safeguard
  if (user?.rol !== RolUsuario.Administrador) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-12 text-center text-xs space-y-4 max-w-md mx-auto my-12">
        <ShieldCheck className="w-12 h-12 text-rose-500 mx-auto animate-pulse" />
        <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-sm">Acceso Restringido</h3>
        <p className="text-slate-400 leading-relaxed">
          Las configuraciones generales del establecimiento deportivo (razón social, datos impositivos CUIT, etc) solo pueden ser modificadas por un usuario con perfil de **Administrador**.
        </p>
      </div>
    );
  }

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateConfiguracion(formData);
      alert("Configuraciones actualizadas con éxito.");
    } catch (err: any) {
      alert("Error al actualizar configuración: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl text-xs">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-sm transition-colors duration-200">
        <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200">Parámetros del Establecimiento</h2>
        <p className="text-slate-400 text-[11px] mt-0.5">Modifique los datos fiscales, domicilio legal e identidad corporativa de su gimnasio</p>
      </div>

      {/* Main configuration form */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-2xl p-6 shadow-sm">
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div>
            <label className="block text-slate-500 font-bold mb-1.5 uppercase text-[9px]">Nombre Comercial del Gimnasio *</label>
            <input
              type="text"
              required
              value={formData.nombre_gimnasio}
              onChange={(e) => setFormData({ ...formData, nombre_gimnasio: e.target.value })}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-slate-800 dark:text-slate-200 font-bold"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-500 font-bold mb-1.5 uppercase text-[9px]">CUIT impositivo *</label>
              <input
                type="text"
                required
                value={formData.cuit}
                onChange={(e) => setFormData({ ...formData, cuit: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-slate-800 dark:text-slate-200 font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-500 font-bold mb-1.5 uppercase text-[9px]">Teléfono de contacto *</label>
              <input
                type="text"
                required
                value={formData.telefono}
                onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-slate-800 dark:text-slate-200 font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-500 font-bold mb-1.5 uppercase text-[9px]">Dirección Legal / Domicilio *</label>
            <input
              type="text"
              required
              value={formData.direccion}
              onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-slate-800 dark:text-slate-200 font-medium"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-500 font-bold mb-1.5 uppercase text-[9px]">Ciudad</label>
              <input
                type="text"
                value={formData.ciudad}
                onChange={(e) => setFormData({ ...formData, ciudad: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-slate-800 dark:text-slate-200"
              />
            </div>
            <div>
              <label className="block text-slate-500 font-bold mb-1.5 uppercase text-[9px]">Provincia</label>
              <input
                type="text"
                value={formData.provincia}
                onChange={(e) => setFormData({ ...formData, provincia: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-slate-800 dark:text-slate-200"
              />
            </div>
          </div>

          {/* Warning notice about system modifications */}
          <div className="p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-800/80 rounded-xl flex items-start space-x-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
            <div className="text-[10px] text-slate-500 leading-relaxed">
              <strong>Atención:</strong> La modificación del nombre del gimnasio, teléfono o dirección actualizará de inmediato la impresión de los comprobantes térmicos fiscales digitales de las cuotas emitidas a partir de este momento.
            </div>
          </div>

          <div className="pt-4 border-t border-slate-50 dark:border-slate-800 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-md transition flex items-center space-x-1.5 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{loading ? "Guardando..." : "Guardar Cambios"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
export default Configuracion;
