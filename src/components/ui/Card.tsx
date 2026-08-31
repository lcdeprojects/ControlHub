import React from 'react';
import { cn } from '@/lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'glass' | 'gradient';
}

export function Card({ className, variant = 'glass', children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-2xl p-5 md:p-6 transition-all duration-200',
        variant === 'glass' && 'glass-card border border-slate-800/80 hover:border-slate-700/80',
        variant === 'default' && 'bg-slate-900 border border-slate-800',
        variant === 'gradient' && 'bg-gradient-to-br from-slate-900 via-slate-900/90 to-blue-950/40 border border-blue-500/20',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
