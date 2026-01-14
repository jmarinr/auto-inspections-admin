import React from 'react';
import { cn } from '../utils/cn';

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md';
};

export default function Button({ className, variant='secondary', size='md', ...props }: Props) {
  const base = 'inline-flex items-center justify-center gap-2 rounded-xl transition active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed';
  const sizes = size === 'sm' ? 'px-3 py-2 text-sm' : 'px-4 py-2.5 text-sm font-medium';
  const variants = {
    primary: 'bg-[rgb(var(--blue))] text-white hover:opacity-95 shadow-sm',
    secondary: 'bg-[rgb(var(--card-2))] text-[rgb(var(--fg))] border border-[rgb(var(--border))] hover:bg-white/60 dark:hover:bg-black/20',
    ghost: 'bg-transparent text-[rgb(var(--fg))] hover:bg-[rgb(var(--card-2))]',
    danger: 'bg-[rgb(var(--red))] text-white hover:opacity-95 shadow-sm',
  }[variant];

  return <button className={cn(base, sizes, variants, className)} {...props} />;
}
