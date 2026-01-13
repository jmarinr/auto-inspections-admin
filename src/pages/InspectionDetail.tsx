import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Download, CheckCircle, AlertTriangle, XCircle, 
  ChevronLeft, ChevronRight, Loader2, X, ZoomIn, Maximize2,
  User, Car, MapPin, Camera, Shield, Clock, 
  Phone, Mail, CreditCard, Calendar, PenTool, Users
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
    <div className="min-h-screen bg-[#0a0a1a] flex items-center justify-center">
      <div className="text-center">
        <div className="relative w-20 h-20 mx-auto mb-6">
          <div className="absolute inset-0 rounded-full border-4 border-purple-500/20"></div>
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-[#d946ef] animate-spin"></div>
        </div>
        <p className="text-gray-400 text-lg">Cargando inspección...</p>
      </div>
    </div>
  );
  
  if (!inspection) return (
    <div className="min-h-screen bg-[#0a0a1a] flex items-center justify-center">
      <div className="text-center">
        <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
        <p className="text-xl text-gray-400 mb-6">Inspección no encontrada</p>
        <button onClick={() => navigate('/')} className="px-8 py-3 bg-gradient-to-r from-[#d946ef] to-[#8b5cf6] rounded-xl font-semibold hover:opacity-90 transition-all">
          ← Volver al Dashboard
        </button>
      </div>
    </div>
  );

  const currentPhoto = photos[selectedPhotoIndex];
  
  const getStatusStyle = (status: string) => {
    const styles: Record<string, string> = {
      'Pendiente': 'from-amber-500 to-orange-500',
      'En Revisión': 'from-blue-500 to-cyan-500',
      'Aprobada': 'from-emerald-500 to-green-500',
      'Rechazada': 'from-red-500 to-rose-500',
      'Reinspección': 'from-purple-500 to-violet-500',
    };
    return styles[status] || styles['Pendiente'];
  };

  return (
    <div className="min-h-screen bg-[#0a0a1a]">
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-[#d946ef]/10 rounded-full blur-[150px]"></div>
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-[#8b5cf6]/10 rounded-full blur-[150px]"></div>
      </div>

      {/* Modal */}
      {modalImage && (
        <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-8 animate-fadeIn" onClick={() => setModalImage(null)}>
          <button className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 rounded-xl backdrop-blur-sm transition-all">
            <X className="w-6 h-6" />
          </button>
          <img src={modalImage} className="max-w-full max-h-full object-contain rounded-2xl" />
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#0a0a1a]/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-[1600px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-5">
              <button onClick={() => navigate('/')} className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl transition-all">
                <ArrowLeft className="w-5 h-5" />
              </button>
              
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#d946ef] to-[#8b5cf6] flex items-center justify-center text-xl font-bold shadow-lg shadow-purple-500/30">
                  {inspection.vehicle_brand?.charAt(0) || 'V'}
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h1 className="text-xl font-bold">{inspection.id}</h1>
                    <span className={`px-4 py-1.5 text-xs font-bold rounded-full bg-gradient-to-r ${getStatusStyle(inspection.status)} shadow-lg`}>
                      {inspection.status}
                    </span>
                  </div>
                  <p className="text-gray-400">
                    {inspection.vehicle_brand} {inspection.vehicle_model} {inspection.vehicle_year} • {inspection.client_name || 'Sin nombre'}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center gap-3 px-4 py-2.5 bg-white/5 rounded-xl border border-white/10">
                <Clock className="w-4 h-4 text-[#d946ef]" />
                <span className="text-sm">{format(new Date(inspection.created_at), 'dd/MM/yyyy HH:mm')}</span>
              </div>
              <button onClick={handleDownloadPDF} className="flex items-center gap-2 px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl font-medium transition-all">
                <Download className="w-4 h-4" /> Descargar PDF
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative max-w-[1600px] mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column - Vehicle & Client Info */}
          <div className="lg:col-span-3 space-y-6">
            
            {/* Scores */}
            <div className="grid grid-cols-2 gap-4">
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 p-5">
                <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-[#d946ef]/20 to-transparent rounded-full blur-2xl"></div>
                <div className="flex items-center gap-2 text-gray-400 mb-2">
                  <Shield className="w-4 h-4" />
                  <span className="text-xs font-medium uppercase tracking-wider">Risk</span>
                </div>
                <p className={`text-3xl font-bold ${inspection.risk_score >= 70 ? 'text-red-400' : inspection.risk_score >= 50 ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {inspection.risk_score}
                </p>
                <div className="mt-3 h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${inspection.risk_score >= 70 ? 'bg-red-400' : inspection.risk_score >= 50 ? 'bg-amber-400' : 'bg-emerald-400'}`} style={{ width: `${inspection.risk_score}%` }}></div>
                </div>
              </div>
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 p-5">
                <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-emerald-500/20 to-transparent rounded-full blur-2xl"></div>
                <div className="flex items-center gap-2 text-gray-400 mb-2">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-xs font-medium uppercase tracking-wider">Quality</span>
                </div>
                <p className="text-3xl font-bold text-emerald-400">{inspection.quality_score}</p>
                <div className="mt-3 h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${inspection.quality_score}%` }}></div>
                </div>
              </div>
            </div>

            {/* Vehicle Info */}
            <div className="rounded-2xl bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 overflow-hidden">
              <div className="px-5 py-4 border-b border-white/5 flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-[#d946ef]/20 to-[#8b5cf6]/20">
                  <Car className="w-5 h-5 text-[#d946ef]" />
                </div>
                <h3 className="font-semibold">Datos del Vehículo</h3>
              </div>
              <div className="p-5 grid grid-cols-2 gap-4">
                <DataField label="Placa" value={inspection.vehicle_plate} highlight />
                <DataField label="VIN" value={inspection.vehicle_vin} mono />
                <DataField label="Marca" value={inspection.vehicle_brand} />
                <DataField label="Modelo" value={inspection.vehicle_model} />
                <DataField label="Año" value={inspection.vehicle_year} />
                <DataField label="Color" value={inspection.vehicle_color} />
                <DataField label="Kilometraje" value={inspection.vehicle_mileage ? `${inspection.vehicle_mileage.toLocaleString()} km` : null} />
                <DataField label="Uso" value={inspection.vehicle_usage} />
              </div>
            </div>

            {/* Client Info */}
            <div className="rounded-2xl bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 overflow-hidden">
              <div className="px-5 py-4 border-b border-white/5 flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20">
                  <User className="w-5 h-5 text-blue-400" />
                </div>
                <h3 className="font-semibold">Datos del Cliente</h3>
              </div>
              <div className="p-5 space-y-4">
                <DataField label="Nombre" value={inspection.client_name} icon={User} />
                <DataField label="Documento" value={inspection.client_id} icon={CreditCard} />
                <DataField label="Teléfono" value={inspection.client_phone} icon={Phone} />
                <DataField label="Email" value={inspection.client_email} icon={Mail} />
                
                {(inspection.client_id_front_image || inspection.client_id_back_image) && (
                  <div className="pt-4 border-t border-white/5">
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">Documento de Identidad</p>
                    <div className="grid grid-cols-2 gap-3">
                      {inspection.client_id_front_image && (
                        <div className="relative group cursor-pointer rounded-xl overflow-hidden" onClick={() => setModalImage(inspection.client_id_front_image!)}>
                          <img src={inspection.client_id_front_image} className="w-full h-16 object-cover" />
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
                            <ZoomIn className="w-5 h-5" />
                          </div>
                        </div>
                      )}
                      {inspection.client_id_back_image && (
                        <div className="relative group cursor-pointer rounded-xl overflow-hidden" onClick={() => setModalImage(inspection.client_id_back_image!)}>
                          <img src={inspection.client_id_back_image} className="w-full h-16 object-cover" />
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
                            <ZoomIn className="w-5 h-5" />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Accident Info */}
            <div className="rounded-2xl bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 overflow-hidden">
              <div className="px-5 py-4 border-b border-white/5 flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20">
                  <MapPin className="w-5 h-5 text-amber-400" />
                </div>
                <h3 className="font-semibold">Datos del Accidente</h3>
              </div>
              <div className="p-5 space-y-4">
                <DataField label="Tipo" value={inspection.accident_type} />
                <DataField label="Fecha" value={inspection.accident_date ? format(new Date(inspection.accident_date), 'dd/MM/yyyy HH:mm') : null} icon={Calendar} />
                <DataField label="Ubicación" value={inspection.accident_location} icon={MapPin} />
                
                <div className="flex flex-wrap gap-2 pt-2">
                  <span className={`px-3 py-1.5 text-xs font-medium rounded-lg ${inspection.police_present ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-gray-500/20 text-gray-500 border border-gray-500/30'}`}>
                    {inspection.police_present ? '✓ Policía' : '✗ Sin policía'}
                  </span>
                  <span className={`px-3 py-1.5 text-xs font-medium rounded-lg ${inspection.has_witnesses ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-gray-500/20 text-gray-500 border border-gray-500/30'}`}>
                    {inspection.has_witnesses ? '✓ Testigos' : '✗ Sin testigos'}
                  </span>
                </div>
              </div>
            </div>

            {/* Signature */}
            {consent?.signature_url && (
              <div className="rounded-2xl bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 overflow-hidden">
                <div className="px-5 py-4 border-b border-white/5 flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-gradient-to-br from-[#d946ef]/20 to-[#8b5cf6]/20">
                    <PenTool className="w-5 h-5 text-[#d946ef]" />
                  </div>
                  <h3 className="font-semibold">Firma Digital</h3>
                </div>
                <div className="p-5">
                  <div className="bg-white rounded-xl p-3 cursor-pointer hover:shadow-lg hover:shadow-purple-500/10 transition-all" onClick={() => setModalImage(consent.signature_url!)}>
                    <img src={consent.signature_url} className="w-full h-20 object-contain" />
                  </div>
                  <p className="text-xs text-gray-500 text-center mt-3">
                    Firmado el {format(new Date(consent.timestamp), 'dd/MM/yyyy')} a las {format(new Date(consent.timestamp), 'HH:mm')}
                  </p>
                </div>
              </div>
            )}

            {/* Third Party */}
            {inspection.has_third_party && (
              <div className="rounded-2xl bg-gradient-to-br from-amber-500/10 to-orange-500/5 border border-amber-500/20 overflow-hidden">
                <div className="px-5 py-4 border-b border-amber-500/20 flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-amber-500/20">
                    <Users className="w-5 h-5 text-amber-400" />
                  </div>
                  <h3 className="font-semibold text-amber-300">Tercero Involucrado</h3>
                </div>
                <div className="p-5 space-y-3">
                  <DataField label="Nombre" value={inspection.third_party_name} />
                  <DataField label="Documento" value={inspection.third_party_id} />
                  <DataField label="Vehículo" value={`${inspection.third_party_vehicle_brand || ''} ${inspection.third_party_vehicle_model || ''}`} />
                  <DataField label="Placa" value={inspection.third_party_vehicle_plate} />
                </div>
              </div>
            )}
          </div>

          {/* Center Column - Photos */}
          <div className="lg:col-span-6 space-y-6">
            
            {/* Photo Viewer */}
            <div className="rounded-2xl bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 overflow-hidden">
              <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-gradient-to-br from-[#d946ef]/20 to-[#8b5cf6]/20">
                    <Camera className="w-5 h-5 text-[#d946ef]" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Galería de Fotografías</h3>
                    <p className="text-xs text-gray-500">{photos.length} imágenes capturadas</p>
                  </div>
                </div>
                <span className="px-4 py-2 bg-white/5 rounded-xl text-sm font-medium border border-white/10">
                  {photos.length > 0 ? `${selectedPhotoIndex + 1} / ${photos.length}` : '0 / 0'}
                </span>
              </div>
              
              {/* Main Photo Display */}
              <div className="relative aspect-[16/9] bg-black/40 group cursor-pointer" onClick={() => currentPhoto?.image_url && setModalImage(currentPhoto.image_url)}>
                {currentPhoto?.image_url ? (
                  <>
                    <img src={currentPhoto.image_url} className="w-full h-full object-contain" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="p-4 bg-white/10 backdrop-blur-xl rounded-2xl">
                          <Maximize2 className="w-8 h-8" />
                        </div>
                      </div>
                    </div>
                    {/* Photo Label */}
                    <div className="absolute bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-black/80 to-transparent">
                      <p className="font-semibold text-lg">{currentPhoto.label || currentPhoto.angle || 'Sin etiqueta'}</p>
                      <p className="text-sm text-gray-400">{currentPhoto.photo_type} • {currentPhoto.category || 'general'}</p>
                    </div>
                  </>
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <Camera className="w-20 h-20 text-gray-700 mx-auto mb-4" />
                      <p className="text-gray-500 text-lg">No hay fotografías disponibles</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Thumbnails */}
              {photos.length > 0 && (
                <div className="p-5 border-t border-white/5">
                  <div className="flex gap-3 overflow-x-auto pb-2">
                    {photos.map((photo, idx) => (
                      <button
                        key={photo.id}
                        onClick={() => setSelectedPhotoIndex(idx)}
                        className={`relative flex-shrink-0 w-24 h-24 rounded-xl overflow-hidden border-2 transition-all ${
                          selectedPhotoIndex === idx 
                            ? 'border-[#d946ef] ring-4 ring-[#d946ef]/20 scale-105' 
                            : 'border-transparent hover:border-white/30'
                        }`}
                      >
                        {photo.image_url ? (
                          <img src={photo.image_url} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                            <Camera className="w-6 h-6 text-gray-600" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                  
                  {/* Navigation */}
                  <div className="flex gap-3 mt-4">
                    <button 
                      onClick={() => setSelectedPhotoIndex(Math.max(0, selectedPhotoIndex - 1))}
                      disabled={selectedPhotoIndex === 0}
                      className="flex-1 flex items-center justify-center gap-2 py-3 bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-white/5 rounded-xl transition-all border border-white/10"
                    >
                      <ChevronLeft className="w-5 h-5" /> Anterior
                    </button>
                    <button 
                      onClick={() => setSelectedPhotoIndex(Math.min(photos.length - 1, selectedPhotoIndex + 1))}
                      disabled={selectedPhotoIndex >= photos.length - 1}
                      className="flex-1 flex items-center justify-center gap-2 py-3 bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-white/5 rounded-xl transition-all border border-white/10"
                    >
                      Siguiente <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Damages */}
            <div className="rounded-2xl bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 overflow-hidden">
              <div className="px-5 py-4 border-b border-white/5 flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20">
                  <AlertTriangle className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h3 className="font-semibold">Daños Detectados por IA</h3>
                  <p className="text-xs text-gray-500">{damages.length} daños identificados</p>
                </div>
              </div>
              
              <div className="p-5">
                {damages.length > 0 ? (
                  <div className="space-y-4">
                    {damages.map((damage) => (
                      <div key={damage.id} className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5 hover:border-white/10 transition-all group">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="font-semibold">{damage.part}</span>
                            <span className={`px-2.5 py-1 text-xs font-medium rounded-lg ${
                              damage.severity === 'Leve' ? 'bg-emerald-500/20 text-emerald-400' :
                              damage.severity === 'Moderado' ? 'bg-amber-500/20 text-amber-400' :
                              'bg-red-500/20 text-red-400'
                            }`}>
                              {damage.severity}
                            </span>
                          </div>
                          <p className="text-sm text-gray-400 mb-3">{damage.type}</p>
                          <div className="flex items-center gap-3">
                            <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                              <div className="h-full bg-gradient-to-r from-[#d946ef] to-[#8b5cf6] rounded-full" style={{ width: `${damage.confidence}%` }}></div>
                            </div>
                            <span className="text-xs text-gray-500 font-medium">{damage.confidence}% confianza</span>
                          </div>
                        </div>
                        <div className="flex gap-2 ml-6">
                          <button 
                            onClick={() => toggleDamage(damage.id, true)}
                            className={`p-3 rounded-xl transition-all ${
                              damage.approved === true 
                                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30' 
                                : 'bg-white/5 text-gray-400 hover:bg-emerald-500/20 hover:text-emerald-400'
                            }`}
                          >
                            <CheckCircle className="w-5 h-5" />
                          </button>
                          <button 
                            onClick={() => toggleDamage(damage.id, false)}
                            className={`p-3 rounded-xl transition-all ${
                              damage.approved === false 
                                ? 'bg-red-500 text-white shadow-lg shadow-red-500/30' 
                                : 'bg-white/5 text-gray-400 hover:bg-red-500/20 hover:text-red-400'
                            }`}
                          >
                            <XCircle className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-emerald-500/20 flex items-center justify-center">
                      <CheckCircle className="w-8 h-8 text-emerald-400" />
                    </div>
                    <p className="text-lg font-medium text-emerald-400">Sin daños detectados</p>
                    <p className="text-gray-500 mt-1">El vehículo parece estar en buen estado</p>
                  </div>
                )}
              </div>
            </div>

            {/* Comments */}
            {inspection.client_comments && (
              <div className="rounded-2xl bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20">
                    <User className="w-5 h-5 text-blue-400" />
                  </div>
                  <h3 className="font-semibold">Comentarios del Cliente</h3>
                </div>
                <p className="text-gray-300 leading-relaxed bg-white/5 rounded-xl p-4 border border-white/5">{inspection.client_comments}</p>
              </div>
            )}
          </div>

          {/* Right Column - Actions */}
          <div className="lg:col-span-3 space-y-6">
            
            {/* Summary */}
            <div className="rounded-2xl bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 overflow-hidden">
              <div className="px-5 py-4 border-b border-white/5">
                <h3 className="font-semibold text-sm uppercase tracking-wider text-gray-400">Resumen de Inspección</h3>
              </div>
              <div className="p-5 space-y-1">
                <SummaryItem label="Fotos totales" value={photos.length} />
                <SummaryItem label="Fotos vehículo" value={photos.filter(p => p.photo_type === 'vehicle').length} status={photos.filter(p => p.photo_type === 'vehicle').length >= 8 ? 'success' : 'warning'} />
                <SummaryItem label="Fotos daños" value={photos.filter(p => p.category === 'damage').length} />
                <SummaryItem label="Fotos escena" value={photos.filter(p => p.photo_type === 'scene').length} />
                <SummaryItem label="Daños detectados" value={damages.length} />
                <SummaryItem label="Firma cliente" value={consent?.signature_url ? 'Sí' : 'No'} status={consent?.signature_url ? 'success' : 'error'} />
                <SummaryItem label="Tercero involucrado" value={inspection.has_third_party ? 'Sí' : 'No'} />
              </div>
            </div>

            {/* Review Notes */}
            <div className="rounded-2xl bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 overflow-hidden">
              <div className="px-5 py-4 border-b border-white/5">
                <h3 className="font-semibold text-sm uppercase tracking-wider text-gray-400">Notas de Revisión</h3>
              </div>
              <div className="p-5">
                <textarea 
                  className="w-full h-36 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#d946ef]/50 focus:border-[#d946ef]/50 placeholder-gray-600 transition-all"
                  placeholder="Escribe tus notas de revisión aquí..."
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                />
              </div>
            </div>

            {/* Actions */}
            <div className="rounded-2xl bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 overflow-hidden">
              <div className="px-5 py-4 border-b border-white/5">
                <h3 className="font-semibold text-sm uppercase tracking-wider text-gray-400">Decisión Final</h3>
              </div>
              <div className="p-5 space-y-3">
                <button 
                  onClick={() => handleAction('Aprobada')} 
                  disabled={saving}
                  className="w-full flex items-center justify-center gap-3 py-4 bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white font-semibold rounded-xl shadow-lg shadow-emerald-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
                  Aprobar Inspección
                </button>
                <button 
                  onClick={() => handleAction('Reinspección')} 
                  disabled={saving}
                  className="w-full flex items-center justify-center gap-3 py-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold rounded-xl shadow-lg shadow-amber-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <AlertTriangle className="w-5 h-5" />}
                  Solicitar Reinspección
                </button>
                <button 
                  onClick={() => handleAction('Rechazada')} 
                  disabled={saving}
                  className="w-full flex items-center justify-center gap-3 py-4 bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white font-semibold rounded-xl shadow-lg shadow-red-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <XCircle className="w-5 h-5" />}
                  Rechazar Inspección
                </button>
              </div>
            </div>

            {/* Tags */}
            {inspection.tags?.length > 0 && (
              <div className="rounded-2xl bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 overflow-hidden">
                <div className="px-5 py-4 border-b border-white/5">
                  <h3 className="font-semibold text-sm uppercase tracking-wider text-gray-400">Etiquetas</h3>
                </div>
                <div className="p-5">
                  <div className="flex flex-wrap gap-2">
                    {inspection.tags.map((tag, i) => (
                      <span key={i} className="px-4 py-2 text-sm bg-gradient-to-r from-[#d946ef]/10 to-[#8b5cf6]/10 text-gray-300 rounded-xl border border-white/10">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

// Helper Components
function DataField({ label, value, icon: Icon, highlight, mono }: { label: string; value: any; icon?: any; highlight?: boolean; mono?: boolean }) {
  return (
    <div>
      <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">{label}</p>
      <div className="flex items-center gap-2">
        {Icon && <Icon className="w-4 h-4 text-gray-500 flex-shrink-0" />}
        <p className={`text-sm ${highlight ? 'font-bold text-white bg-gradient-to-r from-[#d946ef] to-[#8b5cf6] bg-clip-text text-transparent' : 'text-gray-300'} ${mono ? 'font-mono text-xs' : ''} truncate`}>
          {value || '—'}
        </p>
      </div>
    </div>
  );
}

function SummaryItem({ label, value, status }: { label: string; value: string | number; status?: 'success' | 'warning' | 'error' }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
      <span className="text-sm text-gray-400">{label}</span>
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
}
