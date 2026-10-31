'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

export const PageHeader = ({
  title,
  subtitle,
  breadcrumbs = [], // [{ label: string, href?: string }]
  actions = null,
  badge = null,
  className = '',
}) => {
  return (
    <header className={`mb-6 sm:mb-8 space-y-2 ${className}`}>
      {/* Breadcrumbs */}
      {breadcrumbs.length > 0 && (
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-[#78716C] dark:text-[#A8A29E]">
          {breadcrumbs.map((crumb, idx) => (
            <React.Fragment key={idx}>
              {idx > 0 && <ChevronRight className="w-3 h-3 text-[#A8A29E] shrink-0" />}
              {crumb.href ? (
                <Link
                  href={crumb.href}
                  className="hover:text-[#1C1917] dark:hover:text-[#FAF8F5] transition-colors"
                >
                  {crumb.label}
                </Link>
              ) : (
                <span className="text-[#1C1917] dark:text-[#FAF8F5] font-medium">
                  {crumb.label}
                </span>
              )}
            </React.Fragment>
          ))}
        </nav>
      )}

      {/* Title & Actions Row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-serif text-2xl sm:text-3xl font-normal text-[#1C1917] dark:text-[#FAF8F5] tracking-tight">
              {title}
            </h1>
            {badge && <div>{badge}</div>}
          </div>
          {subtitle && (
            <p className="text-sm text-[#78716C] dark:text-[#A8A29E] mt-1 font-sans">
              {subtitle}
            </p>
          )}
        </div>

        {actions && (
          <div className="flex items-center flex-wrap gap-2.5 shrink-0">
            {actions}
          </div>
        )}
      </div>
    </header>
  );
};

export default PageHeader;
