import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, Clock, Eye, CheckCircle, AlertTriangle, 
  Filter, ChevronDown, Plus, BarChart3, Sun, Moon,
  RefreshCw
} from 'lucide-react';
import { getInspections, getStats, type Inspection } from '../lib/supabase';


export default function Dashboard() {
  const navigate = useNavigate();
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter] = useState('all');
  const [isDark, setIsDark] = useState(true);
  const [stats, setStats] = useState({
    pending: 0,
    review: 0,
    approved: 0,
    reinspection: 0,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [inspectionsData, statsData] = await Promise.all([
        getInspections(),
        getStats()
      ]);
      setInspections(inspectionsData || []);
      setStats({
        pending: statsData.pending,
        review: statsData.review,
        approved: statsData.approved,
        reinspection: statsData.reinspection,
      });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const filteredInspections = inspections.filter(ins => {
    const matchesSearch = 
      ins.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ins.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ins.vehicle_plate?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || ins.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusDot = (status: string) => {
    const colors: Record<string, string> = {
      'Pendiente': 'bg-red-500',
      'En Revisión': 'bg-yellow-500',
      'Aprobada': 'bg-green-500',
      'Rechazada': 'bg-red-500',
      'Reinspección': 'bg-purple-500',
    };
    return colors[status] || 'bg-gray-500';
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      'Pendiente': 'bg-pink-500/20 text-pink-400 border-pink-500/30',
      'En Revisión': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      'Aprobada': 'bg-green-500/20 text-green-400 border-green-500/30',
      'Rechazada': 'bg-red-500/20 text-red-400 border-red-500/30',
      'Reinspección': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    };
    return styles[status] || 'bg-gray-500/20 text-gray-400';
  };

  const getPolicyStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'En-Proceso': 'text-cyan-400',
      'Emitida': 'text-green-400',
      'Rechazada': 'text-red-400',
      'Cancelada': 'text-orange-400',
    };
    return colors[status] || 'text-gray-400';
  };

  const getRiskColor = (score: number) => {
    if (score >= 70) return { bar: 'bg-red-500', text: 'text-red-400' };
    if (score >= 50) return { bar: 'bg-yellow-500', text: 'text-yellow-400' };
    return { bar: 'bg-green-500', text: 'text-green-400' };
  };

  const theme = {
    bg: isDark ? 'bg-[#0d1117]' : 'bg-gray-100',
    card: isDark ? 'bg-[#161b22] border-[#30363d]' : 'bg-white border-gray-200',
    text: isDark ? 'text-white' : 'text-gray-900',
    textMuted: isDark ? 'text-gray-400' : 'text-gray-500',
    input: isDark ? 'bg-[#0d1117] border-[#30363d] text-white' : 'bg-white border-gray-300 text-gray-900',
    hover: isDark ? 'hover:bg-[#1c2128]' : 'hover:bg-gray-50',
  };

  return (
    <div className={`min-h-screen ${theme.bg} transition-colors duration-300`}>
      {/* Header */}
      <header className={`${theme.card} border-b px-6 py-4 sticky top-0 z-50`}>
        <div className="max-w-[1600px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center font-bold text-white shadow-lg shadow-pink-500/25">
              H
            </div>
            <span className={`font-bold text-lg ${theme.text}`}>HenkanCX</span>
            <span className="px-3 py-1 text-xs font-medium bg-purple-500/20 text-purple-400 rounded-full border border-purple-500/30">
              Dashboard de Triage
            </span>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsDark(!isDark)}
              className={`p-2.5 rounded-xl ${theme.card} border transition-all`}
            >
              {isDark ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5 text-purple-500" />}
            </button>
            <button className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-pink-500 to-pink-600 text-white font-semibold rounded-xl shadow-lg shadow-pink-500/25 hover:shadow-pink-500/40 transition-all">
              <Plus className="w-4 h-4" /> Crear Inspección
            </button>
            <button className={`flex items-center gap-2 px-5 py-2.5 ${theme.card} border rounded-xl font-medium ${theme.text} transition-all`}>
              <BarChart3 className="w-4 h-4" /> Reportes
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto p-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard 
            title="Casos Pendientes" 
            value={stats.pending} 
            subtitle="+3 en las últimas 2h"
            icon={<Clock className="w-6 h-6" />}
            iconBg="bg-yellow-500/20"
            iconColor="text-yellow-400"
            theme={theme}
          />
          <StatCard 
            title="En Revisión" 
            value={stats.review} 
            subtitle="Tiempo prom: 2.3h"
            icon={<Eye className="w-6 h-6" />}
            iconBg="bg-blue-500/20"
            iconColor="text-blue-400"
            theme={theme}
          />
          <StatCard 
            title="Aprobados Hoy" 
            value={stats.approved} 
            subtitle="92% auto-aprobación"
            icon={<CheckCircle className="w-6 h-6" />}
            iconBg="bg-green-500/20"
            iconColor="text-green-400"
            theme={theme}
          />
          <StatCard 
            title="Reinspecciones" 
            value={stats.reinspection} 
            subtitle="8% del total"
            icon={<AlertTriangle className="w-6 h-6" />}
            iconBg="bg-red-500/20"
            iconColor="text-red-400"
            theme={theme}
          />
        </div>

        {/* Search & Filters */}
        <div className={`${theme.card} border rounded-2xl p-4 mb-6`}>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[300px] relative">
              <Search className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${theme.textMuted}`} />
              <input
                type="text"
                placeholder="Buscar por número de caso, cliente o vehículo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full pl-12 pr-4 py-3 ${theme.input} border rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500/50 transition-all`}
              />
            </div>
            
            <div className="flex items-center gap-3">
              <FilterButton label="Todos los estados" icon={<Filter className="w-4 h-4" />} theme={theme} />
              <FilterButton label="Todas las prioridades" theme={theme} />
              <FilterButton label="Todos los tipos de póli..." theme={theme} />
              <FilterButton label="Todos los estados de p..." theme={theme} />
            </div>
          </div>
        </div>

        {/* Inspections Table */}
        <div className="space-y-3">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <RefreshCw className="w-8 h-8 text-pink-500 animate-spin" />
            </div>
          ) : filteredInspections.length === 0 ? (
            <div className={`${theme.card} border rounded-2xl p-12 text-center`}>
              <p className={theme.textMuted}>No se encontraron inspecciones</p>
            </div>
          ) : (
            filteredInspections.map((ins) => (
              <InspectionRow 
                key={ins.id} 
                inspection={ins} 
                theme={theme}
                onView={() => navigate(`/inspection/${ins.id}`)}
                getStatusDot={getStatusDot}
                getStatusBadge={getStatusBadge}
                getPolicyStatusColor={getPolicyStatusColor}
                getRiskColor={getRiskColor}
              />
            ))
          )}
        </div>
      </main>
    </div>
  );
}

// Stat Card Component
function StatCard({ title, value, subtitle, icon, iconBg, iconColor, theme }: any) {
  return (
    <div className={`${theme.card} border rounded-2xl p-5 relative overflow-hidden`}>
      <div className="flex items-start justify-between">
        <div>
          <p className={`text-sm ${theme.textMuted} mb-1`}>{title}</p>
          <p className={`text-3xl font-bold ${theme.text}`}>{value}</p>
          <p className={`text-xs ${theme.textMuted} mt-2`}>{subtitle}</p>
        </div>
        <div className={`p-3 rounded-xl ${iconBg}`}>
          <div className={iconColor}>{icon}</div>
        </div>
      </div>
    </div>
  );
}

// Filter Button Component
function FilterButton({ label, icon, theme }: any) {
  return (
    <button className={`flex items-center gap-2 px-4 py-2.5 ${theme.card} border rounded-xl text-sm ${theme.textMuted} hover:border-pink-500/50 transition-all`}>
      {icon}
      <span className="truncate max-w-[140px]">{label}</span>
      <ChevronDown className="w-4 h-4 flex-shrink-0" />
    </button>
  );
}

// Inspection Row Component
function InspectionRow({ inspection, theme, onView, getStatusDot, getStatusBadge, getPolicyStatusColor, getRiskColor }: any) {
  const riskStyle = getRiskColor(inspection.risk_score);
  
  const calculateSLA = () => {
    if (!inspection.sla_deadline) return { time: 'N/A', date: '' };
    const deadline = new Date(inspection.sla_deadline);
    const now = new Date();
    const diff = deadline.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return {
      time: diff > 0 ? `${hours}h ${minutes}m` : 'Vencido',
      date: deadline.toLocaleDateString('es-ES', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
    };
  };
  
  const sla = calculateSLA();

  return (
    <div className={`${theme.card} border rounded-2xl p-5 ${theme.hover} transition-all cursor-pointer group`} onClick={onView}>
      <div className="flex items-center gap-6">
        {/* ID & Client Info */}
        <div className="min-w-[200px]">
          <div className="flex items-center gap-3 mb-1">
            <p className={`font-mono font-semibold ${theme.text}`}>{inspection.id}</p>
            <div className={`w-3 h-3 rounded-full ${getStatusDot(inspection.status)}`}></div>
          </div>
          <p className={`text-sm ${theme.text}`}>{inspection.client_name || 'Sin nombre'}</p>
          <p className={`text-sm ${theme.textMuted}`}>
            {inspection.vehicle_brand} {inspection.vehicle_model} {inspection.vehicle_year}
          </p>
          <div className="flex flex-wrap gap-1.5 mt-2">
            <span className={`px-2 py-0.5 text-xs rounded-md border ${getStatusBadge(inspection.status)}`}>
              {inspection.status}
            </span>
            {inspection.tags?.slice(0, 2).map((tag: string, i: number) => (
              <span key={i} className="px-2 py-0.5 text-xs bg-gray-500/20 text-gray-400 rounded-md border border-gray-500/30">
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Policy Type */}
        <div className="min-w-[100px]">
          <p className={`text-xs ${theme.textMuted} mb-1`}>Policy Type</p>
          <p className={`font-medium ${theme.text}`}>{inspection.policy_type || 'Standard'}</p>
        </div>

        {/* Policy Status */}
        <div className="min-w-[100px]">
          <p className={`text-xs ${theme.textMuted} mb-1`}>Policy Status</p>
          <p className={`font-medium ${getPolicyStatusColor(inspection.policy_status)}`}>
            {inspection.policy_status || 'En-Proceso'}
          </p>
        </div>

        {/* Risk Score */}
        <div className="min-w-[120px]">
          <p className={`text-xs ${theme.textMuted} mb-1`}>Risk Score</p>
          <div className="flex items-center gap-2">
            <span className={`text-xl font-bold ${riskStyle.text}`}>{inspection.risk_score}</span>
            <span className={theme.textMuted}>/100</span>
          </div>
          <div className="h-1.5 bg-gray-700 rounded-full mt-1.5 overflow-hidden">
            <div className={`h-full ${riskStyle.bar} rounded-full`} style={{ width: `${inspection.risk_score}%` }}></div>
          </div>
        </div>

        {/* Quality Score */}
        <div className="min-w-[120px]">
          <p className={`text-xs ${theme.textMuted} mb-1`}>Quality Score</p>
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold text-green-400">{inspection.quality_score}</span>
            <span className={theme.textMuted}>/100</span>
          </div>
          <div className="h-1.5 bg-gray-700 rounded-full mt-1.5 overflow-hidden">
            <div className="h-full bg-green-500 rounded-full" style={{ width: `${inspection.quality_score}%` }}></div>
          </div>
        </div>

        {/* SLA */}
        <div className="min-w-[120px]">
          <p className={`text-xs ${theme.textMuted} mb-1`}>SLA Restante</p>
          <p className={`text-xl font-bold ${theme.text}`}>{sla.time}</p>
          <p className={`text-xs ${theme.textMuted}`}>{sla.date}</p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 ml-auto">
          <button className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-pink-500 to-pink-600 text-white font-medium rounded-xl shadow-lg shadow-pink-500/25 hover:shadow-pink-500/40 transition-all">
            <Eye className="w-4 h-4" /> Revisar
          </button>
          <button className={`p-2.5 ${theme.card} border rounded-xl ${theme.hover} transition-all`}>
            <CheckCircle className="w-5 h-5 text-green-400" />
          </button>
          <button className={`p-2.5 ${theme.card} border rounded-xl ${theme.hover} transition-all`}>
            <AlertTriangle className="w-5 h-5 text-yellow-400" />
          </button>
        </div>
      </div>
    </div>
  );
}
