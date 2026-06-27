import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import { Plus, Edit2, Trash2, ShieldAlert, Award, Phone, Mail } from "lucide-react";
import { Entrenador } from "../types";

export const Entrenadores: React.FC = () => {
  const { entrenadores, addEntrenador, updateEntrenador, deleteEntrenador } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [editingEnt, setEditingEnt] = useState<Entrenador | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    nombre: "",
    apellido: "",
    especialidad: "",
    telefono: "",
    correo: "",
    estado: "activo" as "activo" | "inactivo"
  });

  const handleOpenForm = (ent?: Entrenador) => {
    if (ent) {
      setEditingEnt(ent);
      setFormData({
        nombre: ent.nombre,
        apellido: ent.apellido,
        especialidad: ent.especialidad,
        telefono: ent.telefono,
        correo: ent.correo,
        estado: ent.estado
      });
    } else {
      setEditingEnt(null);
      setFormData({
        nombre: "",
        apellido: "",
        especialidad: "",
        telefono: "",
        correo: "",
        estado: "activo"
      });
    }
    setShowModal(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingEnt) {
        await updateEntrenador(editingEnt.id, formData);
      } else {
        await addEntrenador(formData);
      }
      setShowModal(false);
    } catch (err) {
      alert("Error al registrar entrenador");
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`¿Está seguro de eliminar al entrenador ${name}? Se desvinculará de sus rutinas asociadas.`)) {
      await deleteEntrenador(id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top action header */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-sm flex justify-between items-center transition-colors duration-200">
        <div>
          <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200">Staff Técnico / Entrenadores</h2>
          <p className="text-slate-400 text-[11px] mt-0.5">Asigne entrenadores especializados para confeccionar y auditar las rutinas de los socios</p>
        </div>
        <button
          onClick={() => handleOpenForm()}
          className="flex items-center space-x-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Agregar Entrenador</span>
        </button>
      </div>

      {/* Grid List */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {entrenadores.map((ent) => (
          <div
            key={ent.id}
            className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between"
          >
            <div>
              <div className="flex justify-between items-start mb-3">
                <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center font-black text-sm">
                  {ent.nombre[0]}{ent.apellido[0]}
                </div>
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ${
                  ent.estado === "activo"
                    ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-400"
                }`}>
                  {ent.estado}
                </span>
              </div>

              <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-sm">
                {ent.nombre} {ent.apellido}
              </h3>
              
              <div className="flex items-start space-x-1.5 mt-2 text-indigo-600 dark:text-indigo-400">
                <Award className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                <span className="text-[11px] leading-relaxed font-bold">{ent.especialidad}</span>
              </div>

              {/* Contact metadata */}
              <div className="pt-3 mt-3 border-t border-slate-50 dark:border-slate-800/60 text-[10px] space-y-1.5 text-slate-500 dark:text-slate-400">
                <div className="flex items-center space-x-2">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{ent.telefono || "Sin teléfono registrado"}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Mail className="w-3.5 h-3.5 text-slate-400 truncate" />
                  <span className="truncate">{ent.correo || "Sin correo electrónico"}</span>
                </div>
              </div>
            </div>

            {/* Actions row */}
            <div className="pt-4 mt-4 border-t border-slate-50 dark:border-slate-800/60 flex justify-end space-x-1.5">
              <button
                onClick={() => handleOpenForm(ent)}
                className="px-3 py-1.5 rounded-lg border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold transition cursor-pointer"
              >
                Editar Perfil
              </button>
              <button
                onClick={() => handleDelete(ent.id, `${ent.nombre} ${ent.apellido}`)}
                className="p-1.5 rounded-lg border border-slate-100 dark:border-slate-800 hover:bg-rose-50 text-rose-500 transition"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Form Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-xl text-xs">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4">
              {editingEnt ? "Modificar Entrenador" : "Agregar Nuevo Entrenador"}
            </h3>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Nombre *</label>
                  <input
                    type="text"
                    required
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-slate-800 dark:text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Apellido *</label>
                  <input
                    type="text"
                    required
                    value={formData.apellido}
                    onChange={(e) => setFormData({ ...formData, apellido: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-slate-800 dark:text-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-500 font-semibold mb-1">Especialidad / Perfil Deportivo *</label>
                <input
                  type="text"
                  required
                  value={formData.especialidad}
                  onChange={(e) => setFormData({ ...formData, especialidad: e.target.value })}
                  placeholder="Ej: Crossfit L1, Preparador Físico, Nutricionista"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-slate-800 dark:text-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Teléfono</label>
                  <input
                    type="text"
                    value={formData.telefono}
                    onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-slate-800 dark:text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Correo Electrónico</label>
                  <input
                    type="email"
                    value={formData.correo}
                    onChange={(e) => setFormData({ ...formData, correo: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-slate-800 dark:text-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-500 font-semibold mb-1">Estado Administrativo</label>
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
                  Guardar Entrenador
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default Entrenadores;
