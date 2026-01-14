import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Download, CheckCircle, AlertTriangle, XCircle, 
  ChevronLeft, ChevronRight, Loader2, X, 
  MessageSquare, Eye, ExternalLink, User, Car, MapPin, 
  FileText, Users, Camera, Shield, PenTool, Phone, Mail,
  CreditCard, Calendar, AlertCircle, Clock, BarChart3
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
  const [consent, setConsent] = useState<Consent | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);
  const [reviewNotes, setReviewNotes] = useState('');
  const [modalImage, setModalImage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'damages' | 'consistency'>('damages');
  const [activeInfoTab, setActiveInfoTab] = useState<'client' | 'vehicle' | 'accident' | 'third_party' | 'policy'>('client');
  
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

  const calculateSLA = () => {
    if (!inspection?.sla_deadline) return { text: 'N/A', urgent: false, color: 'text-slate-400' };
    const deadline = new Date(inspection.sla_deadline);
    const now = new Date();
    const diff = deadline.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    if (diff <= 0) return { text: 'Vencido', urgent: true, color: 'text-red-600 bg-red-50' };
    if (hours < 4) return { text: `${hours}h ${minutes}m`, urgent: true, color: 'text-red-600 bg-red-50' };
    if (hours < 12) return { text: `${hours}h ${minutes}m`, urgent: false, color: 'text-amber-600 bg-amber-50' };
    return { text: `${hours}h ${minutes}m`, urgent: false, color: 'text-emerald-600 bg-emerald-50' };
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'Pendiente': return { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' };
      case 'En Revisión': return { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' };
      case 'Aprobada': return { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' };
      case 'Rechazada': return { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' };
      case 'Reinspección': return { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' };
      default: return { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200' };
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center">
      <Loader2 className="w-12 h-12 text-orange-500 animate-spin" />
    </div>
  );
  
  if (!inspection) return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center">
      <button onClick={() => navigate('/')} className="px-6 py-3 bg-orange-500 rounded-xl font-medium text-white">← Volver</button>
    </div>
  );

  const currentPhoto = photos[selectedPhotoIndex];
  const sla = calculateSLA();
  const statusConfig = getStatusConfig(inspection.status);
  
  const infoTabs = [
    { id: 'client', label: 'Cliente', icon: User },
    { id: 'vehicle', label: 'Vehículo', icon: Car },
    { id: 'accident', label: 'Accidente', icon: MapPin },
    ...(inspection.has_third_party ? [{ id: 'third_party', label: 'Tercero', icon: Users }] : []),
    { id: 'policy', label: 'Póliza', icon: FileText },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      {/* Modal */}
      {modalImage && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-8" onClick={() => setModalImage(null)}>
          <button className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-colors">
            <X className="w-6 h-6 text-white" />
          </button>
          <img src={modalImage} className="max-w-full max-h-full object-contain rounded-xl" />
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-200/50">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={() => navigate('/')} className="p-2 rounded-xl hover:bg-slate-100 transition-colors">
                <ArrowLeft className="w-5 h-5 text-slate-600" />
              </button>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center font-bold text-white shadow-lg shadow-orange-500/20">
                {inspection.vehicle_brand?.charAt(0) || 'V'}
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <p className="font-mono font-bold text-slate-900">{inspection.id}</p>
                  <span className={`px-3 py-1 text-xs font-semibold rounded-lg border ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}>
                    {inspection.status}
                  </span>
                </div>
                <p className="text-sm text-slate-500">{inspection.client_name} • {inspection.vehicle_brand} {inspection.vehicle_model} {inspection.vehicle_year}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className={`flex items-center gap-2 px-4 py-2 rounded-xl ${sla.color}`}>
                <Clock className="w-4 h-4" />
                <span className="text-sm font-semibold">SLA: {sla.text}</span>
              </div>
              <button onClick={handleDownloadPDF} className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 rounded-xl font-medium text-slate-700 hover:bg-slate-50 transition-colors">
                <Download className="w-4 h-4" /> PDF
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6 max-w-[1800px] mx-auto">
        <div className="grid grid-cols-12 gap-6">
          
          {/* Left Column - Info Tabs */}
          <div className="col-span-12 lg:col-span-3 space-y-4">
            
            {/* Info Tab Navigation */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-2">
              <div className="flex flex-wrap gap-1">
                {infoTabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveInfoTab(tab.id as any)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                      activeInfoTab === tab.id 
                        ? 'bg-orange-50 text-orange-600 border border-orange-200' 
                        : 'text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    <tab.icon className="w-4 h-4" />
                    <span className="hidden xl:inline">{tab.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Dynamic Info Panel */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              {/* Client Info */}
              {activeInfoTab === 'client' && (
                <>
                  <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50">
                    <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                      <User className="w-4 h-4 text-orange-500" /> Información del Cliente
                    </h3>
                  </div>
                  <div className="p-5 space-y-4">
                    <DataRow label="Nombre completo" value={inspection.client_name} />
                    <DataRow label="Documento" value={inspection.client_id} icon={CreditCard} mono />
                    <DataRow label="Teléfono" value={inspection.client_phone} icon={Phone} />
                    <DataRow label="Email" value={inspection.client_email} icon={Mail} />
                    <DataRow label="Dirección" value={inspection.client_address} icon={MapPin} />
                    <DataRow label="Licencia" value={inspection.client_driver_license} icon={CreditCard} />
                    
                    {(inspection.client_id_front_image || inspection.client_id_back_image) && (
                      <div className="pt-4 border-t border-slate-100">
                        <p className="text-xs text-slate-400 uppercase tracking-wider mb-3">Fotos del Documento</p>
                        <div className="grid grid-cols-2 gap-3">
                          {inspection.client_id_front_image && (
                            <ImageThumbnail src={inspection.client_id_front_image} label="Frente" onClick={() => setModalImage(inspection.client_id_front_image!)} />
                          )}
                          {inspection.client_id_back_image && (
                            <ImageThumbnail src={inspection.client_id_back_image} label="Reverso" onClick={() => setModalImage(inspection.client_id_back_image!)} />
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Vehicle Info */}
              {activeInfoTab === 'vehicle' && (
                <>
                  <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50">
                    <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                      <Car className="w-4 h-4 text-blue-500" /> Datos del Vehículo
                    </h3>
                  </div>
                  <div className="p-5 space-y-4">
                    <DataRow label="VIN" value={inspection.vehicle_vin} mono />
                    <DataRow label="Placa" value={inspection.vehicle_plate} highlight />
                    <DataRow label="Marca" value={inspection.vehicle_brand} />
                    <DataRow label="Modelo" value={inspection.vehicle_model} />
                    <DataRow label="Año" value={inspection.vehicle_year} />
                    <DataRow label="Color" value={inspection.vehicle_color} />
                    <DataRow label="Kilometraje" value={inspection.vehicle_mileage ? `${inspection.vehicle_mileage.toLocaleString()} km` : null} />
                    <DataRow label="Uso" value={inspection.vehicle_usage === 'private' ? 'Particular' : inspection.vehicle_usage === 'commercial' ? 'Comercial' : inspection.vehicle_usage} />
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-500">¿Tiene garage?</span>
                      <span className={`px-3 py-1 text-xs font-medium rounded-lg ${inspection.vehicle_has_garage ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                        {inspection.vehicle_has_garage ? 'Sí' : 'No'}
                      </span>
                    </div>
                  </div>
                </>
              )}

              {/* Accident Info */}
              {activeInfoTab === 'accident' && (
                <>
                  <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50">
                    <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-500" /> Datos del Accidente
                    </h3>
                  </div>
                  <div className="p-5 space-y-4">
                    <DataRow label="Tipo" value={inspection.accident_type} />
                    <DataRow label="Fecha" value={inspection.accident_date ? new Date(inspection.accident_date).toLocaleString('es-ES') : null} icon={Calendar} />
                    <DataRow label="Ubicación" value={inspection.accident_location} icon={MapPin} />
                    
                    {inspection.accident_description && (
                      <div>
                        <p className="text-xs text-slate-400 uppercase tracking-wider mb-2">Descripción</p>
                        <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-lg">{inspection.accident_description}</p>
                      </div>
                    )}
                    
                    <div className="flex flex-wrap gap-2 pt-2">
                      <span className={`px-3 py-1.5 text-xs font-medium rounded-lg ${inspection.police_present ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                        {inspection.police_present ? '✓ Policía presente' : '✗ Sin policía'}
                      </span>
                      <span className={`px-3 py-1.5 text-xs font-medium rounded-lg ${inspection.has_witnesses ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                        {inspection.has_witnesses ? '✓ Hay testigos' : '✗ Sin testigos'}
                      </span>
                    </div>
                    
                    {inspection.police_report_number && <DataRow label="# Reporte" value={inspection.police_report_number} />}
                    {inspection.witness_info && <DataRow label="Info testigos" value={inspection.witness_info} />}
                    
                    {inspection.accident_sketch_url && (
                      <div className="pt-4 border-t border-slate-100">
                        <p className="text-xs text-slate-400 uppercase tracking-wider mb-3">Croquis</p>
                        <ImageThumbnail src={inspection.accident_sketch_url} label="Ver croquis" onClick={() => setModalImage(inspection.accident_sketch_url!)} large />
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Third Party Info */}
              {activeInfoTab === 'third_party' && inspection.has_third_party && (
                <>
                  <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50">
                    <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                      <Users className="w-4 h-4 text-purple-500" /> Información del Tercero
                    </h3>
                  </div>
                  <div className="p-5 space-y-4">
                    <DataRow label="Nombre" value={inspection.third_party_name} icon={User} />
                    <DataRow label="Documento" value={inspection.third_party_id} icon={CreditCard} />
                    <DataRow label="Teléfono" value={inspection.third_party_phone} icon={Phone} />
                    <DataRow label="Email" value={inspection.third_party_email} icon={Mail} />
                    
                    {(inspection.third_party_id_front_image || inspection.third_party_id_back_image) && (
                      <div className="pt-4 border-t border-slate-100">
                        <p className="text-xs text-slate-400 uppercase tracking-wider mb-3">Documento</p>
                        <div className="grid grid-cols-2 gap-3">
                          {inspection.third_party_id_front_image && (
                            <ImageThumbnail src={inspection.third_party_id_front_image} label="Frente" onClick={() => setModalImage(inspection.third_party_id_front_image!)} />
                          )}
                          {inspection.third_party_id_back_image && (
                            <ImageThumbnail src={inspection.third_party_id_back_image} label="Reverso" onClick={() => setModalImage(inspection.third_party_id_back_image!)} />
                          )}
                        </div>
                      </div>
                    )}
                    
                    <div className="pt-4 border-t border-slate-100">
                      <p className="text-xs text-slate-400 uppercase tracking-wider mb-3">Vehículo del Tercero</p>
                      <div className="space-y-3">
                        <DataRow label="Placa" value={inspection.third_party_vehicle_plate} />
                        <DataRow label="Marca" value={inspection.third_party_vehicle_brand} />
                        <DataRow label="Modelo" value={inspection.third_party_vehicle_model} />
                        <DataRow label="Año" value={inspection.third_party_vehicle_year} />
                        <DataRow label="Color" value={inspection.third_party_vehicle_color} />
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Policy Info */}
              {activeInfoTab === 'policy' && (
                <>
                  <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50">
                    <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-indigo-500" /> Información de Póliza
                    </h3>
                  </div>
                  <div className="p-5 space-y-4">
                    <DataRow label="# Póliza" value={inspection.policy_number} mono />
                    <DataRow label="# Reclamo" value={inspection.claim_number} mono />
                    <DataRow label="Tipo" value={inspection.policy_type} />
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-500">Estado</span>
                      <span className={`px-3 py-1 text-xs font-medium rounded-lg ${
                        inspection.policy_status === 'Emitida' ? 'bg-emerald-50 text-emerald-600' :
                        inspection.policy_status === 'Rechazada' ? 'bg-red-50 text-red-600' :
                        inspection.policy_status === 'Cancelada' ? 'bg-amber-50 text-amber-600' :
                        'bg-blue-50 text-blue-600'
                      }`}>
                        {inspection.policy_status}
                      </span>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Scores */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50">
                <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-emerald-500" /> Scores
                </h3>
              </div>
              <div className="p-5 space-y-5">
                <ScoreBar label="Risk Score" value={inspection.risk_score} type="risk" />
                <ScoreBar label="Quality Score" value={inspection.quality_score} type="quality" />
              </div>
            </div>

            {/* Signature */}
            {consent?.signature_url && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50">
                  <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                    <PenTool className="w-4 h-4 text-purple-500" /> Firma Digital
                  </h3>
                </div>
                <div className="p-5">
                  <div className="bg-slate-50 rounded-xl p-3 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => setModalImage(consent.signature_url!)}>
                    <img src={consent.signature_url} className="w-full h-16 object-contain" />
                  </div>
                  <p className="text-xs text-slate-500 text-center mt-3">
                    Firmado el {new Date(consent.timestamp).toLocaleString('es-ES')}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Center Column - Photos */}
          <div className="col-span-12 lg:col-span-6 space-y-4">
            
            {/* Photo Viewer */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                  <Camera className="w-4 h-4 text-orange-500" /> Visor de Imágenes
                </h3>
                <span className="text-sm text-slate-500">{photos.length > 0 ? `${selectedPhotoIndex + 1} / ${photos.length}` : '0 / 0'}</span>
              </div>
              
              {/* Main Photo */}
              <div 
                className="aspect-video bg-slate-100 flex items-center justify-center cursor-pointer relative group"
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
                  <p className="text-slate-400">Sin imagen</p>
                )}
              </div>
              
              {/* Photo Label */}
              <div className="px-5 py-3 border-t border-b border-slate-100 text-center">
                <p className="font-medium text-slate-900">{currentPhoto?.label || currentPhoto?.angle || 'Sin etiqueta'}</p>
                <p className="text-xs text-slate-500">{currentPhoto?.photo_type} • {currentPhoto?.category || 'general'}</p>
              </div>

              {/* Thumbnails Grid */}
              <div className="p-5">
                <div className="grid grid-cols-6 gap-2 mb-4">
                  {Array.from({ length: Math.max(12, photos.length) }).map((_, idx) => {
                    const photo = photos[idx];
                    return (
                      <button
                        key={idx}
                        onClick={() => photo && setSelectedPhotoIndex(idx)}
                        className={`aspect-square rounded-xl border-2 overflow-hidden transition-all ${
                          selectedPhotoIndex === idx 
                            ? 'border-orange-500 ring-2 ring-orange-500/30' 
                            : 'border-slate-200 hover:border-slate-300'
                        } ${!photo ? 'opacity-40' : ''}`}
                      >
                        {photo?.image_url ? (
                          <img src={photo.image_url} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-slate-100 flex items-center justify-center">
                            <span className="text-xs text-slate-400">{idx + 1}</span>
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
                    className="py-3 border border-slate-200 rounded-xl text-slate-700 font-medium disabled:opacity-30 transition-all flex items-center justify-center gap-2 hover:bg-slate-50"
                  >
                    <ChevronLeft className="w-5 h-5" /> Anterior
                  </button>
                  <button 
                    onClick={() => setSelectedPhotoIndex(Math.min(photos.length - 1, selectedPhotoIndex + 1))}
                    disabled={selectedPhotoIndex >= photos.length - 1}
                    className="py-3 border border-slate-200 rounded-xl text-slate-700 font-medium disabled:opacity-30 transition-all flex items-center justify-center gap-2 hover:bg-slate-50"
                  >
                    Siguiente <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Client Comments */}
            {inspection.client_comments && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-blue-500" />
                  <h3 className="font-semibold text-slate-900">Comentarios del Cliente</h3>
                </div>
                <div className="p-5">
                  <p className="text-slate-600 leading-relaxed">{inspection.client_comments}</p>
                </div>
              </div>
            )}

            {/* Tags */}
            {inspection.tags && inspection.tags.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                <p className="text-xs text-slate-400 uppercase tracking-wider mb-3">Etiquetas</p>
                <div className="flex flex-wrap gap-2">
                  {inspection.tags.map((tag, i) => (
                    <span key={i} className="px-3 py-1.5 text-sm bg-slate-100 text-slate-600 rounded-lg">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Damages & Actions */}
          <div className="col-span-12 lg:col-span-3 space-y-4">
            
            {/* Damages Tabs */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="flex border-b border-slate-100">
                <button
                  onClick={() => setActiveTab('damages')}
                  className={`flex-1 py-3 text-sm font-medium transition-all ${
                    activeTab === 'damages' ? 'bg-orange-50 text-orange-600 border-b-2 border-orange-500' : 'text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  Daños ({damages.length})
                </button>
                <button
                  onClick={() => setActiveTab('consistency')}
                  className={`flex-1 py-3 text-sm font-medium transition-all ${
                    activeTab === 'consistency' ? 'bg-orange-50 text-orange-600 border-b-2 border-orange-500' : 'text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  Consistencia
                </button>
              </div>
              
              <div className="p-4 max-h-[450px] overflow-y-auto">
                {activeTab === 'damages' ? (
                  damages.length > 0 ? (
                    <div className="space-y-3">
                      {damages.map((damage) => (
                        <div key={damage.id} className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <p className="font-semibold text-slate-900">{damage.part}</p>
                              <p className="text-sm text-slate-500">{damage.type}</p>
                            </div>
                            <span className={`px-2.5 py-1 text-xs font-semibold rounded-lg ${
                              damage.severity === 'Leve' ? 'bg-emerald-50 text-emerald-600' :
                              damage.severity === 'Moderado' ? 'bg-amber-50 text-amber-600' :
                              damage.severity === 'Severo' ? 'bg-orange-50 text-orange-600' :
                              'bg-red-50 text-red-600'
                            }`}>
                              {damage.severity}
                            </span>
                          </div>
                          {damage.description && (
                            <p className="text-xs text-slate-500 mb-2">{damage.description}</p>
                          )}
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-slate-400">IA: {damage.confidence}%</span>
                            <div className="flex gap-2">
                              <button 
                                onClick={() => toggleDamage(damage.id, true)}
                                className={`p-2 rounded-lg transition-all ${
                                  damage.approved === true ? 'bg-emerald-500 text-white' : 'bg-white border border-slate-200 text-slate-400 hover:text-emerald-500 hover:border-emerald-300'
                                }`}
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => toggleDamage(damage.id, false)}
                                className={`p-2 rounded-lg transition-all ${
                                  damage.approved === false ? 'bg-red-500 text-white' : 'bg-white border border-slate-200 text-slate-400 hover:text-red-500 hover:border-red-300'
                                }`}
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                          {damage.photo_url && (
                            <div className="mt-3">
                              <img 
                                src={damage.photo_url} 
                                className="w-full h-20 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                                onClick={() => setModalImage(damage.photo_url!)}
                              />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-10">
                      <CheckCircle className="w-14 h-14 text-emerald-400 mx-auto mb-3" />
                      <p className="font-medium text-slate-900">Sin daños detectados</p>
                      <p className="text-sm text-slate-500">El vehículo parece estar en buen estado</p>
                    </div>
                  )
                ) : (
                  <div className="text-center py-10">
                    <Shield className="w-14 h-14 text-blue-400 mx-auto mb-3" />
                    <p className="text-slate-500">Análisis de consistencia próximamente</p>
                  </div>
                )}
              </div>
            </div>

            {/* Review Notes */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50">
                <h3 className="font-semibold text-slate-900">Notas de Revisión</h3>
              </div>
              <div className="p-4">
                <textarea 
                  className="w-full h-28 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder-slate-400 resize-none focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                  placeholder="Agrega notas sobre tu revisión..."
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                />
              </div>
            </div>

            {/* Decision */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50">
                <h3 className="font-semibold text-slate-900">Decisión</h3>
              </div>
              <div className="p-4 space-y-3">
                <button 
                  onClick={() => handleAction('Aprobada')} 
                  disabled={saving}
                  className="w-full flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold rounded-xl shadow-lg shadow-emerald-500/25 transition-all disabled:opacity-50"
                >
                  {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
                  Aprobar
                </button>
                <button 
                  onClick={() => handleAction('Reinspección')} 
                  disabled={saving}
                  className="w-full flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold rounded-xl shadow-lg shadow-amber-500/25 transition-all disabled:opacity-50"
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

// Helper Components
function DataRow({ label, value, icon: Icon, mono, highlight }: { label: string; value: any; icon?: any; mono?: boolean; highlight?: boolean }) {
  return (
    <div>
      <p className="text-xs text-slate-400 mb-0.5 flex items-center gap-1">
        {Icon && <Icon className="w-3 h-3" />}
        {label}
      </p>
      <p className={`text-sm ${highlight ? 'text-orange-600 font-semibold' : 'text-slate-900'} ${mono ? 'font-mono' : ''}`}>
        {value || '—'}
      </p>
    </div>
  );
}

function ImageThumbnail({ src, label, onClick, large }: { src: string; label: string; onClick: () => void; large?: boolean }) {
  return (
    <div className="relative group cursor-pointer" onClick={onClick}>
      <img src={src} className={`w-full ${large ? 'h-32' : 'h-16'} object-cover rounded-xl border border-slate-200`} />
      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center">
        <Eye className="w-5 h-5 text-white" />
      </div>
      <p className="text-xs text-slate-500 text-center mt-1">{label}</p>
    </div>
  );
}

function ScoreBar({ label, value, type }: { label: string; value: number; type: 'risk' | 'quality' }) {
  const isRisk = type === 'risk';
  const textColor = isRisk 
    ? (value >= 70 ? 'text-red-600' : value >= 50 ? 'text-amber-600' : 'text-emerald-600')
    : 'text-emerald-600';
  const barColor = isRisk 
    ? (value >= 70 ? 'bg-red-500' : value >= 50 ? 'bg-amber-500' : 'bg-emerald-500')
    : 'bg-emerald-500';

  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm text-slate-500">{label}</span>
        <span className={`font-bold ${textColor}`}>{value}/100</span>
      </div>
      <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full ${barColor} rounded-full transition-all`} style={{ width: `${value}%` }}></div>
      </div>
    </div>
  );
}
