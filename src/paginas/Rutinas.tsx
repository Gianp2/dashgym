import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import { Plus, Trash2, Edit, Save, Dumbbell, Sparkles, BrainCircuit, User, ShieldCheck, Clipboard, MessageSquare, AlertCircle, RefreshCcw } from "lucide-react";
import { Rutina, Ejercicio } from "../types";

export const Rutinas: React.FC = () => {
  const { rutinas, socios, entrenadores, addRutina, deleteRutina } = useApp();
  const [showModal, setShowModal] = useState(false);
  
  // Selected routine to inspect
  const [selectedRutina, setSelectedRutina] = useState<Rutina | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    socio_id: "",
    entrenador_id: "",
    nombre: "",
    descripcion: ""
  });
  const [ejercicios, setEjercicios] = useState<Omit<Ejercicio, "id">[]>([
    { ejercicio: "Sentadilla Goblet", series: 4, repeticiones: "10-12", peso: "15kg", descanso: "90s" }
  ]);

  const addExerciseRow = () => {
    setEjercicios([
      ...ejercicios,
      { ejercicio: "", series: 3, repeticiones: "12", peso: "", descanso: "60s" }
    ]);
  };

  const removeExerciseRow = (index: number) => {
    if (ejercicios.length === 1) return;
    const next = [...ejercicios];
    next.splice(index, 1);
    setEjercicios(next);
  };

  const handleExerciseChange = (index: number, field: string, value: any) => {
    const next = [...ejercicios];
    next[index] = {
      ...next[index],
      [field]: value
    };
    setEjercicios(next);
  };

  const handleOpenForm = () => {
    setFormData({
      socio_id: socios[0]?.id || "",
      entrenador_id: entrenadores[0]?.id || "",
      nombre: "Rutina Acondicionamiento Gral",
      descripcion: "Plan semanal para entrenar lunes, miércoles y viernes."
    });
    setEjercicios([
      { ejercicio: "Sentadilla Goblet", series: 4, repeticiones: "10-12", peso: "15kg", descanso: "90s" }
    ]);
    setShowModal(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.socio_id || !formData.nombre) return;

    try {
      // Append random IDs to exercises
      const mappedEjercicios = ejercicios.map((ex, i) => ({
        ...ex,
        id: "ex-" + Date.now() + "-" + i
      }));

      const newRutina = await addRutina({
        ...formData,
        ejercicios: mappedEjercicios
      });

      setShowModal(false);
      setSelectedRutina(newRutina);
    } catch (err) {
      alert("Error al guardar la rutina");
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`¿Está seguro de eliminar la rutina "${name}"?`)) {
      await deleteRutina(id);
      if (selectedRutina?.id === id) setSelectedRutina(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Action Header */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-sm flex flex-col md:flex-row justify-between items-stretch md:items-center space-y-4 md:space-y-0 gap-4 transition-colors duration-200">
        <div>
          <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200">Fichas de Entrenamiento Personalizadas</h2>
          <p className="text-slate-400 text-[11px] mt-0.5">Gestione y planifique las rutinas de entrenamiento físico de sus alumnos</p>
        </div>
        <button
          onClick={handleOpenForm}
          className="flex items-center space-x-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Nueva Ficha Manual</span>
        </button>
      </div>

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: List of current routines (span 5) */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-5 rounded-2xl shadow-sm transition-colors duration-200 text-xs space-y-4">
          <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm">Fichas Registradas</h3>
          
          <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
            {rutinas.map((r) => (
              <div
                key={r.id}
                onClick={() => setSelectedRutina(r)}
                className={`p-3.5 border rounded-xl cursor-pointer transition flex justify-between items-start ${
                  selectedRutina?.id === r.id
                    ? "border-indigo-500 bg-slate-50 dark:bg-slate-800/20"
                    : "border-slate-100 dark:border-slate-850 hover:border-slate-200 dark:hover:border-slate-750"
                }`}
              >
                <div className="space-y-1">
                  <div className="font-bold text-slate-800 dark:text-slate-200">{r.nombre}</div>
                  <div className="text-[10px] text-slate-400">Socio: <span className="font-bold text-slate-500 dark:text-slate-300">{r.socio_nombre}</span></div>
                  <div className="text-[10px] text-slate-400">Coach: {r.entrenador_nombre}</div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(r.id, r.nombre);
                  }}
                  className="p-1 text-slate-400 hover:text-rose-500 rounded hover:bg-rose-50 dark:hover:bg-rose-950/20 transition"
                  title="Eliminar rutina"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}

            {rutinas.length === 0 && (
              <div className="text-center py-12 text-slate-400">No hay fichas manuales creadas aún.</div>
            )}
          </div>
        </div>

        {/* Right Column: Selected routine detail sheet (span 7) */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-5 rounded-2xl shadow-sm transition-colors duration-200 text-xs">
          {selectedRutina ? (
            <div className="space-y-4">
              <div className="pb-3 border-b border-slate-50 dark:border-slate-850">
                <span className="text-[9px] font-bold text-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded-md uppercase tracking-wider">
                  Ficha de Entrenamiento
                </span>
                <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-sm mt-1">{selectedRutina.nombre}</h3>
                <p className="text-slate-500 dark:text-slate-400 text-[10px] mt-1 italic">
                  &ldquo;{selectedRutina.descripcion}&rdquo;
                </p>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[10px] text-slate-400 font-bold uppercase tracking-wide">
                  <span>Socio:</span>
                  <span className="text-slate-700 dark:text-slate-200 font-black">{selectedRutina.socio_nombre}</span>
                </div>
                <div className="flex justify-between text-[10px] text-slate-400 font-bold uppercase tracking-wide">
                  <span>Profesor:</span>
                  <span className="text-slate-700 dark:text-slate-200">{selectedRutina.entrenador_nombre}</span>
                </div>
              </div>

              {/* Exercises workout list */}
              <div className="pt-3 border-t border-slate-50 dark:border-slate-800/80">
                <div className="font-bold text-slate-700 dark:text-slate-300 mb-2">Ejercicios Planificados:</div>
                <div className="space-y-2.5 max-h-[220px] overflow-y-auto">
                  {selectedRutina.ejercicios.map((ex, index) => (
                    <div key={ex.id || index} className="p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-lg">
                      <div className="font-bold text-slate-800 dark:text-slate-200 text-[11px] mb-1">
                        {index + 1}. {ex.ejercicio}
                      </div>
                      <div className="grid grid-cols-4 gap-1 text-[9px] font-mono text-slate-500 dark:text-slate-400">
                        <div><span className="block font-sans text-[8px] font-bold uppercase text-slate-400">Sets</span>{ex.series}</div>
                        <div><span className="block font-sans text-[8px] font-bold uppercase text-slate-400">Reps</span>{ex.repeticiones}</div>
                        <div><span className="block font-sans text-[8px] font-bold uppercase text-slate-400">Carga</span>{ex.peso}</div>
                        <div><span className="block font-sans text-[8px] font-bold uppercase text-slate-400">Pausa</span>{ex.descanso}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-slate-400">
              Seleccione una ficha de entrenamiento registrada para inspeccionar su grilla de series y cargas.
            </div>
          )}
        </div>
      </div>

      {/* Manual Routine Form Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl w-full max-w-xl p-6 shadow-xl text-xs max-h-[90vh] overflow-y-auto">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4">Confeccionar Ficha de Entrenamiento Manual</h3>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Socio Receptor *</label>
                  <select
                    required
                    value={formData.socio_id}
                    onChange={(e) => setFormData({ ...formData, socio_id: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-slate-800 dark:text-slate-200"
                  >
                    {socios.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.nombre} {s.apellido} ({s.dni})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Entrenador Firma *</label>
                  <select
                    required
                    value={formData.entrenador_id}
                    onChange={(e) => setFormData({ ...formData, entrenador_id: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-slate-800 dark:text-slate-200"
                  >
                    {entrenadores.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.nombre} {e.apellido}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-500 font-semibold mb-1">Nombre de la Rutina *</label>
                <input
                  type="text"
                  required
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  placeholder="Ej: Rutina Pierna / Empuje"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-slate-800 dark:text-slate-200"
                />
              </div>

              <div>
                <label className="block text-slate-500 font-semibold mb-1">Descripción / Frecuencia</label>
                <input
                  type="text"
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  placeholder="Ej: Frecuencia 2, lunes y jueves"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-slate-800 dark:text-slate-200"
                />
              </div>

              {/* Dynamic Exercise Grid Rows */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-bold text-slate-700 dark:text-slate-300">Ejercicios / Series y Cargas</span>
                  <button
                    type="button"
                    onClick={addExerciseRow}
                    className="px-2 py-1 bg-indigo-55 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 text-indigo-600 dark:text-indigo-400 rounded font-bold text-[10px]"
                  >
                    + Agregar Fila
                  </button>
                </div>

                <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                  {ejercicios.map((ex, idx) => (
                    <div key={idx} className="flex items-center space-x-2.5 p-2 bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-800 rounded-lg">
                      <div className="flex-1 min-w-[120px]">
                        <input
                          type="text"
                          required
                          value={ex.ejercicio}
                          onChange={(e) => handleExerciseChange(idx, "ejercicio", e.target.value)}
                          placeholder="Nombre ejercicio"
                          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded p-1"
                        />
                      </div>
                      <div className="w-12">
                        <input
                          type="number"
                          required
                          value={ex.series}
                          onChange={(e) => handleExerciseChange(idx, "series", Number(e.target.value))}
                          placeholder="Sets"
                          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded p-1 text-center"
                        />
                      </div>
                      <div className="w-18">
                        <input
                          type="text"
                          required
                          value={ex.repeticiones}
                          onChange={(e) => handleExerciseChange(idx, "repeticiones", e.target.value)}
                          placeholder="Reps"
                          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded p-1 text-center"
                        />
                      </div>
                      <div className="w-18">
                        <input
                          type="text"
                          value={ex.peso}
                          onChange={(e) => handleExerciseChange(idx, "peso", e.target.value)}
                          placeholder="Carga"
                          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded p-1 text-center"
                        />
                      </div>
                      <div className="w-18">
                        <input
                          type="text"
                          value={ex.descanso}
                          onChange={(e) => handleExerciseChange(idx, "descanso", e.target.value)}
                          placeholder="Pausa"
                          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded p-1 text-center"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeExerciseRow(idx)}
                        className="p-1 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
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
                  Guardar Ficha
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default Rutinas;
