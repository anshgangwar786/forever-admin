'use client';

import React, { forwardRef } from 'react';

export const Input = forwardRef(function Input(
  {
    label,
    error,
    hint,
    leftIcon,
    rightIcon,
    required = false,
    className = '',
    containerClassName = '',
    id,
    type = 'text',
    ...props
  },
  ref
) {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className={`w-full flex flex-col gap-1.5 ${containerClassName}`}>
      {label && (
        <label
          htmlFor={inputId}
          className="text-xs font-medium text-gray-700 dark:text-neutral-300 flex items-center justify-between"
        >
          <span>
            {label}
            {required && <span className="text-[#8E2824] ml-1">*</span>}
          </span>
        </label>
      )}

      <div className="relative flex items-center">
        {leftIcon && (
          <span className="absolute left-3 text-gray-400 dark:text-neutral-500 pointer-events-none flex items-center">
            {leftIcon}
          </span>
        )}

        <input
          ref={ref}
          id={inputId}
          type={type}
          required={required}
          className={`w-full px-3.5 py-2 text-sm bg-white dark:bg-[#1C1917] text-[#1C1917] dark:text-[#FAF8F5] placeholder-gray-400 dark:placeholder-neutral-500 border border-[#E7E3D9] dark:border-neutral-800 rounded-lg transition-all duration-150 outline-none focus:border-[#B08D57] focus:ring-1 focus:ring-[#B08D57]/30 disabled:bg-[#F4F1EA] dark:disabled:bg-neutral-900 disabled:cursor-not-allowed ${
            leftIcon ? 'pl-9' : ''
          } ${rightIcon ? 'pr-9' : ''} ${
            error ? 'border-[#8E2824] focus:border-[#8E2824] focus:ring-[#8E2824]/30' : ''
          } ${className}`}
          {...props}
        />

        {rightIcon && (
          <span className="absolute right-3 text-gray-400 dark:text-neutral-500 flex items-center">
            {rightIcon}
          </span>
        )}
      </div>

      {error && <p className="text-xs text-[#8E2824] dark:text-rose-400">{error}</p>}
      {hint && !error && <p className="text-[11px] text-gray-500 dark:text-neutral-400">{hint}</p>}
    </div>
  );
});

export default Input;
