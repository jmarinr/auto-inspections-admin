import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Clock, Eye, CheckCircle, AlertTriangle, Search, Plus, 
  BarChart3, AlertCircle, RefreshCw, Loader2
} from 'lucide-react';
import { getInspections, getStats, type Inspection } from '../lib/supabase';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

const StatCard = ({ icon: Icon, label, value, subtitle, color }: any) => (
  <div className="card flex items-center justify-between">
    <div>
      <p className="text-sm text-gray-400">{label}</p>
      <p className="text-3xl font-bold mt-1">{value}</p>
      <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
    </div>
    <div className={`p-3 rounded-full ${color}`}>
      <Icon className="w-6 h-6" />
    </div>
  </div>
);

const getPolicyStatusColor = (status: string) => {
  switch (status) {
    case 'En-Proceso': return 'text-blue-400';
    case 'Emitida': return 'text-green-400';
    case 'Rechazada': return 'text-red-400';
    case 'Cancelada': return 'text-purple-400';
    default: return '';
  }
};

const getTagClass = (tag: string) => {
  if (tag.includes('Pendiente') || tag.includes('pending')) return 'badge-yellow';
  if (tag.includes('Revisión') || tag.includes('review')) return 'badge-blue';
  if (tag.includes('Aprobada') || tag.includes('approved')) return 'badge-green';
  if (tag.includes('Reinspección') || tag.includes('reinspection')) return 'badge-red';
  if (tag.includes('high-') || tag.includes('prior-') || tag.includes('missing') || tag.includes('inconsistent')) return 'badge-red';
  return 'badge-gray';
};

const getRiskColor = (score: number) => {
  if (score >= 70) return '#ef4444';
  if (score >= 50) return '#f59e0b';
  return '#10b981';
};

const InspectionRow = ({ inspection, onClick }: { inspection: Inspection; onClick: () => void }) => {
  const slaTime = inspection.sla_deadline 
    ? formatDistanceToNow(new Date(inspection.sla_deadline), { locale: es, addSuffix: false })
    : 'N/A';
  
  const statusIndicator = inspection.status === 'Pendiente' ? 'bg-red-500' : 
                         inspection.status === 'En Revisión' ? 'bg-yellow-500' : 
                         inspection.status === 'Aprobada' ? 'bg-green-500' : 'bg-red-500';

  const tags = Array.isArray(inspection.tags) ? inspection.tags : [];

  return (
    <div className="card card-hover cursor-pointer mb-3" onClick={onClick}>
      <div className="flex items-center gap-4 flex-wrap">
        {/* Status Indicator */}
        <div className={`w-3 h-3 rounded-full flex-shrink-0 ${statusIndicator}`} />
        
        {/* ID & Client Info */}
        <div className="min-w-[180px] flex-1">
          <p className="font-semibold text-sm">{inspection.id}</p>
          <p className="text-sm text-gray-400">{inspection.client_name || 'Sin nombre'}</p>
          <p className="text-xs text-gray-500">
            {inspection.vehicle_brand} {inspection.vehicle_model} {inspection.vehicle_year}
          </p>
          <div className="flex gap-1 mt-2 flex-wrap">
            {tags.slice(0, 3).map((tag, i) => (
              <span key={i} className={`badge ${getTagClass(tag)}`}>{tag}</span>
            ))}
          </div>
        </div>
        
        {/* Policy Type */}
        <div className="min-w-[90px]">
          <p className="text-xs text-gray-500">Tipo</p>
          <p className="font-medium text-sm">{inspection.policy_type}</p>
        </div>
        
        {/* Policy Status */}
        <div className="min-w-[90px]">
          <p className="text-xs text-gray-500">Estado</p>
          <p className={`font-medium text-sm ${getPolicyStatusColor(inspection.policy_status)}`}>
            {inspection.policy_status}
          </p>
        </div>
        
        {/* Risk Score */}
        <div className="min-w-[70px]">
          <p className="text-xs text-gray-500">Risk</p>
          <p className="text-xl font-bold" style={{ color: getRiskColor(inspection.risk_score) }}>
            {inspection.risk_score}<span className="text-xs text-gray-500">/100</span>
          </p>
          <div className="progress-bar mt-1">
            <div 
              className="progress-fill" 
              style={{ width: `${inspection.risk_score}%`, backgroundColor: getRiskColor(inspection.risk_score) }}
            />
          </div>
        </div>
        
        {/* Quality Score */}
        <div className="min-w-[70px]">
          <p className="text-xs text-gray-500">Quality</p>
          <p className="text-xl font-bold text-green-400">
            {inspection.quality_score}<span className="text-xs text-gray-500">/100</span>
          </p>
          <div className="progress-bar mt-1">
            <div 
              className="progress-fill" 
              style={{ width: `${inspection.quality_score}%`, backgroundColor: '#10b981' }}
            />
          </div>
        </div>
        
        {/* SLA */}
        <div className="min-w-[80px]">
          <p className="text-xs text-gray-500">SLA</p>
          <p className="font-semibold text-sm">{slaTime}</p>
        </div>
        
        {/* Actions */}
        <div className="flex gap-2">
          <button className="btn-primary text-sm py-2 px-4">
            <Eye className="w-4 h-4" /> Revisar
          </button>
        </div>
      </div>
    </div>
  );
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [stats, setStats] = useState({ pending: 0, review: 0, approved: 0, reinspection: 0, avgTime: '0h', autoApprovalRate: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [inspectionsData, statsData] = await Promise.all([
        getInspections(),
        getStats()
      ]);
      setInspections(inspectionsData);
      setStats(statsData);
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Error al cargar datos. Verifica la conexión.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);
  
  const filteredInspections = inspections.filter(ins => {
    const matchesSearch = ins.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (ins.client_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (ins.vehicle_plate || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || ins.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-[#0a0a12]">
      {/* Header */}
      <header className="border-b border-white/10 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#ec4899] flex items-center justify-center font-bold text-lg">
              H
            </div>
            <span className="font-bold text-lg">HenkanCX</span>
            <span className="badge badge-purple ml-2">Dashboard de Triage</span>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={loadData} className="btn-secondary" disabled={loading}>
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button className="btn-primary">
              <Plus className="w-4 h-4" /> Crear Inspección
            </button>
            <button className="btn-secondary">
              <BarChart3 className="w-4 h-4" /> Reportes
            </button>
          </div>
        </div>
      </header>

      <main className="p-6">
        {/* Error */}
        {error && (
          <div className="card mb-6 border-red-500/50 bg-red-500/10">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-400" />
              <p className="text-red-400">{error}</p>
              <button onClick={loadData} className="btn-secondary ml-auto text-sm">Reintentar</button>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <StatCard 
            icon={Clock} 
            label="Casos Pendientes" 
            value={stats.pending} 
            subtitle="Esperando revisión"
            color="bg-yellow-500/20 text-yellow-400"
          />
          <StatCard 
            icon={Eye} 
            label="En Revisión" 
            value={stats.review} 
            subtitle={`Tiempo prom: ${stats.avgTime}`}
            color="bg-blue-500/20 text-blue-400"
          />
          <StatCard 
            icon={CheckCircle} 
            label="Aprobadas" 
            value={stats.approved} 
            subtitle={`${stats.autoApprovalRate}% auto-aprobación`}
            color="bg-green-500/20 text-green-400"
          />
          <StatCard 
            icon={AlertTriangle} 
            label="Reinspecciones" 
            value={stats.reinspection} 
            subtitle="Requieren atención"
            color="bg-red-500/20 text-red-400"
          />
        </div>

        {/* Filters */}
        <div className="flex gap-3 mb-6 flex-wrap">
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input 
              type="text" 
              placeholder="Buscar por ID, cliente o placa..."
              className="input pl-12"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select 
            className="input w-auto"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">Todos los estados</option>
            <option value="Pendiente">Pendiente</option>
            <option value="En Revisión">En Revisión</option>
            <option value="Aprobada">Aprobada</option>
            <option value="Rechazada">Rechazada</option>
            <option value="Reinspección">Reinspección</option>
          </select>
        </div>

        {/* Loading */}
        {loading && (
          <div className="card text-center py-12">
            <Loader2 className="w-8 h-8 text-[#ec4899] mx-auto mb-4 animate-spin" />
            <p className="text-gray-400">Cargando inspecciones...</p>
          </div>
        )}

        {/* Inspection List */}
        {!loading && (
          <div>
            {filteredInspections.map((inspection) => (
              <InspectionRow 
                key={inspection.id} 
                inspection={inspection} 
                onClick={() => navigate(`/inspection/${inspection.id}`)}
              />
            ))}
            
            {filteredInspections.length === 0 && !error && (
              <div className="card text-center py-12">
                <AlertCircle className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                <p className="text-gray-400">
                  {inspections.length === 0 
                    ? 'No hay inspecciones aún. Las nuevas aparecerán aquí.'
                    : 'No se encontraron inspecciones con ese filtro'}
                </p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
