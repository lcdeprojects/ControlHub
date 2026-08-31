import React from 'react';
import { cn } from '@/lib/utils';

interface ProgressBarProps {
  value: number; // 0 to 100
  className?: string;
  indicatorClassName?: string;
  showLabel?: boolean;
}

export function ProgressBar({
  value,
  className,
  indicatorClassName,
  showLabel = false,
}: ProgressBarProps) {
  const clamped = Math.min(Math.max(value, 0), 100);

  let defaultColor = 'bg-blue-500';
  if (clamped >= 100) defaultColor = 'bg-rose-500';
  else if (clamped >= 85) defaultColor = 'bg-amber-500';
  else if (clamped >= 60) defaultColor = 'bg-blue-500';
  else defaultColor = 'bg-emerald-500';

  return (
    <div className="w-full">
      <div className={cn('w-full h-2.5 bg-slate-800 rounded-full overflow-hidden', className)}>
        <div
          className={cn('h-full transition-all duration-500 rounded-full', indicatorClassName || defaultColor)}
          style={{ width: `${clamped}%` }}
        />
      </div>
      {showLabel && (
        <div className="flex justify-between items-center mt-1 text-xs text-slate-400 font-medium">
          <span>Progresso</span>
          <span>{clamped.toFixed(0)}%</span>
        </div>
      )}
    </div>
  );
}
