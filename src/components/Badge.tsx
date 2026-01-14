import React from 'react';
import { cn } from '../utils/cn';

type Tone = 'yellow' | 'green' | 'red' | 'blue' | 'gray' | 'pink';

const tones: Record<Tone, string> = {
  yellow: 'bg-[rgba(var(--yellow)/0.14)] text-[rgb(var(--yellow))] border-[rgba(var(--yellow)/0.25)]',
  green: 'bg-[rgba(var(--green)/0.12)] text-[rgb(var(--green))] border-[rgba(var(--green)/0.22)]',
  red: 'bg-[rgba(var(--red)/0.12)] text-[rgb(var(--red))] border-[rgba(var(--red)/0.22)]',
  blue: 'bg-[rgba(var(--blue)/0.12)] text-[rgb(var(--blue))] border-[rgba(var(--blue)/0.22)]',
  pink: 'bg-[rgba(236,72,153,0.12)] text-[rgb(236,72,153)] border-[rgba(236,72,153,0.22)]',
  gray: 'bg-[rgba(100,116,139,0.14)] text-[rgb(var(--muted))] border-[rgba(100,116,139,0.25)]',
};

export default function Badge({ children, tone='gray', className }:{ children: React.ReactNode; tone?: Tone; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium', tones[tone], className)}>
      {children}
    </span>
  );
}
