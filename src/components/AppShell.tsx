import React from 'react';
import { LayoutDashboard, ClipboardCheck, Settings, Shield, HelpCircle } from 'lucide-react';
import { cn } from '../utils/cn';
import ThemeLangControls from './ThemeLangControls';
import { useI18n } from '../contexts/LanguageContext';

function NavItem({ active, label, icon }: { active?: boolean; label: string; icon: React.ReactNode }) {
  return (
    <button
      className={cn(
        'w-full flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm transition',
        active ? 'bg-[rgb(var(--card-2))] border border-[rgb(var(--border))] text-[rgb(var(--fg))]' : 'text-[rgb(var(--muted))] hover:bg-[rgb(var(--card-2))]'
      )}
    >
      <span className="shrink-0">{icon}</span>
      <span className="truncate">{label}</span>
    </button>
  );
}

export default function AppShell({ children, title, subtitle }:{
  children: React.ReactNode;
  title: string;
  subtitle?: React.ReactNode;
}) {
  const { t } = useI18n();

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-[1400px] px-4 py-5 lg:px-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_1fr]">
          {/* Sidebar */}
          <aside className="hidden lg:block">
            <div className="sticky top-5 space-y-4">
              <div className="rounded-[var(--radius)] border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4 shadow-[0_10px_30px_rgba(var(--shadow)/0.06)]">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-[rgb(var(--blue))] to-[rgb(var(--green))] flex items-center justify-center text-white font-bold">
                    H
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-[rgb(var(--fg))]">{t('appName')}</div>
                    <div className="text-xs text-[rgb(var(--muted))]">{t('triage')}</div>
                  </div>
                </div>
              </div>

              <div className="rounded-[var(--radius)] border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-3 shadow-[0_10px_30px_rgba(var(--shadow)/0.06)]">
                <div className="space-y-2">
                  <NavItem active label={t('dashboard')} icon={<LayoutDashboard className="h-4 w-4" />} />
                  <NavItem label={t('inspections')} icon={<ClipboardCheck className="h-4 w-4" />} />
                  <NavItem label="Security" icon={<Shield className="h-4 w-4" />} />
                  <NavItem label="Settings" icon={<Settings className="h-4 w-4" />} />
                  <NavItem label="Help" icon={<HelpCircle className="h-4 w-4" />} />
                </div>
              </div>
            </div>
          </aside>

          {/* Main */}
          <main className="min-w-0">
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <h1 className="text-xl font-semibold tracking-tight text-[rgb(var(--fg))]">{title}</h1>
                  {subtitle && <div className="mt-1 text-sm text-[rgb(var(--muted))]">{subtitle}</div>}
                </div>
                <ThemeLangControls />
              </div>

              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
