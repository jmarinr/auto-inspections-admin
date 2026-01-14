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
    if (!deadline) return { text: 'N/A', date: '' };
    const now = new Date();
    const dl = new Date(deadline);
    const diff = dl.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const dateStr = dl.toLocaleDateString('es-ES', { year: 'numeric', month: '2-digit', day: '2-digit' }) + ' ' + dl.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    if (diff <= 0) return { text: 'Vencido', date: dateStr };
    return { text: `${hours}h ${minutes}m`, date: dateStr };
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Pendiente': return 'bg-yellow-500/20 text-yellow-400';
      case 'En Revisión': return 'bg-blue-500/20 text-blue-400';
      case 'Aprobada': return 'bg-emerald-500/20 text-emerald-400';
      case 'Rechazada': return 'bg-red-500/20 text-red-400';
      case 'Reinspección': return 'bg-pink-500/20 text-pink-400';
      default: return 'bg-gray-500/20 text-gray-400';
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

  const getRiskColor = (score: number) => {
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
    <div className="min-h-screen bg-[#0c1117]">
      {/* Header */}
      <header className="px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center">
            <span className="text-white font-bold text-sm">H</span>
          </div>
          <span className="font-semibold text-white">HenkanCX</span>
          <span className="px-2.5 py-1 text-xs bg-emerald-500/20 text-emerald-400 rounded font-medium">
            Dashboard de Triage
          </span>
        </div>
        
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-pink-500 hover:bg-pink-600 text-white text-sm font-medium rounded-lg transition-all">
            <Plus className="w-4 h-4" />
            Crear Inspección
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-[#1a2332] text-white text-sm font-medium rounded-lg hover:bg-[#243044] transition-all">
            <BarChart3 className="w-4 h-4" />
            Reportes
          </button>
          <div className="w-8 h-8 rounded-full bg-[#1a2332]"></div>
        </div>
      </header>

      <div className="px-6 pb-6 space-y-5">
        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-[#141c27] rounded-xl p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-400 mb-1">Casos Pendientes</p>
                <p className="text-4xl font-bold text-white">{stats.pending}</p>
                <p className="text-xs text-gray-500 mt-2">+3 en las últimas 2h</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-yellow-500/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-yellow-500" />
              </div>
            </div>
          </div>

          <div className="bg-[#141c27] rounded-xl p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-400 mb-1">En Revisión</p>
                <p className="text-4xl font-bold text-white">{stats.inReview}</p>
                <p className="text-xs text-gray-500 mt-2">Tiempo prom: 2.3h</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                <Eye className="w-5 h-5 text-blue-500" />
              </div>
            </div>
          </div>

          <div className="bg-[#141c27] rounded-xl p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-400 mb-1">Aprobados Hoy</p>
                <p className="text-4xl font-bold text-white">{stats.approved}</p>
                <p className="text-xs text-gray-500 mt-2">92% auto-aprobación</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-emerald-500" />
              </div>
            </div>
          </div>

          <div className="bg-[#141c27] rounded-xl p-5 relative">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-400 mb-1">Reinspecciones</p>
                <p className="text-4xl font-bold text-white">{stats.reinspection}</p>
                <p className="text-xs text-gray-500 mt-2">8% del total</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center">
                <RotateCcw className="w-5 h-5 text-orange-500" />
              </div>
            </div>
            <AlertTriangle className="absolute top-4 right-4 w-5 h-5 text-red-400" />
          </div>
        </div>

        {/* Search & Filters */}
        <div className="bg-[#141c27] rounded-xl p-4 flex items-center gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input 
              type="text"
              placeholder="Buscar por número de caso, cliente o vehículo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-[#0c1117] border border-[#2a3544] rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-pink-500"
            />
          </div>
          
          <FilterSelect value={statusFilter} onChange={setStatusFilter} options={[
            { value: 'all', label: 'Todos los estados' },
            { value: 'Pendiente', label: 'Pendiente' },
            { value: 'En Revisión', label: 'En Revisión' },
            { value: 'Aprobada', label: 'Aprobada' },
            { value: 'Rechazada', label: 'Rechazada' },
            { value: 'Reinspección', label: 'Reinspección' },
          ]} />
          <FilterSelect value={priorityFilter} onChange={setPriorityFilter} options={[
            { value: 'all', label: 'Todas las prioridades' },
            { value: 'high', label: 'Alta' },
            { value: 'medium', label: 'Media' },
            { value: 'low', label: 'Baja' },
          ]} />
          <FilterSelect value={policyTypeFilter} onChange={setPolicyTypeFilter} options={[
            { value: 'all', label: 'Todos los tipos de póli...' },
            { value: 'Premium', label: 'Premium' },
            { value: 'Standard', label: 'Standard' },
            { value: 'Comprehensive', label: 'Comprehensive' },
          ]} />
          <FilterSelect value={policyStatusFilter} onChange={setPolicyStatusFilter} options={[
            { value: 'all', label: 'Todos los estados de p...' },
            { value: 'En-Proceso', label: 'En Proceso' },
            { value: 'Emitida', label: 'Emitida' },
            { value: 'Rechazada', label: 'Rechazada' },
            { value: 'Cancelada', label: 'Cancelada' },
          ]} />
        </div>

        {/* Inspection Cards */}
        <div className="space-y-3">
          {loading ? (
            <div className="bg-[#141c27] rounded-xl p-16 text-center">
              <div className="w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
              <p className="text-gray-400">Cargando inspecciones...</p>
            </div>
          ) : filteredInspections.length === 0 ? (
            <div className="bg-[#141c27] rounded-xl p-16 text-center">
              <p className="text-gray-400">No hay inspecciones</p>
            </div>
          ) : (
            filteredInspections.map((ins) => {
              const sla = calculateSLA(ins.sla_deadline);
              return (
                <div 
                  key={ins.id}
                  className="bg-[#141c27] rounded-xl p-5 hover:bg-[#1a2332] transition-all cursor-pointer"
                  onClick={() => navigate(`/inspection/${ins.id}`)}
                >
                  <div className="flex items-center">
                    {/* Left section */}
                    <div className="flex items-start gap-4 w-[280px]">
                      <div className={`w-3 h-3 rounded-full mt-1.5 flex-shrink-0 ${getStatusDot(ins.status)}`}></div>
                      <div className="min-w-0">
                        <p className="font-mono text-sm font-semibold text-white">{ins.id}</p>
                        <p className="text-sm text-gray-400 truncate">{ins.client_name || 'Sin nombre'}</p>
                        <p className="text-sm text-gray-500 truncate">{ins.vehicle_brand} {ins.vehicle_model} {ins.vehicle_year}</p>
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          <span className={`px-2 py-0.5 text-xs rounded font-medium ${getStatusBadge(ins.status)}`}>
                            {ins.status}
                          </span>
                          {ins.tags?.slice(0, 2).map((tag, i) => (
                            <span key={i} className="px-2 py-0.5 text-xs bg-emerald-500/20 text-emerald-400 rounded font-medium">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Policy Type */}
                    <div className="w-[140px]">
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
                      <div className="w-20 h-1 bg-[#2a3544] rounded-full mt-1.5">
                        <div className={`h-full rounded-full ${getRiskColor(ins.risk_score)}`} style={{ width: `${ins.risk_score}%` }}></div>
                      </div>
                    </div>

                    {/* Quality Score */}
                    <div className="w-[130px]">
                      <p className="text-xs text-gray-500 mb-1">Quality Score</p>
                      <div className="flex items-baseline gap-1">
                        <span className="text-xl font-bold text-emerald-400">{ins.quality_score}</span>
                        <span className="text-xs text-gray-500">/100</span>
                      </div>
                      <div className="w-20 h-1 bg-[#2a3544] rounded-full mt-1.5">
                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${ins.quality_score}%` }}></div>
                      </div>
                    </div>

                    {/* SLA */}
                    <div className="w-[130px]">
                      <p className="text-xs text-gray-500 mb-1">SLA Restante</p>
                      <p className="text-xl font-bold text-white">{sla.text}</p>
                      <p className="text-xs text-gray-500">{sla.date}</p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 ml-auto">
                      <button 
                        onClick={(e) => { e.stopPropagation(); navigate(`/inspection/${ins.id}`); }}
                        className="flex items-center gap-2 px-4 py-2 bg-pink-500 hover:bg-pink-600 text-white text-sm font-medium rounded-lg transition-all"
                      >
                        <Eye className="w-4 h-4" />
                        Revisar
                      </button>
                      <button 
                        onClick={(e) => e.stopPropagation()}
                        className="w-8 h-8 rounded-lg bg-[#1a2332] hover:bg-[#243044] flex items-center justify-center transition-all"
                      >
                        <CheckCircle className="w-4 h-4 text-emerald-400" />
                      </button>
                      <button 
                        onClick={(e) => e.stopPropagation()}
                        className="w-8 h-8 rounded-lg bg-[#1a2332] hover:bg-[#243044] flex items-center justify-center transition-all"
                      >
                        <AlertTriangle className="w-4 h-4 text-orange-400" />
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

function FilterSelect({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none px-4 py-2.5 pr-9 bg-purple-500/20 border border-purple-500/30 rounded-lg text-sm text-purple-300 focus:outline-none cursor-pointer hover:bg-purple-500/30 transition-all min-w-[160px]"
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value} className="bg-[#141c27] text-white">{opt.label}</option>
        ))}
      </select>
      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400 pointer-events-none" />
    </div>
  );
}
