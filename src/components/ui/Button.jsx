'use client';

import React, { useRef, useState } from 'react';

export const Button = ({
  children,
  variant = 'primary', // 'primary' | 'secondary' | 'accent' | 'outline' | 'ghost' | 'danger'
  size = 'md', // 'xs' | 'sm' | 'md' | 'lg' | 'icon'
  loading = false,
  disabled = false,
  className = '',
  icon,
  iconRight,
  onClick,
  type = 'button',
  ...props
}) => {
  const baseStyles =
    'relative inline-flex items-center justify-center font-medium rounded-lg transition-all duration-150 select-none cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B08D57]/40';

  const sizeStyles = {
    xs: 'px-2.5 py-1 text-xs gap-1.5',
    sm: 'px-3 py-1.5 text-xs gap-1.5',
    md: 'px-4 py-2 text-xs sm:text-sm gap-2',
    lg: 'px-6 py-2.5 text-sm sm:text-base gap-2.5',
    icon: 'p-2 rounded-lg aspect-square',
  };

  const variantStyles = {
    primary:
      'bg-[#1C1917] hover:bg-[#292524] text-[#FAF8F5] shadow-xs dark:bg-[#FAF8F5] dark:text-[#1C1917] dark:hover:bg-white',
    secondary:
      'bg-[#FAF8F5] hover:bg-[#F4F1EA] text-[#1C1917] border border-[#E7E3D9] dark:bg-[#1C1917] dark:text-[#FAF8F5] dark:border-neutral-800 dark:hover:bg-neutral-800',
    outline:
      'bg-transparent hover:bg-[#FAF8F5] text-[#1C1917] border border-[#E7E3D9] dark:text-[#FAF8F5] dark:border-neutral-800 dark:hover:bg-neutral-800',
    accent:
      'bg-[#B08D57] hover:bg-[#967543] text-white shadow-xs dark:bg-[#B08D57] dark:hover:bg-[#967543]',
    ghost:
      'bg-transparent hover:bg-[#F4F1EA] text-[#44403C] hover:text-[#1C1917] dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-white',
    danger:
      'bg-[#FAECEB] hover:bg-[#8E2824] text-[#8E2824] hover:text-white border border-[#E8C4C2] dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900/60 dark:hover:bg-rose-900',
  };

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`${baseStyles} ${sizeStyles[size] || sizeStyles.md} ${
        variantStyles[variant] || variantStyles.primary
      } ${className}`}
      {...props}
    >
      {loading && (
        <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin shrink-0" />
      )}
      {!loading && icon && <span className="shrink-0">{icon}</span>}
      {children && <span>{children}</span>}
      {!loading && iconRight && <span className="shrink-0">{iconRight}</span>}
    </button>
  );
};

export default Button;
