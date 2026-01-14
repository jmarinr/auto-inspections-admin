import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, Clock, CheckCircle, AlertTriangle, RotateCcw,
  Eye, ChevronDown, Filter, Plus, BarChart3, Car,
  User, Calendar, TrendingUp, ArrowUpRight, MoreHorizontal,
  RefreshCw, Bell, Settings, LogOut, ChevronRight, FileText
} from 'lucide-react';
import { getInspections, type Inspection } from '../lib/supabase';

export default function Dashboard() {
  const navigate = useNavigate();
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');

  useEffect(() => { loadInspections(); }, []);

  const loadInspections = async () => {
    setLoading(true);
    try {
      const data = await getInspections();
      setInspections(data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const filteredInspections = inspections.filter(ins => {
    const matchesSearch = searchTerm === '' || 
      ins.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ins.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ins.vehicle_plate?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || ins.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    pending: inspections.filter(i => i.status === 'Pendiente').length,
    inReview: inspections.filter(i => i.status === 'En Revisión').length,
    approved: inspections.filter(i => i.status === 'Aprobada').length,
    reinspection: inspections.filter(i => i.status === 'Reinspección').length,
  };

  const calculateSLA = (deadline: string | null) => {
    if (!deadline) return { text: 'N/A', urgent: false, color: 'text-slate-400' };
    const now = new Date();
    const dl = new Date(deadline);
    const diff = dl.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    if (diff <= 0) return { text: 'Vencido', urgent: true, color: 'text-red-600' };
    if (hours < 4) return { text: `${hours}h ${minutes}m`, urgent: true, color: 'text-red-600' };
    if (hours < 12) return { text: `${hours}h ${minutes}m`, urgent: false, color: 'text-amber-600' };
    return { text: `${hours}h ${minutes}m`, urgent: false, color: 'text-emerald-600' };
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'Pendiente': return { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', dot: 'bg-amber-500' };
      case 'En Revisión': return { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', dot: 'bg-blue-500' };
      case 'Aprobada': return { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500' };
      case 'Rechazada': return { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', dot: 'bg-red-500' };
      case 'Reinspección': return { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', dot: 'bg-purple-500' };
      default: return { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200', dot: 'bg-slate-500' };
    }
  };

  const getRiskColor = (score: number) => {
    if (score >= 80) return { bar: 'bg-red-500', text: 'text-red-600' };
    if (score >= 60) return { bar: 'bg-amber-500', text: 'text-amber-600' };
    return { bar: 'bg-emerald-500', text: 'text-emerald-600' };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-white border-r border-slate-200 z-40 hidden lg:flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-lg shadow-orange-500/20">
              <span className="text-white font-bold text-lg">H</span>
            </div>
            <div>
              <h1 className="font-bold text-slate-900 tracking-tight">HenkanCX</h1>
              <p className="text-xs text-slate-500">Panel de Triage</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          <NavItem icon={BarChart3} label="Dashboard" active />
          <NavItem icon={Car} label="Inspecciones" badge={stats.pending} />
          <NavItem icon={User} label="Clientes" />
          <NavItem icon={Calendar} label="Calendario" />
          <NavItem icon={TrendingUp} label="Reportes" />
          <NavItem icon={Settings} label="Configuración" />
        </nav>

        {/* User */}
        <div className="p-4 border-t border-slate-100">
          <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center">
              <User className="w-5 h-5 text-slate-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-900 truncate">Admin</p>
              <p className="text-xs text-slate-500 truncate">admin@henkancx.com</p>
            </div>
            <LogOut className="w-4 h-4 text-slate-400" />
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:pl-64">
        {/* Top Header */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-slate-200/50">
          <div className="px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Dashboard</h2>
                <p className="text-sm text-slate-500 mt-0.5">Gestión de inspecciones vehiculares</p>
              </div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={loadInspections}
                  className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition-all hover:border-slate-300 group"
                >
                  <RefreshCw className={`w-5 h-5 text-slate-600 group-hover:text-slate-900 ${loading ? 'animate-spin' : ''}`} />
                </button>
                <button className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition-all hover:border-slate-300 relative">
                  <Bell className="w-5 h-5 text-slate-600" />
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center font-medium">3</span>
                </button>
                <button className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 rounded-xl text-slate-700 font-medium hover:bg-slate-50 transition-all">
                  <FileText className="w-4 h-4" />
                  Reportes
                </button>
                <button className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-semibold rounded-xl shadow-lg shadow-orange-500/25 transition-all hover:shadow-orange-500/40 hover:-translate-y-0.5">
                  <Plus className="w-5 h-5" />
                  Nueva Inspección
                </button>
              </div>
            </div>
          </div>
        </header>

        <div className="p-6 lg:p-8 space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard 
              icon={Clock} 
              label="Pendientes" 
              value={stats.pending} 
              subtitle="+3 hoy"
              color="amber"
            />
            <StatCard 
              icon={Eye} 
              label="En Revisión" 
              value={stats.inReview} 
              subtitle="Tiempo prom: 2.3h"
              color="blue"
            />
            <StatCard 
              icon={CheckCircle} 
              label="Aprobadas Hoy" 
              value={stats.approved} 
              subtitle="92% tasa"
              color="emerald"
            />
            <StatCard 
              icon={RotateCcw} 
              label="Reinspecciones" 
              value={stats.reinspection} 
              subtitle="8% del total"
              color="purple"
            />
          </div>

          {/* Filters & Search */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm shadow-slate-200/50 p-4">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input 
                  type="text"
                  placeholder="Buscar por ID, cliente o placa..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                />
              </div>
              
              {/* Filters */}
              <div className="flex flex-wrap gap-3">
                <FilterDropdown 
                  value={statusFilter}
                  onChange={setStatusFilter}
                  options={[
                    { value: 'all', label: 'Todos los estados' },
                    { value: 'Pendiente', label: 'Pendiente' },
                    { value: 'En Revisión', label: 'En Revisión' },
                    { value: 'Aprobada', label: 'Aprobada' },
                    { value: 'Rechazada', label: 'Rechazada' },
                    { value: 'Reinspección', label: 'Reinspección' },
                  ]}
                />
                <FilterDropdown 
                  value={priorityFilter}
                  onChange={setPriorityFilter}
                  options={[
                    { value: 'all', label: 'Todas las prioridades' },
                    { value: 'high', label: 'Alta prioridad' },
                    { value: 'medium', label: 'Media' },
                    { value: 'low', label: 'Baja' },
                  ]}
                />
                <button className="flex items-center gap-2 px-4 py-3 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all">
                  <Filter className="w-4 h-4" />
                  Más filtros
                </button>
              </div>
            </div>
          </div>

          {/* Inspections Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm shadow-slate-200/50 overflow-hidden">
            {/* Table Header */}
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-slate-900">
                  Inspecciones Recientes
                  <span className="ml-2 text-sm font-normal text-slate-500">({filteredInspections.length} resultados)</span>
                </h3>
                <button className="text-sm text-orange-600 hover:text-orange-700 font-medium flex items-center gap-1">
                  Ver todas <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Inspección</th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Vehículo</th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Estado</th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Risk Score</th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Quality</th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">SLA</th>
                    <th className="text-right px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-20 text-center">
                        <RefreshCw className="w-8 h-8 text-orange-500 animate-spin mx-auto mb-3" />
                        <p className="text-slate-500">Cargando inspecciones...</p>
                      </td>
                    </tr>
                  ) : filteredInspections.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-20 text-center">
                        <Car className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                        <p className="text-slate-500">No hay inspecciones</p>
                      </td>
                    </tr>
                  ) : filteredInspections.map((ins) => {
                    const statusConfig = getStatusConfig(ins.status);
                    const sla = calculateSLA(ins.sla_deadline);
                    const riskColor = getRiskColor(ins.risk_score);
                    
                    return (
                      <tr 
                        key={ins.id} 
                        className="hover:bg-slate-50/50 transition-colors group cursor-pointer"
                        onClick={() => navigate(`/inspection/${ins.id}`)}
                      >
                        {/* Inspection Info */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-slate-600 font-bold text-sm">
                              {ins.vehicle_brand?.charAt(0) || 'V'}
                            </div>
                            <div>
                              <p className="font-mono text-sm font-semibold text-slate-900">{ins.id}</p>
                              <p className="text-sm text-slate-500">{ins.client_name || 'Sin nombre'}</p>
                            </div>
                          </div>
                        </td>

                        {/* Vehicle */}
                        <td className="px-6 py-4">
                          <p className="text-sm font-medium text-slate-900">{ins.vehicle_brand} {ins.vehicle_model}</p>
                          <p className="text-sm text-slate-500">{ins.vehicle_year} • {ins.vehicle_plate}</p>
                        </td>

                        {/* Status */}
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`}></span>
                            {ins.status}
                          </span>
                        </td>

                        {/* Risk Score */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div 
                                className={`h-full ${riskColor.bar} rounded-full transition-all`} 
                                style={{ width: `${ins.risk_score}%` }}
                              />
                            </div>
                            <span className={`text-sm font-semibold ${riskColor.text}`}>{ins.risk_score}</span>
                          </div>
                        </td>

                        {/* Quality */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-emerald-500 rounded-full transition-all" 
                                style={{ width: `${ins.quality_score}%` }}
                              />
                            </div>
                            <span className="text-sm font-semibold text-emerald-600">{ins.quality_score}</span>
                          </div>
                        </td>

                        {/* SLA */}
                        <td className="px-6 py-4">
                          <div className={`flex items-center gap-2 ${sla.color}`}>
                            {sla.urgent && <AlertTriangle className="w-4 h-4" />}
                            <span className="text-sm font-semibold">{sla.text}</span>
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                              onClick={(e) => { e.stopPropagation(); navigate(`/inspection/${ins.id}`); }}
                              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-sm font-semibold rounded-lg shadow-md shadow-orange-500/20 transition-all"
                            >
                              <Eye className="w-4 h-4" />
                              Revisar
                            </button>
                            <button 
                              onClick={(e) => e.stopPropagation()}
                              className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                            >
                              <MoreHorizontal className="w-4 h-4 text-slate-500" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <p className="text-sm text-slate-500">
                Mostrando {Math.min(filteredInspections.length, 10)} de {filteredInspections.length} inspecciones
              </p>
              <div className="flex items-center gap-2">
                <button className="px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-white transition-colors">
                  Anterior
                </button>
                <button className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium">1</button>
                <button className="px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-white transition-colors">2</button>
                <button className="px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-white transition-colors">3</button>
                <button className="px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-white transition-colors">
                  Siguiente
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// Components
function NavItem({ icon: Icon, label, active, badge }: { icon: any; label: string; active?: boolean; badge?: number }) {
  return (
    <button className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
      active 
        ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/20' 
        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
    }`}>
      <Icon className="w-5 h-5" />
      <span className="font-medium">{label}</span>
      {badge !== undefined && badge > 0 && (
        <span className={`ml-auto px-2.5 py-0.5 rounded-full text-xs font-semibold ${
          active ? 'bg-white/20 text-white' : 'bg-orange-100 text-orange-600'
        }`}>
          {badge}
        </span>
      )}
    </button>
  );
}

function StatCard({ icon: Icon, label, value, subtitle, color }: { icon: any; label: string; value: number; subtitle: string; color: string }) {
  const colors: Record<string, { bg: string; icon: string; iconBg: string }> = {
    amber: { bg: 'from-amber-50 to-orange-50', icon: 'text-amber-600', iconBg: 'bg-amber-100' },
    blue: { bg: 'from-blue-50 to-indigo-50', icon: 'text-blue-600', iconBg: 'bg-blue-100' },
    emerald: { bg: 'from-emerald-50 to-teal-50', icon: 'text-emerald-600', iconBg: 'bg-emerald-100' },
    purple: { bg: 'from-purple-50 to-violet-50', icon: 'text-purple-600', iconBg: 'bg-purple-100' },
  };
  const c = colors[color] || colors.amber;

  return (
    <div className={`bg-gradient-to-br ${c.bg} rounded-2xl p-5 border border-white shadow-sm`}>
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-xl ${c.iconBg}`}>
          <Icon className={`w-6 h-6 ${c.icon}`} />
        </div>
        <ArrowUpRight className={`w-5 h-5 ${c.icon}`} />
      </div>
      <p className="text-3xl font-bold text-slate-900">{value}</p>
      <p className="text-sm font-medium text-slate-600 mt-1">{label}</p>
      <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
    </div>
  );
}

function FilterDropdown({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none pl-4 pr-10 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all cursor-pointer hover:border-slate-300"
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
    </div>
  );
}
