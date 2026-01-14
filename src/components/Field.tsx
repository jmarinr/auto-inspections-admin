import React from 'react';
import { cn } from '../utils/cn';

export function Input(props: React.InputHTMLAttributes<HTMLInputElement> & { className?: string }) {
  const { className, ...rest } = props;
  return (
    <input
      className={cn(
        'w-full rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 py-2.5 text-sm text-[rgb(var(--fg))]',
        'placeholder:text-[rgb(var(--muted-2))] focus:border-[rgba(var(--ring)/0.65)]',
        className
      )}
      {...rest}
    />
  );
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement> & { className?: string }) {
  const { className, children, ...rest } = props;
  return (
    <select
      className={cn(
        'w-full appearance-none rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 py-2.5 text-sm text-[rgb(var(--fg))]',
        'focus:border-[rgba(var(--ring)/0.65)]',
        className
      )}
      {...rest}
    >
      {children}
    </select>
  );
}
