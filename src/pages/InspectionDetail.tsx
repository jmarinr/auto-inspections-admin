import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Download, CheckCircle, AlertTriangle, XCircle, 
  ChevronLeft, ChevronRight, Loader2, X, Sun, Moon,
  MessageSquare, Eye, ExternalLink
} from 'lucide-react';
import { 
  getInspectionById, getDamagesByInspection, getPhotosByInspection,
  getConsentByInspection, updateInspectionStatus, updateDamageApproval,
  type Inspection, type Damage, type Photo, type Consent
} from '../lib/supabase';
import { downloadPDF } from '../utils/pdfGenerator';


export default function InspectionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [inspection, setInspection] = useState<Inspection | null>(null);
  const [damages, setDamages] = useState<Damage[]>([]);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [, setConsent] = useState<Consent | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);
  const [reviewNotes, setReviewNotes] = useState('');
  const [modalImage, setModalImage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'damages' | 'consistency'>('damages');
  const [isDark, setIsDark] = useState(true);
  
  useEffect(() => { loadData(); }, [id]);

  const loadData = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [ins, dam, pho, con] = await Promise.all([
        getInspectionById(id), getDamagesByInspection(id), getPhotosByInspection(id), getConsentByInspection(id)
      ]);
      setInspection(ins); setDamages(dam || []); setPhotos(pho || []); setConsent(con); 
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

  const handleDownloadPDF = () => {
    if (!inspection) return;
    downloadPDF({
      id: inspection.id, clientName: inspection.client_name || '', clientId: inspection.client_id || '',
      clientPhone: inspection.client_phone || '', clientEmail: inspection.client_email || '',
      vehicle: { vin: inspection.vehicle_vin || '', plate: inspection.vehicle_plate || '', brand: inspection.vehicle_brand || '',
        model: inspection.vehicle_model || '', year: inspection.vehicle_year || 0, color: inspection.vehicle_color || '',
        mileage: inspection.vehicle_mileage || 0, usage: inspection.vehicle_usage || '' },
      policyType: inspection.policy_type, policyStatus: inspection.policy_status, status: inspection.status,
      riskScore: inspection.risk_score, qualityScore: inspection.quality_score, slaDeadline: inspection.sla_deadline || '',
      createdAt: inspection.created_at, tags: inspection.tags || [],
      damages: damages.map(d => ({ id: d.id, part: d.part, type: d.type, severity: d.severity as any, confidence: d.confidence })),
      photos: photos.map(p => p.image_url || ''), clientComments: inspection.client_comments || '', reviewNotes
    });
  };

  const theme = {
    bg: isDark ? 'bg-[#0d1117]' : 'bg-gray-100',
    card: isDark ? 'bg-[#161b22] border-[#30363d]' : 'bg-white border-gray-200',
    text: isDark ? 'text-white' : 'text-gray-900',
    textMuted: isDark ? 'text-gray-400' : 'text-gray-500',
    input: isDark ? 'bg-[#0d1117] border-[#30363d] text-white placeholder-gray-600' : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400',
    hover: isDark ? 'hover:bg-[#1c2128]' : 'hover:bg-gray-50',
  };

  const calculateSLA = () => {
    if (!inspection?.sla_deadline) return 'N/A';
    const deadline = new Date(inspection.sla_deadline);
    const now = new Date();
    const diff = deadline.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return diff > 0 ? `${hours}h ${minutes}m` : 'Vencido';
  };

  if (loading) return (
    <div className={`min-h-screen ${theme.bg} flex items-center justify-center`}>
      <div className="text-center">
        <Loader2 className="w-12 h-12 text-pink-500 animate-spin mx-auto mb-4" />
        <p className={theme.textMuted}>Cargando inspección...</p>
      </div>
    </div>
  );
  
  if (!inspection) return (
    <div className={`min-h-screen ${theme.bg} flex items-center justify-center`}>
      <button onClick={() => navigate('/')} className="px-6 py-3 bg-gradient-to-r from-pink-500 to-pink-600 rounded-xl font-medium text-white">
        ← Volver
      </button>
    </div>
  );

  const currentPhoto = photos[selectedPhotoIndex];

  return (
    <div className={`min-h-screen ${theme.bg} transition-colors duration-300`}>
      {/* Modal */}
      {modalImage && (
        <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-8" onClick={() => setModalImage(null)}>
          <button className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 rounded-xl">
            <X className="w-6 h-6 text-white" />
          </button>
          <img src={modalImage} className="max-w-full max-h-full object-contain rounded-xl" />
        </div>
      )}

      {/* Header */}
      <header className={`${theme.card} border-b px-6 py-4 sticky top-0 z-40`}>
        <div className="max-w-[1600px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/')} className={`p-2 rounded-lg ${theme.hover} transition-all`}>
              <ArrowLeft className={`w-5 h-5 ${theme.textMuted}`} />
            </button>
            
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center font-bold text-white">
              {inspection.vehicle_brand?.charAt(0) || 'V'}
            </div>
            
            <div>
              <p className={`font-mono font-bold ${theme.text}`}>{inspection.id}</p>
              <p className={theme.textMuted}>
                {inspection.client_name} • {inspection.vehicle_brand} {inspection.vehicle_model} {inspection.vehicle_year}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <span className={`px-4 py-1.5 text-sm font-semibold rounded-lg ${
              inspection.status === 'Pendiente' ? 'bg-pink-500/20 text-pink-400 border border-pink-500/30' :
              inspection.status === 'Aprobada' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
              inspection.status === 'Rechazada' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
              'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
            }`}>
              {inspection.status}
            </span>
            <span className="px-4 py-1.5 text-sm font-medium bg-cyan-500/20 text-cyan-400 rounded-lg border border-cyan-500/30">
              SLA: {calculateSLA()}
            </span>
            <button
              onClick={() => setIsDark(!isDark)}
              className={`p-2.5 rounded-xl ${theme.card} border transition-all`}
            >
              {isDark ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5 text-purple-500" />}
            </button>
            <button onClick={handleDownloadPDF} className={`flex items-center gap-2 px-4 py-2.5 ${theme.card} border rounded-xl font-medium ${theme.text}`}>
              <Download className="w-4 h-4" /> PDF
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[1600px] mx-auto p-6">
        <div className="grid grid-cols-12 gap-6">
          
          {/* Left Column */}
          <div className="col-span-12 lg:col-span-3 space-y-4">
            
            {/* Client Info */}
            <div className={`${theme.card} border rounded-2xl overflow-hidden`}>
              <div className={`px-5 py-3 border-b ${isDark ? 'border-[#30363d] bg-[#1c2128]' : 'border-gray-200 bg-gray-50'}`}>
                <h3 className={`font-semibold ${theme.text}`}>Información del Cliente</h3>
              </div>
              <div className="p-5 space-y-4">
                <DataRow label="Nombre" value={inspection.client_name} theme={theme} />
                <DataRow label="ID" value={inspection.client_id} theme={theme} mono />
                <DataRow label="Teléfono" value={inspection.client_phone} theme={theme} />
                <DataRow label="Email" value={inspection.client_email} theme={theme} />
              </div>
            </div>

            {/* Vehicle Info */}
            <div className={`${theme.card} border rounded-2xl overflow-hidden`}>
              <div className={`px-5 py-3 border-b ${isDark ? 'border-[#30363d] bg-[#1c2128]' : 'border-gray-200 bg-gray-50'}`}>
                <h3 className={`font-semibold ${theme.text}`}>Datos del Vehículo</h3>
              </div>
              <div className="p-5 space-y-4">
                <DataRow label="VIN" value={inspection.vehicle_vin} theme={theme} mono />
                <DataRow label="Placa" value={inspection.vehicle_plate} theme={theme} />
                <DataRow label="Marca/Modelo" value={`${inspection.vehicle_brand} ${inspection.vehicle_model}`} theme={theme} />
                <DataRow label="Año" value={inspection.vehicle_year} theme={theme} />
                <DataRow label="Color" value={inspection.vehicle_color} theme={theme} />
                <DataRow label="Kilometraje" value={inspection.vehicle_mileage ? `${inspection.vehicle_mileage.toLocaleString()} km` : null} theme={theme} />
                <DataRow label="Uso" value={inspection.vehicle_usage === 'private' ? 'Particular' : inspection.vehicle_usage} theme={theme} />
              </div>
            </div>

            {/* Scores */}
            <div className={`${theme.card} border rounded-2xl overflow-hidden`}>
              <div className={`px-5 py-3 border-b ${isDark ? 'border-[#30363d] bg-[#1c2128]' : 'border-gray-200 bg-gray-50'}`}>
                <h3 className={`font-semibold ${theme.text}`}>Scores</h3>
              </div>
              <div className="p-5 space-y-5">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className={theme.textMuted}>Risk</span>
                    <span className={`font-bold ${inspection.risk_score >= 70 ? 'text-red-400' : inspection.risk_score >= 50 ? 'text-yellow-400' : 'text-green-400'}`}>
                      {inspection.risk_score}/100
                    </span>
                  </div>
                  <div className={`h-2 ${isDark ? 'bg-gray-700' : 'bg-gray-200'} rounded-full overflow-hidden`}>
                    <div className={`h-full rounded-full ${inspection.risk_score >= 70 ? 'bg-red-500' : inspection.risk_score >= 50 ? 'bg-yellow-500' : 'bg-green-500'}`} 
                         style={{ width: `${inspection.risk_score}%` }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className={theme.textMuted}>Quality</span>
                    <span className="font-bold text-green-400">{inspection.quality_score}/100</span>
                  </div>
                  <div className={`h-2 ${isDark ? 'bg-gray-700' : 'bg-gray-200'} rounded-full overflow-hidden`}>
                    <div className="h-full bg-green-500 rounded-full" style={{ width: `${inspection.quality_score}%` }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Center Column - Photos */}
          <div className="col-span-12 lg:col-span-6 space-y-4">
            
            {/* Photo Viewer */}
            <div className={`${theme.card} border rounded-2xl overflow-hidden`}>
              <div className={`px-5 py-3 border-b ${isDark ? 'border-[#30363d] bg-[#1c2128]' : 'border-gray-200 bg-gray-50'} flex items-center justify-between`}>
                <h3 className={`font-semibold ${theme.text}`}>Visor de Imágenes</h3>
                <span className={theme.textMuted}>{photos.length > 0 ? `${selectedPhotoIndex + 1} / ${photos.length}` : '0 / 0'}</span>
              </div>
              
              {/* Main Photo */}
              <div 
                className={`aspect-video ${isDark ? 'bg-[#0d1117]' : 'bg-gray-100'} flex items-center justify-center cursor-pointer relative group`}
                onClick={() => currentPhoto?.image_url && setModalImage(currentPhoto.image_url)}
              >
                {currentPhoto?.image_url ? (
                  <>
                    <img src={currentPhoto.image_url} className="max-w-full max-h-full object-contain" />
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Eye className="w-10 h-10 text-white" />
                    </div>
                  </>
                ) : (
                  <p className={theme.textMuted}>Sin imagen</p>
                )}
              </div>
              
              {/* Photo Label */}
              <div className={`px-5 py-3 border-t border-b ${isDark ? 'border-[#30363d]' : 'border-gray-200'} text-center`}>
                <p className={theme.text}>{currentPhoto?.label || currentPhoto?.angle || 'Sin etiqueta'}</p>
              </div>

              {/* Thumbnails Grid */}
              <div className="p-5">
                <div className="grid grid-cols-6 gap-2 mb-4">
                  {Array.from({ length: 12 }).map((_, idx) => {
                    const photo = photos[idx];
                    return (
                      <button
                        key={idx}
                        onClick={() => photo && setSelectedPhotoIndex(idx)}
                        className={`aspect-square rounded-xl border-2 overflow-hidden transition-all ${
                          selectedPhotoIndex === idx 
                            ? 'border-pink-500 ring-2 ring-pink-500/30' 
                            : isDark ? 'border-[#30363d] hover:border-gray-600' : 'border-gray-200 hover:border-gray-400'
                        } ${!photo ? 'opacity-50' : ''}`}
                      >
                        {photo?.image_url ? (
                          <img src={photo.image_url} className="w-full h-full object-cover" />
                        ) : (
                          <div className={`w-full h-full ${isDark ? 'bg-[#1c2128]' : 'bg-gray-100'} flex items-center justify-center`}>
                            <span className={theme.textMuted}>{idx + 1}</span>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
                
                {/* Navigation */}
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => setSelectedPhotoIndex(Math.max(0, selectedPhotoIndex - 1))}
                    disabled={selectedPhotoIndex === 0}
                    className={`py-3 ${theme.card} border rounded-xl ${theme.text} font-medium disabled:opacity-30 transition-all flex items-center justify-center gap-2`}
                  >
                    <ChevronLeft className="w-5 h-5" /> Anterior
                  </button>
                  <button 
                    onClick={() => setSelectedPhotoIndex(Math.min(photos.length - 1, selectedPhotoIndex + 1))}
                    disabled={selectedPhotoIndex >= photos.length - 1}
                    className={`py-3 ${theme.card} border rounded-xl ${theme.text} font-medium disabled:opacity-30 transition-all flex items-center justify-center gap-2`}
                  >
                    Siguiente <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Client Comments */}
            {inspection.client_comments && (
              <div className={`${theme.card} border rounded-2xl overflow-hidden`}>
                <div className={`px-5 py-3 border-b ${isDark ? 'border-[#30363d] bg-[#1c2128]' : 'border-gray-200 bg-gray-50'} flex items-center gap-2`}>
                  <MessageSquare className="w-5 h-5 text-pink-400" />
                  <h3 className={`font-semibold ${theme.text}`}>Comentarios del Cliente</h3>
                </div>
                <div className="p-5">
                  <p className={`${theme.textMuted} leading-relaxed`}>{inspection.client_comments}</p>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Damages & Actions */}
          <div className="col-span-12 lg:col-span-3 space-y-4">
            
            {/* Damages/Consistency Tabs */}
            <div className={`${theme.card} border rounded-2xl overflow-hidden`}>
              <div className={`flex border-b ${isDark ? 'border-[#30363d]' : 'border-gray-200'}`}>
                <button
                  onClick={() => setActiveTab('damages')}
                  className={`flex-1 py-3 text-sm font-medium transition-all ${
                    activeTab === 'damages' 
                      ? 'bg-pink-500/20 text-pink-400 border-b-2 border-pink-500' 
                      : `${theme.textMuted} ${theme.hover}`
                  }`}
                >
                  Daños
                </button>
                <button
                  onClick={() => setActiveTab('consistency')}
                  className={`flex-1 py-3 text-sm font-medium transition-all ${
                    activeTab === 'consistency' 
                      ? 'bg-pink-500/20 text-pink-400 border-b-2 border-pink-500' 
                      : `${theme.textMuted} ${theme.hover}`
                  }`}
                >
                  Consistencia
                </button>
              </div>
              
              <div className="p-4 max-h-[400px] overflow-y-auto">
                {activeTab === 'damages' ? (
                  damages.length > 0 ? (
                    <div className="space-y-3">
                      {damages.map((damage) => (
                        <div key={damage.id} className={`p-3 ${isDark ? 'bg-[#1c2128]' : 'bg-gray-50'} rounded-xl`}>
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <p className={`font-medium ${theme.text}`}>{damage.part}</p>
                              <p className={`text-sm ${theme.textMuted}`}>{damage.type}</p>
                            </div>
                            <span className={`px-2 py-1 text-xs font-medium rounded-lg ${
                              damage.severity === 'Leve' ? 'bg-green-500/20 text-green-400' :
                              damage.severity === 'Moderado' ? 'bg-yellow-500/20 text-yellow-400' :
                              'bg-red-500/20 text-red-400'
                            }`}>
                              {damage.severity}
                            </span>
                          </div>
                          <p className={`text-sm ${theme.textMuted} mb-3`}>IA: {damage.confidence}%</p>
                          <div className="flex justify-end gap-2">
                            <button 
                              onClick={() => toggleDamage(damage.id, true)}
                              className={`p-2 rounded-lg transition-all ${
                                damage.approved === true 
                                  ? 'bg-green-500 text-white' 
                                  : `${theme.card} border ${theme.textMuted} hover:text-green-400 hover:border-green-500/50`
                              }`}
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => toggleDamage(damage.id, false)}
                              className={`p-2 rounded-lg transition-all ${
                                damage.approved === false 
                                  ? 'bg-red-500 text-white' 
                                  : `${theme.card} border ${theme.textMuted} hover:text-red-400 hover:border-red-500/50`
                              }`}
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
                      <p className={theme.textMuted}>Sin daños detectados</p>
                    </div>
                  )
                ) : (
                  <div className="text-center py-8">
                    <p className={theme.textMuted}>Análisis de consistencia próximamente</p>
                  </div>
                )}
              </div>
            </div>

            {/* Review Notes */}
            <div className={`${theme.card} border rounded-2xl overflow-hidden`}>
              <div className={`px-5 py-3 border-b ${isDark ? 'border-[#30363d] bg-[#1c2128]' : 'border-gray-200 bg-gray-50'}`}>
                <h3 className={`font-semibold ${theme.text}`}>Notas de Revisión</h3>
              </div>
              <div className="p-4">
                <textarea 
                  className={`w-full h-28 ${theme.input} border rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-pink-500/50 transition-all`}
                  placeholder="Agrega notas sobre tu revisión..."
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                />
              </div>
            </div>

            {/* Decision Buttons */}
            <div className={`${theme.card} border rounded-2xl overflow-hidden`}>
              <div className={`px-5 py-3 border-b ${isDark ? 'border-[#30363d] bg-[#1c2128]' : 'border-gray-200 bg-gray-50'}`}>
                <h3 className={`font-semibold ${theme.text}`}>Decisión</h3>
              </div>
              <div className="p-4 space-y-3">
                <button 
                  onClick={() => handleAction('Aprobada')} 
                  disabled={saving}
                  className="w-full flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold rounded-xl shadow-lg shadow-green-500/25 transition-all disabled:opacity-50"
                >
                  {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
                  Aprobar
                </button>
                <button 
                  onClick={() => handleAction('Reinspección')} 
                  disabled={saving}
                  className="w-full flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-semibold rounded-xl shadow-lg shadow-yellow-500/25 transition-all disabled:opacity-50"
                >
                  {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <AlertTriangle className="w-5 h-5" />}
                  Solicitar Reinspección
                </button>
                <button 
                  onClick={() => handleAction('Rechazada')} 
                  disabled={saving}
                  className="w-full flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white font-semibold rounded-xl shadow-lg shadow-red-500/25 transition-all disabled:opacity-50"
                >
                  {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <ExternalLink className="w-5 h-5" />}
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

// Helper Component
function DataRow({ label, value, theme, mono }: { label: string; value: any; theme: any; mono?: boolean }) {
  return (
    <div>
      <p className={`text-xs ${theme.textMuted} mb-0.5`}>{label}</p>
      <p className={`${theme.text} ${mono ? 'font-mono text-sm' : ''}`}>{value || '—'}</p>
    </div>
  );
}
