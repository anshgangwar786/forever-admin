'use client';

import React, { useState } from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight, SlidersHorizontal } from 'lucide-react';
import { Skeleton } from './Skeleton';
import { EmptyState } from './EmptyState';

export const DataTable = ({
  columns = [],
  data = [],
  keyField = 'id',
  isLoading = false,
  emptyMessage = 'No records found',
  emptyDescription = 'Try adjusting your filters or search criteria.',
  selectable = false,
  selectedKeys = [],
  onSelectRow,
  onSelectAll,
  sortColumn,
  sortDirection,
  onSort,
  pagination = null, // { page, totalPages, totalItems, pageSize, onPageChange }
  headerActions = null,
  className = '',
}) => {
  const [density, setDensity] = useState('default'); // 'compact' | 'default'

  const isAllSelected = data.length > 0 && selectedKeys.length === data.length;
  const isPartiallySelected = selectedKeys.length > 0 && selectedKeys.length < data.length;

  const paddingClass = density === 'compact' ? 'py-2 px-3 text-xs' : 'py-3.5 px-4 text-sm';
  const headerPaddingClass = density === 'compact' ? 'py-2.5 px-3 text-xs' : 'py-3 px-4 text-xs';

  return (
    <div className={`w-full bg-white dark:bg-[#1C1917] border border-[#E7E3D9] dark:border-[#292524] rounded-xl overflow-hidden shadow-xs flex flex-col ${className}`}>
      {/* Table Toolbar */}
      <div className="px-4 py-3 border-b border-[#E7E3D9] dark:border-[#292524] flex items-center justify-between gap-4 bg-[#FAF8F5]/50 dark:bg-[#161413]">
        <div className="flex items-center gap-2 text-xs text-[#78716C] dark:text-[#A8A29E]">
          {selectable && selectedKeys.length > 0 && (
            <span className="font-medium text-[#1C1917] dark:text-[#FAF8F5] bg-[#F4F1EA] dark:bg-[#292524] px-2.5 py-1 rounded-md">
              {selectedKeys.length} selected
            </span>
          )}
          {pagination ? (
            <span>Showing {data.length} of {pagination.totalItems ?? data.length} records</span>
          ) : (
            <span>{data.length} records</span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {headerActions}
          {/* Density toggle button */}
          <button
            type="button"
            onClick={() => setDensity(density === 'compact' ? 'default' : 'compact')}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-md border transition-colors cursor-pointer ${
              density === 'compact'
                ? 'bg-[#1C1917] text-white border-[#1C1917] dark:bg-[#FAF8F5] dark:text-[#1C1917]'
                : 'bg-white dark:bg-[#1C1917] text-[#78716C] dark:text-[#A8A29E] border-[#E7E3D9] dark:border-[#292524] hover:border-[#B08D57]'
            }`}
            title="Toggle compact/spacious view density"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{density === 'compact' ? 'Compact' : 'Default'}</span>
          </button>
        </div>
      </div>

      {/* Table Container with Sticky Header */}
      <div className="overflow-x-auto relative min-h-[160px]">
        <table className="w-full text-left border-collapse">
          <thead className="bg-[#FAF8F5] dark:bg-[#161413] text-[#78716C] dark:text-[#A8A29E] font-medium border-b border-[#E7E3D9] dark:border-[#292524] sticky top-0 z-10">
            <tr>
              {selectable && (
                <th className={`w-10 ${headerPaddingClass}`}>
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = isPartiallySelected;
                    }}
                    onChange={(e) => onSelectAll?.(e.target.checked)}
                    className="w-4 h-4 rounded border-[#E7E3D9] text-[#B08D57] focus:ring-[#B08D57]/30 cursor-pointer"
                  />
                </th>
              )}
              {columns.map((col) => {
                const isSorted = sortColumn === col.key;
                return (
                  <th
                    key={col.key}
                    scope="col"
                    className={`${headerPaddingClass} ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'} ${col.className || ''}`}
                  >
                    {col.sortable ? (
                      <button
                        type="button"
                        onClick={() => onSort?.(col.key)}
                        className="inline-flex items-center gap-1 font-medium hover:text-[#1C1917] dark:hover:text-[#FAF8F5] transition-colors cursor-pointer"
                      >
                        <span>{col.label}</span>
                        {isSorted ? (
                          sortDirection === 'asc' ? (
                            <ArrowUp className="w-3.5 h-3.5 text-[#B08D57]" />
                          ) : (
                            <ArrowDown className="w-3.5 h-3.5 text-[#B08D57]" />
                          )
                        ) : (
                          <ArrowUpDown className="w-3 h-3 opacity-40 hover:opacity-100" />
                        )}
                      </button>
                    ) : (
                      <span>{col.label}</span>
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E7E3D9]/60 dark:divide-[#292524]/60 bg-white dark:bg-[#1C1917]">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {selectable && (
                    <td className={paddingClass}>
                      <Skeleton className="w-4 h-4 rounded" />
                    </td>
                  )}
                  {columns.map((col) => (
                    <td key={col.key} className={paddingClass}>
                      <Skeleton className="h-4 w-3/4 rounded" />
                    </td>
                  ))}
                </tr>
              ))
            ) : data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (selectable ? 1 : 0)}
                  className="py-12 text-center"
                >
                  <EmptyState
                    title={emptyMessage}
                    description={emptyDescription}
                  />
                </td>
              </tr>
            ) : (
              data.map((row, index) => {
                const key = row[keyField] ?? index;
                const isSelected = selectedKeys.includes(key);

                return (
                  <tr
                    key={key}
                    className={`transition-colors hover:bg-[#FAF8F5]/80 dark:hover:bg-[#252220] ${
                      isSelected ? 'bg-[#F7F3EB]/60 dark:bg-[#2C2318]/40' : ''
                    }`}
                  >
                    {selectable && (
                      <td className={paddingClass}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => onSelectRow?.(key, e.target.checked)}
                          className="w-4 h-4 rounded border-[#E7E3D9] text-[#B08D57] focus:ring-[#B08D57]/30 cursor-pointer"
                        />
                      </td>
                    )}
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className={`${paddingClass} ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'} text-[#1C1917] dark:text-[#FAF8F5]`}
                      >
                        {col.render ? col.render(row[col.key], row, index) : row[col.key]}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {pagination && (
        <div className="px-4 py-3 border-t border-[#E7E3D9] dark:border-[#292524] bg-[#FAF8F5]/40 dark:bg-[#161413] flex items-center justify-between text-xs text-[#78716C] dark:text-[#A8A29E]">
          <div>
            Page <span className="font-medium text-[#1C1917] dark:text-[#FAF8F5]">{pagination.page}</span> of{' '}
            <span className="font-medium text-[#1C1917] dark:text-[#FAF8F5]">{pagination.totalPages || 1}</span>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={pagination.page <= 1}
              onClick={() => pagination.onPageChange?.(pagination.page - 1)}
              className="p-1.5 rounded-md border border-[#E7E3D9] dark:border-[#292524] hover:bg-[#F4F1EA] dark:hover:bg-[#292524] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              aria-label="Previous page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              disabled={pagination.page >= (pagination.totalPages || 1)}
              onClick={() => pagination.onPageChange?.(pagination.page + 1)}
              className="p-1.5 rounded-md border border-[#E7E3D9] dark:border-[#292524] hover:bg-[#F4F1EA] dark:hover:bg-[#292524] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              aria-label="Next page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataTable;
