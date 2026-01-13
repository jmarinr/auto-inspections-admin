import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Download, CheckCircle, AlertTriangle, XCircle, 
  ChevronLeft, ChevronRight, MessageSquare, Clock, Loader2
} from 'lucide-react';
import { 
  getInspectionById, getDamagesByInspection, getPhotosByInspection,
  updateInspectionStatus, updateDamageApproval,
  type Inspection, type Damage, type Photo
} from '../lib/supabase';
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
  
  const [inspection, setInspection] = useState<Inspection | null>(null);
  const [damages, setDamages] = useState<Damage[]>([]);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  
  const [activeTab, setActiveTab] = useState<'damages' | 'consistency'>('damages');
  const [selectedPhoto, setSelectedPhoto] = useState(0);
  const [reviewNotes, setReviewNotes] = useState('');
  
  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    if (!id) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const [inspectionData, damagesData, photosData] = await Promise.all([
        getInspectionById(id),
        getDamagesByInspection(id),
        getPhotosByInspection(id)
      ]);
      
      setInspection(inspectionData);
      setDamages(damagesData);
      setPhotos(photosData);
      setReviewNotes(inspectionData.review_notes || '');
    } catch (err) {
      console.error('Error loading inspection:', err);
      setError('Error al cargar la inspección');
    } finally {
      setLoading(false);
    }
  };
  
  const handleApprove = async () => {
    if (!inspection) return;
    setSaving(true);
    try {
      await updateInspectionStatus(inspection.id, 'Aprobada', reviewNotes);
      alert('✅ Inspección aprobada');
      navigate('/');
    } catch (err) {
      alert('Error al aprobar');
    } finally {
      setSaving(false);
    }
  };
  
  const handleReinspection = async () => {
    if (!inspection) return;
    setSaving(true);
    try {
      await updateInspectionStatus(inspection.id, 'Reinspección', reviewNotes);
      alert('⚠️ Reinspección solicitada');
      navigate('/');
    } catch (err) {
      alert('Error al solicitar reinspección');
    } finally {
      setSaving(false);
    }
  };
  
  const handleEscalate = async () => {
    if (!inspection) return;
    setSaving(true);
    try {
      await updateInspectionStatus(inspection.id, 'En Revisión', reviewNotes + '\n[ESCALADO A SUPERVISOR]');
      alert('📤 Escalado a supervisor');
      navigate('/');
    } catch (err) {
      alert('Error al escalar');
    } finally {
      setSaving(false);
    }
  };
  
  const toggleDamageApproval = async (damageId: string, approved: boolean) => {
    try {
      await updateDamageApproval(damageId, approved);
      setDamages(prev => prev.map(d => 
        d.id === damageId ? { ...d, approved } : d
      ));
    } catch (err) {
      console.error('Error updating damage:', err);
    }
  };

  const handleDownloadPDF = () => {
    if (!inspection) return;
    // Adaptar inspection al formato esperado por el generador de PDF
    const pdfData = {
      id: inspection.id,
      clientName: inspection.client_name || '',
      clientId: inspection.client_id || '',
      clientPhone: inspection.client_phone || '',
      clientEmail: inspection.client_email || '',
      vehicle: {
        vin: inspection.vehicle_vin || '',
        plate: inspection.vehicle_plate || '',
        brand: inspection.vehicle_brand || '',
        model: inspection.vehicle_model || '',
        year: inspection.vehicle_year || 0,
        color: inspection.vehicle_color || '',
        mileage: inspection.vehicle_mileage || 0,
        usage: inspection.vehicle_usage || '',
      },
      policyType: inspection.policy_type,
      policyStatus: inspection.policy_status,
      status: inspection.status,
      riskScore: inspection.risk_score,
      qualityScore: inspection.quality_score,
      slaDeadline: inspection.sla_deadline || '',
      createdAt: inspection.created_at,
      tags: inspection.tags || [],
      damages: damages.map(d => ({
        id: d.id,
        part: d.part,
        type: d.type,
        severity: d.severity as 'Leve' | 'Moderado' | 'Severo',
        confidence: d.confidence,
        approved: d.approved || undefined,
      })),
      photos: photos.map(p => p.image_url || ''),
      clientComments: inspection.client_comments || '',
      reviewNotes: inspection.review_notes || '',
    };
    downloadPDF(pdfData);
  };

  // Loading
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a12] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-[#ec4899] mx-auto mb-4 animate-spin" />
          <p className="text-gray-400">Cargando inspección...</p>
        </div>
      </div>
    );
  }

  // Error or not found
  if (error || !inspection) {
    return (
      <div className="min-h-screen bg-[#0a0a12] flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-gray-400">{error || 'Inspección no encontrada'}</p>
          <button onClick={() => navigate('/')} className="btn-primary mt-4">
            <ArrowLeft className="w-4 h-4" /> Volver
          </button>
        </div>
      </div>
    );
  }
  
  const slaTime = inspection.sla_deadline 
    ? formatDistanceToNow(new Date(inspection.sla_deadline), { locale: es, addSuffix: false })
    : 'N/A';

  const vehiclePhotos = photos.filter(p => p.photo_type === 'vehicle');

  return (
    <div className="min-h-screen bg-[#0a0a12]">
      {/* Header */}
      <header className="border-b border-white/10 px-6 py-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/')} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
              <ArrowLeft className="w-5 h-5" /> Volver
            </button>
            <div>
              <p className="font-semibold">{inspection.id}</p>
              <p className="text-sm text-gray-400">
                {inspection.client_name} • {inspection.vehicle_brand} {inspection.vehicle_model} {inspection.vehicle_year}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="badge badge-yellow">{inspection.status}</span>
            <div className="flex items-center gap-2 text-sm">
              <Clock className="w-4 h-4 text-gray-400" />
              <span className="text-gray-400">SLA:</span>
              <span className="font-semibold">{slaTime}</span>
            </div>
            <button onClick={handleDownloadPDF} className="btn-secondary">
              <Download className="w-4 h-4" /> PDF
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-col lg:flex-row h-[calc(100vh-73px)]">
        {/* Left Panel - Client & Vehicle Info */}
        <div className="w-full lg:w-[320px] border-b lg:border-b-0 lg:border-r border-white/10 p-6 overflow-y-auto">
          {/* Client Info */}
          <div className="card mb-4">
            <h3 className="font-semibold mb-4 text-sm text-gray-400">Información del Cliente</h3>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-xs text-gray-500">Nombre</p>
                <p className="font-medium">{inspection.client_name || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">ID</p>
                <p className="font-medium">{inspection.client_id || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Teléfono</p>
                <p className="font-medium">{inspection.client_phone || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Email</p>
                <p className="font-medium">{inspection.client_email || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Vehicle Info */}
          <div className="card mb-4">
            <h3 className="font-semibold mb-4 text-sm text-gray-400">Datos del Vehículo</h3>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-xs text-gray-500">VIN</p>
                <p className="font-mono text-xs">{inspection.vehicle_vin || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Placa</p>
                <p className="font-semibold">{inspection.vehicle_plate || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Marca/Modelo</p>
                <p>{inspection.vehicle_brand} {inspection.vehicle_model}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Año</p>
                <p>{inspection.vehicle_year || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Color</p>
                <p>{inspection.vehicle_color || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Kilometraje</p>
                <p>{inspection.vehicle_mileage?.toLocaleString() || 'N/A'} km</p>
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
                  <span className={`font-semibold ${inspection.risk_score >= 70 ? 'text-red-400' : inspection.risk_score >= 50 ? 'text-yellow-400' : 'text-green-400'}`}>
                    {inspection.risk_score}/100
                  </span>
                </div>
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ 
                      width: `${inspection.risk_score}%`, 
                      backgroundColor: inspection.risk_score >= 70 ? '#ef4444' : inspection.risk_score >= 50 ? '#f59e0b' : '#10b981' 
                    }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm">Quality</span>
                  <span className="font-semibold text-green-400">{inspection.quality_score}/100</span>
                </div>
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${inspection.quality_score}%`, backgroundColor: '#10b981' }}
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
              <span className="text-sm text-gray-400">{photos.length > 0 ? `${selectedPhoto + 1}/${photos.length}` : '0 fotos'}</span>
            </div>
            
            {/* Main Photo */}
            <div className="aspect-video bg-[#0a0a12] rounded-lg mb-4 flex items-center justify-center border border-white/10 overflow-hidden">
              {photos.length > 0 && photos[selectedPhoto]?.image_url ? (
                <img 
                  src={photos[selectedPhoto].image_url} 
                  alt={photos[selectedPhoto].label || 'Foto'}
                  className="w-full h-full object-contain"
                />
              ) : (
                <p className="text-gray-500">
                  {photos.length === 0 ? 'No hay fotos' : `Foto ${selectedPhoto + 1}`}
                </p>
              )}
            </div>
            
            {/* Photo Grid */}
            {photos.length > 0 && (
              <>
                <div className="photo-grid">
                  {photos.slice(0, 12).map((photo, i) => (
                    <div 
                      key={photo.id} 
                      className={`photo-cell ${selectedPhoto === i ? 'active' : ''}`}
                      onClick={() => setSelectedPhoto(i)}
                    >
                      {photo.image_url ? (
                        <img src={photo.image_url} alt={photo.label || ''} />
                      ) : (
                        <span className="text-xs text-gray-500">{i + 1}</span>
                      )}
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
                    onClick={() => setSelectedPhoto(Math.min(photos.length - 1, selectedPhoto + 1))}
                    disabled={selectedPhoto === photos.length - 1}
                  >
                    Siguiente <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Client Comments */}
          {inspection.client_comments && (
            <div className="card">
              <div className="flex items-center gap-2 mb-3">
                <MessageSquare className="w-5 h-5 text-gray-400" />
                <h3 className="font-semibold">Comentarios del Cliente</h3>
              </div>
              <p className="text-sm text-gray-300 leading-relaxed">{inspection.client_comments}</p>
            </div>
          )}
        </div>

        {/* Right Panel - Damages & Actions */}
        <div className="w-full lg:w-[360px] border-t lg:border-t-0 lg:border-l border-white/10 p-6 overflow-y-auto">
          {/* Tabs */}
          <div className="flex gap-2 mb-4">
            <button 
              className={`tab flex-1 text-sm ${activeTab === 'damages' ? 'active' : ''}`}
              onClick={() => setActiveTab('damages')}
            >
              Daños ({damages.length})
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
                  <span className={`badge ${vehiclePhotos.length >= 8 ? 'badge-green' : 'badge-yellow'}`}>
                    {vehiclePhotos.length >= 8 ? '✓ OK' : `${vehiclePhotos.length}/8`}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm">Datos del cliente</span>
                  <span className={`badge ${inspection.client_name ? 'badge-green' : 'badge-yellow'}`}>
                    {inspection.client_name ? '✓ OK' : 'Incompleto'}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm">Datos del vehículo</span>
                  <span className={`badge ${inspection.vehicle_plate ? 'badge-green' : 'badge-yellow'}`}>
                    {inspection.vehicle_plate ? '✓ OK' : 'Incompleto'}
                  </span>
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
              <button onClick={handleApprove} disabled={saving} className="btn-success w-full justify-center">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />} Aprobar
              </button>
              <button onClick={handleReinspection} disabled={saving} className="btn-warning w-full justify-center">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <AlertTriangle className="w-4 h-4" />} Solicitar Reinspección
              </button>
              <button onClick={handleEscalate} disabled={saving} className="btn-danger w-full justify-center">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />} Escalar a Supervisor
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
