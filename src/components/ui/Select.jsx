'use client';

import React, { forwardRef } from 'react';

export const Select = forwardRef(function Select(
  {
    label,
    options = [],
    error,
    hint,
    required = false,
    className = '',
    containerClassName = '',
    id,
    children,
    value,
    onChange,
    ...props
  },
  ref
) {
  const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className={`w-full flex flex-col gap-1.5 ${containerClassName}`}>
      {label && (
        <label
          htmlFor={selectId}
          className="text-xs font-medium text-gray-700 dark:text-neutral-300 flex items-center justify-between"
        >
          <span>
            {label}
            {required && <span className="text-[#8E2824] ml-1">*</span>}
          </span>
        </label>
      )}

      <div className="relative flex items-center">
        <select
          ref={ref}
          id={selectId}
          value={value}
          onChange={onChange}
          required={required}
          className={`w-full appearance-none px-3.5 py-2 pr-9 text-sm bg-white dark:bg-[#1C1917] text-[#1C1917] dark:text-[#FAF8F5] border border-[#E7E3D9] dark:border-neutral-800 rounded-lg transition-all duration-150 outline-none focus:border-[#B08D57] focus:ring-1 focus:ring-[#B08D57]/30 disabled:bg-[#F4F1EA] dark:disabled:bg-neutral-900 disabled:cursor-not-allowed cursor-pointer ${
            error ? 'border-[#8E2824] focus:border-[#8E2824] focus:ring-[#8E2824]/30' : ''
          } ${className}`}
          {...props}
        >
          {children ||
            options.map((opt) => (
              <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                {opt.label}
              </option>
            ))}
        </select>

        {/* Clean Caret Icon */}
        <span className="absolute right-3 pointer-events-none text-gray-400 dark:text-neutral-500">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M19 9l-7 7-7-7" />
          </svg>
        </span>
      </div>

      {error && <p className="text-xs text-[#8E2824] dark:text-rose-400">{error}</p>}
      {hint && !error && <p className="text-[11px] text-gray-500 dark:text-neutral-400">{hint}</p>}
    </div>
  );
});

export default Select;
