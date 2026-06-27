import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import { CreditCard, Plus, Printer, Check, Trash2, Search, DollarSign, Calendar, Landmark } from "lucide-react";
import { Pago } from "../types";

export const Pagos: React.FC = () => {
  const { pagos, socios, planes, addPago, deletePago, configuracion } = useApp();
  
  // States
  const [searchTerm, setSearchTerm] = useState("");
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<Pago | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    socio_id: "",
    plan_id: "",
    metodo_pago: "Efectivo" as any
  });

  const handleOpenCheckout = () => {
    setFormData({
      socio_id: socios[0]?.id || "",
      plan_id: planes[0]?.id || "",
      metodo_pago: "Efectivo"
    });
    setShowCheckoutModal(true);
  };

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.socio_id || !formData.plan_id) return;
    try {
      const result = await addPago(formData.socio_id, formData.plan_id, formData.metodo_pago);
      setShowCheckoutModal(false);
      // Automatically open receipt of the new payment
      setSelectedReceipt(result);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleAnular = async (id: string, ref: string) => {
    if (confirm(`¿Está seguro de anular la transacción ${ref}? Se revertirá también el estado del socio si corresponde.`)) {
      await deletePago(id);
    }
  };

  const filteredPagos = pagos.filter((p) => {
    return (
      p.socio_nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.comprobante_numero.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <div className="space-y-6">
      {/* Search and checkout bar */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-sm flex flex-col md:flex-row justify-between items-stretch md:items-center space-y-4 md:space-y-0 gap-4 transition-colors duration-200">
        <div className="flex-1 max-w-md relative">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por Socio o Recibo..."
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2 pl-10 pr-4 text-xs text-slate-700 dark:text-slate-200 placeholder-slate-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition"
          />
        </div>

        <button
          onClick={handleOpenCheckout}
          className="flex items-center space-x-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Cobrar Cuota</span>
        </button>
      </div>

      {/* Main Grid: Left is history, Right is receipt drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column: Transaction logs */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm overflow-hidden transition-colors duration-200 text-xs">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4">Registro Histórico de Pagos</h3>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] text-slate-400 font-bold uppercase">
                  <th className="pb-3">Comprobante</th>
                  <th className="pb-3">Socio</th>
                  <th className="pb-3">Plan / Membresía</th>
                  <th className="pb-3">Monto</th>
                  <th className="pb-3">Método</th>
                  <th className="pb-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                {filteredPagos.map((pago) => (
                  <tr
                    key={pago.id}
                    onClick={() => setSelectedReceipt(pago)}
                    className={`hover:bg-slate-50/50 dark:hover:bg-slate-800/30 cursor-pointer transition ${
                      selectedReceipt?.id === pago.id ? "bg-slate-50 dark:bg-slate-800/40" : ""
                    }`}
                  >
                    <td className="py-3 font-mono font-bold text-slate-500 dark:text-slate-400">
                      {pago.comprobante_numero}
                    </td>
                    <td className="py-3 font-bold text-slate-800 dark:text-slate-200">
                      {pago.socio_nombre}
                    </td>
                    <td className="py-3 text-slate-600 dark:text-slate-400">
                      {pago.plan_nombre}
                    </td>
                    <td className="py-3 font-mono font-extrabold text-slate-800 dark:text-slate-200">
                      ${pago.monto.toLocaleString("es-AR")}
                    </td>
                    <td className="py-3">
                      <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded font-medium text-[10px]">
                        {pago.metodo_pago}
                      </span>
                    </td>
                    <td className="py-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-end space-x-1.5">
                        <button
                          onClick={() => setSelectedReceipt(pago)}
                          className="p-1.5 rounded-md border border-slate-100 dark:border-slate-800 hover:bg-slate-50 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                          title="Ver Comprobante"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleAnular(pago.id, pago.comprobante_numero)}
                          className="p-1.5 rounded-md border border-slate-100 dark:border-slate-800 hover:bg-rose-50 text-rose-500"
                          title="Anular Pago"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {filteredPagos.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-slate-400">
                      No se registran transacciones.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Dynamic printable Receipt display */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm transition-colors duration-200 text-xs">
          {selectedReceipt ? (
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800">
                <span className="font-bold text-slate-700 dark:text-slate-300">Recibo Fiscal / Ticket</span>
                <button
                  onClick={() => window.print()}
                  className="flex items-center space-x-1 px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 hover:text-slate-900 rounded font-semibold text-[10px] transition cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Imprimir</span>
                </button>
              </div>

              {/* Physical Receipt Container with standard thermal paper layout styling */}
              <div id="comprobante-impresion" className="border border-slate-200 dark:border-slate-800 p-5 rounded-xl bg-slate-50 dark:bg-slate-950 font-mono text-[10px] text-slate-700 dark:text-slate-300 space-y-4 relative overflow-hidden">
                {/* Logo simulation */}
                <div className="text-center border-b border-dashed border-slate-300 dark:border-slate-700 pb-3">
                  <div className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-xs">
                    {configuracion?.nombre_gimnasio || "GIMNASIO PRO FITNESS"}
                  </div>
                  <div className="text-[9px] text-slate-400 mt-1">
                    {configuracion?.direccion || "CABA, Argentina"}<br />
                    CUIT: {configuracion?.cuit || "30-71829302-9"}<br />
                    Tel: {configuracion?.telefono}
                  </div>
                </div>

                {/* Receipt ID and Dates */}
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span>Nro Comprobante:</span>
                    <span className="font-bold text-slate-900 dark:text-white">{selectedReceipt.comprobante_numero}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Fecha Pago:</span>
                    <span>{new Date(selectedReceipt.fecha_pago).toLocaleString("es-AR")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Vencimiento:</span>
                    <span className="font-bold text-rose-500">{new Date(selectedReceipt.fecha_vencimiento).toLocaleDateString("es-AR")}</span>
                  </div>
                </div>

                {/* Billing Details */}
                <div className="border-t border-b border-dashed border-slate-300 dark:border-slate-700 py-2.5 my-2 text-slate-800 dark:text-slate-200 font-bold space-y-1.5">
                  <div className="flex justify-between">
                    <span>SOCIO:</span>
                    <span>{selectedReceipt.socio_nombre}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>PLAN:</span>
                    <span className="font-normal text-xs">{selectedReceipt.plan_nombre}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>MÉTODO:</span>
                    <span>{selectedReceipt.metodo_pago}</span>
                  </div>
                </div>

                {/* Total */}
                <div className="flex justify-between items-center text-slate-900 dark:text-white pt-1">
                  <span className="font-bold">TOTAL ABONADO:</span>
                  <span className="text-base font-black">${selectedReceipt.monto.toLocaleString("es-AR")}</span>
                </div>

                {/* Footer terms */}
                <div className="text-center border-t border-dashed border-slate-300 dark:border-slate-700 pt-3 text-[8px] text-slate-400 leading-relaxed">
                  ¡Gracias por entrenar con nosotros!<br />
                  La cuota es de carácter intransferible.<br />
                  Conservar este comprobante fiscal digital.
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-slate-400 text-xs">
              Seleccione una transacción de la tabla para ver, exportar o simular la impresión térmica del comprobante.
            </div>
          )}
        </div>
      </div>

      {/* Checkout register modal */}
      {showCheckoutModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-xl text-xs">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4">Registrar Cobro de Cuota</h3>

            <form onSubmit={handleCheckoutSubmit} className="space-y-4">
              <div>
                <label className="block text-slate-500 font-semibold mb-1">Seleccionar Socio *</label>
                <select
                  required
                  value={formData.socio_id}
                  onChange={(e) => setFormData({ ...formData, socio_id: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-slate-800 dark:text-slate-200"
                >
                  <option value="" disabled>Seleccione socio...</option>
                  {socios.map((socio) => (
                    <option key={socio.id} value={socio.id}>
                      {socio.nombre} {socio.apellido} ({socio.dni}) [Estado: {socio.estado}]
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-500 font-semibold mb-1">Seleccionar Plan *</label>
                <select
                  required
                  value={formData.plan_id}
                  onChange={(e) => setFormData({ ...formData, plan_id: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-slate-800 dark:text-slate-200"
                >
                  {planes.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nombre} (${p.precio.toLocaleString("es-AR")} - {p.duracion_dias} días)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-500 font-semibold mb-1">Método de Pago *</label>
                <select
                  required
                  value={formData.metodo_pago}
                  onChange={(e) => setFormData({ ...formData, metodo_pago: e.target.value as any })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-slate-800 dark:text-slate-200"
                >
                  <option value="Efectivo">Efectivo</option>
                  <option value="Tarjeta de Crédito">Tarjeta de Crédito</option>
                  <option value="Tarjeta de Débito">Tarjeta de Débito</option>
                  <option value="Transferencia">Transferencia Bancaria</option>
                  <option value="Mercado Pago">Mercado Pago (Simulado)</option>
                </select>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowCheckoutModal(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-lg font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold cursor-pointer"
                >
                  Abonar y Activar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default Pagos;
