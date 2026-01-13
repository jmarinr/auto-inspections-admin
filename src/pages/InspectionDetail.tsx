import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Download, CheckCircle, AlertTriangle, XCircle, 
  ChevronLeft, ChevronRight, MessageSquare, Loader2, X,
  User, Car, MapPin, Camera, PenTool, Users,
  Phone, Mail, CreditCard, Gauge, Calendar, Shield, Eye
} from 'lucide-react';
import { 
  getInspectionById, getDamagesByInspection, getPhotosByInspection,
  getConsentByInspection, updateInspectionStatus, updateDamageApproval,
  type Inspection, type Damage, type Photo, type Consent
} from '../lib/supabase';
import { downloadPDF } from '../utils/pdfGenerator';
import { format } from 'date-fns';

// Modal para ver imágenes en grande
const ImageModal = ({ src, onClose }: { src: string; onClose: () => void }) => (
  <div 
    className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4" 
    onClick={onClose}
  >
    <button 
      className="absolute top-4 right-4 p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors"
      onClick={onClose}
    >
      <X className="w-6 h-6 text-white" />
    </button>
    <img 
      src={src} 
      alt="Imagen ampliada" 
      className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg"
      onClick={(e) => e.stopPropagation()}
    />
  </div>
);

// Componente para mostrar una fila de información
const InfoItem = ({ icon: Icon, label, value, className = '' }: { 
  icon?: any; 
  label: string; 
  value: string | number | null | undefined;
  className?: string;
}) => (
  <div className={`flex items-start gap-3 ${className}`}>
    {Icon && <Icon className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />}
    <div className="flex-1 min-w-0">
      <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
      <p className="text-sm font-medium text-white truncate">{value || '—'}</p>
    </div>
  </div>
);

// Componente para sección colapsable
const Section = ({ title, icon: Icon, children, defaultOpen = true }: {
  title: string;
  icon: any;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  
  return (
    <div className="bg-[#12121f] rounded-xl border border-white/10 overflow-hidden">
      <button 
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-white/5 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#ec4899]/20 rounded-lg">
            <Icon className="w-4 h-4 text-[#ec4899]" />
          </div>
          <span className="font-semibold text-sm">{title}</span>
        </div>
        <ChevronRight className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
      </button>
      {isOpen && <div className="px-4 pb-4 border-t border-white/5">{children}</div>}
    </div>
  );
};

// Componente para badge de severidad
const SeverityBadge = ({ severity }: { severity: string }) => {
  const colors = {
    'Leve': 'bg-green-500/20 text-green-400 border-green-500/30',
    'Moderado': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    'Severo': 'bg-red-500/20 text-red-400 border-red-500/30',
    'Pérdida total': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  };
  return (
    <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${colors[severity as keyof typeof colors] || 'bg-gray-500/20 text-gray-400'}`}>
      {severity}
    </span>
  );
};

// Componente para thumbnail de foto
const PhotoThumbnail = ({ 
  photo, 
  isSelected, 
  onClick,
  onView 
}: { 
  photo: Photo; 
  isSelected: boolean; 
  onClick: () => void;
  onView: () => void;
}) => (
  <div 
    className={`relative aspect-square rounded-lg overflow-hidden cursor-pointer border-2 transition-all group ${
      isSelected ? 'border-[#ec4899] ring-2 ring-[#ec4899]/30' : 'border-transparent hover:border-white/30'
    }`}
    onClick={onClick}
  >
    {photo.image_url ? (
      <>
        <img 
          src={photo.image_url} 
          alt={photo.label || 'Foto'} 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <button 
            className="p-2 bg-white/20 rounded-full"
            onClick={(e) => { e.stopPropagation(); onView(); }}
          >
            <Eye className="w-4 h-4 text-white" />
          </button>
        </div>
        {photo.label && (
          <div className="absolute bottom-0 left-0 right-0 bg-black/70 px-2 py-1">
            <p className="text-[10px] text-white truncate">{photo.label}</p>
          </div>
        )}
      </>
    ) : (
      <div className="w-full h-full bg-white/5 flex items-center justify-center">
        <Camera className="w-6 h-6 text-gray-600" />
      </div>
    )}
  </div>
);

export default function InspectionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [inspection, setInspection] = useState<Inspection | null>(null);
  const [damages, setDamages] = useState<Damage[]>([]);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [consent, setConsent] = useState<Consent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);
  const [reviewNotes, setReviewNotes] = useState('');
  const [modalImage, setModalImage] = useState<string | null>(null);
  const [photoCategory, setPhotoCategory] = useState<'all' | 'vehicle' | 'damage' | 'scene'>('all');
  
  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    
    try {
      const [inspectionData, damagesData, photosData, consentData] = await Promise.all([
        getInspectionById(id),
        getDamagesByInspection(id),
        getPhotosByInspection(id),
        getConsentByInspection(id)
      ]);
      
      console.log('Inspection loaded:', inspectionData);
      console.log('Photos loaded:', photosData);
      console.log('Damages loaded:', damagesData);
      console.log('Consent loaded:', consentData);
      
      setInspection(inspectionData);
      setDamages(damagesData || []);
      setPhotos(photosData || []);
      setConsent(consentData);
      setReviewNotes(inspectionData.review_notes || '');
    } catch (err) {
      console.error('Error loading inspection:', err);
      setError('Error al cargar la inspección');
    } finally {
      setLoading(false);
    }
  };
  
  const handleAction = async (status: Inspection['status']) => {
    if (!inspection) return;
    setSaving(true);
    try {
      await updateInspectionStatus(inspection.id, status, reviewNotes);
      alert(`✅ Inspección ${status === 'Aprobada' ? 'aprobada' : status === 'Rechazada' ? 'rechazada' : 'marcada para reinspección'}`);
      navigate('/');
    } catch (err) {
      alert('Error al actualizar');
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
    downloadPDF({
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
      reviewNotes: reviewNotes,
    });
  };

  // Loading state
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

  // Error state
  if (error || !inspection) {
    return (
      <div className="min-h-screen bg-[#0a0a12] flex items-center justify-center">
        <div className="text-center">
          <XCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <p className="text-xl text-gray-400 mb-4">{error || 'Inspección no encontrada'}</p>
          <button onClick={() => navigate('/')} className="btn-primary">
            <ArrowLeft className="w-4 h-4" /> Volver al Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Filtrar fotos por categoría
  const getFilteredPhotos = () => {
    if (photoCategory === 'all') return photos;
    if (photoCategory === 'vehicle') return photos.filter(p => p.photo_type === 'vehicle' && p.category !== 'damage');
    if (photoCategory === 'damage') return photos.filter(p => p.category === 'damage' || p.angle === 'damage');
    if (photoCategory === 'scene') return photos.filter(p => p.photo_type === 'scene');
    return photos;
  };

  const filteredPhotos = getFilteredPhotos();
  const currentPhoto = filteredPhotos[selectedPhotoIndex];

  // Contar fotos por categoría
  const vehiclePhotosCount = photos.filter(p => p.photo_type === 'vehicle' && p.category !== 'damage').length;
  const damagePhotosCount = photos.filter(p => p.category === 'damage' || p.angle === 'damage').length;
  const scenePhotosCount = photos.filter(p => p.photo_type === 'scene').length;

  // Status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Aprobada': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'Rechazada': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'Reinspección': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'En Revisión': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      default: return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a12]">
      {/* Modal de imagen */}
      {modalImage && <ImageModal src={modalImage} onClose={() => setModalImage(null)} />}
      
      {/* Header */}
      <header className="bg-[#12121f] border-b border-white/10 px-6 py-4 sticky top-0 z-40">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/')} 
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-lg font-bold">{inspection.id}</h1>
                <span className={`px-3 py-1 text-xs font-medium rounded-full border ${getStatusColor(inspection.status)}`}>
                  {inspection.status}
                </span>
              </div>
              <p className="text-sm text-gray-400">
                {inspection.client_name || 'Sin nombre'} • {inspection.vehicle_brand} {inspection.vehicle_model} {inspection.vehicle_year}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button onClick={handleDownloadPDF} className="btn-secondary">
              <Download className="w-4 h-4" /> Descargar PDF
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex">
        {/* Left Sidebar - Info */}
        <div className="w-[380px] border-r border-white/10 h-[calc(100vh-73px)] overflow-y-auto p-4 space-y-4">
          
          {/* Cliente */}
          <Section title="Información del Cliente" icon={User}>
            <div className="pt-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <InfoItem icon={User} label="Nombre Completo" value={inspection.client_name} />
                <InfoItem icon={CreditCard} label="Documento ID" value={inspection.client_id} />
                <InfoItem icon={Phone} label="Teléfono" value={inspection.client_phone} />
                <InfoItem icon={Mail} label="Email" value={inspection.client_email} />
              </div>
              
              {/* Fotos del documento de identidad */}
              {(inspection.client_id_front_image || inspection.client_id_back_image) && (
                <div className="pt-4 border-t border-white/10">
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-3">Documento de Identidad</p>
                  <div className="flex gap-3">
                    {inspection.client_id_front_image && (
                      <div 
                        className="relative group cursor-pointer"
                        onClick={() => setModalImage(inspection.client_id_front_image!)}
                      >
                        <img 
                          src={inspection.client_id_front_image} 
                          alt="ID Frente" 
                          className="w-32 h-20 object-cover rounded-lg border border-white/10"
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                          <Eye className="w-5 h-5 text-white" />
                        </div>
                        <p className="text-[10px] text-gray-500 text-center mt-1">Frente</p>
                      </div>
                    )}
                    {inspection.client_id_back_image && (
                      <div 
                        className="relative group cursor-pointer"
                        onClick={() => setModalImage(inspection.client_id_back_image!)}
                      >
                        <img 
                          src={inspection.client_id_back_image} 
                          alt="ID Reverso" 
                          className="w-32 h-20 object-cover rounded-lg border border-white/10"
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                          <Eye className="w-5 h-5 text-white" />
                        </div>
                        <p className="text-[10px] text-gray-500 text-center mt-1">Reverso</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </Section>

          {/* Vehículo */}
          <Section title="Datos del Vehículo" icon={Car}>
            <div className="pt-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <InfoItem label="Placa" value={inspection.vehicle_plate} />
                <InfoItem label="VIN" value={inspection.vehicle_vin} />
                <InfoItem label="Marca" value={inspection.vehicle_brand} />
                <InfoItem label="Modelo" value={inspection.vehicle_model} />
                <InfoItem label="Año" value={inspection.vehicle_year} />
                <InfoItem label="Color" value={inspection.vehicle_color} />
                <InfoItem icon={Gauge} label="Kilometraje" value={inspection.vehicle_mileage ? `${inspection.vehicle_mileage.toLocaleString()} km` : null} />
                <InfoItem label="Uso" value={inspection.vehicle_usage} />
              </div>
            </div>
          </Section>

          {/* Accidente */}
          <Section title="Información del Accidente" icon={MapPin}>
            <div className="pt-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <InfoItem label="Tipo" value={inspection.accident_type} />
                <InfoItem icon={Calendar} label="Fecha" value={inspection.accident_date ? format(new Date(inspection.accident_date), 'dd/MM/yyyy HH:mm') : null} />
              </div>
              <InfoItem icon={MapPin} label="Ubicación" value={inspection.accident_location} className="col-span-2" />
              
              {inspection.accident_description && (
                <div className="pt-3 border-t border-white/10">
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Descripción</p>
                  <p className="text-sm text-gray-300 leading-relaxed">{inspection.accident_description}</p>
                </div>
              )}
              
              <div className="flex gap-2 pt-3">
                <span className={`px-3 py-1 text-xs rounded-full border ${
                  inspection.police_present 
                    ? 'bg-green-500/20 text-green-400 border-green-500/30' 
                    : 'bg-gray-500/20 text-gray-400 border-gray-500/30'
                }`}>
                  {inspection.police_present ? '✓ Policía presente' : '✗ Sin policía'}
                </span>
                <span className={`px-3 py-1 text-xs rounded-full border ${
                  inspection.has_witnesses 
                    ? 'bg-green-500/20 text-green-400 border-green-500/30' 
                    : 'bg-gray-500/20 text-gray-400 border-gray-500/30'
                }`}>
                  {inspection.has_witnesses ? '✓ Hay testigos' : '✗ Sin testigos'}
                </span>
              </div>
              
              {inspection.police_report_number && (
                <InfoItem label="# Reporte Policial" value={inspection.police_report_number} />
              )}
            </div>
          </Section>

          {/* Tercero (si existe) */}
          {inspection.has_third_party && (
            <Section title="Información del Tercero" icon={Users}>
              <div className="pt-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <InfoItem icon={User} label="Nombre" value={inspection.third_party_name} />
                  <InfoItem icon={CreditCard} label="Documento" value={inspection.third_party_id} />
                  <InfoItem icon={Phone} label="Teléfono" value={inspection.third_party_phone} />
                  <InfoItem icon={Mail} label="Email" value={inspection.third_party_email} />
                </div>
                
                <div className="pt-4 border-t border-white/10">
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-3">Vehículo del Tercero</p>
                  <div className="grid grid-cols-2 gap-4">
                    <InfoItem label="Placa" value={inspection.third_party_vehicle_plate} />
                    <InfoItem label="Marca" value={inspection.third_party_vehicle_brand} />
                    <InfoItem label="Modelo" value={inspection.third_party_vehicle_model} />
                    <InfoItem label="Año" value={inspection.third_party_vehicle_year} />
                    <InfoItem label="Color" value={inspection.third_party_vehicle_color} />
                  </div>
                </div>
              </div>
            </Section>
          )}

          {/* Scores */}
          <Section title="Evaluación de Riesgo" icon={Shield}>
            <div className="pt-4 space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-400">Risk Score</span>
                  <span className={`text-lg font-bold ${
                    inspection.risk_score >= 70 ? 'text-red-400' : 
                    inspection.risk_score >= 50 ? 'text-yellow-400' : 'text-green-400'
                  }`}>
                    {inspection.risk_score}/100
                  </span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all"
                    style={{ 
                      width: `${inspection.risk_score}%`,
                      backgroundColor: inspection.risk_score >= 70 ? '#ef4444' : inspection.risk_score >= 50 ? '#f59e0b' : '#10b981'
                    }}
                  />
                </div>
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-400">Quality Score</span>
                  <span className="text-lg font-bold text-green-400">{inspection.quality_score}/100</span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-green-500 rounded-full transition-all"
                    style={{ width: `${inspection.quality_score}%` }}
                  />
                </div>
              </div>
            </div>
          </Section>

          {/* Firma */}
          {consent?.signature_url && (
            <Section title="Firma del Cliente" icon={PenTool}>
              <div className="pt-4">
                <div 
                  className="bg-white rounded-lg p-2 cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => setModalImage(consent.signature_url!)}
                >
                  <img 
                    src={consent.signature_url} 
                    alt="Firma" 
                    className="w-full h-24 object-contain"
                  />
                </div>
                <p className="text-xs text-gray-500 text-center mt-2">
                  Firmado el {format(new Date(consent.timestamp), 'dd/MM/yyyy')} a las {format(new Date(consent.timestamp), 'HH:mm')}
                </p>
              </div>
            </Section>
          )}
        </div>

        {/* Center - Photos */}
        <div className="flex-1 h-[calc(100vh-73px)] overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto">
            {/* Photo filters */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Camera className="w-5 h-5 text-[#ec4899]" />
                Fotografías de la Inspección
              </h2>
              <div className="flex gap-2">
                <button 
                  className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
                    photoCategory === 'all' ? 'bg-[#ec4899] text-white' : 'bg-white/10 hover:bg-white/20'
                  }`}
                  onClick={() => { setPhotoCategory('all'); setSelectedPhotoIndex(0); }}
                >
                  Todas ({photos.length})
                </button>
                <button 
                  className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
                    photoCategory === 'vehicle' ? 'bg-[#ec4899] text-white' : 'bg-white/10 hover:bg-white/20'
                  }`}
                  onClick={() => { setPhotoCategory('vehicle'); setSelectedPhotoIndex(0); }}
                >
                  Vehículo ({vehiclePhotosCount})
                </button>
                <button 
                  className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
                    photoCategory === 'damage' ? 'bg-[#ec4899] text-white' : 'bg-white/10 hover:bg-white/20'
                  }`}
                  onClick={() => { setPhotoCategory('damage'); setSelectedPhotoIndex(0); }}
                >
                  Daños ({damagePhotosCount})
                </button>
                <button 
                  className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
                    photoCategory === 'scene' ? 'bg-[#ec4899] text-white' : 'bg-white/10 hover:bg-white/20'
                  }`}
                  onClick={() => { setPhotoCategory('scene'); setSelectedPhotoIndex(0); }}
                >
                  Escena ({scenePhotosCount})
                </button>
              </div>
            </div>

            {/* Main photo viewer */}
            <div className="bg-[#12121f] rounded-xl border border-white/10 p-4 mb-4">
              {filteredPhotos.length > 0 ? (
                <>
                  {/* Large photo */}
                  <div 
                    className="aspect-video bg-black rounded-lg overflow-hidden mb-4 cursor-pointer relative group"
                    onClick={() => currentPhoto?.image_url && setModalImage(currentPhoto.image_url)}
                  >
                    {currentPhoto?.image_url ? (
                      <>
                        <img 
                          src={currentPhoto.image_url} 
                          alt={currentPhoto.label || 'Foto'} 
                          className="w-full h-full object-contain"
                        />
                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <div className="bg-white/20 backdrop-blur-sm rounded-full p-3">
                            <Eye className="w-6 h-6 text-white" />
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Camera className="w-12 h-12 text-gray-600" />
                      </div>
                    )}
                  </div>
                  
                  {/* Photo info */}
                  {currentPhoto && (
                    <div className="flex items-center justify-between mb-4 px-2">
                      <div>
                        <p className="font-medium">{currentPhoto.label || currentPhoto.angle || 'Sin etiqueta'}</p>
                        <p className="text-sm text-gray-500">
                          {currentPhoto.photo_type} • {currentPhoto.category || currentPhoto.angle}
                        </p>
                      </div>
                      <p className="text-sm text-gray-400">
                        {selectedPhotoIndex + 1} / {filteredPhotos.length}
                      </p>
                    </div>
                  )}
                  
                  {/* Photo grid */}
                  <div className="grid grid-cols-6 gap-2 mb-4">
                    {filteredPhotos.map((photo, index) => (
                      <PhotoThumbnail
                        key={photo.id}
                        photo={photo}
                        isSelected={selectedPhotoIndex === index}
                        onClick={() => setSelectedPhotoIndex(index)}
                        onView={() => photo.image_url && setModalImage(photo.image_url)}
                      />
                    ))}
                  </div>
                  
                  {/* Navigation */}
                  <div className="flex gap-3">
                    <button 
                      className="btn-secondary flex-1"
                      onClick={() => setSelectedPhotoIndex(Math.max(0, selectedPhotoIndex - 1))}
                      disabled={selectedPhotoIndex === 0}
                    >
                      <ChevronLeft className="w-4 h-4" /> Anterior
                    </button>
                    <button 
                      className="btn-secondary flex-1"
                      onClick={() => setSelectedPhotoIndex(Math.min(filteredPhotos.length - 1, selectedPhotoIndex + 1))}
                      disabled={selectedPhotoIndex >= filteredPhotos.length - 1}
                    >
                      Siguiente <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </>
              ) : (
                <div className="aspect-video flex items-center justify-center">
                  <div className="text-center">
                    <Camera className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-500">No hay fotos en esta categoría</p>
                  </div>
                </div>
              )}
            </div>

            {/* Damages section */}
            <div className="bg-[#12121f] rounded-xl border border-white/10 p-4 mb-4">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-400" />
                Daños Detectados ({damages.length})
              </h3>
              
              {damages.length > 0 ? (
                <div className="space-y-3">
                  {damages.map((damage) => (
                    <div 
                      key={damage.id} 
                      className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <span className="font-medium">{damage.part}</span>
                          <SeverityBadge severity={damage.severity} />
                        </div>
                        <p className="text-sm text-gray-400">{damage.type}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          Confianza IA: {damage.confidence}%
                          {damage.description && ` • ${damage.description}`}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => toggleDamageApproval(damage.id, true)}
                          className={`p-2 rounded-lg transition-colors ${
                            damage.approved === true 
                              ? 'bg-green-500/30 text-green-400 ring-2 ring-green-500/50' 
                              : 'bg-white/5 text-gray-400 hover:bg-green-500/20 hover:text-green-400'
                          }`}
                          title="Aprobar daño"
                        >
                          <CheckCircle className="w-5 h-5" />
                        </button>
                        <button 
                          onClick={() => toggleDamageApproval(damage.id, false)}
                          className={`p-2 rounded-lg transition-colors ${
                            damage.approved === false 
                              ? 'bg-red-500/30 text-red-400 ring-2 ring-red-500/50' 
                              : 'bg-white/5 text-gray-400 hover:bg-red-500/20 hover:text-red-400'
                          }`}
                          title="Rechazar daño"
                        >
                          <XCircle className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <CheckCircle className="w-10 h-10 text-green-400 mx-auto mb-3" />
                  <p className="text-gray-400">No se detectaron daños en esta inspección</p>
                </div>
              )}
            </div>

            {/* Client comments */}
            {inspection.client_comments && (
              <div className="bg-[#12121f] rounded-xl border border-white/10 p-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-blue-400" />
                  Comentarios del Cliente
                </h3>
                <p className="text-gray-300 leading-relaxed">{inspection.client_comments}</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar - Actions */}
        <div className="w-[320px] border-l border-white/10 h-[calc(100vh-73px)] overflow-y-auto p-4 space-y-4">
          
          {/* Quick stats */}
          <div className="bg-[#12121f] rounded-xl border border-white/10 p-4">
            <h3 className="font-semibold mb-4 text-sm uppercase tracking-wide text-gray-400">Resumen de Inspección</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Fotos totales</span>
                <span className="font-semibold">{photos.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Fotos vehículo</span>
                <span className={`font-semibold ${vehiclePhotosCount >= 8 ? 'text-green-400' : 'text-yellow-400'}`}>
                  {vehiclePhotosCount} {vehiclePhotosCount < 8 && '⚠️'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Fotos daños</span>
                <span className="font-semibold">{damagePhotosCount}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Fotos escena</span>
                <span className="font-semibold">{scenePhotosCount}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Daños detectados</span>
                <span className="font-semibold">{damages.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Firma cliente</span>
                <span className={`font-semibold ${consent?.signature_url ? 'text-green-400' : 'text-red-400'}`}>
                  {consent?.signature_url ? '✓ Firmado' : '✗ Sin firma'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Tercero involucrado</span>
                <span className="font-semibold">{inspection.has_third_party ? 'Sí' : 'No'}</span>
              </div>
            </div>
          </div>

          {/* Review notes */}
          <div className="bg-[#12121f] rounded-xl border border-white/10 p-4">
            <h3 className="font-semibold mb-3 text-sm uppercase tracking-wide text-gray-400">Notas de Revisión</h3>
            <textarea 
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#ec4899]/50"
              rows={5}
              placeholder="Escribe notas sobre tu revisión aquí..."
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
            />
          </div>

          {/* Decision buttons */}
          <div className="bg-[#12121f] rounded-xl border border-white/10 p-4">
            <h3 className="font-semibold mb-4 text-sm uppercase tracking-wide text-gray-400">Tomar Decisión</h3>
            <div className="space-y-3">
              <button 
                onClick={() => handleAction('Aprobada')} 
                disabled={saving}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/30 rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
                Aprobar Inspección
              </button>
              <button 
                onClick={() => handleAction('Reinspección')} 
                disabled={saving}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 border border-yellow-500/30 rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <AlertTriangle className="w-5 h-5" />}
                Solicitar Reinspección
              </button>
              <button 
                onClick={() => handleAction('Rechazada')} 
                disabled={saving}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <XCircle className="w-5 h-5" />}
                Rechazar Inspección
              </button>
            </div>
          </div>

          {/* Tags */}
          {inspection.tags && inspection.tags.length > 0 && (
            <div className="bg-[#12121f] rounded-xl border border-white/10 p-4">
              <h3 className="font-semibold mb-3 text-sm uppercase tracking-wide text-gray-400">Etiquetas</h3>
              <div className="flex flex-wrap gap-2">
                {inspection.tags.map((tag, index) => (
                  <span 
                    key={index}
                    className="px-2 py-1 text-xs bg-white/10 text-gray-300 rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
