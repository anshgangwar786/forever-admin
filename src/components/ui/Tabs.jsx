'use client';

import React from 'react';

export const Tabs = ({
  tabs = [], // [{ id: string, label: string, count?: number, icon?: ReactNode }]
  activeTab,
  onChange,
  variant = 'underline', // 'underline' | 'pill'
  className = '',
}) => {
  return (
    <div
      role="tablist"
      className={`flex items-center gap-1 border-b border-[#E7E3D9] dark:border-[#292524] ${
        variant === 'pill' ? 'border-b-0 p-1 bg-[#F4F1EA] dark:bg-[#161413] rounded-lg inline-flex' : ''
      } ${className}`}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;

        if (variant === 'pill') {
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              type="button"
              onClick={() => onChange(tab.id)}
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer ${
                isActive
                  ? 'bg-white dark:bg-[#292524] text-[#1C1917] dark:text-[#FAF8F5] shadow-xs'
                  : 'text-[#78716C] dark:text-[#A8A29E] hover:text-[#1C1917] dark:hover:text-[#FAF8F5]'
              }`}
            >
              {tab.icon && <span className="w-3.5 h-3.5">{tab.icon}</span>}
              <span>{tab.label}</span>
              {typeof tab.count === 'number' && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-medium ${
                    isActive
                      ? 'bg-[#1C1917] text-white dark:bg-[#FAF8F5] dark:text-[#1C1917]'
                      : 'bg-[#E7E3D9] text-[#78716C] dark:bg-[#292524] dark:text-[#A8A29E]'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        }

        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all cursor-pointer -mb-px ${
              isActive
                ? 'border-[#B08D57] text-[#1C1917] dark:text-[#FAF8F5]'
                : 'border-transparent text-[#78716C] dark:text-[#A8A29E] hover:text-[#1C1917] dark:hover:text-[#FAF8F5] hover:border-[#DCD7CC]'
            }`}
          >
            {tab.icon && <span className="w-4 h-4">{tab.icon}</span>}
            <span>{tab.label}</span>
            {typeof tab.count === 'number' && (
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  isActive
                    ? 'bg-[#F7F3EB] text-[#B08D57] dark:bg-[#2C2318] dark:text-[#B08D57]'
                    : 'bg-[#F4F1EA] text-[#78716C] dark:bg-[#292524] dark:text-[#A8A29E]'
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

export default Tabs;
