import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Clock, Eye, CheckCircle, AlertTriangle, Search, Plus, 
  BarChart3, ChevronDown, AlertCircle
} from 'lucide-react';
import { mockInspections, getStats, type Inspection } from '../data/mockData';
import { format, formatDistanceToNow } from 'date-fns';
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
  const slaTime = formatDistanceToNow(new Date(inspection.slaDeadline), { locale: es, addSuffix: false });
  const statusIndicator = inspection.status === 'Pendiente' ? 'bg-red-500' : 
                         inspection.status === 'En Revisión' ? 'bg-yellow-500' : 
                         inspection.status === 'Aprobada' ? 'bg-green-500' : 'bg-red-500';

  return (
    <div className="card card-hover cursor-pointer mb-3" onClick={onClick}>
      <div className="flex items-center gap-6">
        {/* Status Indicator */}
        <div className={`w-3 h-3 rounded-full ${statusIndicator}`} />
        
        {/* ID & Client Info */}
        <div className="min-w-[200px]">
          <p className="font-semibold text-sm">{inspection.id}</p>
          <p className="text-sm text-gray-400">{inspection.clientName}</p>
          <p className="text-xs text-gray-500">{inspection.vehicle.brand} {inspection.vehicle.model} {inspection.vehicle.year}</p>
          <div className="flex gap-1 mt-2 flex-wrap">
            {inspection.tags.slice(0, 3).map((tag, i) => (
              <span key={i} className={`badge ${getTagClass(tag)}`}>{tag}</span>
            ))}
          </div>
        </div>
        
        {/* Policy Type */}
        <div className="min-w-[100px]">
          <p className="text-xs text-gray-500">Policy Type</p>
          <p className="font-medium">{inspection.policyType}</p>
        </div>
        
        {/* Policy Status */}
        <div className="min-w-[100px]">
          <p className="text-xs text-gray-500">Policy Status</p>
          <p className={`font-medium ${getPolicyStatusColor(inspection.policyStatus)}`}>
            {inspection.policyStatus}
          </p>
        </div>
        
        {/* Risk Score */}
        <div className="min-w-[80px]">
          <p className="text-xs text-gray-500">Risk Score</p>
          <p className="text-2xl font-bold" style={{ color: getRiskColor(inspection.riskScore) }}>
            {inspection.riskScore}<span className="text-sm text-gray-500">/100</span>
          </p>
          <div className="progress-bar mt-1">
            <div 
              className="progress-fill" 
              style={{ width: `${inspection.riskScore}%`, backgroundColor: getRiskColor(inspection.riskScore) }}
            />
          </div>
        </div>
        
        {/* Quality Score */}
        <div className="min-w-[80px]">
          <p className="text-xs text-gray-500">Quality Score</p>
          <p className="text-2xl font-bold text-green-400">
            {inspection.qualityScore}<span className="text-sm text-gray-500">/100</span>
          </p>
          <div className="progress-bar mt-1">
            <div 
              className="progress-fill" 
              style={{ width: `${inspection.qualityScore}%`, backgroundColor: '#10b981' }}
            />
          </div>
        </div>
        
        {/* SLA */}
        <div className="min-w-[100px]">
          <p className="text-xs text-gray-500">SLA Restante</p>
          <p className="font-semibold">{slaTime}</p>
          <p className="text-xs text-gray-500">
            {format(new Date(inspection.slaDeadline), 'yyyy-MM-dd HH:mm')}
          </p>
        </div>
        
        {/* Actions */}
        <div className="flex gap-2 ml-auto">
          <button className="btn-primary text-sm py-2 px-4">
            <Eye className="w-4 h-4" /> Revisar
          </button>
          <button className="btn-secondary text-sm py-2 px-3">
            <CheckCircle className="w-4 h-4" />
          </button>
          <button className="btn-secondary text-sm py-2 px-3">
            <AlertTriangle className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default function Dashboard() {
  const navigate = useNavigate();
  const stats = getStats();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  const filteredInspections = mockInspections.filter(ins => {
    const matchesSearch = ins.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ins.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ins.vehicle.plate.toLowerCase().includes(searchTerm.toLowerCase());
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
        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <StatCard 
            icon={Clock} 
            label="Casos Pendientes" 
            value={stats.pending} 
            subtitle={`+3 en las últimas 2h`}
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
            label="Aprobados Hoy" 
            value={stats.approved} 
            subtitle={`${stats.autoApprovalRate}% auto-aprobación`}
            color="bg-green-500/20 text-green-400"
          />
          <StatCard 
            icon={AlertTriangle} 
            label="Reinspecciones" 
            value={stats.reinspection} 
            subtitle="8% del total"
            color="bg-red-500/20 text-red-400"
          />
        </div>

        {/* Filters */}
        <div className="flex gap-3 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input 
              type="text" 
              placeholder="Buscar por número de caso, cliente o vehículo..."
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
          <button className="btn-secondary">
            Todas las prioridades <ChevronDown className="w-4 h-4" />
          </button>
          <button className="btn-secondary">
            Todos los tipos de póliza <ChevronDown className="w-4 h-4" />
          </button>
        </div>

        {/* Inspection List */}
        <div>
          {filteredInspections.map((inspection) => (
            <InspectionRow 
              key={inspection.id} 
              inspection={inspection} 
              onClick={() => navigate(`/inspection/${inspection.id}`)}
            />
          ))}
          
          {filteredInspections.length === 0 && (
            <div className="card text-center py-12">
              <AlertCircle className="w-12 h-12 text-gray-500 mx-auto mb-4" />
              <p className="text-gray-400">No se encontraron inspecciones</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
