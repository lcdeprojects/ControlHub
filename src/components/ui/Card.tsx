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
        variant === 'glass' && 'glass-card border border-zinc-800/80 hover:border-zinc-700/80',
        variant === 'default' && 'bg-zinc-900 border border-zinc-800',
        variant === 'gradient' && 'bg-gradient-to-br from-zinc-900 via-zinc-900/90 to-rose-950/30 border border-rose-500/20',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
