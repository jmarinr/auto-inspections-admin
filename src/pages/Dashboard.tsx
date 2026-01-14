import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Clock, CheckCircle2, RotateCcw, Eye } from 'lucide-react';
import { formatDistanceToNowStrict } from 'date-fns';
import { es as esLocale, enUS as enLocale } from 'date-fns/locale';

import { getInspections, type Inspection } from '../lib/supabase';
import AppShell from '../components/AppShell';
import StatCard from '../components/StatCard';
import Card from '../components/Card';
import Button from '../components/Button';
import Badge from '../components/Badge';
import { Input, Select } from '../components/Field';
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

function priorityFromRisk(risk: number) {
  if (risk >= 80) return 'high';
  if (risk >= 50) return 'medium';
  return 'low';
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { t, lang } = useI18n();

  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | Inspection['status']>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [policyTypeFilter, setPolicyTypeFilter] = useState<'all' | Inspection['policy_type']>('all');
  const [policyStatusFilter, setPolicyStatusFilter] = useState<'all' | Inspection['policy_status']>('all');

  useEffect(() => { loadInspections(); }, []);

  const loadInspections = async () => {
    setLoading(true);
    try {
      const data = await getInspections();
      setInspections(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const filteredInspections = useMemo(() => {
    return inspections.filter((ins) => {
      const matchesSearch =
        searchTerm === '' ||
        ins.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (ins.client_name ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (ins.vehicle_plate ?? '').toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === 'all' || ins.status === statusFilter;

      const p = priorityFromRisk(ins.risk_score ?? 0);
      const matchesPriority = priorityFilter === 'all' || p === priorityFilter;

      const matchesPolicyType = policyTypeFilter === 'all' || ins.policy_type === policyTypeFilter;
      const matchesPolicyStatus = policyStatusFilter === 'all' || ins.policy_status === policyStatusFilter;

      return matchesSearch && matchesStatus && matchesPriority && matchesPolicyType && matchesPolicyStatus;
    });
  }, [inspections, searchTerm, statusFilter, priorityFilter, policyTypeFilter, policyStatusFilter]);

  const stats = useMemo(() => ({
    pending: inspections.filter(i => i.status === 'Pendiente').length,
    inReview: inspections.filter(i => i.status === 'En Revisión').length,
    approved: inspections.filter(i => i.status === 'Aprobada').length,
    reinspection: inspections.filter(i => i.status === 'Reinspección').length,
  }), [inspections]);

  const dfLocale = lang === 'en' ? enLocale : esLocale;

  return (
    <AppShell
      title={t('dashboard')}
      subtitle={<span>{t('triage')}</span>}
    >
      {/* KPI row */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title={t('pendingCases')}
          value={stats.pending}
          subtitle="SLA & priorización automática"
          tone="yellow"
          icon={<Clock className="h-6 w-6" />}
        />
        <StatCard
          title={t('inReview')}
          value={stats.inReview}
          subtitle="Revisión humana en curso"
          tone="blue"
          icon={<Search className="h-6 w-6" />}
        />
        <StatCard
          title={t('approved')}
          value={stats.approved}
          subtitle="Listas para cierre"
          tone="green"
          icon={<CheckCircle2 className="h-6 w-6" />}
        />
        <StatCard
          title={t('reinspections')}
          value={stats.reinspection}
          subtitle="Requieren evidencia adicional"
          tone="red"
          icon={<RotateCcw className="h-6 w-6" />}
        />
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-1 items-center gap-3">
            <div className="relative w-full max-w-xl">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[rgb(var(--muted-2))]" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={t('search')}
                className="pl-9"
              />
            </div>
            <Button variant="secondary" onClick={loadInspections}>
              {t('lastUpdated')}
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4 lg:w-[680px]">
            <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)}>
              <option value="all">{t('status')} · All</option>
              <option value="Pendiente">Pendiente</option>
              <option value="En Revisión">En Revisión</option>
              <option value="Aprobada">Aprobada</option>
              <option value="Rechazada">Rechazada</option>
              <option value="Reinspección">Reinspección</option>
            </Select>

            <Select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value as any)}>
              <option value="all">{t('priority')} · All</option>
              <option value="high">{lang === 'en' ? 'High' : 'Alta'}</option>
              <option value="medium">{lang === 'en' ? 'Medium' : 'Media'}</option>
              <option value="low">{lang === 'en' ? 'Low' : 'Baja'}</option>
            </Select>

            <Select value={policyTypeFilter} onChange={(e) => setPolicyTypeFilter(e.target.value as any)}>
              <option value="all">{t('policyType')} · All</option>
              <option value="Premium">Premium</option>
              <option value="Standard">Standard</option>
              <option value="Comprehensive">Comprehensive</option>
            </Select>

            <Select value={policyStatusFilter} onChange={(e) => setPolicyStatusFilter(e.target.value as any)}>
              <option value="all">{t('policyStatus')} · All</option>
              <option value="En-Proceso">{lang === 'en' ? 'In progress' : 'En proceso'}</option>
              <option value="Emitida">{lang === 'en' ? 'Issued' : 'Emitida'}</option>
              <option value="Rechazada">{lang === 'en' ? 'Rejected' : 'Rechazada'}</option>
              <option value="Cancelada">{lang === 'en' ? 'Cancelled' : 'Cancelada'}</option>
            </Select>
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card className="overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[rgb(var(--border))]">
          <div className="text-sm text-[rgb(var(--muted))]">
            {loading ? t('loading') : `${filteredInspections.length} ${lang === 'en' ? 'results' : 'resultados'}`}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm">{t('reports')}</Button>
            <Button variant="primary" size="sm">{t('newInspection')}</Button>
          </div>
        </div>

        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead className="bg-[rgb(var(--card-2))] text-[rgb(var(--muted))]">
              <tr>
                <th className="px-4 py-3 text-left font-medium">{t('created')}</th>
                <th className="px-4 py-3 text-left font-medium">{t('client')}</th>
                <th className="px-4 py-3 text-left font-medium">{t('vehicle')}</th>
                <th className="px-4 py-3 text-left font-medium">{t('status')}</th>
                <th className="px-4 py-3 text-left font-medium">{t('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td className="px-4 py-6 text-[rgb(var(--muted))]" colSpan={5}>{t('loading')}</td></tr>
              ) : filteredInspections.length === 0 ? (
                <tr><td className="px-4 py-6 text-[rgb(var(--muted))]" colSpan={5}>{t('noResults')}</td></tr>
              ) : (
                filteredInspections.map((ins) => {
                  const pr = priorityFromRisk(ins.risk_score ?? 0);
                  const prTone = pr === 'high' ? 'red' : pr === 'medium' ? 'yellow' : 'green';
                  const created = new Date(ins.created_at);
                  return (
                    <tr key={ins.id} className="border-t border-[rgb(var(--border))] hover:bg-[rgb(var(--card-2))]">
                      <td className="px-4 py-3 align-top">
                        <div className="font-medium text-[rgb(var(--fg))]">{created.toLocaleString(lang === 'en' ? 'en-US' : 'es-CR')}</div>
                        <div className="mt-1 text-xs text-[rgb(var(--muted-2))]">
                          {formatDistanceToNowStrict(created, { addSuffix: true, locale: dfLocale })}
                        </div>
                      </td>

                      <td className="px-4 py-3 align-top">
                        <div className="font-medium text-[rgb(var(--fg))]">{ins.client_name ?? '—'}</div>
                        <div className="mt-1 flex flex-wrap gap-2">
                          <Badge tone={prTone as any}>
                            {lang === 'en' ? 'Risk' : 'Riesgo'}: {Math.round(ins.risk_score ?? 0)} · {pr.toUpperCase()}
                          </Badge>
                          <Badge tone="blue">POL: {ins.policy_type}</Badge>
                          <Badge tone={ins.policy_status === 'Rechazada' ? 'red' : ins.policy_status === 'Emitida' ? 'green' : 'yellow'}>
                            {ins.policy_status}
                          </Badge>
                        </div>
                      </td>

                      <td className="px-4 py-3 align-top">
                        <div className="font-medium text-[rgb(var(--fg))]">{ins.vehicle_brand ?? ''} {ins.vehicle_model ?? ''}</div>
                        <div className="mt-1 text-xs text-[rgb(var(--muted-2))]">
                          {t('plate')}: {ins.vehicle_plate ?? '—'} · {ins.vehicle_year ?? '—'}
                        </div>
                      </td>

                      <td className="px-4 py-3 align-top">
                        <Badge tone={statusTone(ins.status) as any}>{ins.status}</Badge>
                      </td>

                      <td className="px-4 py-3 align-top">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => navigate(`/inspection/${ins.id}`)}
                        >
                          <Eye className="h-4 w-4" />
                          {t('view')}
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </AppShell>
  );
}
