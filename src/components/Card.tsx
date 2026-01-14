import React from 'react';
import { cn } from '../utils/cn';

export default function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn(
      'rounded-[var(--radius)] border border-[rgb(var(--border))] bg-[rgb(var(--card))] shadow-[0_10px_30px_rgba(var(--shadow)/0.06)]',
      'dark:shadow-[0_10px_30px_rgba(0,0,0,0.35)]',
      className
    )}>
      {children}
    </div>
  );
}
