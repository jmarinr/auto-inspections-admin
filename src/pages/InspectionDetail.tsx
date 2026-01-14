import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, CheckCircle2, XCircle, RotateCcw, Loader2, ChevronLeft, ChevronRight, Expand, X
} from 'lucide-react';

import {
  getInspectionById,
  getDamagesByInspection,
  getPhotosByInspection,
  updateDamageApproval,
  updateInspectionStatus,
  type Inspection,
  type Damage,
  type Photo,
} from '../lib/supabase';

import AppShell from '../components/AppShell';
import Card from '../components/Card';
import Button from '../components/Button';
import Badge from '../components/Badge';
import { Input } from '../components/Field';
import { useI18n } from '../contexts/LanguageContext';

function statusTone(status: Inspection['status']) {
  switch (status) {
    case 'Pendiente': return 'yellow';
    case 'En Revisión': return 'blue';
    case 'Aprobada': return 'green';
    case 'Rechazada': return 'red';
    case 'Reinspección': return 'pink';
    default: return 'gray';
  }
}

export default function InspectionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { lang } = useI18n();

  const [inspection, setInspection] = useState<Inspection | null>(null);
  const [damages, setDamages] = useState<Damage[]>([]);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [notes, setNotes] = useState('');
  const [activeTab, setActiveTab] = useState<'photos' | 'damages'>('photos');
  const [modalUrl, setModalUrl] = useState<string | null>(null);

  useEffect(() => { load(); }, [id]);

  const load = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [ins, dmg, ph] = await Promise.all([
        getInspectionById(id),
        getDamagesByInspection(id),
        getPhotosByInspection(id),
      ]);
      setInspection(ins);
      setDamages(dmg);
      setPhotos(ph);
      setSelectedIndex(0);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const mainPhoto = photos[selectedIndex]?.image_url || photos[selectedIndex]?.thumbnail_url || null;

  const groupedPhotos = useMemo(() => {
    const items = [...photos];
    items.sort((a, b) => (a.photo_type || '').localeCompare(b.photo_type || '') || (a.id).localeCompare(b.id));
    return items;
  }, [photos]);

  const setIndexSafe = (i: number) => {
    if (photos.length === 0) return;
    const next = (i + photos.length) % photos.length;
    setSelectedIndex(next);
  };

  const toggleDamage = async (damageId: string, approved: boolean) => {
    await updateDamageApproval(damageId, approved);
    setDamages(prev => prev.map(d => d.id === damageId ? { ...d, approved } : d));
  };

  const handleAction = async (status: Inspection['status']) => {
    if (!inspection) return;
    setSaving(true);
    try {
      await updateInspectionStatus(inspection.id, status, notes);
      navigate('/');
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShell
      title={lang === 'en' ? 'Inspection' : 'Inspección'}
      subtitle={
        inspection ? (
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={statusTone(inspection.status) as any}>{inspection.status}</Badge>
            <Badge tone="blue">ID: {inspection.id}</Badge>
            {inspection.vehicle_plate && <Badge tone="gray">{lang === 'en' ? 'Plate' : 'Placa'}: {inspection.vehicle_plate}</Badge>}
          </div>
        ) : undefined
      }
    >
      {/* Header actions */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button variant="ghost" onClick={() => navigate('/')} aria-label="Back">
          <ArrowLeft className="h-4 w-4" />
          {lang === 'en' ? 'Back' : 'Volver'}
        </Button>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => handleAction('Reinspección')}
            disabled={saving || loading}
          >
            <RotateCcw className="h-4 w-4" />
            {lang === 'en' ? 'Request re-inspection' : 'Pedir reinspección'}
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={() => handleAction('Rechazada')}
            disabled={saving || loading}
          >
            <XCircle className="h-4 w-4" />
            {lang === 'en' ? 'Reject' : 'Rechazar'}
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => handleAction('Aprobada')}
            disabled={saving || loading}
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            {lang === 'en' ? 'Approve' : 'Aprobar'}
          </Button>
        </div>
      </div>

      {loading ? (
        <Card className="p-6 text-[rgb(var(--muted))]">{lang === 'en' ? 'Loading…' : 'Cargando…'}</Card>
      ) : !inspection ? (
        <Card className="p-6 text-[rgb(var(--muted))]">{lang === 'en' ? 'Not found.' : 'No encontrado.'}</Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.2fr_0.8fr]">
          {/* Left: media */}
          <Card className="p-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Button
                  variant={activeTab === 'photos' ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => setActiveTab('photos')}
                >
                  {lang === 'en' ? 'Photos' : 'Fotos'}
                </Button>
                <Button
                  variant={activeTab === 'damages' ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => setActiveTab('damages')}
                >
                  {lang === 'en' ? 'Damages' : 'Daños'}
                </Button>
              </div>

              {mainPhoto && (
                <Button variant="secondary" size="sm" onClick={() => setModalUrl(mainPhoto)}>
                  <Expand className="h-4 w-4" />
                  {lang === 'en' ? 'Expand' : 'Ampliar'}
                </Button>
              )}
            </div>

            {activeTab === 'photos' && (
              <div className="mt-4">
                <div className="relative overflow-hidden rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card-2))]">
                  <div className="aspect-[16/10] w-full flex items-center justify-center">
                    {mainPhoto ? (
                      <img src={mainPhoto} alt="Inspection" className="max-h-full max-w-full object-contain" />
                    ) : (
                      <div className="text-sm text-[rgb(var(--muted))]">{lang === 'en' ? 'No photos.' : 'Sin fotos.'}</div>
                    )}
                  </div>

                  {photos.length > 1 && (
                    <>
                      <button
                        className="absolute left-3 top-1/2 -translate-y-1/2 rounded-xl border border-[rgb(var(--border))] bg-[rgba(255,255,255,0.85)] px-2 py-2 shadow-sm dark:bg-[rgba(0,0,0,0.35)]"
                        onClick={() => setIndexSafe(selectedIndex - 1)}
                        aria-label="Previous photo"
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </button>
                      <button
                        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-xl border border-[rgb(var(--border))] bg-[rgba(255,255,255,0.85)] px-2 py-2 shadow-sm dark:bg-[rgba(0,0,0,0.35)]"
                        onClick={() => setIndexSafe(selectedIndex + 1)}
                        aria-label="Next photo"
                      >
                        <ChevronRight className="h-5 w-5" />
                      </button>
                    </>
                  )}
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-5">
                  {groupedPhotos.slice(0, 20).map((p, idx) => {
                    const url = p.thumbnail_url || p.image_url;
                    const isActive = photos[selectedIndex]?.id === p.id;
                    return (
                      <button
                        key={p.id}
                        className={[
                          'overflow-hidden rounded-xl border transition',
                          isActive ? 'border-[rgba(var(--ring)/0.7)] shadow-sm' : 'border-[rgb(var(--border))] hover:bg-[rgb(var(--card-2))]'
                        ].join(' ')}
                        onClick={() => {
                          const i = photos.findIndex(pp => pp.id === p.id);
                          if (i >= 0) setSelectedIndex(i);
                        }}
                        aria-label="Select photo"
                      >
                        <div className="aspect-[4/3] bg-[rgb(var(--card-2))] flex items-center justify-center">
                          {url ? <img src={url} alt="thumb" className="h-full w-full object-cover" /> : <span className="text-xs text-[rgb(var(--muted))]">—</span>}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {activeTab === 'damages' && (
              <div className="mt-4 space-y-3">
                {damages.length === 0 ? (
                  <div className="text-sm text-[rgb(var(--muted))]">{lang === 'en' ? 'No damages detected.' : 'No se detectaron daños.'}</div>
                ) : (
                  damages.map((d) => (
                    <div key={d.id} className="rounded-2xl border border-[rgb(var(--border))] p-3">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="font-medium text-[rgb(var(--fg))]">{d.part} · {d.type}</div>
                          <div className="mt-1 flex flex-wrap gap-2">
                            <Badge tone={d.severity === 'Severo' || d.severity === 'Pérdida total' ? 'red' : d.severity === 'Moderado' ? 'yellow' : 'green'}>
                              {d.severity}
                            </Badge>
                            <Badge tone="blue">Conf: {Math.round((d.confidence ?? 0) * 100)}%</Badge>
                            {d.approved === true && <Badge tone="green">{lang === 'en' ? 'Approved' : 'Aprobado'}</Badge>}
                            {d.approved === false && <Badge tone="red">{lang === 'en' ? 'Rejected' : 'Rechazado'}</Badge>}
                          </div>
                          {d.description && <div className="mt-2 text-sm text-[rgb(var(--muted))]">{d.description}</div>}
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => toggleDamage(d.id, true)}
                          >
                            {lang === 'en' ? 'Approve' : 'Aprobar'}
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => toggleDamage(d.id, false)}
                          >
                            {lang === 'en' ? 'Reject' : 'Rechazar'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </Card>

          {/* Right: info + notes */}
          <div className="space-y-4">
            <Card className="p-4">
              <div className="text-sm font-semibold text-[rgb(var(--fg))]">{lang === 'en' ? 'Summary' : 'Resumen'}</div>
              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-2xl bg-[rgb(var(--card-2))] p-3 border border-[rgb(var(--border))]">
                  <div className="text-xs text-[rgb(var(--muted))]">{lang === 'en' ? 'Customer' : 'Cliente'}</div>
                  <div className="mt-1 font-medium">{inspection.client_name ?? '—'}</div>
                  <div className="mt-1 text-xs text-[rgb(var(--muted))]">{inspection.client_phone ?? ''}</div>
                </div>
                <div className="rounded-2xl bg-[rgb(var(--card-2))] p-3 border border-[rgb(var(--border))]">
                  <div className="text-xs text-[rgb(var(--muted))]">{lang === 'en' ? 'Vehicle' : 'Vehículo'}</div>
                  <div className="mt-1 font-medium">{inspection.vehicle_brand ?? ''} {inspection.vehicle_model ?? ''}</div>
                  <div className="mt-1 text-xs text-[rgb(var(--muted))]">{inspection.vehicle_plate ?? '—'} · {inspection.vehicle_year ?? '—'}</div>
                </div>
                <div className="rounded-2xl bg-[rgb(var(--card-2))] p-3 border border-[rgb(var(--border))]">
                  <div className="text-xs text-[rgb(var(--muted))]">{lang === 'en' ? 'Policy' : 'Póliza'}</div>
                  <div className="mt-1 font-medium">{inspection.policy_type} · {inspection.policy_status}</div>
                  <div className="mt-1 text-xs text-[rgb(var(--muted))]">{inspection.policy_number ?? '—'} · {inspection.claim_number ?? '—'}</div>
                </div>
                <div className="rounded-2xl bg-[rgb(var(--card-2))] p-3 border border-[rgb(var(--border))]">
                  <div className="text-xs text-[rgb(var(--muted))]">{lang === 'en' ? 'Scores' : 'Scores'}</div>
                  <div className="mt-1 flex flex-wrap gap-2">
                    <Badge tone={inspection.risk_score >= 80 ? 'red' : inspection.risk_score >= 50 ? 'yellow' : 'green'}>
                      Risk: {Math.round(inspection.risk_score)}
                    </Badge>
                    <Badge tone={inspection.quality_score >= 80 ? 'green' : inspection.quality_score >= 50 ? 'yellow' : 'red'}>
                      Quality: {Math.round(inspection.quality_score)}
                    </Badge>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between gap-2">
                <div className="text-sm font-semibold text-[rgb(var(--fg))]">{lang === 'en' ? 'Review notes' : 'Notas de revisión'}</div>
                <Badge tone="gray">{lang === 'en' ? 'Saved with decision' : 'Se guarda con la decisión'}</Badge>
              </div>
              <div className="mt-3">
                <Input
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={lang === 'en' ? 'Write a short note (optional)…' : 'Escribe una nota corta (opcional)…'}
                />
                <div className="mt-2 text-xs text-[rgb(var(--muted))]">
                  {lang === 'en'
                    ? 'Tip: note the reason for re-inspection or rejection for audit & training.'
                    : 'Tip: documenta el motivo de reinspección o rechazo (auditoría y entrenamiento).'}
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Simple modal */}
      {modalUrl && (
        <div className="fixed inset-0 z-50 bg-black/60 p-4" role="dialog" aria-modal="true" onClick={() => setModalUrl(null)}>
          <div className="mx-auto max-w-6xl h-full flex items-center justify-center">
            <div className="relative w-full rounded-3xl bg-[rgb(var(--card))] border border-[rgb(var(--border))] p-3" onClick={(e) => e.stopPropagation()}>
              <button
                className="absolute right-3 top-3 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card-2))] p-2"
                onClick={() => setModalUrl(null)}
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
              <div className="max-h-[80vh] overflow-auto rounded-2xl bg-[rgb(var(--card-2))] flex items-center justify-center">
                <img src={modalUrl} alt="Expanded" className="max-h-[80vh] w-auto object-contain" />
              </div>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
