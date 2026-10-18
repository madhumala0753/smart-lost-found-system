import React from 'react';
import { Search, ShieldCheck } from 'lucide-react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'light' | 'dark';
}

export const Logo: React.FC<LogoProps> = ({ className = '', size = 'md', variant = 'light' }) => {
  const iconSizes = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-12 h-12',
  };

  const textSizes = {
    sm: 'text-base',
    md: 'text-xl',
    lg: 'text-2xl',
  };

  const subTextSizes = {
    sm: 'text-[10px]',
    md: 'text-xs',
    lg: 'text-sm',
  };

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* Emblem: Magnifying glass nested inside protective campus vault shield */}
      <div className={`relative flex items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 via-indigo-600 to-teal-500 shadow-sm text-white ${iconSizes[size]}`}>
        <ShieldCheck className="w-3/5 h-3/5" />
        <div className="absolute -bottom-1 -right-1 bg-white dark:bg-slate-900 rounded-full p-0.5 shadow-xs">
          <Search className="w-3 h-3 text-blue-600" />
        </div>
      </div>

      <div className="flex flex-col leading-tight">
        <span className={`font-bold tracking-tight ${textSizes[size]} ${variant === 'dark' ? 'text-white' : 'text-slate-900'}`}>
          Campus<span className="text-teal-500">Vault</span>
        </span>
        <span className={`font-medium tracking-wide uppercase ${subTextSizes[size]} ${variant === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
          Smart Lost & Found
        </span>
      </div>
    </div>
  );
};
