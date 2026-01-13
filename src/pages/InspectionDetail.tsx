import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Download, CheckCircle, AlertTriangle, XCircle, 
  ChevronLeft, ChevronRight, MessageSquare, Clock
} from 'lucide-react';
import { mockInspections, type Damage } from '../data/mockData';
import { downloadPDF } from '../utils/pdfGenerator';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

const getSeverityClass = (severity: string) => {
  switch (severity) {
    case 'Leve': return 'badge-green';
    case 'Moderado': return 'badge-yellow';
    case 'Severo': return 'badge-red';
    default: return 'badge-gray';
  }
};

const DamageItem = ({ damage, onApprove, onReject }: { damage: Damage; onApprove: () => void; onReject: () => void }) => (
  <div className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
    <div className="flex-1">
      <div className="flex items-center gap-2 mb-1">
        <span className="font-medium text-sm">{damage.part}</span>
        <span className={`badge ${getSeverityClass(damage.severity)}`}>{damage.severity}</span>
      </div>
      <p className="text-xs text-gray-400">{damage.type}</p>
      <p className="text-xs text-gray-500">IA: {damage.confidence}%</p>
    </div>
    <div className="flex gap-2">
      <button 
        onClick={onApprove}
        className={`p-2 rounded-lg transition-colors ${damage.approved === true ? 'bg-green-500/20 text-green-400' : 'bg-white/5 text-gray-400 hover:bg-green-500/10 hover:text-green-400'}`}
      >
        <CheckCircle className="w-4 h-4" />
      </button>
      <button 
        onClick={onReject}
        className={`p-2 rounded-lg transition-colors ${damage.approved === false ? 'bg-red-500/20 text-red-400' : 'bg-white/5 text-gray-400 hover:bg-red-500/10 hover:text-red-400'}`}
      >
        <XCircle className="w-4 h-4" />
      </button>
    </div>
  </div>
);

export default function InspectionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const inspection = mockInspections.find(i => i.id === id);
  
  const [activeTab, setActiveTab] = useState<'damages' | 'consistency'>('damages');
  const [selectedPhoto, setSelectedPhoto] = useState(0);
  const [reviewNotes, setReviewNotes] = useState(inspection?.reviewNotes || '');
  const [damages, setDamages] = useState<Damage[]>(inspection?.damages || []);
  
  if (!inspection) {
    return (
      <div className="min-h-screen bg-[#0a0a12] flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-gray-400">Inspección no encontrada</p>
          <button onClick={() => navigate('/')} className="btn-primary mt-4">
            <ArrowLeft className="w-4 h-4" /> Volver
          </button>
        </div>
      </div>
    );
  }
  
  const slaTime = formatDistanceToNow(new Date(inspection.slaDeadline), { locale: es, addSuffix: false });
  
  const handleApprove = () => {
    alert('Inspección aprobada');
    navigate('/');
  };
  
  const handleReinspection = () => {
    alert('Reinspección solicitada');
    navigate('/');
  };
  
  const handleEscalate = () => {
    alert('Escalado a supervisor');
  };
  
  const toggleDamageApproval = (damageId: string, approved: boolean) => {
    setDamages(prev => prev.map(d => 
      d.id === damageId ? { ...d, approved } : d
    ));
  };

  return (
    <div className="min-h-screen bg-[#0a0a12]">
      {/* Header */}
      <header className="border-b border-white/10 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/')} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
              <ArrowLeft className="w-5 h-5" /> Volver
            </button>
            <div>
              <p className="font-semibold">{inspection.id}</p>
              <p className="text-sm text-gray-400">{inspection.clientName} • {inspection.vehicle.brand} {inspection.vehicle.model} {inspection.vehicle.year}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="badge badge-yellow">{inspection.status}</span>
            <div className="flex items-center gap-2 text-sm">
              <Clock className="w-4 h-4 text-gray-400" />
              <span className="text-gray-400">SLA:</span>
              <span className="font-semibold">{slaTime}</span>
            </div>
            <button onClick={() => downloadPDF(inspection)} className="btn-secondary">
              <Download className="w-4 h-4" /> PDF
            </button>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-73px)]">
        {/* Left Panel - Client & Vehicle Info */}
        <div className="w-[320px] border-r border-white/10 p-6 overflow-y-auto">
          {/* Client Info */}
          <div className="card mb-4">
            <h3 className="font-semibold mb-4 text-sm text-gray-400">Información del Cliente</h3>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-xs text-gray-500">Nombre</p>
                <p className="font-medium">{inspection.clientName}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">ID</p>
                <p className="font-medium">{inspection.clientId}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Teléfono</p>
                <p className="font-medium">{inspection.clientPhone}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Email</p>
                <p className="font-medium">{inspection.clientEmail}</p>
              </div>
            </div>
          </div>

          {/* Vehicle Info */}
          <div className="card mb-4">
            <h3 className="font-semibold mb-4 text-sm text-gray-400">Datos del Vehículo</h3>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-xs text-gray-500">VIN</p>
                <p className="font-mono">{inspection.vehicle.vin}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Placa</p>
                <p className="font-semibold">{inspection.vehicle.plate}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Marca/Modelo</p>
                <p>{inspection.vehicle.brand} {inspection.vehicle.model}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Año</p>
                <p>{inspection.vehicle.year}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Color</p>
                <p>{inspection.vehicle.color}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Kilometraje</p>
                <p>{inspection.vehicle.mileage.toLocaleString()} km</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Uso</p>
                <p>{inspection.vehicle.usage}</p>
              </div>
            </div>
          </div>

          {/* Scores */}
          <div className="card">
            <h3 className="font-semibold mb-4 text-sm text-gray-400">Scores</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm">Risk</span>
                  <span className={`font-semibold ${inspection.riskScore >= 70 ? 'text-red-400' : inspection.riskScore >= 50 ? 'text-yellow-400' : 'text-green-400'}`}>
                    {inspection.riskScore}/100
                  </span>
                </div>
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ 
                      width: `${inspection.riskScore}%`, 
                      backgroundColor: inspection.riskScore >= 70 ? '#ef4444' : inspection.riskScore >= 50 ? '#f59e0b' : '#10b981' 
                    }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm">Quality</span>
                  <span className="font-semibold text-green-400">{inspection.qualityScore}/100</span>
                </div>
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${inspection.qualityScore}%`, backgroundColor: '#10b981' }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Center Panel - Photo Viewer */}
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="card mb-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Visor de Imágenes</h3>
              <span className="text-sm text-gray-400">{selectedPhoto + 1}/12</span>
            </div>
            
            {/* Main Photo */}
            <div className="aspect-video bg-[#0a0a12] rounded-lg mb-4 flex items-center justify-center border border-white/10">
              <p className="text-gray-500">Foto {selectedPhoto + 1} - {['Frontal', 'Frontal 45° Izq.', 'Lateral Izq.', 'Trasera 45° Izq.', 'Trasera', 'Trasera 45° Der.', 'Lateral Der.', 'Frontal 45° Der.', 'Dashboard', 'Interior Frontal', 'Interior Trasero', 'Maletero'][selectedPhoto]}</p>
            </div>
            
            {/* Photo Grid */}
            <div className="photo-grid">
              {Array(12).fill(null).map((_, i) => (
                <div 
                  key={i} 
                  className={`photo-cell ${selectedPhoto === i ? 'active' : ''}`}
                  onClick={() => setSelectedPhoto(i)}
                >
                  <span className="text-xs text-gray-500">{i + 1}</span>
                </div>
              ))}
            </div>
            
            {/* Navigation */}
            <div className="flex gap-3 mt-4">
              <button 
                className="btn-secondary flex-1"
                onClick={() => setSelectedPhoto(Math.max(0, selectedPhoto - 1))}
                disabled={selectedPhoto === 0}
              >
                <ChevronLeft className="w-4 h-4" /> Anterior
              </button>
              <button 
                className="btn-secondary flex-1"
                onClick={() => setSelectedPhoto(Math.min(11, selectedPhoto + 1))}
                disabled={selectedPhoto === 11}
              >
                Siguiente <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Client Comments */}
          <div className="card">
            <div className="flex items-center gap-2 mb-3">
              <MessageSquare className="w-5 h-5 text-gray-400" />
              <h3 className="font-semibold">Comentarios del Cliente</h3>
            </div>
            <p className="text-sm text-gray-300 leading-relaxed">{inspection.clientComments}</p>
          </div>
        </div>

        {/* Right Panel - Damages & Actions */}
        <div className="w-[360px] border-l border-white/10 p-6 overflow-y-auto">
          {/* Tabs */}
          <div className="flex gap-2 mb-4">
            <button 
              className={`tab flex-1 text-sm ${activeTab === 'damages' ? 'active' : ''}`}
              onClick={() => setActiveTab('damages')}
            >
              Daños
            </button>
            <button 
              className={`tab flex-1 text-sm ${activeTab === 'consistency' ? 'active' : ''}`}
              onClick={() => setActiveTab('consistency')}
            >
              Consistencia
            </button>
          </div>

          {/* Damages List */}
          {activeTab === 'damages' && (
            <div className="card mb-4">
              {damages.length > 0 ? (
                damages.map((damage) => (
                  <DamageItem 
                    key={damage.id} 
                    damage={damage}
                    onApprove={() => toggleDamageApproval(damage.id, true)}
                    onReject={() => toggleDamageApproval(damage.id, false)}
                  />
                ))
              ) : (
                <p className="text-center text-gray-500 py-6">No se detectaron daños</p>
              )}
            </div>
          )}

          {/* Consistency Tab */}
          {activeTab === 'consistency' && (
            <div className="card mb-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm">Fotos completas</span>
                  <span className="badge badge-green">✓ OK</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm">Datos coinciden</span>
                  <span className="badge badge-green">✓ OK</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm">Geolocalización</span>
                  <span className="badge badge-green">✓ OK</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm">Fecha/Hora válida</span>
                  <span className="badge badge-green">✓ OK</span>
                </div>
              </div>
            </div>
          )}

          {/* Review Notes */}
          <div className="card mb-4">
            <h3 className="font-semibold mb-3 text-sm">Notas de Revisión</h3>
            <textarea 
              className="input min-h-[100px] resize-none"
              placeholder="Agrega notas sobre tu revisión..."
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
            />
          </div>

          {/* Decision Actions */}
          <div className="card">
            <h3 className="font-semibold mb-3 text-sm">Decisión</h3>
            <div className="space-y-2">
              <button onClick={handleApprove} className="btn-success w-full justify-center">
                <CheckCircle className="w-4 h-4" /> Aprobar
              </button>
              <button onClick={handleReinspection} className="btn-warning w-full justify-center">
                <AlertTriangle className="w-4 h-4" /> Solicitar Reinspección
              </button>
              <button onClick={handleEscalate} className="btn-danger w-full justify-center">
                <XCircle className="w-4 h-4" /> Escalar a Supervisor
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
