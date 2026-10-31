'use client';

import React from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  ShoppingBag, 
  Receipt, 
  Percent, 
  Users 
} from 'lucide-react';

/**
 * Reusable Mini Sparkline Component (Responsive & Contained)
 */
function Sparkline({ data = [20, 25, 22, 30, 28, 35, 42], height = 32, isPositive = true }) {
  if (!data || data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const svgWidth = 100;
  
  // Internal padding so lines and strokes never bleed outside SVG boundaries
  const padX = 2;
  const padY = 3;
  const usableWidth = svgWidth - padX * 2;
  const usableHeight = height - padY * 2;
  
  const points = data.map((val, idx) => {
    const x = padX + (idx / (data.length - 1)) * usableWidth;
    const y = padY + usableHeight - ((val - min) / range) * usableHeight;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  const pathD = `M ${points.join(' L ')}`;
  const areaD = `M ${points[0]} L ${points.join(' L ')} L ${svgWidth - padX},${height} L ${padX},${height} Z`;

  const strokeColor = isPositive ? '#B08D57' : '#8E2824';
  const gradId = `sparkline-grad-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <svg 
      viewBox={`0 0 ${svgWidth} ${height}`} 
      className="w-16 sm:w-20 md:w-24 h-7 sm:h-8 overflow-hidden block shrink-0"
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={strokeColor} stopOpacity="0.25" />
          <stop offset="100%" stopColor={strokeColor} stopOpacity="0.0" />
        </linearGradient>
      </defs>
      <path d={areaD} fill={`url(#${gradId})`} />
      <path d={pathD} fill="none" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/**
 * Luxury Trend Badge
 */
function TrendBadge({ change = 0 }) {
  const isPositive = change > 0;
  const isNegative = change < 0;
  const formattedVal = Math.abs(change).toFixed(1);

  if (isPositive) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-xs text-[11px] font-medium bg-[#EBF3EC] text-[#2E5A36] border border-[#C2D9C6]">
        <TrendingUp className="w-3 h-3 text-[#2E5A36]" />
        +{formattedVal}%
      </span>
    );
  }

  if (isNegative) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-xs text-[11px] font-medium bg-[#FAECEB] text-[#8E2824] border border-[#E8C4C2]">
        <TrendingDown className="w-3 h-3 text-[#8E2824]" />
        -{formattedVal}%
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-xs text-[11px] font-medium bg-[#FAF8F5] text-[#78716C] border border-[#E7E3D9]">
      0.0%
    </span>
  );
}

export default function KpiCardsSection({
  currency = '$',
  metrics = {},
  compareWithPrevious = true,
}) {
  const {
    totalRevenue = 0,
    prevRevenue = 0,
    revenueChange = 0,
    revenueSparkline = [30, 42, 38, 55, 48, 62, 70],

    totalOrders = 0,
    prevOrders = 0,
    ordersChange = 0,
    pendingOrders = 0,
    processingOrders = 0,
    deliveredOrders = 0,

    aov = 0,
    prevAov = 0,
    aovChange = 0,
    aovSparkline = [85, 88, 92, 90, 94, 98, 102],

    conversionRate = 3.65,
    prevConversionRate = 3.1,
    conversionChange = 0,
    totalVisits = 0,

    totalUsers = 0,
    newUsers = 0,
    returningUsers = 0,
  } = metrics;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3.5 sm:gap-4">
      {/* 1. Total Revenue */}
      <div className="bg-white rounded-xl border border-[#E7E3D9] p-4 sm:p-5 shadow-[0_1px_3px_rgba(28,25,23,0.04)] flex flex-col justify-between overflow-hidden min-w-0 hover:shadow-[0_4px_16px_-2px_rgba(28,25,23,0.06)] transition-shadow">
        <div className="min-w-0">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#78716C] truncate">
              Gross Revenue
            </span>
            <div className="p-1.5 sm:p-2 bg-[#FAF8F5] border border-[#E7E3D9] rounded-lg text-[#B08D57] shrink-0">
              <DollarSign className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2 min-w-0">
            <p className="font-serif text-xl sm:text-2xl font-normal tracking-tight text-[#1C1917] truncate">
              {currency}{totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
          <div className="mt-2.5 flex items-center justify-between gap-1.5 min-w-0 overflow-hidden">
            <div className="shrink-0">
              <TrendBadge change={revenueChange} />
            </div>
            <div className="shrink-0 overflow-hidden flex items-center justify-end">
              <Sparkline data={revenueSparkline} isPositive={revenueChange >= 0} />
            </div>
          </div>
        </div>
        {compareWithPrevious && (
          <div className="mt-3.5 pt-3 border-t border-[#E7E3D9] text-[11px] text-[#78716C] flex justify-between items-center gap-1 min-w-0">
            <span className="truncate">vs. prev:</span>
            <span className="font-medium text-[#1C1917] shrink-0">
              {currency}{prevRevenue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </span>
          </div>
        )}
      </div>

      {/* 2. Total Orders */}
      <div className="bg-white rounded-xl border border-[#E7E3D9] p-4 sm:p-5 shadow-[0_1px_3px_rgba(28,25,23,0.04)] flex flex-col justify-between overflow-hidden min-w-0 hover:shadow-[0_4px_16px_-2px_rgba(28,25,23,0.06)] transition-shadow">
        <div className="min-w-0">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#78716C] truncate">
              Total Orders
            </span>
            <div className="p-1.5 sm:p-2 bg-[#FAF8F5] border border-[#E7E3D9] rounded-lg text-[#1C1917] shrink-0">
              <ShoppingBag className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2 min-w-0">
            <p className="font-serif text-xl sm:text-2xl font-normal tracking-tight text-[#1C1917] truncate">
              {totalOrders.toLocaleString()}
            </p>
            <div className="shrink-0">
              <TrendBadge change={ordersChange} />
            </div>
          </div>

          <div className="mt-3 flex items-center gap-1 sm:gap-1.5 flex-wrap min-w-0">
            <span className="inline-flex items-center px-1.5 sm:px-2 py-0.5 rounded-xs text-[10px] font-medium bg-[#FAF2E6] text-[#8C581E] border border-[#EAD7BA] shrink-0">
              {pendingOrders} Pending
            </span>
            <span className="inline-flex items-center px-1.5 sm:px-2 py-0.5 rounded-xs text-[10px] font-medium bg-[#EBF2F8] text-[#2A4B6B] border border-[#BFD3E6] shrink-0">
              {processingOrders} Proc
            </span>
            <span className="inline-flex items-center px-1.5 sm:px-2 py-0.5 rounded-xs text-[10px] font-medium bg-[#EBF3EC] text-[#2E5A36] border border-[#C2D9C6] shrink-0">
              {deliveredOrders} Deliv
            </span>
          </div>
        </div>
        {compareWithPrevious && (
          <div className="mt-3.5 pt-3 border-t border-[#E7E3D9] text-[11px] text-[#78716C] flex justify-between items-center gap-1 min-w-0">
            <span className="truncate">Prev period:</span>
            <span className="font-medium text-[#1C1917] shrink-0">{prevOrders} orders</span>
          </div>
        )}
      </div>

      {/* 3. Average Order Value (AOV) */}
      <div className="bg-white rounded-xl border border-[#E7E3D9] p-4 sm:p-5 shadow-[0_1px_3px_rgba(28,25,23,0.04)] flex flex-col justify-between overflow-hidden min-w-0 hover:shadow-[0_4px_16px_-2px_rgba(28,25,23,0.06)] transition-shadow">
        <div className="min-w-0">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#78716C] truncate">
              Average Order Value
            </span>
            <div className="p-1.5 sm:p-2 bg-[#FAF8F5] border border-[#E7E3D9] rounded-lg text-[#B08D57] shrink-0">
              <Receipt className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2 min-w-0">
            <p className="font-serif text-xl sm:text-2xl font-normal tracking-tight text-[#1C1917] truncate">
              {currency}{aov.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
            </p>
          </div>
          <div className="mt-2.5 flex items-center justify-between gap-1.5 min-w-0 overflow-hidden">
            <div className="shrink-0">
              <TrendBadge change={aovChange} />
            </div>
            <div className="shrink-0 overflow-hidden flex items-center justify-end">
              <Sparkline data={aovSparkline} isPositive={aovChange >= 0} />
            </div>
          </div>
        </div>
        {compareWithPrevious && (
          <div className="mt-3.5 pt-3 border-t border-[#E7E3D9] text-[11px] text-[#78716C] flex justify-between items-center gap-1 min-w-0">
            <span className="truncate">Prev AOV:</span>
            <span className="font-medium text-[#1C1917] shrink-0">
              {currency}{prevAov.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
            </span>
          </div>
        )}
      </div>

      {/* 4. Conversion Rate */}
      <div className="bg-white rounded-xl border border-[#E7E3D9] p-4 sm:p-5 shadow-[0_1px_3px_rgba(28,25,23,0.04)] flex flex-col justify-between overflow-hidden min-w-0 hover:shadow-[0_4px_16px_-2px_rgba(28,25,23,0.06)] transition-shadow">
        <div className="min-w-0">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#78716C] truncate">
              Conversion Rate
            </span>
            <div className="p-1.5 sm:p-2 bg-[#FAF8F5] border border-[#E7E3D9] rounded-lg text-[#1C1917] shrink-0">
              <Percent className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2 min-w-0">
            <p className="font-serif text-xl sm:text-2xl font-normal tracking-tight text-[#1C1917] truncate">
              {conversionRate.toFixed(2)}%
            </p>
            <div className="shrink-0">
              <TrendBadge change={conversionChange} />
            </div>
          </div>
          <p className="mt-3 text-[11px] text-[#78716C] truncate">
            From <span className="font-medium text-[#1C1917]">{totalVisits.toLocaleString()}</span> boutique visits
          </p>
        </div>
        {compareWithPrevious && (
          <div className="mt-3.5 pt-3 border-t border-[#E7E3D9] text-[11px] text-[#78716C] flex justify-between items-center gap-1 min-w-0">
            <span className="truncate">Prev rate:</span>
            <span className="font-medium text-[#1C1917] shrink-0">{prevConversionRate.toFixed(2)}%</span>
          </div>
        )}
      </div>

      {/* 5. Registered Customers */}
      <div className="bg-white rounded-xl border border-[#E7E3D9] p-4 sm:p-5 shadow-[0_1px_3px_rgba(28,25,23,0.04)] flex flex-col justify-between overflow-hidden min-w-0 hover:shadow-[0_4px_16px_-2px_rgba(28,25,23,0.06)] transition-shadow">
        <div className="min-w-0">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#78716C] truncate">
              Curated Clients
            </span>
            <div className="p-1.5 sm:p-2 bg-[#FAF8F5] border border-[#E7E3D9] rounded-lg text-[#B08D57] shrink-0">
              <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2 min-w-0">
            <p className="font-serif text-xl sm:text-2xl font-normal tracking-tight text-[#1C1917] truncate">
              {totalUsers.toLocaleString()}
            </p>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs gap-1 min-w-0">
            <div className="flex items-center gap-1 truncate">
              <span className="w-2 h-2 rounded-full bg-[#B08D57] shrink-0"></span>
              <span className="text-[#78716C] text-[11px]">New:</span>
              <span className="font-semibold text-[#1C1917]">{newUsers}</span>
            </div>
            <div className="flex items-center gap-1 truncate">
              <span className="w-2 h-2 rounded-full bg-[#1C1917] shrink-0"></span>
              <span className="text-[#78716C] text-[11px]">Returning:</span>
              <span className="font-semibold text-[#1C1917]">{returningUsers}</span>
            </div>
          </div>
        </div>
        <div className="mt-3.5 pt-3 border-t border-[#E7E3D9]">
          <div className="w-full bg-[#F4F1EA] h-1.5 rounded-full overflow-hidden flex">
            <div 
              className="bg-[#B08D57] h-full transition-all" 
              style={{ width: `${totalUsers > 0 ? (newUsers / totalUsers) * 100 : 50}%` }}
              title={`New clients: ${newUsers}`}
            />
            <div 
              className="bg-[#1C1917] h-full transition-all" 
              style={{ width: `${totalUsers > 0 ? (returningUsers / totalUsers) * 100 : 50}%` }}
              title={`Returning clients: ${returningUsers}`}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
