import React, { createContext, useContext, useMemo, useState } from 'react';

export type Lang = 'es' | 'en';

type Dictionary = Record<string, { es: string; en: string }>;

const dict: Dictionary = {
  appName: { es: 'HenkanCX', en: 'HenkanCX' },
  triage: { es: 'Panel de Triage', en: 'Triage Console' },
  dashboard: { es: 'Dashboard', en: 'Dashboard' },
  inspections: { es: 'Inspecciones', en: 'Inspections' },
  search: { es: 'Buscar…', en: 'Search…' },
  filters: { es: 'Filtros', en: 'Filters' },
  status: { es: 'Estado', en: 'Status' },
  priority: { es: 'Prioridad', en: 'Priority' },
  policyType: { es: 'Tipo de póliza', en: 'Policy type' },
  policyStatus: { es: 'Estado de póliza', en: 'Policy status' },
  clear: { es: 'Limpiar', en: 'Clear' },
  view: { es: 'Ver', en: 'View' },
  pendingCases: { es: 'Casos pendientes', en: 'Pending cases' },
  inReview: { es: 'En revisión', en: 'In review' },
  approved: { es: 'Aprobadas', en: 'Approved' },
  rejected: { es: 'Rechazadas', en: 'Rejected' },
  reinspections: { es: 'Reinspecciones', en: 'Re-inspections' },
  reports: { es: 'Reportes', en: 'Reports' },
  newInspection: { es: 'Crear inspección', en: 'New inspection' },
  darkMode: { es: 'Oscuro', en: 'Dark' },
  lightMode: { es: 'Claro', en: 'Light' },
  language: { es: 'Idioma', en: 'Language' },
  lastUpdated: { es: 'Actualizado', en: 'Updated' },
  created: { es: 'Creada', en: 'Created' },
  plate: { es: 'Placa', en: 'Plate' },
  client: { es: 'Cliente', en: 'Customer' },
  vehicle: { es: 'Vehículo', en: 'Vehicle' },
  actions: { es: 'Acciones', en: 'Actions' },
  loading: { es: 'Cargando…', en: 'Loading…' },
  noResults: { es: 'No hay resultados.', en: 'No results.' },
};

type LangCtx = {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: keyof typeof dict) => string;
};

const LanguageContext = createContext<LangCtx | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    const saved = localStorage.getItem('hk_admin_lang');
    return (saved === 'en' || saved === 'es') ? saved : 'es';
  });

  const api = useMemo<LangCtx>(() => ({
    lang,
    setLang: (l) => {
      setLangState(l);
      localStorage.setItem('hk_admin_lang', l);
    },
    t: (key) => dict[key][lang],
  }), [lang]);

  return <LanguageContext.Provider value={api}>{children}</LanguageContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useI18n must be used inside LanguageProvider');
  return ctx;
}
