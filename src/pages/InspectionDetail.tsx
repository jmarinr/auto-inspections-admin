import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Download, CheckCircle, AlertTriangle, XCircle, 
  ChevronLeft, ChevronRight, MessageSquare, Loader2,
  User, Car, MapPin, Camera, PenTool, Users
} from 'lucide-react';
import { 
  getInspectionById, getDamagesByInspection, getPhotosByInspection,
  getConsentByInspection, updateInspectionStatus, updateDamageApproval,
  type Inspection, type Damage, type Photo, type Consent
} from '../lib/supabase';
import { downloadPDF } from '../utils/pdfGenerator';
import { format } from 'date-fns';

const getSeverityClass = (s: string) => s === 'Leve' ? 'badge-green' : s === 'Moderado' ? 'badge-yellow' : 'badge-red';

const InfoRow = ({ label, value }: { label: string; value: string | number | null | undefined }) => (
  <div><p className="text-xs text-gray-500">{label}</p><p className="font-medium text-sm">{value || 'N/A'}</p></div>
);

const ImageModal = ({ src, onClose }: { src: string; onClose: () => void }) => (
  <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4" onClick={onClose}>
    <img src={src} alt="" className="max-w-full max-h-full object-contain" />
    <button className="absolute top-4 right-4 text-white"><XCircle className="w-8 h-8" /></button>
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
  const [saving, setSaving] = useState(false);
  
  const [activeTab, setActiveTab] = useState<'photos' | 'damages' | 'third_party'>('photos');
  const [selectedPhoto, setSelectedPhoto] = useState(0);
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
      setInspection(ins); setDamages(dam); setPhotos(pho); setConsent(con); setReviewNotes(ins.review_notes || '');
    } catch { } finally { setLoading(false); }
  };
  
  const handleAction = async (status: Inspection['status']) => {
    if (!inspection) return;
    setSaving(true);
    try {
      await updateInspectionStatus(inspection.id, status, reviewNotes);
      navigate('/');
    } catch { } finally { setSaving(false); }
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
      photos: photos.map(p => p.image_url || ''), clientComments: inspection.client_comments || '', reviewNotes: reviewNotes
    });
  };

  if (loading) return <div className="min-h-screen bg-[#0a0a12] flex items-center justify-center"><Loader2 className="w-12 h-12 text-[#ec4899] animate-spin" /></div>;
  if (!inspection) return <div className="min-h-screen bg-[#0a0a12] flex items-center justify-center"><button onClick={() => navigate('/')} className="btn-primary"><ArrowLeft className="w-4 h-4" /> Volver</button></div>;
  
  const allPhotos = photos.filter(p => p.vehicle_type !== 'third_party');
  const thirdPartyPhotos = photos.filter(p => p.vehicle_type === 'third_party');

  return (
    <div className="min-h-screen bg-[#0a0a12]">
      {modalImage && <ImageModal src={modalImage} onClose={() => setModalImage(null)} />}
      
      <header className="border-b border-white/10 px-6 py-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/')} className="text-gray-400 hover:text-white"><ArrowLeft className="w-5 h-5" /></button>
            <div>
              <p className="font-semibold">{inspection.id}</p>
              <p className="text-sm text-gray-400">{inspection.client_name} • {inspection.vehicle_brand} {inspection.vehicle_model}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className={`badge ${inspection.status === 'Aprobada' ? 'badge-green' : inspection.status === 'Rechazada' ? 'badge-red' : 'badge-yellow'}`}>{inspection.status}</span>
            <button onClick={handleDownloadPDF} className="btn-secondary"><Download className="w-4 h-4" /> PDF</button>
          </div>
        </div>
      </header>

      <div className="flex flex-col lg:flex-row h-[calc(100vh-73px)]">
        {/* Left Panel */}
        <div className="w-full lg:w-[350px] border-r border-white/10 p-4 overflow-y-auto">
          <div className="card mb-4">
            <div className="flex items-center gap-2 mb-4"><User className="w-5 h-5 text-[#ec4899]" /><h3 className="font-semibold text-sm">Cliente</h3></div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <InfoRow label="Nombre" value={inspection.client_name} />
              <InfoRow label="Documento" value={inspection.client_id} />
              <InfoRow label="Teléfono" value={inspection.client_phone} />
              <InfoRow label="Email" value={inspection.client_email} />
            </div>
            {(inspection.client_id_front_image || inspection.client_id_back_image) && (
              <div className="mt-4 pt-4 border-t border-white/10 flex gap-2">
                {inspection.client_id_front_image && <img src={inspection.client_id_front_image} className="w-20 h-14 object-cover rounded cursor-pointer" onClick={() => setModalImage(inspection.client_id_front_image!)} />}
                {inspection.client_id_back_image && <img src={inspection.client_id_back_image} className="w-20 h-14 object-cover rounded cursor-pointer" onClick={() => setModalImage(inspection.client_id_back_image!)} />}
              </div>
            )}
          </div>

          <div className="card mb-4">
            <div className="flex items-center gap-2 mb-4"><Car className="w-5 h-5 text-[#ec4899]" /><h3 className="font-semibold text-sm">Vehículo</h3></div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <InfoRow label="Placa" value={inspection.vehicle_plate} />
              <InfoRow label="VIN" value={inspection.vehicle_vin} />
              <InfoRow label="Marca" value={inspection.vehicle_brand} />
              <InfoRow label="Modelo" value={inspection.vehicle_model} />
              <InfoRow label="Año" value={inspection.vehicle_year} />
              <InfoRow label="Color" value={inspection.vehicle_color} />
              <InfoRow label="Km" value={inspection.vehicle_mileage?.toLocaleString()} />
            </div>
          </div>

          <div className="card mb-4">
            <div className="flex items-center gap-2 mb-4"><MapPin className="w-5 h-5 text-[#ec4899]" /><h3 className="font-semibold text-sm">Accidente</h3></div>
            <div className="space-y-2 text-sm">
              <InfoRow label="Tipo" value={inspection.accident_type} />
              <InfoRow label="Ubicación" value={inspection.accident_location} />
              <div className="flex gap-2 pt-2">
                <span className={`badge ${inspection.police_present ? 'badge-green' : 'badge-gray'}`}>{inspection.police_present ? '✓ Policía' : 'Sin policía'}</span>
                <span className={`badge ${inspection.has_witnesses ? 'badge-green' : 'badge-gray'}`}>{inspection.has_witnesses ? '✓ Testigos' : 'Sin testigos'}</span>
              </div>
            </div>
          </div>

          {consent?.signature_url && (
            <div className="card">
              <div className="flex items-center gap-2 mb-3"><PenTool className="w-5 h-5 text-[#ec4899]" /><h3 className="font-semibold text-sm">Firma</h3></div>
              <img src={consent.signature_url} className="w-full h-20 object-contain bg-white rounded cursor-pointer" onClick={() => setModalImage(consent.signature_url!)} />
              <p className="text-xs text-gray-500 mt-2">{format(new Date(consent.timestamp), 'dd/MM/yyyy HH:mm')}</p>
            </div>
          )}
        </div>

        {/* Center Panel */}
        <div className="flex-1 p-4 overflow-y-auto">
          <div className="flex gap-2 mb-4">
            <button className={`tab text-sm ${activeTab === 'photos' ? 'active' : ''}`} onClick={() => setActiveTab('photos')}><Camera className="w-4 h-4" /> Fotos ({allPhotos.length})</button>
            <button className={`tab text-sm ${activeTab === 'damages' ? 'active' : ''}`} onClick={() => setActiveTab('damages')}><AlertTriangle className="w-4 h-4" /> Daños ({damages.length})</button>
            {inspection.has_third_party && <button className={`tab text-sm ${activeTab === 'third_party' ? 'active' : ''}`} onClick={() => setActiveTab('third_party')}><Users className="w-4 h-4" /> Tercero</button>}
          </div>

          {activeTab === 'photos' && (
            <div className="card">
              <div className="aspect-video bg-[#0a0a12] rounded-lg mb-4 flex items-center justify-center border border-white/10 overflow-hidden cursor-pointer"
                   onClick={() => allPhotos[selectedPhoto]?.image_url && setModalImage(allPhotos[selectedPhoto].image_url!)}>
                {allPhotos[selectedPhoto]?.image_url ? <img src={allPhotos[selectedPhoto].image_url!} className="w-full h-full object-contain" /> : <p className="text-gray-500">Sin fotos</p>}
              </div>
              {allPhotos[selectedPhoto] && <p className="text-sm text-center mb-4">{allPhotos[selectedPhoto].label || allPhotos[selectedPhoto].angle}</p>}
              <div className="grid grid-cols-6 gap-2 mb-4">
                {allPhotos.map((p, i) => (
                  <div key={p.id} className={`aspect-square rounded overflow-hidden cursor-pointer border-2 ${selectedPhoto === i ? 'border-[#ec4899]' : 'border-transparent'}`} onClick={() => setSelectedPhoto(i)}>
                    {p.image_url ? <img src={p.image_url} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-white/5 flex items-center justify-center text-xs">{i+1}</div>}
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <button className="btn-secondary flex-1" onClick={() => setSelectedPhoto(Math.max(0, selectedPhoto-1))} disabled={selectedPhoto === 0}><ChevronLeft className="w-4 h-4" /></button>
                <button className="btn-secondary flex-1" onClick={() => setSelectedPhoto(Math.min(allPhotos.length-1, selectedPhoto+1))} disabled={selectedPhoto >= allPhotos.length-1}><ChevronRight className="w-4 h-4" /></button>
              </div>
            </div>
          )}

          {activeTab === 'damages' && (
            <div className="card">
              {damages.length > 0 ? damages.map(d => (
                <div key={d.id} className="flex items-center justify-between py-3 border-b border-white/5">
                  <div>
                    <div className="flex items-center gap-2"><span className="font-medium text-sm">{d.part}</span><span className={`badge ${getSeverityClass(d.severity)}`}>{d.severity}</span></div>
                    <p className="text-xs text-gray-400">{d.type} • IA: {d.confidence}%</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => toggleDamage(d.id, true)} className={`p-2 rounded ${d.approved === true ? 'bg-green-500/20 text-green-400' : 'bg-white/5'}`}><CheckCircle className="w-4 h-4" /></button>
                    <button onClick={() => toggleDamage(d.id, false)} className={`p-2 rounded ${d.approved === false ? 'bg-red-500/20 text-red-400' : 'bg-white/5'}`}><XCircle className="w-4 h-4" /></button>
                  </div>
                </div>
              )) : <p className="text-center text-gray-500 py-6">Sin daños detectados</p>}
            </div>
          )}

          {activeTab === 'third_party' && inspection.has_third_party && (
            <div className="space-y-4">
              <div className="card">
                <h3 className="font-semibold mb-4 text-sm">Tercero</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <InfoRow label="Nombre" value={inspection.third_party_name} />
                  <InfoRow label="Documento" value={inspection.third_party_id} />
                  <InfoRow label="Teléfono" value={inspection.third_party_phone} />
                  <InfoRow label="Placa" value={inspection.third_party_vehicle_plate} />
                  <InfoRow label="Vehículo" value={`${inspection.third_party_vehicle_brand} ${inspection.third_party_vehicle_model}`} />
                </div>
              </div>
              {thirdPartyPhotos.length > 0 && (
                <div className="card">
                  <h3 className="font-semibold mb-4 text-sm">Fotos del Tercero</h3>
                  <div className="grid grid-cols-4 gap-2">
                    {thirdPartyPhotos.map(p => p.image_url && <img key={p.id} src={p.image_url} className="aspect-square object-cover rounded cursor-pointer" onClick={() => setModalImage(p.image_url!)} />)}
                  </div>
                </div>
              )}
            </div>
          )}

          {inspection.client_comments && (
            <div className="card mt-4">
              <div className="flex items-center gap-2 mb-3"><MessageSquare className="w-5 h-5" /><h3 className="font-semibold">Comentarios</h3></div>
              <p className="text-sm text-gray-300">{inspection.client_comments}</p>
            </div>
          )}
        </div>

        {/* Right Panel */}
        <div className="w-full lg:w-[280px] border-l border-white/10 p-4 overflow-y-auto">
          <div className="card mb-4">
            <h3 className="font-semibold mb-3 text-sm">Notas</h3>
            <textarea className="input min-h-[100px] resize-none" placeholder="Notas de revisión..." value={reviewNotes} onChange={e => setReviewNotes(e.target.value)} />
          </div>

          <div className="card mb-4">
            <h3 className="font-semibold mb-3 text-sm">Resumen</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-400">Fotos</span><span>{allPhotos.length}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Daños</span><span>{damages.length}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Firma</span><span className={consent?.signature_url ? 'text-green-400' : 'text-red-400'}>{consent?.signature_url ? '✓' : '✗'}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Tercero</span><span>{inspection.has_third_party ? 'Sí' : 'No'}</span></div>
            </div>
          </div>

          <div className="card">
            <h3 className="font-semibold mb-3 text-sm">Decisión</h3>
            <div className="space-y-2">
              <button onClick={() => handleAction('Aprobada')} disabled={saving} className="btn-success w-full justify-center">{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />} Aprobar</button>
              <button onClick={() => handleAction('Reinspección')} disabled={saving} className="btn-warning w-full justify-center">{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <AlertTriangle className="w-4 h-4" />} Reinspección</button>
              <button onClick={() => handleAction('Rechazada')} disabled={saving} className="btn-danger w-full justify-center">{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />} Rechazar</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
