import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Clock, Eye, CheckCircle, RotateCcw, Plus, BarChart3, AlertTriangle, ChevronDown } from 'lucide-react';
import { getInspections, type Inspection } from '../lib/supabase';

export default function Dashboard() {
  const navigate = useNavigate();
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [policyTypeFilter, setPolicyTypeFilter] = useState('all');
  const [policyStatusFilter, setPolicyStatusFilter] = useState('all');

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
    if (!deadline) return { time: 'N/A', date: '' };
    const now = new Date();
    const dl = new Date(deadline);
    const diff = dl.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const dateStr = dl.toLocaleDateString('es-ES', { year: 'numeric', month: '2-digit', day: '2-digit' }) + ' ' + dl.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    if (diff <= 0) return { time: 'Vencido', date: dateStr };
    return { time: `${hours}h ${minutes}m`, date: dateStr };
  };

  const getStatusDot = (status: string) => {
    switch (status) {
      case 'Pendiente': return 'bg-yellow-400';
      case 'En Revisión': return 'bg-yellow-400';
      case 'Aprobada': return 'bg-emerald-400';
      case 'Rechazada': return 'bg-red-400';
      case 'Reinspección': return 'bg-pink-400';
      default: return 'bg-gray-400';
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'Pendiente': return 'bg-yellow-500 text-black';
      case 'En Revisión': return 'bg-blue-500 text-white';
      case 'Aprobada': return 'bg-emerald-500 text-white';
      case 'Rechazada': return 'bg-red-500 text-white';
      case 'Reinspección': return 'bg-pink-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getPolicyStatusColor = (status: string) => {
    switch (status) {
      case 'Emitida': return 'text-emerald-400';
      case 'Rechazada': return 'text-red-400';
      case 'Cancelada': return 'text-orange-400';
      default: return 'text-cyan-400';
    }
  };

  const getRiskBarColor = (score: number) => {
    if (score >= 70) return 'bg-red-500';
    if (score >= 50) return 'bg-yellow-500';
    return 'bg-emerald-500';
  };

  const getRiskTextColor = (score: number) => {
    if (score >= 70) return 'text-red-400';
    if (score >= 50) return 'text-yellow-400';
    return 'text-emerald-400';
  };

  return (
    <div className="min-h-screen bg-[#0d1421] text-white">
      {/* Header */}
      <header className="px-8 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center">
            <span className="text-white font-bold text-sm">H</span>
          </div>
          <span className="font-semibold text-white text-lg">HenkanCX</span>
          <span className="ml-1 px-2.5 py-1 text-xs bg-emerald-500/20 text-emerald-400 rounded font-medium">
            Dashboard de Triage
          </span>
        </div>
        
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2.5 bg-pink-500 hover:bg-pink-600 text-white text-sm font-medium rounded-lg transition-all">
            <Plus className="w-4 h-4" />
            Crear Inspección
          </button>
          <button className="flex items-center gap-2 px-4 py-2.5 bg-[#1e2a3b] text-white text-sm font-medium rounded-lg hover:bg-[#2a3a4f] transition-all">
            <BarChart3 className="w-4 h-4" />
            Reportes
          </button>
          <div className="w-9 h-9 rounded-full bg-[#1e2a3b]"></div>
        </div>
      </header>

      <div className="px-8 pb-8 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-5">
          {/* Casos Pendientes */}
          <div className="bg-[#151d2b] rounded-2xl p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-400 mb-2">Casos Pendientes</p>
                <p className="text-5xl font-bold text-white">{stats.pending}</p>
                <p className="text-xs text-gray-500 mt-3">+3 en las últimas 2h</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-yellow-500/10 flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-400" />
              </div>
            </div>
          </div>

          {/* En Revisión */}
          <div className="bg-[#151d2b] rounded-2xl p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-400 mb-2">En Revisión</p>
                <p className="text-5xl font-bold text-white">{stats.inReview}</p>
                <p className="text-xs text-gray-500 mt-3">Tiempo prom: 2.3h</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                <Eye className="w-6 h-6 text-blue-400" />
              </div>
            </div>
          </div>

          {/* Aprobados Hoy */}
          <div className="bg-[#151d2b] rounded-2xl p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-400 mb-2">Aprobados Hoy</p>
                <p className="text-5xl font-bold text-white">{stats.approved}</p>
                <p className="text-xs text-gray-500 mt-3">92% auto-aprobación</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-emerald-400" />
              </div>
            </div>
          </div>

          {/* Reinspecciones */}
          <div className="bg-[#151d2b] rounded-2xl p-6 relative">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-400 mb-2">Reinspecciones</p>
                <p className="text-5xl font-bold text-white">{stats.reinspection}</p>
                <p className="text-xs text-gray-500 mt-3">8% del total</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-orange-500/10 flex items-center justify-center">
                <RotateCcw className="w-6 h-6 text-orange-400" />
              </div>
            </div>
            <AlertTriangle className="absolute top-5 right-5 w-5 h-5 text-red-400" />
          </div>
        </div>

        {/* Search & Filters */}
        <div className="bg-[#151d2b] rounded-2xl p-5 flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input 
              type="text"
              placeholder="Buscar por número de caso, cliente o vehículo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-[#0d1421] border border-[#2a3a4f] rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-pink-500 transition-colors"
            />
          </div>
          
          <FilterButton value={statusFilter} onChange={setStatusFilter} options={[
            { value: 'all', label: 'Todos los estados' },
            { value: 'Pendiente', label: 'Pendiente' },
            { value: 'En Revisión', label: 'En Revisión' },
            { value: 'Aprobada', label: 'Aprobada' },
            { value: 'Rechazada', label: 'Rechazada' },
            { value: 'Reinspección', label: 'Reinspección' },
          ]} />
          <FilterButton value={priorityFilter} onChange={setPriorityFilter} options={[
            { value: 'all', label: 'Todas las prioridades' },
            { value: 'high', label: 'Alta' },
            { value: 'medium', label: 'Media' },
            { value: 'low', label: 'Baja' },
          ]} />
          <FilterButton value={policyTypeFilter} onChange={setPolicyTypeFilter} options={[
            { value: 'all', label: 'Todos los tipos de póli...' },
            { value: 'Premium', label: 'Premium' },
            { value: 'Standard', label: 'Standard' },
            { value: 'Comprehensive', label: 'Comprehensive' },
          ]} />
          <FilterButton value={policyStatusFilter} onChange={setPolicyStatusFilter} options={[
            { value: 'all', label: 'Todos los estados de p...' },
            { value: 'En-Proceso', label: 'En Proceso' },
            { value: 'Emitida', label: 'Emitida' },
            { value: 'Rechazada', label: 'Rechazada' },
            { value: 'Cancelada', label: 'Cancelada' },
          ]} />
        </div>

        {/* Inspection Cards */}
        <div className="space-y-4">
          {loading ? (
            <div className="bg-[#151d2b] rounded-2xl p-16 text-center">
              <div className="w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
              <p className="text-gray-400">Cargando inspecciones...</p>
            </div>
          ) : filteredInspections.length === 0 ? (
            <div className="bg-[#151d2b] rounded-2xl p-16 text-center">
              <p className="text-gray-400">No hay inspecciones</p>
            </div>
          ) : (
            filteredInspections.map((ins) => {
              const sla = calculateSLA(ins.sla_deadline);
              return (
                <div 
                  key={ins.id}
                  className="bg-[#151d2b] rounded-2xl p-6 hover:bg-[#1a2536] transition-all cursor-pointer"
                  onClick={() => navigate(`/inspection/${ins.id}`)}
                >
                  <div className="flex items-center">
                    {/* Left: ID, Client, Vehicle, Tags */}
                    <div className="w-[240px] min-w-[240px]">
                      <p className="font-mono text-sm font-semibold text-white">{ins.id}</p>
                      <p className="text-sm text-gray-400 mt-0.5">{ins.client_name || 'Sin nombre'}</p>
                      <p className="text-sm text-gray-500">{ins.vehicle_brand} {ins.vehicle_model} {ins.vehicle_year}</p>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        <span className={`px-2 py-0.5 text-xs rounded font-medium ${getStatusBadgeClass(ins.status)}`}>
                          {ins.status}
                        </span>
                        {ins.tags?.slice(0, 2).map((tag, i) => (
                          <span key={i} className="px-2 py-0.5 text-xs bg-cyan-500/20 text-cyan-400 rounded font-medium">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Dot */}
                    <div className="w-[60px] flex justify-center">
                      <div className={`w-3 h-3 rounded-full ${getStatusDot(ins.status)}`}></div>
                    </div>

                    {/* Policy Type */}
                    <div className="w-[130px]">
                      <p className="text-xs text-gray-500 mb-1">Policy Type</p>
                      <p className="text-sm text-white font-medium">{ins.policy_type}</p>
                    </div>

                    {/* Policy Status */}
                    <div className="w-[120px]">
                      <p className="text-xs text-gray-500 mb-1">Policy Status</p>
                      <p className={`text-sm font-medium ${getPolicyStatusColor(ins.policy_status)}`}>
                        {ins.policy_status}
                      </p>
                    </div>

                    {/* Risk Score */}
                    <div className="w-[130px]">
                      <p className="text-xs text-gray-500 mb-1">Risk Score</p>
                      <div className="flex items-baseline gap-1">
                        <span className={`text-xl font-bold ${getRiskTextColor(ins.risk_score)}`}>{ins.risk_score}</span>
                        <span className="text-xs text-gray-500">/100</span>
                      </div>
                      <div className="w-24 h-1.5 bg-[#2a3a4f] rounded-full mt-1.5">
                        <div className={`h-full rounded-full ${getRiskBarColor(ins.risk_score)}`} style={{ width: `${ins.risk_score}%` }}></div>
                      </div>
                    </div>

                    {/* Quality Score */}
                    <div className="w-[130px]">
                      <p className="text-xs text-gray-500 mb-1">Quality Score</p>
                      <div className="flex items-baseline gap-1">
                        <span className="text-xl font-bold text-emerald-400">{ins.quality_score}</span>
                        <span className="text-xs text-gray-500">/100</span>
                      </div>
                      <div className="w-24 h-1.5 bg-[#2a3a4f] rounded-full mt-1.5">
                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${ins.quality_score}%` }}></div>
                      </div>
                    </div>

                    {/* SLA */}
                    <div className="w-[140px]">
                      <p className="text-xs text-gray-500 mb-1">SLA Restante</p>
                      <p className="text-xl font-bold text-white">{sla.time}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{sla.date}</p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 ml-auto">
                      <button 
                        onClick={(e) => { e.stopPropagation(); navigate(`/inspection/${ins.id}`); }}
                        className="flex items-center gap-2 px-5 py-2.5 bg-pink-500 hover:bg-pink-600 text-white text-sm font-medium rounded-lg transition-all"
                      >
                        <Eye className="w-4 h-4" />
                        Revisar
                      </button>
                      <button 
                        onClick={(e) => e.stopPropagation()}
                        className="w-10 h-10 rounded-lg bg-[#1e2a3b] hover:bg-[#2a3a4f] flex items-center justify-center transition-all"
                      >
                        <CheckCircle className="w-4 h-4 text-emerald-400" />
                      </button>
                      <button 
                        onClick={(e) => e.stopPropagation()}
                        className="w-10 h-10 rounded-lg bg-[#1e2a3b] hover:bg-[#2a3a4f] flex items-center justify-center transition-all"
                      >
                        <AlertTriangle className="w-4 h-4 text-yellow-400" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

function FilterButton({ value, onChange, options }: { 
  value: string; 
  onChange: (v: string) => void; 
  options: { value: string; label: string }[] 
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none px-4 py-3 pr-10 bg-[#1e2a3b] border border-[#3a4a5f] rounded-xl text-sm text-purple-300 focus:outline-none cursor-pointer hover:bg-[#2a3a4f] transition-all min-w-[170px]"
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value} className="bg-[#151d2b] text-white">{opt.label}</option>
        ))}
      </select>
      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400 pointer-events-none" />
    </div>
  );
}
