'use client';

import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export const Drawer = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  width = 'max-w-xl',
  className = '',
}) => {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose?.();
    };

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex justify-end overflow-hidden"
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-[#1C1917]/50 backdrop-blur-xs transition-opacity duration-300 animate-fadeIn"
      />

      {/* Drawer Panel */}
      <aside
        className={`relative w-full ${width} bg-[#FAF8F5] dark:bg-[#1C1917] border-l border-[#E7E3D9] dark:border-[#292524] shadow-2xl z-10 flex flex-col h-full transform transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${className}`}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#E7E3D9] dark:border-[#292524] flex items-center justify-between bg-white dark:bg-[#181615] shrink-0">
          <div>
            {title && (
              <h2 className="font-serif text-lg font-medium text-[#1C1917] dark:text-[#FAF8F5] tracking-tight">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="text-xs text-[#78716C] dark:text-[#A8A29E] mt-0.5 font-sans">
                {subtitle}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-[#78716C] hover:text-[#1C1917] dark:text-[#A8A29E] dark:hover:text-[#FAF8F5] hover:bg-[#F4F1EA] dark:hover:bg-[#292524] rounded-lg transition-colors cursor-pointer"
            aria-label="Close drawer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="p-4 px-6 border-t border-[#E7E3D9] dark:border-[#292524] bg-white dark:bg-[#181615] shrink-0 flex items-center justify-end gap-3">
            {footer}
          </div>
        )}
      </aside>
    </div>
  );
};

export default Drawer;
