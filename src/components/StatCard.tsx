import React from 'react';
import Card from './Card';
import { cn } from '../utils/cn';

type Tone = 'yellow' | 'green' | 'red' | 'blue';

const toneMap: Record<Tone, { ring: string; bg: string; text: string }> = {
  yellow: { ring: 'rgba(var(--yellow)/0.28)', bg: 'rgba(var(--yellow)/0.10)', text: 'rgb(var(--yellow))' },
  green: { ring: 'rgba(var(--green)/0.24)', bg: 'rgba(var(--green)/0.10)', text: 'rgb(var(--green))' },
  red: { ring: 'rgba(var(--red)/0.22)', bg: 'rgba(var(--red)/0.10)', text: 'rgb(var(--red))' },
  blue: { ring: 'rgba(var(--blue)/0.24)', bg: 'rgba(var(--blue)/0.10)', text: 'rgb(var(--blue))' },
};

export default function StatCard({
  title,
  value,
  subtitle,
  icon,
  tone = 'blue',
}:{
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  tone?: Tone;
}) {
  const t = toneMap[tone];
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm text-[rgb(var(--muted))]">{title}</p>
          <p className="mt-1 text-4xl font-semibold tracking-tight text-[rgb(var(--fg))]">{value}</p>
          {subtitle && <p className="mt-2 text-xs text-[rgb(var(--muted-2))]">{subtitle}</p>}
        </div>
        <div
          className={cn('h-12 w-12 rounded-2xl flex items-center justify-center')}
          style={{ background: t.bg, boxShadow: `0 0 0 6px ${t.ring}` }}
        >
          <div style={{ color: t.text }}>{icon}</div>
        </div>
      </div>
    </Card>
  );
}
