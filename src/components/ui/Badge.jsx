'use client';

import React from 'react';

export const Badge = ({
  children,
  variant = 'default', // 'default' | 'accent' | 'success' | 'warning' | 'danger' | 'info' | 'outline' | 'neutral'
  size = 'md', // 'sm' | 'md'
  dot = false,
  className = '',
  ...props
}) => {
  const variantStyles = {
    default:
      'bg-[#1C1917] text-[#FAF8F5] border border-[#1C1917] dark:bg-[#FAF8F5] dark:text-[#1C1917]',
    accent:
      'bg-[#F7F3EB] text-[#B08D57] border border-[#B08D57]/30 dark:bg-amber-950/40 dark:text-[#D4AF37] dark:border-amber-800/50',
    success:
      'bg-[#EBF3EC] text-[#2E5A36] border border-[#C2D9C6] dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/60',
    warning:
      'bg-[#FAF2E6] text-[#8C581E] border border-[#EAD7BA] dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800/60',
    danger:
      'bg-[#FAECEB] text-[#8E2824] border border-[#E8C4C2] dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900/60',
    info:
      'bg-[#EBF2F8] text-[#2A4B6B] border border-[#BFD3E6] dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900/60',
    neutral:
      'bg-gray-100 text-gray-700 border border-gray-200 dark:bg-neutral-800 dark:text-neutral-300 dark:border-neutral-700',
    outline:
      'bg-transparent text-[#1C1917] border border-[#E7E3D9] dark:text-neutral-300 dark:border-neutral-700',
  };

  const dotColors = {
    default: 'bg-white dark:bg-neutral-900',
    accent: 'bg-[#B08D57]',
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    danger: 'bg-rose-500',
    info: 'bg-blue-500',
    neutral: 'bg-gray-400',
    outline: 'bg-gray-400',
  };

  const sizeStyles = {
    sm: 'text-[10px] font-medium px-2 py-0.5 rounded-full',
    md: 'text-xs font-medium px-2.5 py-0.5 rounded-full',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 transition-colors ${
        sizeStyles[size] || sizeStyles.md
      } ${variantStyles[variant] || variantStyles.default} ${className}`}
      {...props}
    >
      {dot && (
        <span
          className={`w-1.5 h-1.5 rounded-full shrink-0 ${
            dotColors[variant] || 'bg-current'
          }`}
        />
      )}
      <span>{children}</span>
    </span>
  );
};

export default Badge;
