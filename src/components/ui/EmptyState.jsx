'use client';

import React from 'react';
import Link from 'next/link';
import Button from './Button';

export const EmptyState = ({
  icon,
  title = 'No items found',
  description = 'There are no records to display at this moment.',
  actionLabel,
  onAction,
  actionHref,
  className = '',
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center p-8 sm:p-12 border border-dashed border-[#E7E3D9] dark:border-[#292524] rounded-xl bg-[#FBF9F6] dark:bg-[#161413] max-w-lg mx-auto my-6 ${className}`}
    >
      <div className="w-14 h-14 rounded-full bg-[#F4F1EA] dark:bg-[#252220] border border-[#E7E3D9] dark:border-[#292524] flex items-center justify-center text-[#B08D57] mb-4 shadow-[0_2px_8px_rgba(28,25,23,0.04)]">
        {icon || (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.5"
              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
            />
          </svg>
        )}
      </div>

      <h3 className="font-serif text-lg font-medium text-[#1C1917] dark:text-[#FAF8F5] mb-1.5 tracking-tight">
        {title}
      </h3>

      <p className="text-xs text-[#78716C] dark:text-[#A8A29E] max-w-sm mb-6 leading-relaxed">
        {description}
      </p>

      {actionLabel && (
        actionHref ? (
          <Link href={actionHref}>
            <Button variant="primary" size="md">
              {actionLabel}
            </Button>
          </Link>
        ) : (
          <Button variant="primary" size="md" onClick={onAction}>
            {actionLabel}
          </Button>
        )
      )}
    </div>
  );
};

export default EmptyState;
