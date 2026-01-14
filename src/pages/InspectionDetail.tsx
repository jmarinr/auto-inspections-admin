import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Download, CheckCircle, AlertTriangle, XCircle, 
  ChevronLeft, ChevronRight, Loader2, X, Sun, Moon,
  MessageSquare, Eye, ExternalLink, User, Car, MapPin, 
  FileText, Users, Camera, Shield, PenTool, Phone, Mail,
  CreditCard, Calendar, FileCheck, AlertCircle
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
    cardHeader: isDark ? 'bg-[#1c2128] border-[#30363d]' : 'bg-gray-50 border-gray-200',
    text: isDark ? 'text-white' : 'text-gray-900',
    textMuted: isDark ? 'text-gray-400' : 'text-gray-500',
    textLabel: isDark ? 'text-gray-500' : 'text-gray-400',
    input: isDark ? 'bg-[#0d1117] border-[#30363d] text-white placeholder-gray-600' : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400',
    hover: isDark ? 'hover:bg-[#1c2128]' : 'hover:bg-gray-50',
    divider: isDark ? 'border-[#30363d]' : 'border-gray-200',
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
      <Loader2 className="w-12 h-12 text-pink-500 animate-spin" />
    </div>
  );
  
  if (!inspection) return (
    <div className={`min-h-screen ${theme.bg} flex items-center justify-center`}>
      <button onClick={() => navigate('/')} className="px-6 py-3 bg-pink-500 rounded-xl font-medium text-white">← Volver</button>
    </div>
  );

  const currentPhoto = photos[selectedPhotoIndex];
  const infoTabs = [
    { id: 'client', label: 'Cliente', icon: User },
    { id: 'vehicle', label: 'Vehículo', icon: Car },
    { id: 'accident', label: 'Accidente', icon: MapPin },
    ...(inspection.has_third_party ? [{ id: 'third_party', label: 'Tercero', icon: Users }] : []),
    { id: 'policy', label: 'Póliza', icon: FileText },
  ];

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
        <div className="max-w-[1800px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/')} className={`p-2 rounded-lg ${theme.hover}`}>
              <ArrowLeft className={`w-5 h-5 ${theme.textMuted}`} />
            </button>
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center font-bold text-white">
              {inspection.vehicle_brand?.charAt(0) || 'V'}
            </div>
            <div>
              <p className={`font-mono font-bold ${theme.text}`}>{inspection.id}</p>
              <p className={theme.textMuted}>{inspection.client_name} • {inspection.vehicle_brand} {inspection.vehicle_model} {inspection.vehicle_year}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <span className={`px-4 py-1.5 text-sm font-semibold rounded-lg ${
              inspection.status === 'Pendiente' ? 'bg-pink-500/20 text-pink-400 border border-pink-500/30' :
              inspection.status === 'Aprobada' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
              inspection.status === 'Rechazada' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
              'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
            }`}>{inspection.status}</span>
            <span className="px-4 py-1.5 text-sm font-medium bg-cyan-500/20 text-cyan-400 rounded-lg border border-cyan-500/30">
              SLA: {calculateSLA()}
            </span>
            <button onClick={() => setIsDark(!isDark)} className={`p-2.5 rounded-xl ${theme.card} border`}>
              {isDark ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5 text-purple-500" />}
            </button>
            <button onClick={handleDownloadPDF} className={`flex items-center gap-2 px-4 py-2.5 ${theme.card} border rounded-xl font-medium ${theme.text}`}>
              <Download className="w-4 h-4" /> PDF
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[1800px] mx-auto p-6">
        <div className="grid grid-cols-12 gap-6">
          
          {/* Left Column - Info Tabs */}
          <div className="col-span-12 lg:col-span-3 space-y-4">
            
            {/* Info Tab Navigation */}
            <div className={`${theme.card} border rounded-2xl p-2`}>
              <div className="flex flex-wrap gap-1">
                {infoTabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveInfoTab(tab.id as any)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                      activeInfoTab === tab.id 
                        ? 'bg-pink-500/20 text-pink-400 border border-pink-500/30' 
                        : `${theme.textMuted} ${theme.hover}`
                    }`}
                  >
                    <tab.icon className="w-4 h-4" />
                    <span className="hidden xl:inline">{tab.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Dynamic Info Panel */}
            <div className={`${theme.card} border rounded-2xl overflow-hidden`}>
              {/* Client Info */}
              {activeInfoTab === 'client' && (
                <>
                  <div className={`px-5 py-3 border-b ${theme.divider} ${theme.cardHeader}`}>
                    <h3 className={`font-semibold ${theme.text} flex items-center gap-2`}>
                      <User className="w-4 h-4 text-pink-400" /> Información del Cliente
                    </h3>
                  </div>
                  <div className="p-5 space-y-4">
                    <DataRow label="Nombre completo" value={inspection.client_name} theme={theme} />
                    <DataRow label="Documento de identidad" value={inspection.client_id} theme={theme} icon={CreditCard} />
                    <DataRow label="Teléfono" value={inspection.client_phone} theme={theme} icon={Phone} />
                    <DataRow label="Email" value={inspection.client_email} theme={theme} icon={Mail} />
                    <DataRow label="Dirección" value={inspection.client_address} theme={theme} icon={MapPin} />
                    <DataRow label="Licencia de conducir" value={inspection.client_driver_license} theme={theme} icon={CreditCard} />
                    
                    {/* ID Photos */}
                    {(inspection.client_id_front_image || inspection.client_id_back_image) && (
                      <div className={`pt-4 border-t ${theme.divider}`}>
                        <p className={`text-xs ${theme.textLabel} uppercase tracking-wider mb-3`}>Fotos del Documento</p>
                        <div className="grid grid-cols-2 gap-3">
                          {inspection.client_id_front_image && (
                            <ImageThumbnail 
                              src={inspection.client_id_front_image} 
                              label="Frente" 
                              onClick={() => setModalImage(inspection.client_id_front_image!)}
                              theme={theme}
                            />
                          )}
                          {inspection.client_id_back_image && (
                            <ImageThumbnail 
                              src={inspection.client_id_back_image} 
                              label="Reverso" 
                              onClick={() => setModalImage(inspection.client_id_back_image!)}
                              theme={theme}
                            />
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
                  <div className={`px-5 py-3 border-b ${theme.divider} ${theme.cardHeader}`}>
                    <h3 className={`font-semibold ${theme.text} flex items-center gap-2`}>
                      <Car className="w-4 h-4 text-blue-400" /> Datos del Vehículo
                    </h3>
                  </div>
                  <div className="p-5 space-y-4">
                    <DataRow label="VIN" value={inspection.vehicle_vin} theme={theme} mono />
                    <DataRow label="Placa" value={inspection.vehicle_plate} theme={theme} highlight />
                    <DataRow label="Marca" value={inspection.vehicle_brand} theme={theme} />
                    <DataRow label="Modelo" value={inspection.vehicle_model} theme={theme} />
                    <DataRow label="Año" value={inspection.vehicle_year} theme={theme} />
                    <DataRow label="Color" value={inspection.vehicle_color} theme={theme} />
                    <DataRow label="Kilometraje" value={inspection.vehicle_mileage ? `${inspection.vehicle_mileage.toLocaleString()} km` : null} theme={theme} />
                    <DataRow label="Uso" value={inspection.vehicle_usage === 'private' ? 'Particular' : inspection.vehicle_usage === 'commercial' ? 'Comercial' : inspection.vehicle_usage} theme={theme} />
                    <div className="flex items-center justify-between">
                      <span className={theme.textLabel}>¿Tiene garage?</span>
                      <span className={`px-3 py-1 text-xs rounded-lg ${inspection.vehicle_has_garage ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                        {inspection.vehicle_has_garage ? 'Sí' : 'No'}
                      </span>
                    </div>
                  </div>
                </>
              )}

              {/* Accident Info */}
              {activeInfoTab === 'accident' && (
                <>
                  <div className={`px-5 py-3 border-b ${theme.divider} ${theme.cardHeader}`}>
                    <h3 className={`font-semibold ${theme.text} flex items-center gap-2`}>
                      <AlertCircle className="w-4 h-4 text-orange-400" /> Datos del Accidente
                    </h3>
                  </div>
                  <div className="p-5 space-y-4">
                    <DataRow label="Tipo de accidente" value={inspection.accident_type} theme={theme} />
                    <DataRow label="Fecha y hora" value={inspection.accident_date ? new Date(inspection.accident_date).toLocaleString('es-ES') : null} theme={theme} icon={Calendar} />
                    <DataRow label="Ubicación" value={inspection.accident_location} theme={theme} icon={MapPin} />
                    
                    {inspection.accident_description && (
                      <div>
                        <p className={`text-xs ${theme.textLabel} uppercase tracking-wider mb-2`}>Descripción</p>
                        <p className={`text-sm ${theme.text} leading-relaxed`}>{inspection.accident_description}</p>
                      </div>
                    )}
                    
                    <div className="flex flex-wrap gap-2 pt-2">
                      <span className={`px-3 py-1.5 text-xs font-medium rounded-lg ${inspection.police_present ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-gray-500/20 text-gray-500 border border-gray-500/30'}`}>
                        {inspection.police_present ? '✓ Policía presente' : '✗ Sin policía'}
                      </span>
                      <span className={`px-3 py-1.5 text-xs font-medium rounded-lg ${inspection.has_witnesses ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-gray-500/20 text-gray-500 border border-gray-500/30'}`}>
                        {inspection.has_witnesses ? '✓ Hay testigos' : '✗ Sin testigos'}
                      </span>
                    </div>
                    
                    {inspection.police_report_number && (
                      <DataRow label="# Reporte policial" value={inspection.police_report_number} theme={theme} />
                    )}
                    {inspection.witness_info && (
                      <DataRow label="Info testigos" value={inspection.witness_info} theme={theme} />
                    )}
                    
                    {/* Accident Sketch */}
                    {inspection.accident_sketch_url && (
                      <div className={`pt-4 border-t ${theme.divider}`}>
                        <p className={`text-xs ${theme.textLabel} uppercase tracking-wider mb-3`}>Croquis del Accidente</p>
                        <ImageThumbnail 
                          src={inspection.accident_sketch_url} 
                          label="Ver croquis" 
                          onClick={() => setModalImage(inspection.accident_sketch_url!)}
                          theme={theme}
                          large
                        />
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Third Party Info */}
              {activeInfoTab === 'third_party' && inspection.has_third_party && (
                <>
                  <div className={`px-5 py-3 border-b ${theme.divider} ${theme.cardHeader}`}>
                    <h3 className={`font-semibold ${theme.text} flex items-center gap-2`}>
                      <Users className="w-4 h-4 text-yellow-400" /> Información del Tercero
                    </h3>
                  </div>
                  <div className="p-5 space-y-4">
                    <DataRow label="Nombre" value={inspection.third_party_name} theme={theme} icon={User} />
                    <DataRow label="Documento" value={inspection.third_party_id} theme={theme} icon={CreditCard} />
                    <DataRow label="Teléfono" value={inspection.third_party_phone} theme={theme} icon={Phone} />
                    <DataRow label="Email" value={inspection.third_party_email} theme={theme} icon={Mail} />
                    
                    {/* Third Party ID Photos */}
                    {(inspection.third_party_id_front_image || inspection.third_party_id_back_image) && (
                      <div className={`pt-4 border-t ${theme.divider}`}>
                        <p className={`text-xs ${theme.textLabel} uppercase tracking-wider mb-3`}>Documento del Tercero</p>
                        <div className="grid grid-cols-2 gap-3">
                          {inspection.third_party_id_front_image && (
                            <ImageThumbnail src={inspection.third_party_id_front_image} label="Frente" onClick={() => setModalImage(inspection.third_party_id_front_image!)} theme={theme} />
                          )}
                          {inspection.third_party_id_back_image && (
                            <ImageThumbnail src={inspection.third_party_id_back_image} label="Reverso" onClick={() => setModalImage(inspection.third_party_id_back_image!)} theme={theme} />
                          )}
                        </div>
                      </div>
                    )}
                    
                    {/* Third Party Vehicle */}
                    <div className={`pt-4 border-t ${theme.divider}`}>
                      <p className={`text-xs ${theme.textLabel} uppercase tracking-wider mb-3`}>Vehículo del Tercero</p>
                      <div className="space-y-3">
                        <DataRow label="Placa" value={inspection.third_party_vehicle_plate} theme={theme} />
                        <DataRow label="Marca" value={inspection.third_party_vehicle_brand} theme={theme} />
                        <DataRow label="Modelo" value={inspection.third_party_vehicle_model} theme={theme} />
                        <DataRow label="Año" value={inspection.third_party_vehicle_year} theme={theme} />
                        <DataRow label="Color" value={inspection.third_party_vehicle_color} theme={theme} />
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Policy Info */}
              {activeInfoTab === 'policy' && (
                <>
                  <div className={`px-5 py-3 border-b ${theme.divider} ${theme.cardHeader}`}>
                    <h3 className={`font-semibold ${theme.text} flex items-center gap-2`}>
                      <FileText className="w-4 h-4 text-purple-400" /> Información de Póliza
                    </h3>
                  </div>
                  <div className="p-5 space-y-4">
                    <DataRow label="Número de póliza" value={inspection.policy_number} theme={theme} mono />
                    <DataRow label="Número de reclamo" value={inspection.claim_number} theme={theme} mono />
                    <DataRow label="Tipo de póliza" value={inspection.policy_type} theme={theme} />
                    <div className="flex items-center justify-between">
                      <span className={theme.textLabel}>Estado de póliza</span>
                      <span className={`px-3 py-1 text-xs font-medium rounded-lg ${
                        inspection.policy_status === 'Emitida' ? 'bg-green-500/20 text-green-400' :
                        inspection.policy_status === 'Rechazada' ? 'bg-red-500/20 text-red-400' :
                        inspection.policy_status === 'Cancelada' ? 'bg-orange-500/20 text-orange-400' :
                        'bg-cyan-500/20 text-cyan-400'
                      }`}>
                        {inspection.policy_status}
                      </span>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Scores */}
            <div className={`${theme.card} border rounded-2xl overflow-hidden`}>
              <div className={`px-5 py-3 border-b ${theme.divider} ${theme.cardHeader}`}>
                <h3 className={`font-semibold ${theme.text} flex items-center gap-2`}>
                  <Shield className="w-4 h-4 text-green-400" /> Scores
                </h3>
              </div>
              <div className="p-5 space-y-5">
                <ScoreBar label="Risk" value={inspection.risk_score} theme={theme} type="risk" />
                <ScoreBar label="Quality" value={inspection.quality_score} theme={theme} type="quality" />
              </div>
            </div>

            {/* Signature */}
            {consent?.signature_url && (
              <div className={`${theme.card} border rounded-2xl overflow-hidden`}>
                <div className={`px-5 py-3 border-b ${theme.divider} ${theme.cardHeader}`}>
                  <h3 className={`font-semibold ${theme.text} flex items-center gap-2`}>
                    <PenTool className="w-4 h-4 text-purple-400" /> Firma Digital
                  </h3>
                </div>
                <div className="p-5">
                  <div 
                    className="bg-white rounded-xl p-3 cursor-pointer hover:shadow-lg transition-all"
                    onClick={() => setModalImage(consent.signature_url!)}
                  >
                    <img src={consent.signature_url} className="w-full h-16 object-contain" />
                  </div>
                  <p className={`text-xs ${theme.textMuted} text-center mt-3`}>
                    Firmado el {new Date(consent.timestamp).toLocaleString('es-ES')}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Center Column - Photos */}
          <div className="col-span-12 lg:col-span-6 space-y-4">
            
            {/* Photo Viewer */}
            <div className={`${theme.card} border rounded-2xl overflow-hidden`}>
              <div className={`px-5 py-3 border-b ${theme.divider} ${theme.cardHeader} flex items-center justify-between`}>
                <h3 className={`font-semibold ${theme.text} flex items-center gap-2`}>
                  <Camera className="w-4 h-4 text-pink-400" /> Visor de Imágenes
                </h3>
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
              <div className={`px-5 py-3 border-t border-b ${theme.divider} text-center`}>
                <p className={theme.text}>{currentPhoto?.label || currentPhoto?.angle || 'Sin etiqueta'}</p>
                <p className={`text-xs ${theme.textMuted}`}>{currentPhoto?.photo_type} • {currentPhoto?.category || 'general'}</p>
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
                            ? 'border-pink-500 ring-2 ring-pink-500/30' 
                            : isDark ? 'border-[#30363d] hover:border-gray-600' : 'border-gray-200 hover:border-gray-400'
                        } ${!photo ? 'opacity-40' : ''}`}
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
                <div className={`px-5 py-3 border-b ${theme.divider} ${theme.cardHeader} flex items-center gap-2`}>
                  <MessageSquare className="w-4 h-4 text-blue-400" />
                  <h3 className={`font-semibold ${theme.text}`}>Comentarios del Cliente</h3>
                </div>
                <div className="p-5">
                  <p className={`${theme.textMuted} leading-relaxed`}>{inspection.client_comments}</p>
                </div>
              </div>
            )}

            {/* Tags */}
            {inspection.tags && inspection.tags.length > 0 && (
              <div className={`${theme.card} border rounded-2xl p-5`}>
                <p className={`text-xs ${theme.textLabel} uppercase tracking-wider mb-3`}>Etiquetas</p>
                <div className="flex flex-wrap gap-2">
                  {inspection.tags.map((tag, i) => (
                    <span key={i} className={`px-3 py-1.5 text-sm ${isDark ? 'bg-white/5 text-gray-300 border border-white/10' : 'bg-gray-100 text-gray-600 border border-gray-200'} rounded-lg`}>
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
            <div className={`${theme.card} border rounded-2xl overflow-hidden`}>
              <div className={`flex border-b ${theme.divider}`}>
                <button
                  onClick={() => setActiveTab('damages')}
                  className={`flex-1 py-3 text-sm font-medium transition-all ${
                    activeTab === 'damages' ? 'bg-pink-500/20 text-pink-400 border-b-2 border-pink-500' : `${theme.textMuted} ${theme.hover}`
                  }`}
                >
                  Daños ({damages.length})
                </button>
                <button
                  onClick={() => setActiveTab('consistency')}
                  className={`flex-1 py-3 text-sm font-medium transition-all ${
                    activeTab === 'consistency' ? 'bg-pink-500/20 text-pink-400 border-b-2 border-pink-500' : `${theme.textMuted} ${theme.hover}`
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
                        <div key={damage.id} className={`p-4 ${isDark ? 'bg-[#1c2128]' : 'bg-gray-50'} rounded-xl`}>
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <p className={`font-semibold ${theme.text}`}>{damage.part}</p>
                              <p className={`text-sm ${theme.textMuted}`}>{damage.type}</p>
                            </div>
                            <span className={`px-2.5 py-1 text-xs font-semibold rounded-lg ${
                              damage.severity === 'Leve' ? 'bg-green-500/20 text-green-400' :
                              damage.severity === 'Moderado' ? 'bg-yellow-500/20 text-yellow-400' :
                              damage.severity === 'Severo' ? 'bg-orange-500/20 text-orange-400' :
                              'bg-red-500/20 text-red-400'
                            }`}>
                              {damage.severity}
                            </span>
                          </div>
                          {damage.description && (
                            <p className={`text-xs ${theme.textMuted} mb-2`}>{damage.description}</p>
                          )}
                          <div className="flex items-center justify-between">
                            <span className={`text-xs ${theme.textMuted}`}>IA: {damage.confidence}%</span>
                            <div className="flex gap-2">
                              <button 
                                onClick={() => toggleDamage(damage.id, true)}
                                className={`p-2 rounded-lg transition-all ${
                                  damage.approved === true ? 'bg-green-500 text-white' : `${theme.card} border ${theme.textMuted} hover:text-green-400`
                                }`}
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => toggleDamage(damage.id, false)}
                                className={`p-2 rounded-lg transition-all ${
                                  damage.approved === false ? 'bg-red-500 text-white' : `${theme.card} border ${theme.textMuted} hover:text-red-400`
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
                      <CheckCircle className="w-14 h-14 text-green-400 mx-auto mb-3" />
                      <p className={`font-medium ${theme.text}`}>Sin daños detectados</p>
                      <p className={`text-sm ${theme.textMuted}`}>El vehículo parece estar en buen estado</p>
                    </div>
                  )
                ) : (
                  <div className="text-center py-10">
                    <FileCheck className="w-14 h-14 text-blue-400 mx-auto mb-3" />
                    <p className={theme.textMuted}>Análisis de consistencia próximamente</p>
                  </div>
                )}
              </div>
            </div>

            {/* Review Notes */}
            <div className={`${theme.card} border rounded-2xl overflow-hidden`}>
              <div className={`px-5 py-3 border-b ${theme.divider} ${theme.cardHeader}`}>
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

            {/* Decision */}
            <div className={`${theme.card} border rounded-2xl overflow-hidden`}>
              <div className={`px-5 py-3 border-b ${theme.divider} ${theme.cardHeader}`}>
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

// Helper Components
function DataRow({ label, value, theme, icon: Icon, mono, highlight }: any) {
  return (
    <div>
      <p className={`text-xs ${theme.textLabel} mb-0.5 flex items-center gap-1`}>
        {Icon && <Icon className="w-3 h-3" />}
        {label}
      </p>
      <p className={`${highlight ? 'text-pink-400 font-semibold' : theme.text} ${mono ? 'font-mono text-sm' : ''}`}>
        {value || '—'}
      </p>
    </div>
  );
}

function ImageThumbnail({ src, label, onClick, theme, large }: any) {
  return (
    <div className={`relative group cursor-pointer ${large ? '' : ''}`} onClick={onClick}>
      <img src={src} className={`w-full ${large ? 'h-32' : 'h-16'} object-cover rounded-xl border ${theme.divider}`} />
      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center">
        <Eye className="w-5 h-5 text-white" />
      </div>
      <p className={`text-xs ${theme.textMuted} text-center mt-1`}>{label}</p>
    </div>
  );
}

function ScoreBar({ label, value, theme, type }: { label: string; value: number; theme: any; type: 'risk' | 'quality' }) {
  const isRisk = type === 'risk';
  const textColor = isRisk 
    ? (value >= 70 ? 'text-red-400' : value >= 50 ? 'text-yellow-400' : 'text-green-400')
    : 'text-green-400';
  const barColor = isRisk 
    ? (value >= 70 ? 'bg-red-500' : value >= 50 ? 'bg-yellow-500' : 'bg-green-500')
    : 'bg-green-500';

  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <span className={theme.textMuted}>{label}</span>
        <span className={`font-bold ${textColor}`}>{value}/100</span>
      </div>
      <div className={`h-2.5 ${theme.bg === 'bg-[#0d1117]' ? 'bg-gray-700' : 'bg-gray-200'} rounded-full overflow-hidden`}>
        <div className={`h-full ${barColor} rounded-full transition-all`} style={{ width: `${value}%` }}></div>
      </div>
    </div>
  );
}
