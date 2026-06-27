import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import {
  Search,
  Filter,
  UserPlus,
  QrCode,
  Edit2,
  Trash2,
  Check,
  AlertCircle,
  TrendingDown,
  ChevronRight,
  Sparkles,
  Phone,
  Mail,
  MapPin,
  Target,
  FileSpreadsheet
} from "lucide-react";
import { Socio } from "../types";

export const Socios: React.FC = () => {
  const { socios, planes, addSocio, updateSocio, deleteSocio } = useApp();
  
  // Search and Filter State
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"todos" | "activo" | "vencido" | "deudor">("todos");

  // Selected Member for Detail or QR
  const [selectedSocio, setSelectedSocio] = useState<Socio | null>(null);
  const [showQRModal, setShowQRModal] = useState(false);

  // Form State
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingSocio, setEditingSocio] = useState<Socio | null>(null);

  const [formData, setFormData] = useState({
    nombre: "",
    apellido: "",
    dni: "",
    fecha_nacimiento: "",
    sexo: "Masculino" as any,
    telefono: "",
    correo: "",
    direccion: "",
    ciudad: "",
    provincia: "",
    peso: "",
    altura: "",
    objetivo: "",
    observaciones: "",
    plan_id: "",
    estado: "activo" as any
  });

  const handleOpenForm = (socio?: Socio) => {
    if (socio) {
      setEditingSocio(socio);
      setFormData({
        nombre: socio.nombre,
        apellido: socio.apellido,
        dni: socio.dni,
        fecha_nacimiento: socio.fecha_nacimiento,
        sexo: socio.sexo,
        telefono: socio.telefono,
        correo: socio.correo,
        direccion: socio.direccion,
        ciudad: socio.ciudad,
        provincia: socio.provincia,
        peso: String(socio.peso),
        altura: String(socio.altura),
        objetivo: socio.objetivo,
        observaciones: socio.observaciones || "",
        plan_id: socio.plan_id,
        estado: socio.estado
      });
    } else {
      setEditingSocio(null);
      setFormData({
        nombre: "",
        apellido: "",
        dni: "",
        fecha_nacimiento: "",
        sexo: "Masculino",
        telefono: "",
        correo: "",
        direccion: "",
        ciudad: "",
        provincia: "",
        peso: "",
        altura: "",
        objetivo: "",
        observaciones: "",
        plan_id: planes[0]?.id || "",
        estado: "activo"
      });
    }
    setShowFormModal(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        peso: Number(formData.peso) || 0,
        altura: Number(formData.altura) || 0
      };

      if (editingSocio) {
        await updateSocio(editingSocio.id, payload);
      } else {
        await addSocio(payload);
      }
      setShowFormModal(false);
    } catch (err) {
      alert("Error al guardar socio");
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`¿Está seguro de que desea eliminar al socio ${name}? Se borrarán también sus datos de asistencia.`)) {
      await deleteSocio(id);
      if (selectedSocio?.id === id) setSelectedSocio(null);
    }
  };

  // Filter Logic
  const filteredSocios = socios.filter((s) => {
    const matchesSearch =
      `${s.nombre} ${s.apellido}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.dni.includes(searchTerm) ||
      s.correo.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "todos" || s.estado === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Search and Action Bar */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-sm flex flex-col md:flex-row justify-between items-stretch md:items-center space-y-4 md:space-y-0 gap-4 transition-colors duration-200">
        <div className="flex-1 max-w-md relative">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por Nombre, DNI o Correo..."
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2 pl-10 pr-4 text-xs text-slate-700 dark:text-slate-200 placeholder-slate-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition"
          />
        </div>

        {/* Filter and Create Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Status filter buttons */}
          <div className="bg-slate-100 dark:bg-slate-950 p-1 rounded-xl flex space-x-1 border border-slate-200/50 dark:border-slate-800/50">
            {(["todos", "activo", "vencido", "deudor"] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setStatusFilter(filter)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition cursor-pointer ${
                  statusFilter === filter
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                }`}
              >
                {filter === "todos" ? "Todos" : filter === "activo" ? "Activos" : filter === "vencido" ? "Vencidos" : "Deudores"}
              </button>
            ))}
          </div>

          <button
            onClick={() => handleOpenForm()}
            className="flex items-center space-x-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Agregar Socio</span>
          </button>
        </div>
      </div>

      {/* Main Split Grid: Left is Members List, Right is Details Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column: Member cards/table */}
        <div className="lg:col-span-2 space-y-3">
          {filteredSocios.map((socio) => {
            const plan = planes.find((p) => p.id === socio.plan_id);

            return (
              <div
                key={socio.id}
                onClick={() => setSelectedSocio(socio)}
                className={`bg-white dark:bg-slate-900 border p-4.5 rounded-2xl flex items-center justify-between shadow-sm cursor-pointer transition ${
                  selectedSocio?.id === socio.id
                    ? "border-indigo-500 ring-1 ring-indigo-500 bg-slate-50/50 dark:bg-slate-800/20"
                    : "border-slate-100 dark:border-slate-800/80 hover:border-slate-200 dark:hover:border-slate-700"
                }`}
              >
                <div className="flex items-center space-x-3.5">
                  <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center font-black">
                    {socio.nombre[0]}{socio.apellido[0]}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                        {socio.nombre} {socio.apellido}
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 font-bold rounded-full uppercase ${
                        socio.estado === "activo"
                          ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400"
                          : socio.estado === "vencido"
                          ? "bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400"
                          : "bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400"
                      }`}>
                        {socio.estado}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 font-medium mt-1">
                      DNI: <span className="font-mono">{socio.dni}</span> | Plan: <span className="text-slate-500 dark:text-slate-300 font-bold">{plan ? plan.nombre : "Sin Plan"}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => {
                      setSelectedSocio(socio);
                      setShowQRModal(true);
                    }}
                    className="p-1.5 rounded-lg border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition"
                    title="Ver QR de Acceso"
                  >
                    <QrCode className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleOpenForm(socio)}
                    className="p-1.5 rounded-lg border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-indigo-600 dark:text-indigo-400 transition"
                    title="Editar"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(socio.id, `${socio.nombre} ${socio.apellido}`)}
                    className="p-1.5 rounded-lg border border-slate-100 dark:border-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-rose-600 dark:text-rose-400 transition"
                    title="Eliminar"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}

          {filteredSocios.length === 0 && (
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-12 rounded-2xl text-center text-slate-400 text-xs">
              No se encontraron socios que coincidan con los filtros aplicados.
            </div>
          )}
        </div>

        {/* Right Column: Member detailed profile card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm transition-colors duration-200">
          {selectedSocio ? (
            <div className="space-y-5 text-xs">
              {/* Header profile badge */}
              <div className="flex flex-col items-center text-center pb-4 border-b border-slate-50 dark:border-slate-800/60">
                <div className="w-16 h-16 rounded-full bg-indigo-600 text-white flex items-center justify-center font-black text-xl mb-3 shadow-md">
                  {selectedSocio.nombre[0]}{selectedSocio.apellido[0]}
                </div>
                <h4 className="font-bold text-slate-800 dark:text-slate-200 text-base">
                  {selectedSocio.nombre} {selectedSocio.apellido}
                </h4>
                <span className={`px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider text-[9px] mt-1.5 ${
                  selectedSocio.estado === "activo"
                    ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400"
                    : selectedSocio.estado === "vencido"
                    ? "bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400"
                    : "bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400"
                }`}>
                  Socio {selectedSocio.estado}
                </span>
              </div>

              {/* Physical Metrics */}
              <div className="grid grid-cols-2 gap-3.5 bg-slate-50 dark:bg-slate-950 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Peso Corporal</span>
                  <div className="font-mono text-sm font-bold text-slate-800 dark:text-slate-200 mt-1">
                    {selectedSocio.peso} kg
                  </div>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Altura</span>
                  <div className="font-mono text-sm font-bold text-slate-800 dark:text-slate-200 mt-1">
                    {selectedSocio.altura} cm
                  </div>
                </div>
              </div>

              {/* Goal & Observations */}
              <div className="space-y-3">
                <div className="flex items-start space-x-2">
                  <Target className="w-4 h-4 text-indigo-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-bold text-slate-700 dark:text-slate-300">Objetivo Deportivo:</span>
                    <p className="text-slate-500 dark:text-slate-400 mt-0.5 text-[11px] leading-relaxed">{selectedSocio.objetivo}</p>
                  </div>
                </div>

                <div className="flex items-start space-x-2">
                  <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-bold text-slate-700 dark:text-slate-300">Observaciones de Salud:</span>
                    <p className="text-slate-500 dark:text-slate-400 mt-0.5 text-[11px] leading-relaxed">
                      {selectedSocio.observaciones || "Sin observaciones o patologías registradas."}
                    </p>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="space-y-2 pt-4 border-t border-slate-50 dark:border-slate-800/60 text-[11px]">
                <div className="flex items-center space-x-2 text-slate-600 dark:text-slate-400">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{selectedSocio.telefono}</span>
                </div>
                <div className="flex items-center space-x-2 text-slate-600 dark:text-slate-400">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span className="truncate">{selectedSocio.correo}</span>
                </div>
                <div className="flex items-center space-x-2 text-slate-600 dark:text-slate-400">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span className="truncate">{selectedSocio.direccion}, {selectedSocio.ciudad}</span>
                </div>
              </div>

              {/* Action trigger for access */}
              <button
                onClick={() => {
                  setShowQRModal(true);
                }}
                className="w-full flex items-center justify-center space-x-2 py-2 border border-indigo-100 dark:border-slate-800 bg-indigo-50/50 dark:bg-slate-800/50 hover:bg-indigo-100/50 dark:hover:bg-slate-800 text-indigo-700 dark:text-indigo-400 font-bold rounded-xl transition cursor-pointer"
              >
                <QrCode className="w-4 h-4" />
                <span>Generar Credencial QR de Acceso</span>
              </button>
            </div>
          ) : (
            <div className="text-center py-12 text-slate-400 text-xs">
              Seleccione un socio del listado para ver su ficha médica, objetivos y credencial QR de acceso.
            </div>
          )}
        </div>
      </div>

      {/* Form Modal (Add / Edit Socio) */}
      {showFormModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl w-full max-w-2xl p-6 shadow-xl text-xs max-h-[90vh] overflow-y-auto">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4">
              {editingSocio ? "Editar Datos del Socio" : "Registrar Nuevo Socio"}
            </h3>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              {/* Row 1: Nombre y Apellido */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

              {/* Row 2: DNI y Fecha Nacimiento */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">DNI *</label>
                  <input
                    type="text"
                    required
                    value={formData.dni}
                    onChange={(e) => setFormData({ ...formData, dni: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-slate-800 dark:text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Fecha de Nacimiento</label>
                  <input
                    type="date"
                    value={formData.fecha_nacimiento}
                    onChange={(e) => setFormData({ ...formData, fecha_nacimiento: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-slate-800 dark:text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Sexo</label>
                  <select
                    value={formData.sexo}
                    onChange={(e) => setFormData({ ...formData, sexo: e.target.value as any })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-slate-800 dark:text-slate-200"
                  >
                    <option value="Masculino">Masculino</option>
                    <option value="Femenino">Femenino</option>
                    <option value="Otro">Otro</option>
                  </select>
                </div>
              </div>

              {/* Row 3: Contacto */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

              {/* Row 4: Direccion, Ciudad, Provincia */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Dirección</label>
                  <input
                    type="text"
                    value={formData.direccion}
                    onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-slate-800 dark:text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Ciudad</label>
                  <input
                    type="text"
                    value={formData.ciudad}
                    onChange={(e) => setFormData({ ...formData, ciudad: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-slate-800 dark:text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Provincia</label>
                  <input
                    type="text"
                    value={formData.provincia}
                    onChange={(e) => setFormData({ ...formData, provincia: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-slate-800 dark:text-slate-200"
                  />
                </div>
              </div>

              {/* Row 5: Physical assessments */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Peso Corporal (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.peso}
                    onChange={(e) => setFormData({ ...formData, peso: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-slate-800 dark:text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Altura (cm)</label>
                  <input
                    type="number"
                    value={formData.altura}
                    onChange={(e) => setFormData({ ...formData, altura: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-slate-800 dark:text-slate-200"
                  />
                </div>
              </div>

              {/* Goals, medical observations, and base plan selection */}
              <div>
                <label className="block text-slate-500 font-semibold mb-1">Objetivos del Alumno</label>
                <textarea
                  value={formData.objetivo}
                  onChange={(e) => setFormData({ ...formData, objetivo: e.target.value })}
                  placeholder="Acondicionamiento físico, hipertrofia, resistencia, etc."
                  rows={2}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-slate-800 dark:text-slate-200"
                ></textarea>
              </div>

              <div>
                <label className="block text-slate-500 font-semibold mb-1">Observaciones Médicas o de Cuidado</label>
                <textarea
                  value={formData.observaciones}
                  onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                  placeholder="Cirugías, dolores lumbares, asma, etc."
                  rows={2}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-slate-800 dark:text-slate-200"
                ></textarea>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Membresía / Plan Base</label>
                  <select
                    value={formData.plan_id}
                    onChange={(e) => setFormData({ ...formData, plan_id: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-slate-800 dark:text-slate-200"
                  >
                    {planes.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nombre} (${p.precio})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Estado Operativo</label>
                  <select
                    value={formData.estado}
                    onChange={(e) => setFormData({ ...formData, estado: e.target.value as any })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-slate-800 dark:text-slate-200"
                  >
                    <option value="activo">Activo</option>
                    <option value="vencido">Vencido</option>
                    <option value="deudor">Deudor (En deuda)</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end space-x-2.5">
                <button
                  type="button"
                  onClick={() => setShowFormModal(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-lg font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold cursor-pointer"
                >
                  Guardar Socio
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QR Credential Access Modal */}
      {showQRModal && selectedSocio && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl w-full max-w-sm p-6 text-center shadow-xl text-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Credencial Digital del Socio</h3>
            <p className="text-slate-400 text-[10px]">Utiliza este código o el DNI del socio para registrar el ingreso en el control de asistencias</p>
            
            {/* Visual QR Simulator */}
            <div className="bg-slate-50 dark:bg-white p-5 rounded-xl inline-block border border-slate-100/80 mx-auto">
              <div className="w-40 h-40 border-4 border-slate-900 flex flex-col items-center justify-center p-1 relative">
                {/* QR dots simulator */}
                <div className="grid grid-cols-5 gap-1.5 w-full h-full p-2">
                  {[...Array(25)].map((_, i) => (
                    <div
                      key={i}
                      className={`rounded-sm ${(i * 7 + 13) % 5 === 0 || (i % 4 === 0) || (i < 5 && i !== 2) || (i > 20) || (i % 5 === 0) ? "bg-slate-900" : "bg-transparent"}`}
                    ></div>
                  ))}
                </div>
                {/* Overlay code label */}
                <div className="absolute bg-white border border-slate-200 px-2 py-0.5 rounded-md font-mono font-bold text-[9px] text-slate-800 shadow-sm">
                  {selectedSocio.qr}
                </div>
              </div>
            </div>

            <div>
              <div className="font-bold text-slate-800 dark:text-slate-200">{selectedSocio.nombre} {selectedSocio.apellido}</div>
              <div className="text-[10px] text-slate-400 font-mono mt-0.5">DNI: {selectedSocio.dni}</div>
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setShowQRModal(false)}
                className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-bold cursor-pointer"
              >
                Cerrar Credencial
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default Socios;
