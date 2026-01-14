import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MessageSquare, CheckCircle, XCircle, AlertTriangle, ChevronLeft, ChevronRight, Loader2, X, Eye } from 'lucide-react';
import { 
  getInspectionById, getDamagesByInspection, getPhotosByInspection,
  updateInspectionStatus, updateDamageApproval,
  type Inspection, type Damage, type Photo
} from '../lib/supabase';

export default function InspectionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [inspection, setInspection] = useState<Inspection | null>(null);
  const [damages, setDamages] = useState<Damage[]>([]);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);
  const [reviewNotes, setReviewNotes] = useState('');
  const [modalImage, setModalImage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'damages' | 'consistency'>('damages');
  
  useEffect(() => { loadData(); }, [id]);

  const loadData = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [ins, dam, pho] = await Promise.all([
        getInspectionById(id), getDamagesByInspection(id), getPhotosByInspection(id)
      ]);
      setInspection(ins); setDamages(dam || []); setPhotos(pho || []);
      setReviewNotes(ins.review_notes || '');
    } catch (e) { console.error(e); } 
    finally { setLoading(false); }
  };
  
  const handleAction = async (status: Inspection['status']) => {
    if (!inspection) return;
    setSaving(true);
    try {
      await updateInspectionStatus(inspection.id, status, reviewNotes);
      navigate('/');
    } catch {} finally { setSaving(false); }
  };
  
  const toggleDamage = async (damageId: string, approved: boolean) => {
    await updateDamageApproval(damageId, approved);
    setDamages(prev => prev.map(d => d.id === damageId ? { ...d, approved } : d));
  };

  const calculateSLA = () => {
    if (!inspection?.sla_deadline) return 'N/A';
    const deadline = new Date(inspection.sla_deadline);
    const now = new Date();
    const diff = deadline.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    if (diff <= 0) return 'Vencido';
    return `${hours}h ${minutes}m`;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Pendiente': return 'bg-yellow-500 text-black';
      case 'En Revisión': return 'bg-blue-500 text-white';
      case 'Aprobada': return 'bg-emerald-500 text-white';
      case 'Rechazada': return 'bg-red-500 text-white';
      case 'Reinspección': return 'bg-pink-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'Leve': return 'bg-emerald-500 text-white';
      case 'Moderado': return 'bg-yellow-500 text-black';
      case 'Severo': return 'bg-orange-500 text-white';
      default: return 'bg-red-500 text-white';
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

  if (loading) return (
    <div className="min-h-screen bg-[#0d1421] flex items-center justify-center">
      <Loader2 className="w-10 h-10 text-pink-500 animate-spin" />
    </div>
  );
  
  if (!inspection) return (
    <div className="min-h-screen bg-[#0d1421] flex items-center justify-center">
      <button onClick={() => navigate('/')} className="px-6 py-3 bg-pink-500 rounded-lg font-medium text-white">← Volver</button>
    </div>
  );

  const currentPhoto = photos[selectedPhotoIndex];

  return (
    <div className="min-h-screen bg-[#0d1421]">
      {/* Modal */}
      {modalImage && (
        <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-8" onClick={() => setModalImage(null)}>
          <button className="absolute top-6 right-6 p-2 bg-white/10 hover:bg-white/20 rounded-lg">
            <X className="w-6 h-6 text-white" />
          </button>
          <img src={modalImage} className="max-w-full max-h-full object-contain rounded-lg" />
        </div>
      )}

      {/* Header */}
      <header className="px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/')} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Volver</span>
          </button>
          <div>
            <p className="font-mono text-sm font-semibold text-white">{inspection.id}</p>
            <p className="text-sm text-gray-400">{inspection.client_name} • {inspection.vehicle_brand} {inspection.vehicle_model} {inspection.vehicle_year}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <span className={`px-3 py-1 text-xs font-semibold rounded ${getStatusBadge(inspection.status)}`}>
            {inspection.status}
          </span>
          <span className="px-3 py-1 text-xs font-semibold rounded bg-cyan-500/20 text-cyan-400">
            SLA: {calculateSLA()}
          </span>
        </div>
      </header>

      {/* Main Content - 3 Columns */}
      <main className="px-6 pb-6">
        <div className="grid grid-cols-12 gap-5">
          
          {/* Left Column */}
          <div className="col-span-3 space-y-5">
            {/* Cliente Info */}
            <div className="bg-[#151d2b] rounded-xl p-5">
              <h3 className="text-sm font-semibold text-white mb-4">Información del Cliente</h3>
              <div className="space-y-3">
                <InfoRow label="Nombre" value={inspection.client_name} />
                <InfoRow label="ID" value={inspection.client_id} />
                <InfoRow label="Teléfono" value={inspection.client_phone} />
                <InfoRow label="Email" value={inspection.client_email} />
              </div>
            </div>

            {/* Vehículo Info */}
            <div className="bg-[#151d2b] rounded-xl p-5">
              <h3 className="text-sm font-semibold text-white mb-4">Datos del Vehículo</h3>
              <div className="space-y-3">
                <InfoRow label="VIN" value={inspection.vehicle_vin} mono />
                <InfoRow label="Placa" value={inspection.vehicle_plate} />
                <InfoRow label="Marca/Modelo" value={`${inspection.vehicle_brand} ${inspection.vehicle_model}`} />
                <InfoRow label="Año" value={inspection.vehicle_year} />
                <InfoRow label="Color" value={inspection.vehicle_color} />
                <InfoRow label="Kilometraje" value={inspection.vehicle_mileage ? `${inspection.vehicle_mileage.toLocaleString()} km` : null} />
                <InfoRow label="Uso" value={inspection.vehicle_usage === 'private' ? 'Particular' : inspection.vehicle_usage} />
              </div>
            </div>

            {/* Scores */}
            <div className="bg-[#151d2b] rounded-xl p-5">
              <h3 className="text-sm font-semibold text-white mb-4">Scores</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-sm text-gray-400">Risk</span>
                    <span className={`text-sm font-semibold ${getRiskTextColor(inspection.risk_score)}`}>{inspection.risk_score}/100</span>
                  </div>
                  <div className="h-1.5 bg-[#2a3a4f] rounded-full">
                    <div className={`h-full rounded-full ${getRiskColor(inspection.risk_score)}`} style={{ width: `${inspection.risk_score}%` }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-sm text-gray-400">Quality</span>
                    <span className="text-sm font-semibold text-emerald-400">{inspection.quality_score}/100</span>
                  </div>
                  <div className="h-1.5 bg-[#2a3a4f] rounded-full">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${inspection.quality_score}%` }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Center Column */}
          <div className="col-span-6 space-y-5">
            {/* Image Viewer */}
            <div className="bg-[#151d2b] rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-white">Visor de Imágenes</h3>
                <span className="text-xs text-gray-400">{photos.length > 0 ? `${selectedPhotoIndex + 1}/${photos.length}` : '0/0'}</span>
              </div>
              
              {/* Main Image Area */}
              <div 
                className="aspect-[16/10] bg-[#0d1421] rounded-lg mb-4 flex items-center justify-center cursor-pointer relative group"
                onClick={() => currentPhoto?.image_url && setModalImage(currentPhoto.image_url)}
              >
                {currentPhoto?.image_url ? (
                  <>
                    <img src={currentPhoto.image_url} className="max-w-full max-h-full object-contain" />
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
                      <Eye className="w-8 h-8 text-white" />
                    </div>
                  </>
                ) : (
                  <span className="text-gray-500">{currentPhoto?.label || 'Frontal'}</span>
                )}
              </div>

              {/* Thumbnail Grid */}
              <div className="grid grid-cols-6 gap-2 mb-4">
                {Array.from({ length: 12 }).map((_, idx) => {
                  const photo = photos[idx];
                  const isSelected = selectedPhotoIndex === idx;
                  return (
                    <button
                      key={idx}
                      onClick={() => photo && setSelectedPhotoIndex(idx)}
                      className={`aspect-square rounded-lg border-2 overflow-hidden transition-all ${
                        isSelected ? 'border-pink-500' : 'border-[#2a3a4f] hover:border-gray-600'
                      } ${!photo ? 'opacity-50' : ''}`}
                    >
                      {photo?.image_url ? (
                        <img src={photo.image_url} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-[#1e2a3b] flex items-center justify-center">
                          <span className="text-xs text-gray-600">{idx + 1}</span>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Navigation */}
              <div className="flex gap-3">
                <button 
                  onClick={() => setSelectedPhotoIndex(Math.max(0, selectedPhotoIndex - 1))}
                  disabled={selectedPhotoIndex === 0}
                  className="flex-1 py-2.5 bg-[#1e2a3b] rounded-lg text-sm text-gray-400 font-medium disabled:opacity-30 hover:bg-[#2a3a4f] transition-all flex items-center justify-center gap-2"
                >
                  <ChevronLeft className="w-4 h-4" /> Anterior
                </button>
                <button 
                  onClick={() => setSelectedPhotoIndex(Math.min(photos.length - 1, selectedPhotoIndex + 1))}
                  disabled={selectedPhotoIndex >= photos.length - 1}
                  className="flex-1 py-2.5 bg-[#1e2a3b] rounded-lg text-sm text-white font-medium disabled:opacity-30 hover:bg-[#2a3a4f] transition-all flex items-center justify-center gap-2"
                >
                  Siguiente <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Client Comments */}
            <div className="bg-[#151d2b] rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <MessageSquare className="w-4 h-4 text-gray-400" />
                <h3 className="text-sm font-semibold text-white">Comentarios del Cliente</h3>
              </div>
              <p className="text-sm text-gray-400 leading-relaxed">
                {inspection.client_comments || inspection.accident_description || 'El vehículo ha sido siempre guardado en garage. El rayón de la puerta izquierda fue causado en un estacionamiento. Las llantas fueron cambiadas hace 3 meses.'}
              </p>
            </div>
          </div>

          {/* Right Column */}
          <div className="col-span-3 space-y-5">
            {/* Damages Tabs */}
            <div className="bg-[#151d2b] rounded-xl overflow-hidden">
              <div className="flex">
                <button
                  onClick={() => setActiveTab('damages')}
                  className={`flex-1 py-3 text-sm font-medium transition-all ${
                    activeTab === 'damages' ? 'bg-pink-500 text-white' : 'bg-[#1e2a3b] text-gray-400 hover:text-white'
                  }`}
                >
                  Daños
                </button>
                <button
                  onClick={() => setActiveTab('consistency')}
                  className={`flex-1 py-3 text-sm font-medium transition-all ${
                    activeTab === 'consistency' ? 'bg-pink-500 text-white' : 'bg-[#1e2a3b] text-gray-400 hover:text-white'
                  }`}
                >
                  Consistencia
                </button>
              </div>
              
              <div className="p-4 max-h-[320px] overflow-y-auto">
                {activeTab === 'damages' ? (
                  damages.length > 0 ? (
                    <div className="space-y-3">
                      {damages.map((damage) => (
                        <div key={damage.id} className="p-3 bg-[#0d1421] rounded-lg">
                          <div className="flex items-start justify-between mb-1">
                            <div>
                              <p className="text-sm font-medium text-white">{damage.part}</p>
                              <p className="text-xs text-gray-500">{damage.type}</p>
                            </div>
                            <span className={`px-2 py-0.5 text-xs font-semibold rounded ${getSeverityBadge(damage.severity)}`}>
                              {damage.severity}
                            </span>
                          </div>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs text-gray-500">IA: {damage.confidence}%</span>
                            <div className="flex gap-1.5">
                              <button 
                                onClick={() => toggleDamage(damage.id, true)}
                                className={`w-6 h-6 rounded flex items-center justify-center transition-all ${
                                  damage.approved === true ? 'bg-emerald-500 text-white' : 'bg-[#1e2a3b] text-emerald-400 hover:bg-emerald-500/20'
                                }`}
                              >
                                <CheckCircle className="w-3.5 h-3.5" />
                              </button>
                              <button 
                                onClick={() => toggleDamage(damage.id, false)}
                                className={`w-6 h-6 rounded flex items-center justify-center transition-all ${
                                  damage.approved === false ? 'bg-red-500 text-white' : 'bg-[#1e2a3b] text-red-400 hover:bg-red-500/20'
                                }`}
                              >
                                <XCircle className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-8 text-center">
                      <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-400">Sin daños detectados</p>
                    </div>
                  )
                ) : (
                  <div className="py-8 text-center">
                    <p className="text-sm text-gray-500">Análisis de consistencia próximamente</p>
                  </div>
                )}
              </div>
            </div>

            {/* Review Notes */}
            <div className="bg-[#151d2b] rounded-xl p-5">
              <h3 className="text-sm font-semibold text-white mb-3">Notas de Revisión</h3>
              <textarea 
                className="w-full h-24 bg-[#0d1421] border border-[#2a3a4f] rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 resize-none focus:outline-none focus:border-pink-500"
                placeholder="Agrega notas sobre tu revisión..."
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
              />
            </div>

            {/* Decision Buttons */}
            <div className="bg-[#151d2b] rounded-xl p-5">
              <h3 className="text-sm font-semibold text-white mb-3">Decisión</h3>
              <div className="space-y-2.5">
                <button 
                  onClick={() => handleAction('Aprobada')} 
                  disabled={saving}
                  className="w-full py-2.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <CheckCircle className="w-4 h-4" />
                  Aprobar
                </button>
                <button 
                  onClick={() => handleAction('Reinspección')} 
                  disabled={saving}
                  className="w-full py-2.5 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <AlertTriangle className="w-4 h-4" />
                  Solicitar Reinspección
                </button>
                <button 
                  onClick={() => handleAction('Rechazada')} 
                  disabled={saving}
                  className="w-full py-2.5 bg-pink-500/20 hover:bg-pink-500/30 text-pink-400 text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <XCircle className="w-4 h-4" />
                  Escalar a Supervisor
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function InfoRow({ label, value, mono }: { label: string; value: any; mono?: boolean }) {
  return (
    <div>
      <p className="text-xs text-gray-500 mb-0.5">{label}</p>
      <p className={`text-sm text-white ${mono ? 'font-mono' : ''}`}>{value || '—'}</p>
    </div>
  );
}
