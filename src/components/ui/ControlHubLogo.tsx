'use client';

import React from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface ControlHubLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
}

export function ControlHubLogo({
  size = 'md',
  showText = true,
  className,
}: ControlHubLogoProps) {
  const sizeMap = {
    sm: { box: 'w-7 h-7 rounded-lg', text: 'text-sm', sub: 'text-[9px]' },
    md: { box: 'w-10 h-10 rounded-xl', text: 'text-lg', sub: 'text-xs' },
    lg: { box: 'w-12 h-12 rounded-xl', text: 'text-xl', sub: 'text-xs' },
    xl: { box: 'w-16 h-16 rounded-2xl', text: 'text-3xl', sub: 'text-sm' },
  };

  const currentSize = sizeMap[size];

  return (
    <div className={cn('flex items-center gap-3 group select-none cursor-pointer', className)}>
      {/* Icon Emblem Frame with Subtle Metallic Border & Glow */}
      <div className={cn(
        'relative overflow-hidden shadow-xl shadow-emerald-500/10 ring-1 ring-emerald-500/30 group-hover:ring-cyan-400/50 group-hover:shadow-cyan-500/20 group-hover:scale-105 transition-all duration-300 bg-slate-950 flex items-center justify-center p-0.5',
        currentSize.box
      )}>
        <Image
          src="/logo.png"
          alt="ControlHub Logo"
          width={128}
          height={128}
          className="w-full h-full object-cover rounded-[10px]"
          priority
        />
      </div>

      {showText && (
        <div className="flex flex-col">
          <span className={cn('font-black tracking-tight flex items-center', currentSize.text)}>
            <span className="text-white">Control</span>
            <span className="bg-gradient-to-r from-cyan-400 via-emerald-400 to-teal-300 bg-clip-text text-transparent ml-0.5">
              Hub
            </span>
          </span>
          <span className={cn('text-slate-400 font-medium tracking-wide -mt-0.5', currentSize.sub)}>
            Gestão Financeira Pro
          </span>
        </div>
      )}
    </div>
  );
}
