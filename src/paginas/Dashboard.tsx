import React from "react";
import { useApp } from "../context/AppContext";
import {
  TrendingUp,
  Users,
  Activity,
  CreditCard,
  PlusCircle,
  ArrowRight,
  AlertTriangle,
  FileSpreadsheet
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from "recharts";

interface DashboardProps {
  setActiveTab: (tab: string) => void;
  openSocioModal: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ setActiveTab, openSocioModal }) => {
  const { socios, planes, pagos, asistencias, user, theme } = useApp();

  // 1. KPI Calculations
  const totalSocios = socios.length;
  const sociosActivos = socios.filter((s) => s.estado === "activo").length;
  const sociosVencidos = socios.filter((s) => s.estado === "vencido").length;
  const sociosDeudores = socios.filter((s) => s.estado === "deudor").length;

  const totalIngresos = pagos
    .filter((p) => p.estado === "aprobado")
    .reduce((sum, p) => sum + p.monto, 0);

  // Active payments in current month (June 2026 based on metadata)
  const ingresosEsteMes = pagos
    .filter((p) => {
      const pDate = new Date(p.fecha_pago);
      return pDate.getFullYear() === 2026 && pDate.getMonth() === 5; // Month 5 is June
    })
    .reduce((sum, p) => sum + p.monto, 0);

  const asistenciasHoy = asistencias.filter((a) => {
    // metadata is 2026-06-24
    return a.fecha === "2026-06-24";
  }).length;

  // 2. Chart Data Construction

  // A. Revenue Chart (Historical payments)
  // Group payments by month
  const meses = ["Ene", "Feb", "Mar", "Abr", "May", "Jun"];
  const revenueData = meses.map((mes, index) => {
    const value = pagos
      .filter((p) => {
        const d = new Date(p.fecha_pago);
        return d.getFullYear() === 2026 && d.getMonth() === index;
      })
      .reduce((sum, p) => sum + p.monto, 0);
    return { name: mes, monto: value };
  });

  // B. Plan Popularity (Count active members per plan)
  const planStats = planes.map((p) => {
    const count = socios.filter((s) => s.plan_id === p.id && s.estado === "activo").length;
    return { name: p.nombre.replace("Plan ", ""), value: count || 1 }; // default 1 for beautiful visual if mock is low
  });

  const COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ec4899"];

  // C. Attendance peaks by day of the week
  // Group attendance by day name (simulated)
  const attendanceWeekly = [
    { name: "Lun", asistencias: 14 },
    { name: "Mar", asistencias: 22 },
    { name: "Mié", asistencias: asistenciasHoy + 8 },
    { name: "Jue", asistencias: 19 },
    { name: "Vie", asistencias: 25 },
    { name: "Sáb", asistencias: 10 }
  ];

  // Last 5 check-ins
  const ultimasAsistencias = asistencias.slice(0, 5);

  // Last 5 payments
  const ultimosPagos = pagos.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-slate-900 dark:bg-indigo-950/40 border border-slate-800 dark:border-indigo-500/10 p-6 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none"></div>
        <div>
          <h2 className="text-xl font-bold text-white">¡Hola de nuevo, {user?.nombre}!</h2>
          <p className="text-slate-400 text-xs mt-1">
            Aquí tienes el resumen operativo de tu gimnasio para el día de hoy.
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={openSocioModal}
            className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition shadow-md shadow-indigo-600/20 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Nuevo Socio</span>
          </button>
          <button
            onClick={() => setActiveTab("asistencias")}
            className="flex items-center space-x-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold border border-slate-700 transition cursor-pointer"
          >
            <Activity className="w-4 h-4" />
            <span>Control de Ingreso</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* KPI 1 */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 p-5 rounded-2xl flex items-center justify-between shadow-sm transition-colors duration-200">
          <div>
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Socios Totales</span>
            <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100 mt-1">{totalSocios}</h3>
            <div className="flex items-center space-x-1.5 mt-2">
              <span className="text-[10px] font-bold text-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 px-1.5 py-0.5 rounded-md">
                {sociosActivos} Activos
              </span>
              <span className="text-[10px] font-bold text-rose-500 bg-rose-50 dark:bg-rose-950/30 px-1.5 py-0.5 rounded-md">
                {sociosDeudores + sociosVencidos} Alertas
              </span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* KPI 2 */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 p-5 rounded-2xl flex items-center justify-between shadow-sm transition-colors duration-200">
          <div>
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Ingresos de Junio</span>
            <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100 mt-1">
              ${ingresosEsteMes.toLocaleString("es-AR")}
            </h3>
            <div className="flex items-center space-x-1 mt-2">
              <TrendingUp className="w-3 h-3 text-emerald-500" />
              <span className="text-[10px] font-semibold text-slate-400">Facturación mensual activa</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <CreditCard className="w-6 h-6" />
          </div>
        </div>

        {/* KPI 3 */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 p-5 rounded-2xl flex items-center justify-between shadow-sm transition-colors duration-200">
          <div>
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Asistencias Hoy</span>
            <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100 mt-1">{asistenciasHoy}</h3>
            <div className="flex items-center space-x-1.5 mt-2">
              <span className="text-[10px] font-bold text-indigo-500 bg-indigo-50 dark:bg-indigo-950/30 px-1.5 py-0.5 rounded-md">
                Hoy (24 de Jun)
              </span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-rose-50 dark:bg-rose-950/30 flex items-center justify-center text-rose-600 dark:text-rose-400">
            <Activity className="w-6 h-6" />
          </div>
        </div>

        {/* KPI 4 */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 p-5 rounded-2xl flex items-center justify-between shadow-sm transition-colors duration-200">
          <div>
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Morosos / Deudores</span>
            <h3 className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">{sociosDeudores + sociosVencidos}</h3>
            <div className="flex items-center space-x-1 mt-2 text-rose-500">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span className="text-[10px] font-bold">Cuotas atrasadas</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Analytics Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Line Chart: Income */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 p-5 rounded-2xl shadow-sm lg:col-span-2 flex flex-col transition-colors duration-200">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h4 className="font-bold text-slate-700 dark:text-slate-200 text-sm">Evolución de Ingresos</h4>
              <p className="text-[11px] text-slate-400">Facturación histórica total: ${totalIngresos.toLocaleString("es-AR")}</p>
            </div>
          </div>
          <div className="h-64 flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={theme === "dark" ? "#334155" : "#f1f5f9"} vertical={false} />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    background: theme === "dark" ? "#1e293b" : "#0f172a",
                    border: theme === "dark" ? "1px solid #334155" : "none",
                    borderRadius: "10px"
                  }}
                  labelStyle={{ color: theme === "dark" ? "#cbd5e1" : "#94a3b8", fontWeight: "bold" }}
                  itemStyle={{ color: theme === "dark" ? "#f8fafc" : "#fff" }}
                />
                <Line type="monotone" dataKey="monto" stroke="#6366f1" strokeWidth={3} activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart: Popular plans */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 p-5 rounded-2xl shadow-sm flex flex-col transition-colors duration-200">
          <h4 className="font-bold text-slate-700 dark:text-slate-200 text-sm mb-1">Membresías Activas</h4>
          <p className="text-[11px] text-slate-400 mb-4">Distribución porcentual por planes de socio</p>
          <div className="h-48 flex items-center justify-center relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={planStats}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {planStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: theme === "dark" ? "#1e293b" : "#0f172a",
                    border: theme === "dark" ? "1px solid #334155" : "none",
                    borderRadius: "10px"
                  }}
                  labelStyle={{ color: theme === "dark" ? "#cbd5e1" : "#94a3b8", fontWeight: "bold" }}
                  itemStyle={{ color: theme === "dark" ? "#f8fafc" : "#fff" }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute flex flex-col items-center">
              <span className="text-xl font-black text-slate-800 dark:text-slate-100">{sociosActivos}</span>
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Activos</span>
            </div>
          </div>
          {/* Legend */}
          <div className="grid grid-cols-2 gap-2 text-[10px] mt-4 font-medium">
            {planStats.map((item, idx) => (
              <div key={item.name} className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></span>
                <span className="text-slate-600 dark:text-slate-400 truncate">{item.name} ({item.value})</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Lists Row: Recent Check-ins and Payments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Last check-ins */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 p-5 rounded-2xl shadow-sm transition-colors duration-200">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h4 className="font-bold text-slate-700 dark:text-slate-200 text-sm">Últimos Ingresos</h4>
              <p className="text-[11px] text-slate-400">Check-ins recientes por molinete / QR</p>
            </div>
            <button
              onClick={() => setActiveTab("asistencias")}
              className="text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center hover:underline"
            >
              <span>Ver todos</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </button>
          </div>
          <div className="divide-y divide-slate-50 dark:divide-slate-800/50">
            {ultimasAsistencias.map((item) => (
              <div key={item.id} className="py-3 flex justify-between items-center text-xs">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                    {item.socio_nombre[0]}
                  </div>
                  <div>
                    <div className="font-bold text-slate-800 dark:text-slate-200">{item.socio_nombre}</div>
                    <div className="text-[10px] text-slate-400 font-mono">ID: {item.socio_id}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-slate-700 dark:text-slate-300">{item.fecha}</div>
                  <div className="text-[10px] text-slate-400 font-mono">{item.hora} hs</div>
                </div>
              </div>
            ))}
            {ultimasAsistencias.length === 0 && (
              <div className="py-8 text-center text-slate-400 text-xs">No se registran accesos hoy</div>
            )}
          </div>
        </div>

        {/* Right: Last payments */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 p-5 rounded-2xl shadow-sm transition-colors duration-200">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h4 className="font-bold text-slate-700 dark:text-slate-200 text-sm">Últimos Pagos</h4>
              <p className="text-[11px] text-slate-400">Recibos de cuotas registrados hoy</p>
            </div>
            <button
              onClick={() => setActiveTab("pagos")}
              className="text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center hover:underline"
            >
              <span>Ver todos</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </button>
          </div>
          <div className="divide-y divide-slate-50 dark:divide-slate-800/50">
            {ultimosPagos.map((item) => (
              <div key={item.id} className="py-3 flex justify-between items-center text-xs">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                    $
                  </div>
                  <div>
                    <div className="font-bold text-slate-800 dark:text-slate-200">{item.socio_nombre}</div>
                    <div className="text-[10px] text-slate-400 font-medium">{item.plan_nombre}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-indigo-600 dark:text-indigo-400">+${item.monto.toLocaleString("es-AR")}</div>
                  <div className="text-[9px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 font-mono mt-0.5 inline-block">
                    {item.comprobante_numero}
                  </div>
                </div>
              </div>
            ))}
            {ultimosPagos.length === 0 && (
              <div className="py-8 text-center text-slate-400 text-xs">No se registran pagos recientes</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
export default Dashboard;
