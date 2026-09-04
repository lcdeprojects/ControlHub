'use client';

import React from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface NexumHubLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
}

export function NexumHubLogo({
  size = 'md',
  showText = true,
  className,
}: NexumHubLogoProps) {
  const sizeMap = {
    sm: { box: 'w-8 h-8 rounded-xl', text: 'text-sm', sub: 'text-[9px]' },
    md: { box: 'w-10 h-10 rounded-xl', text: 'text-lg', sub: 'text-xs' },
    lg: { box: 'w-12 h-12 rounded-2xl', text: 'text-xl', sub: 'text-xs' },
    xl: { box: 'w-16 h-16 rounded-2xl', text: 'text-3xl', sub: 'text-sm' },
  };

  const currentSize = sizeMap[size];

  return (
    <div className={cn('flex items-center gap-3 group select-none cursor-pointer', className)}>
      {/* Icon Emblem Frame with Metallic Titanium Ring */}
      <div className={cn(
        'relative overflow-hidden shadow-2xl shadow-zinc-950/80 ring-1 ring-zinc-700/60 group-hover:ring-zinc-400/80 group-hover:shadow-zinc-300/10 group-hover:scale-105 transition-all duration-300 bg-zinc-950 flex items-center justify-center p-0.5',
        currentSize.box
      )}>
        <Image
          src="/logo.png"
          alt="NexumHub Logo"
          width={128}
          height={128}
          className="w-full h-full object-cover rounded-[10px]"
          priority
        />
      </div>

      {showText && (
        <div className="flex flex-col">
          <span className={cn('font-black tracking-tight flex items-center', currentSize.text)}>
            <span className="text-white">Nexum</span>
            <span className="bg-gradient-to-r from-zinc-100 via-zinc-300 to-zinc-400 bg-clip-text text-transparent ml-0.5">
              Hub
            </span>
          </span>
          <span className={cn('text-zinc-400 font-medium tracking-wide -mt-0.5', currentSize.sub)}>
            Trading & Financial Control
          </span>
        </div>
      )}
    </div>
  );
}

export { NexumHubLogo as ControlHubLogo };
