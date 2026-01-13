import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Download, CheckCircle, AlertTriangle, XCircle, 
  ChevronLeft, ChevronRight, Loader2, X, ZoomIn,
  User, Car, MapPin, Camera, Shield, Clock, Hash,
  Phone, Mail, CreditCard, Calendar, FileCheck, Signature
} from 'lucide-react';
import { 
  getInspectionById, getDamagesByInspection, getPhotosByInspection,
  getConsentByInspection, updateInspectionStatus, updateDamageApproval,
  type Inspection, type Damage, type Photo, type Consent
} from '../lib/supabase';
import { downloadPDF } from '../utils/pdfGenerator';
import { format } from 'date-fns';

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
  const [activeSection, setActiveSection] = useState<'vehicle' | 'client' | 'accident'>('vehicle');
  
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

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-pink-500/30 border-t-pink-500 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-400">Cargando inspección...</p>
      </div>
    </div>
  );
  
  if (!inspection) return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
      <button onClick={() => navigate('/')} className="px-6 py-3 bg-pink-500 rounded-xl font-medium">
        ← Volver
      </button>
    </div>
  );

  const currentPhoto = photos[selectedPhotoIndex];
  const statusColors: Record<string, string> = {
    'Pendiente': 'from-amber-500 to-orange-500',
    'En Revisión': 'from-blue-500 to-cyan-500',
    'Aprobada': 'from-emerald-500 to-green-500',
    'Rechazada': 'from-red-500 to-rose-500',
    'Reinspección': 'from-purple-500 to-violet-500',
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Modal */}
      {modalImage && (
        <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-8" onClick={() => setModalImage(null)}>
          <button className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-all">
            <X className="w-6 h-6" />
          </button>
          <img src={modalImage} className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl" />
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-slate-950/80 border-b border-white/5">
        <div className="max-w-[1800px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <button onClick={() => navigate('/')} className="p-2 hover:bg-white/5 rounded-xl transition-all">
                <ArrowLeft className="w-5 h-5 text-slate-400" />
              </button>
              
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-pink-500 to-violet-500 flex items-center justify-center font-bold text-lg shadow-lg shadow-pink-500/25">
                  {inspection.vehicle_brand?.charAt(0) || 'V'}
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <h1 className="text-xl font-bold tracking-tight">{inspection.id}</h1>
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full bg-gradient-to-r ${statusColors[inspection.status]} text-white shadow-lg`}>
                      {inspection.status}
                    </span>
                  </div>
                  <p className="text-sm text-slate-400">
                    {inspection.vehicle_brand} {inspection.vehicle_model} {inspection.vehicle_year} • {inspection.client_name || 'Sin cliente'}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-white/5 rounded-xl">
                <Clock className="w-4 h-4 text-slate-400" />
                <span className="text-sm text-slate-300">
                  {format(new Date(inspection.created_at), 'dd/MM/yyyy HH:mm')}
                </span>
              </div>
              <button onClick={handleDownloadPDF} className="flex items-center gap-2 px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl font-medium transition-all">
                <Download className="w-4 h-4" /> PDF
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-[1800px] mx-auto p-6">
        <div className="grid grid-cols-12 gap-6">
          
          {/* Left Column - Info Cards */}
          <div className="col-span-12 lg:col-span-3 space-y-4">
            
            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur rounded-2xl p-4 border border-white/5">
                <div className="flex items-center gap-2 text-slate-400 mb-1">
                  <Shield className="w-4 h-4" />
                  <span className="text-xs uppercase tracking-wider">Risk</span>
                </div>
                <p className={`text-2xl font-bold ${inspection.risk_score >= 70 ? 'text-red-400' : inspection.risk_score >= 50 ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {inspection.risk_score}
                </p>
              </div>
              <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur rounded-2xl p-4 border border-white/5">
                <div className="flex items-center gap-2 text-slate-400 mb-1">
                  <FileCheck className="w-4 h-4" />
                  <span className="text-xs uppercase tracking-wider">Quality</span>
                </div>
                <p className="text-2xl font-bold text-emerald-400">{inspection.quality_score}</p>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="bg-slate-800/30 backdrop-blur rounded-2xl p-1.5 border border-white/5">
              <div className="grid grid-cols-3 gap-1">
                {[
                  { id: 'vehicle', icon: Car, label: 'Vehículo' },
                  { id: 'client', icon: User, label: 'Cliente' },
                  { id: 'accident', icon: MapPin, label: 'Accidente' },
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveSection(tab.id as any)}
                    className={`flex flex-col items-center gap-1 py-3 rounded-xl transition-all ${
                      activeSection === tab.id 
                        ? 'bg-gradient-to-br from-pink-500/20 to-violet-500/20 text-white border border-pink-500/30' 
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <tab.icon className="w-5 h-5" />
                    <span className="text-xs font-medium">{tab.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Dynamic Info Card */}
            <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur rounded-2xl border border-white/5 overflow-hidden">
              {activeSection === 'vehicle' && (
                <div className="p-5 space-y-4">
                  <div className="flex items-center gap-3 pb-3 border-b border-white/5">
                    <div className="p-2 bg-pink-500/20 rounded-xl">
                      <Car className="w-5 h-5 text-pink-400" />
                    </div>
                    <h3 className="font-semibold">Datos del Vehículo</h3>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <InfoField label="Placa" value={inspection.vehicle_plate} highlight />
                    <InfoField label="VIN" value={inspection.vehicle_vin} mono />
                    <InfoField label="Marca" value={inspection.vehicle_brand} />
                    <InfoField label="Modelo" value={inspection.vehicle_model} />
                    <InfoField label="Año" value={inspection.vehicle_year} />
                    <InfoField label="Color" value={inspection.vehicle_color} />
                    <InfoField label="Kilometraje" value={inspection.vehicle_mileage ? `${inspection.vehicle_mileage.toLocaleString()} km` : null} />
                    <InfoField label="Uso" value={inspection.vehicle_usage} />
                  </div>
                </div>
              )}

              {activeSection === 'client' && (
                <div className="p-5 space-y-4">
                  <div className="flex items-center gap-3 pb-3 border-b border-white/5">
                    <div className="p-2 bg-blue-500/20 rounded-xl">
                      <User className="w-5 h-5 text-blue-400" />
                    </div>
                    <h3 className="font-semibold">Datos del Cliente</h3>
                  </div>
                  
                  <div className="space-y-3">
                    <InfoField label="Nombre" value={inspection.client_name} icon={User} />
                    <InfoField label="Documento" value={inspection.client_id} icon={CreditCard} />
                    <InfoField label="Teléfono" value={inspection.client_phone} icon={Phone} />
                    <InfoField label="Email" value={inspection.client_email} icon={Mail} />
                  </div>

                  {(inspection.client_id_front_image || inspection.client_id_back_image) && (
                    <div className="pt-4 border-t border-white/5">
                      <p className="text-xs text-slate-500 uppercase tracking-wider mb-3">Documento de Identidad</p>
                      <div className="grid grid-cols-2 gap-2">
                        {inspection.client_id_front_image && (
                          <div className="relative group cursor-pointer" onClick={() => setModalImage(inspection.client_id_front_image!)}>
                            <img src={inspection.client_id_front_image} className="w-full h-20 object-cover rounded-xl border border-white/10" />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center">
                              <ZoomIn className="w-5 h-5" />
                            </div>
                          </div>
                        )}
                        {inspection.client_id_back_image && (
                          <div className="relative group cursor-pointer" onClick={() => setModalImage(inspection.client_id_back_image!)}>
                            <img src={inspection.client_id_back_image} className="w-full h-20 object-cover rounded-xl border border-white/10" />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center">
                              <ZoomIn className="w-5 h-5" />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeSection === 'accident' && (
                <div className="p-5 space-y-4">
                  <div className="flex items-center gap-3 pb-3 border-b border-white/5">
                    <div className="p-2 bg-amber-500/20 rounded-xl">
                      <MapPin className="w-5 h-5 text-amber-400" />
                    </div>
                    <h3 className="font-semibold">Datos del Accidente</h3>
                  </div>
                  
                  <div className="space-y-3">
                    <InfoField label="Tipo" value={inspection.accident_type} />
                    <InfoField label="Fecha" value={inspection.accident_date ? format(new Date(inspection.accident_date), 'dd/MM/yyyy HH:mm') : null} icon={Calendar} />
                    <InfoField label="Ubicación" value={inspection.accident_location} icon={MapPin} />
                  </div>

                  <div className="flex gap-2 pt-3">
                    <span className={`px-3 py-1.5 text-xs rounded-lg ${inspection.police_present ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700/50 text-slate-500'}`}>
                      {inspection.police_present ? '✓ Policía' : '✗ Sin policía'}
                    </span>
                    <span className={`px-3 py-1.5 text-xs rounded-lg ${inspection.has_witnesses ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700/50 text-slate-500'}`}>
                      {inspection.has_witnesses ? '✓ Testigos' : '✗ Sin testigos'}
                    </span>
                  </div>

                  {inspection.accident_description && (
                    <div className="pt-3 border-t border-white/5">
                      <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Descripción</p>
                      <p className="text-sm text-slate-300 leading-relaxed">{inspection.accident_description}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Signature */}
            {consent?.signature_url && (
              <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur rounded-2xl border border-white/5 p-5">
                <div className="flex items-center gap-3 pb-3 border-b border-white/5">
                  <div className="p-2 bg-violet-500/20 rounded-xl">
                    <Signature className="w-5 h-5 text-violet-400" />
                  </div>
                  <h3 className="font-semibold">Firma Digital</h3>
                </div>
                <div className="mt-4 p-3 bg-white rounded-xl cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setModalImage(consent.signature_url!)}>
                  <img src={consent.signature_url} className="w-full h-16 object-contain" />
                </div>
                <p className="text-xs text-slate-500 text-center mt-3">
                  Firmado el {format(new Date(consent.timestamp), 'dd/MM/yyyy')} a las {format(new Date(consent.timestamp), 'HH:mm')}
                </p>
              </div>
            )}

            {/* Third Party */}
            {inspection.has_third_party && (
              <div className="bg-gradient-to-br from-amber-900/20 to-orange-900/20 backdrop-blur rounded-2xl border border-amber-500/20 p-5">
                <div className="flex items-center gap-3 pb-3 border-b border-amber-500/20">
                  <div className="p-2 bg-amber-500/20 rounded-xl">
                    <AlertTriangle className="w-5 h-5 text-amber-400" />
                  </div>
                  <h3 className="font-semibold text-amber-300">Tercero Involucrado</h3>
                </div>
                <div className="mt-4 space-y-3">
                  <InfoField label="Nombre" value={inspection.third_party_name} />
                  <InfoField label="Documento" value={inspection.third_party_id} />
                  <InfoField label="Vehículo" value={`${inspection.third_party_vehicle_brand || ''} ${inspection.third_party_vehicle_model || ''}`} />
                  <InfoField label="Placa" value={inspection.third_party_vehicle_plate} />
                </div>
              </div>
            )}
          </div>

          {/* Center Column - Photos */}
          <div className="col-span-12 lg:col-span-6 space-y-4">
            
            {/* Photo Viewer */}
            <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur rounded-2xl border border-white/5 overflow-hidden">
              <div className="p-4 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-pink-500/20 rounded-xl">
                    <Camera className="w-5 h-5 text-pink-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Galería de Fotos</h3>
                    <p className="text-xs text-slate-500">{photos.length} fotografías capturadas</p>
                  </div>
                </div>
                <span className="px-3 py-1 bg-white/5 rounded-lg text-sm">
                  {selectedPhotoIndex + 1} / {photos.length || 1}
                </span>
              </div>
              
              {/* Main Photo */}
              <div className="relative aspect-[16/10] bg-black/50 group cursor-pointer" onClick={() => currentPhoto?.image_url && setModalImage(currentPhoto.image_url)}>
                {currentPhoto?.image_url ? (
                  <>
                    <img src={currentPhoto.image_url} className="w-full h-full object-contain" />
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="p-4 bg-white/20 backdrop-blur-xl rounded-2xl">
                        <ZoomIn className="w-8 h-8" />
                      </div>
                    </div>
                    {/* Photo Label */}
                    <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                      <p className="font-medium">{currentPhoto.label || currentPhoto.angle || 'Sin etiqueta'}</p>
                      <p className="text-sm text-slate-400">{currentPhoto.photo_type} • {currentPhoto.category || 'general'}</p>
                    </div>
                  </>
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <Camera className="w-16 h-16 text-slate-700 mx-auto mb-3" />
                      <p className="text-slate-500">No hay fotos disponibles</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Thumbnails */}
              {photos.length > 0 && (
                <div className="p-4 border-t border-white/5">
                  <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
                    {photos.map((photo, idx) => (
                      <button
                        key={photo.id}
                        onClick={() => setSelectedPhotoIndex(idx)}
                        className={`relative flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 transition-all ${
                          selectedPhotoIndex === idx 
                            ? 'border-pink-500 ring-2 ring-pink-500/30' 
                            : 'border-transparent hover:border-white/30'
                        }`}
                      >
                        {photo.image_url ? (
                          <img src={photo.image_url} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-slate-800 flex items-center justify-center">
                            <Camera className="w-5 h-5 text-slate-600" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                  
                  {/* Navigation */}
                  <div className="flex gap-2 mt-3">
                    <button 
                      onClick={() => setSelectedPhotoIndex(Math.max(0, selectedPhotoIndex - 1))}
                      disabled={selectedPhotoIndex === 0}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-white/5 hover:bg-white/10 disabled:opacity-30 rounded-xl transition-all"
                    >
                      <ChevronLeft className="w-4 h-4" /> Anterior
                    </button>
                    <button 
                      onClick={() => setSelectedPhotoIndex(Math.min(photos.length - 1, selectedPhotoIndex + 1))}
                      disabled={selectedPhotoIndex >= photos.length - 1}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-white/5 hover:bg-white/10 disabled:opacity-30 rounded-xl transition-all"
                    >
                      Siguiente <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Damages */}
            <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur rounded-2xl border border-white/5 overflow-hidden">
              <div className="p-4 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-500/20 rounded-xl">
                    <AlertTriangle className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Daños Detectados</h3>
                    <p className="text-xs text-slate-500">{damages.length} daños identificados por IA</p>
                  </div>
                </div>
              </div>
              
              <div className="p-4">
                {damages.length > 0 ? (
                  <div className="space-y-3">
                    {damages.map((damage) => (
                      <div key={damage.id} className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5 hover:border-white/10 transition-all">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-1">
                            <span className="font-medium">{damage.part}</span>
                            <span className={`px-2 py-0.5 text-xs rounded-full ${
                              damage.severity === 'Leve' ? 'bg-emerald-500/20 text-emerald-400' :
                              damage.severity === 'Moderado' ? 'bg-amber-500/20 text-amber-400' :
                              'bg-red-500/20 text-red-400'
                            }`}>
                              {damage.severity}
                            </span>
                          </div>
                          <p className="text-sm text-slate-400">{damage.type}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                              <div className="h-full bg-gradient-to-r from-pink-500 to-violet-500 rounded-full" style={{ width: `${damage.confidence}%` }} />
                            </div>
                            <span className="text-xs text-slate-500">{damage.confidence}% IA</span>
                          </div>
                        </div>
                        <div className="flex gap-2 ml-4">
                          <button 
                            onClick={() => toggleDamage(damage.id, true)}
                            className={`p-2.5 rounded-xl transition-all ${
                              damage.approved === true 
                                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30' 
                                : 'bg-white/5 text-slate-400 hover:bg-emerald-500/20 hover:text-emerald-400'
                            }`}
                          >
                            <CheckCircle className="w-5 h-5" />
                          </button>
                          <button 
                            onClick={() => toggleDamage(damage.id, false)}
                            className={`p-2.5 rounded-xl transition-all ${
                              damage.approved === false 
                                ? 'bg-red-500 text-white shadow-lg shadow-red-500/30' 
                                : 'bg-white/5 text-slate-400 hover:bg-red-500/20 hover:text-red-400'
                            }`}
                          >
                            <XCircle className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                    <p className="text-slate-400">Sin daños detectados</p>
                    <p className="text-sm text-slate-600">El vehículo parece estar en buen estado</p>
                  </div>
                )}
              </div>
            </div>

            {/* Comments */}
            {inspection.client_comments && (
              <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur rounded-2xl border border-white/5 p-5">
                <div className="flex items-center gap-3 pb-3 border-b border-white/5">
                  <div className="p-2 bg-blue-500/20 rounded-xl">
                    <Hash className="w-5 h-5 text-blue-400" />
                  </div>
                  <h3 className="font-semibold">Comentarios del Cliente</h3>
                </div>
                <p className="text-slate-300 leading-relaxed mt-4">{inspection.client_comments}</p>
              </div>
            )}
          </div>

          {/* Right Column - Actions */}
          <div className="col-span-12 lg:col-span-3 space-y-4">
            
            {/* Summary */}
            <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur rounded-2xl border border-white/5 p-5">
              <h3 className="font-semibold mb-4 text-sm uppercase tracking-wider text-slate-400">Resumen</h3>
              <div className="space-y-3">
                <SummaryRow label="Fotos totales" value={photos.length} />
                <SummaryRow label="Fotos vehículo" value={photos.filter(p => p.photo_type === 'vehicle').length} status={photos.filter(p => p.photo_type === 'vehicle').length >= 8 ? 'success' : 'warning'} />
                <SummaryRow label="Fotos daños" value={photos.filter(p => p.category === 'damage').length} />
                <SummaryRow label="Fotos escena" value={photos.filter(p => p.photo_type === 'scene').length} />
                <SummaryRow label="Daños detectados" value={damages.length} />
                <SummaryRow label="Firma cliente" value={consent?.signature_url ? 'Sí' : 'No'} status={consent?.signature_url ? 'success' : 'error'} />
                <SummaryRow label="Tercero" value={inspection.has_third_party ? 'Sí' : 'No'} />
              </div>
            </div>

            {/* Review Notes */}
            <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur rounded-2xl border border-white/5 p-5">
              <h3 className="font-semibold mb-4 text-sm uppercase tracking-wider text-slate-400">Notas de Revisión</h3>
              <textarea 
                className="w-full h-32 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-pink-500/50 focus:border-pink-500/50 placeholder-slate-600 transition-all"
                placeholder="Escribe tus notas aquí..."
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
              />
            </div>

            {/* Actions */}
            <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur rounded-2xl border border-white/5 p-5">
              <h3 className="font-semibold mb-4 text-sm uppercase tracking-wider text-slate-400">Decisión Final</h3>
              <div className="space-y-3">
                <button 
                  onClick={() => handleAction('Aprobada')} 
                  disabled={saving}
                  className="w-full flex items-center justify-center gap-3 py-4 bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white font-semibold rounded-xl shadow-lg shadow-emerald-500/25 transition-all disabled:opacity-50"
                >
                  {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
                  Aprobar Inspección
                </button>
                <button 
                  onClick={() => handleAction('Reinspección')} 
                  disabled={saving}
                  className="w-full flex items-center justify-center gap-3 py-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold rounded-xl shadow-lg shadow-amber-500/25 transition-all disabled:opacity-50"
                >
                  {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <AlertTriangle className="w-5 h-5" />}
                  Solicitar Reinspección
                </button>
                <button 
                  onClick={() => handleAction('Rechazada')} 
                  disabled={saving}
                  className="w-full flex items-center justify-center gap-3 py-4 bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white font-semibold rounded-xl shadow-lg shadow-red-500/25 transition-all disabled:opacity-50"
                >
                  {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <XCircle className="w-5 h-5" />}
                  Rechazar Inspección
                </button>
              </div>
            </div>

            {/* Tags */}
            {inspection.tags?.length > 0 && (
              <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur rounded-2xl border border-white/5 p-5">
                <h3 className="font-semibold mb-3 text-sm uppercase tracking-wider text-slate-400">Etiquetas</h3>
                <div className="flex flex-wrap gap-2">
                  {inspection.tags.map((tag, i) => (
                    <span key={i} className="px-3 py-1.5 text-xs bg-white/5 text-slate-300 rounded-lg border border-white/5">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper Components
const InfoField = ({ label, value, icon: Icon, highlight, mono }: { label: string; value: any; icon?: any; highlight?: boolean; mono?: boolean }) => (
  <div>
    <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">{label}</p>
    <div className="flex items-center gap-2">
      {Icon && <Icon className="w-4 h-4 text-slate-500" />}
      <p className={`text-sm ${highlight ? 'font-bold text-white' : 'text-slate-300'} ${mono ? 'font-mono text-xs' : ''}`}>
        {value || '—'}
      </p>
    </div>
  </div>
);

const SummaryRow = ({ label, value, status }: { label: string; value: string | number; status?: 'success' | 'warning' | 'error' }) => (
  <div className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
    <span className="text-sm text-slate-400">{label}</span>
    <span className={`font-semibold ${
      status === 'success' ? 'text-emerald-400' : 
      status === 'warning' ? 'text-amber-400' : 
      status === 'error' ? 'text-red-400' : 
      'text-white'
    }`}>
      {value}
    </span>
  </div>
);
