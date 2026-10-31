'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  RefreshCw, 
  Plus, 
  Download, 
  Calendar, 
  ChevronDown, 
  Check, 
  Clock, 
} from 'lucide-react';
import { Button, Badge } from '../ui';

const DATE_OPTIONS = [
  { id: 'today', label: 'Today' },
  { id: '7days', label: 'Last 7 days' },
  { id: '30days', label: 'Last 30 days' },
  { id: 'quarter', label: 'This Quarter (90d)' },
  { id: 'custom', label: 'Custom Range' },
];

export default function DashboardHeader({
  dateRange,
  setDateRange,
  customDates,
  setCustomDates,
  compareWithPrevious,
  setCompareWithPrevious,
  lastSyncTime,
  onRefresh,
  isRefreshing,
  onExport,
}) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [tempStart, setTempStart] = useState(customDates.start || '');
  const [tempEnd, setTempEnd] = useState(customDates.end || '');

  const activeLabel = DATE_OPTIONS.find((opt) => opt.id === dateRange)?.label || 'Select Date';

  const handleSelectOption = (id) => {
    if (id === 'custom') {
      setShowCustomModal(true);
    } else {
      setDateRange(id);
    }
    setDropdownOpen(false);
  };

  const applyCustomDates = () => {
    if (tempStart && tempEnd) {
      setCustomDates({ start: tempStart, end: tempEnd });
      setDateRange('custom');
      setShowCustomModal(false);
    }
  };

  const formatLastSync = (time) => {
    if (!time) return 'Never';
    const d = new Date(time);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <div className="bg-white dark:bg-[#1C1917] rounded-xl border border-[#E7E3D9] dark:border-[#292524] p-5 shadow-[0_1px_3px_rgba(28,25,23,0.04)] transition-all">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        {/* Left: Title & Live Sync Indicator */}
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-serif text-2xl sm:text-3xl font-normal tracking-tight text-[#1C1917] dark:text-[#FAF8F5]">
              Sales &amp; Mission Overview
            </h1>
            <Badge variant="accent" size="sm">
              <span className="w-1.5 h-1.5 rounded-full bg-[#B08D57] animate-pulse"></span>
              Live Sync
            </Badge>
          </div>
          <div className="flex items-center gap-2 mt-1.5 text-xs text-[#78716C] dark:text-[#A8A29E]">
            <Clock className="w-3.5 h-3.5 text-[#A8A29E]" />
            <span>
              Last sync: <strong className="font-medium text-[#1C1917] dark:text-[#FAF8F5]">{formatLastSync(lastSyncTime)}</strong>
            </span>
            <span className="text-[#DCD7CC] dark:text-[#44403C]">&bull;</span>
            <span>Real-time boutique metrics &amp; fulfillment stream</span>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Refresh Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={isRefreshing}
            icon={
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-[#1C1917] dark:text-white' : 'text-[#78716C] dark:text-[#A8A29E]'}`} />
            }
          >
            {isRefreshing ? 'Syncing...' : 'Refresh'}
          </Button>

          {/* Export Report Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={onExport}
            icon={<Download className="w-3.5 h-3.5 text-[#78716C] dark:text-[#A8A29E]" />}
          >
            Export CSV
          </Button>

          {/* Add Product Link */}
          <Link href="/add">
            <Button
              variant="primary"
              size="sm"
              icon={<Plus className="w-3.5 h-3.5" />}
            >
              Add Product
            </Button>
          </Link>
        </div>
      </div>

      {/* Secondary Bar: Filters and Comparative Period Toggle */}
      <div className="mt-4 pt-4 border-t border-[#E7E3D9] dark:border-[#292524] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {/* Date Filter Dropdown */}
        <div className="relative">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-wider font-medium text-[#78716C] dark:text-[#A8A29E]">Range:</span>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="inline-flex items-center justify-between gap-2 px-3 py-1.5 text-xs font-medium text-[#1C1917] dark:text-[#FAF8F5] bg-[#FAF8F5] dark:bg-[#161413] hover:bg-[#F4F1EA] dark:hover:bg-[#252220] border border-[#E7E3D9] dark:border-[#292524] rounded-md transition shadow-2xs min-w-[160px] cursor-pointer"
            >
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#78716C] dark:text-[#A8A29E]" />
                <span>
                  {dateRange === 'custom' && customDates.start
                    ? `${customDates.start} → ${customDates.end}`
                    : activeLabel}
                </span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-[#78716C] dark:text-[#A8A29E]" />
            </button>
          </div>

          {dropdownOpen && (
            <div className="absolute left-0 mt-2 w-52 bg-white dark:bg-[#1C1917] rounded-lg shadow-xl border border-[#E7E3D9] dark:border-[#292524] py-1.5 z-40 animate-fadeIn">
              {DATE_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => handleSelectOption(opt.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2 text-xs text-left cursor-pointer transition ${
                    dateRange === opt.id
                      ? 'bg-[#F7F3EB] dark:bg-[#2C2318] text-[#1C1917] dark:text-[#FAF8F5] font-semibold'
                      : 'text-[#44403C] dark:text-[#D6D3D1] hover:bg-[#FAF8F5] dark:hover:bg-[#252220]'
                  }`}
                >
                  <span>{opt.label}</span>
                  {dateRange === opt.id && <Check className="w-3.5 h-3.5 text-[#B08D57]" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Previous Period Toggle */}
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={compareWithPrevious}
              onChange={(e) => setCompareWithPrevious(e.target.checked)}
              className="sr-only peer"
            />
            <div className="relative w-9 h-5 bg-[#E7E3D9] dark:bg-[#292524] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#B08D57]"></div>
            <span className="text-xs font-medium text-[#44403C] dark:text-[#D6D3D1]">
              Compare with previous period
            </span>
          </label>
        </div>
      </div>

      {/* Custom Date Range Modal */}
      {showCustomModal && (
        <div className="fixed inset-0 z-50 bg-[#1C1917]/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1C1917] rounded-xl shadow-2xl border border-[#E7E3D9] dark:border-[#292524] p-6 max-w-sm w-full space-y-4">
            <h3 className="font-serif text-lg font-medium text-[#1C1917] dark:text-[#FAF8F5]">Custom Date Filter</h3>
            <p className="text-xs text-[#78716C] dark:text-[#A8A29E]">
              Select custom start and end dates to filter your analytics.
            </p>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[#44403C] uppercase tracking-wider mb-1">Start Date</label>
                <input
                  type="date"
                  value={tempStart}
                  onChange={(e) => setTempStart(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-[#E7E3D9] rounded-md focus:border-[#B08D57] outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#44403C] uppercase tracking-wider mb-1">End Date</label>
                <input
                  type="date"
                  value={tempEnd}
                  onChange={(e) => setTempEnd(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-[#E7E3D9] rounded-md focus:border-[#B08D57] outline-none"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-3 border-t border-[#E7E3D9]">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowCustomModal(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={applyCustomDates}
                disabled={!tempStart || !tempEnd}
              >
                Apply Range
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
