import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import { Sparkles, Calendar, Plus, Edit3, Trash2, DollarSign } from "lucide-react";
import { Plan } from "../types";

export const Planes: React.FC = () => {
  const { planes, addPlan, updatePlan, deletePlan } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);

  const [formData, setFormData] = useState({
    nombre: "",
    descripcion: "",
    precio: "",
    duracion_dias: "30",
    estado: "activo" as "activo" | "inactivo"
  });

  const handleOpenForm = (plan?: Plan) => {
    if (plan) {
      setEditingPlan(plan);
      setFormData({
        nombre: plan.nombre,
        descripcion: plan.descripcion,
        precio: String(plan.precio),
        duracion_dias: String(plan.duracion_dias),
        estado: plan.estado
      });
    } else {
      setEditingPlan(null);
      setFormData({
        nombre: "",
        descripcion: "",
        precio: "",
        duracion_dias: "30",
        estado: "activo"
      });
    }
    setShowModal(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        nombre: formData.nombre,
        descripcion: formData.descripcion,
        precio: Number(formData.precio) || 0,
        duracion_dias: Number(formData.duracion_dias) || 30,
        estado: formData.estado
      };

      if (editingPlan) {
        await updatePlan(editingPlan.id, payload);
      } else {
        await addPlan(payload);
      }
      setShowModal(false);
    } catch (err) {
      alert("Error al guardar plan");
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`¿Está seguro de eliminar el plan "${name}"? Los socios que lo posean seguirán vinculados.`)) {
      await deletePlan(id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top action header */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-sm flex justify-between items-center transition-colors duration-200">
        <div>
          <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200">Planes de Membresía</h2>
          <p className="text-slate-400 text-[11px] mt-0.5">Defina las tarifas, plazos y accesos disponibles en su centro deportivo</p>
        </div>
        <button
          onClick={() => handleOpenForm()}
          className="flex items-center space-x-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Crear Plan</span>
        </button>
      </div>

      {/* Grid of plans */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {planes.map((plan) => {
          const durationLabel =
            plan.duracion_dias === 1
              ? "Acceso Diario"
              : plan.duracion_dias === 30
              ? "Mensual"
              : plan.duracion_dias === 90
              ? "Trimestral"
              : plan.duracion_dias === 365
              ? "Anual"
              : `${plan.duracion_dias} días`;

          return (
            <div
              key={plan.id}
              className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5.5 shadow-sm flex flex-col justify-between transition hover:shadow-md relative overflow-hidden"
            >
              {/* Highlight for anual / premium plans */}
              {plan.duracion_dias >= 365 && (
                <div className="absolute top-0 right-0 bg-indigo-600 text-white text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-bl-xl flex items-center space-x-1">
                  <Sparkles className="w-3 h-3" />
                  <span>PRO</span>
                </div>
              )}

              <div>
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] font-bold text-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded-md uppercase tracking-wider">
                    {durationLabel}
                  </span>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                    plan.estado === "activo"
                      ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-400"
                  }`}>
                    {plan.estado}
                  </span>
                </div>

                <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-sm mt-1 mb-1.5 truncate">
                  {plan.nombre}
                </h3>
                
                <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed line-clamp-3 min-h-[48px]">
                  {plan.descripcion || "Sin descripción cargada."}
                </p>
              </div>

              {/* Price and Action Section */}
              <div className="pt-4 mt-4 border-t border-slate-50 dark:border-slate-800/60 flex items-end justify-between">
                <div>
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Tarifa</span>
                  <div className="font-mono font-black text-slate-800 dark:text-slate-100 text-lg mt-0.5">
                    ${plan.precio.toLocaleString("es-AR")}
                  </div>
                </div>

                <div className="flex space-x-1">
                  <button
                    onClick={() => handleOpenForm(plan)}
                    className="p-1.5 rounded-lg border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-300 transition"
                    title="Editar"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(plan.id, plan.nombre)}
                    className="p-1.5 rounded-lg border border-slate-100 dark:border-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-rose-500 transition"
                    title="Eliminar"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Form Modal (Add / Edit Plan) */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-xl text-xs">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4">
              {editingPlan ? "Editar Plan" : "Crear Nuevo Plan"}
            </h3>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div>
                <label className="block text-slate-500 font-semibold mb-1">Nombre del Plan *</label>
                <input
                  type="text"
                  required
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  placeholder="Ej: Plan Pase Libre Mensual"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-slate-800 dark:text-slate-200"
                />
              </div>

              <div>
                <label className="block text-slate-500 font-semibold mb-1">Descripción</label>
                <textarea
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  placeholder="Detalles sobre el alcance del plan..."
                  rows={3}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-slate-800 dark:text-slate-200"
                ></textarea>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Precio ($ ARS) *</label>
                  <input
                    type="number"
                    required
                    value={formData.precio}
                    onChange={(e) => setFormData({ ...formData, precio: e.target.value })}
                    placeholder="Ej: 35000"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-slate-800 dark:text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Duración (Días) *</label>
                  <input
                    type="number"
                    required
                    value={formData.duracion_dias}
                    onChange={(e) => setFormData({ ...formData, duracion_dias: e.target.value })}
                    placeholder="Ej: 30"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-slate-800 dark:text-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-500 font-semibold mb-1">Estado</label>
                <select
                  value={formData.estado}
                  onChange={(e) => setFormData({ ...formData, estado: e.target.value as any })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-slate-800 dark:text-slate-200"
                >
                  <option value="activo">Activo</option>
                  <option value="inactivo">Inactivo</option>
                </select>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-lg font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold cursor-pointer"
                >
                  Guardar Plan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default Planes;
