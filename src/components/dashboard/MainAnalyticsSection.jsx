'use client';

import React, { useState, useMemo } from 'react';
import { 
  CreditCard, 
} from 'lucide-react';

export default function MainAnalyticsSection({
  currency = '$',
  timeframe = 'daily',
  setTimeframe,
  chartData = [],
  paymentData = {
    razorpay: { count: 0, amount: 0, percent: 0 },
    cod: { count: 0, amount: 0, percent: 0 },
    stripe: { count: 0, amount: 0, percent: 0 },
    total: 0,
    totalAmount: 0,
  },
}) {
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [hoveredSlice, setHoveredSlice] = useState(null);

  // Fallback data if empty
  const activeChartData = useMemo(() => {
    if (chartData && chartData.length > 0) return chartData;
    return [
      { label: 'Mon', revenue: 1200, orders: 8 },
      { label: 'Tue', revenue: 1900, orders: 12 },
      { label: 'Wed', revenue: 1500, orders: 10 },
      { label: 'Thu', revenue: 2800, orders: 18 },
      { label: 'Fri', revenue: 3400, orders: 22 },
      { label: 'Sat', revenue: 4200, orders: 28 },
      { label: 'Sun', revenue: 3900, orders: 25 },
    ];
  }, [chartData]);

  // Dual-Axis Chart Math
  const maxRevenue = useMemo(() => {
    const max = Math.max(...activeChartData.map((d) => d.revenue), 100);
    return Math.ceil(max * 1.15);
  }, [activeChartData]);

  const maxOrders = useMemo(() => {
    const max = Math.max(...activeChartData.map((d) => d.orders), 5);
    return Math.ceil(max * 1.2);
  }, [activeChartData]);

  const svgWidth = 640;
  const svgHeight = 260;
  const paddingLeft = 55;
  const paddingRight = 45;
  const paddingTop = 25;
  const paddingBottom = 40;
  const plotWidth = svgWidth - paddingLeft - paddingRight;
  const plotHeight = svgHeight - paddingTop - paddingBottom;

  const points = useMemo(() => {
    return activeChartData.map((item, idx) => {
      const x = paddingLeft + (idx / Math.max(activeChartData.length - 1, 1)) * plotWidth;
      const yRev = paddingTop + plotHeight - (item.revenue / maxRevenue) * plotHeight;
      const yOrd = paddingTop + plotHeight - (item.orders / maxOrders) * plotHeight;
      const barHeight = (item.orders / maxOrders) * plotHeight;
      return {
        ...item,
        x,
        yRev,
        yOrd,
        barHeight,
        barY: paddingTop + plotHeight - barHeight,
      };
    });
  }, [activeChartData, maxRevenue, maxOrders, plotWidth, plotHeight, paddingLeft, paddingTop]);

  const linePath = useMemo(() => {
    if (points.length === 0) return '';
    return points.reduce((acc, pt, idx, arr) => {
      if (idx === 0) return `M ${pt.x},${pt.yRev}`;
      const prev = arr[idx - 1];
      const cx1 = prev.x + (pt.x - prev.x) / 2;
      const cy1 = prev.yRev;
      const cx2 = prev.x + (pt.x - prev.x) / 2;
      const cy2 = pt.yRev;
      return `${acc} C ${cx1},${cy1} ${cx2},${cy2} ${pt.x},${pt.yRev}`;
    }, '');
  }, [points]);

  const areaPath = useMemo(() => {
    if (points.length === 0) return '';
    const firstX = points[0].x;
    const lastX = points[points.length - 1].x;
    const bottomY = paddingTop + plotHeight;
    return `${linePath} L ${lastX},${bottomY} L ${firstX},${bottomY} Z`;
  }, [linePath, points, plotHeight, paddingTop]);

  const peakItem = useMemo(() => {
    if (points.length === 0) return null;
    return [...points].sort((a, b) => b.revenue - a.revenue)[0];
  }, [points]);

  // Donut Chart Math
  const donutRadius = 70;
  const donutCircumference = 2 * Math.PI * donutRadius;
  const razorpayPercent = paymentData.razorpay?.percent || 0;
  const codPercent = paymentData.cod?.percent || 0;
  
  const razorpayStroke = (razorpayPercent / 100) * donutCircumference;
  const codStroke = (codPercent / 100) * donutCircumference;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
      {/* 1. Main Dual-Axis Chart */}
      <div className="lg:col-span-8 bg-white dark:bg-[#1C1917] rounded-xl border border-[#E7E3D9] dark:border-[#292524] p-4 sm:p-5 shadow-[0_1px_3px_rgba(28,25,23,0.04)] flex flex-col justify-between overflow-hidden min-w-0">
        {/* Chart Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E7E3D9] dark:border-[#292524]">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-serif text-base font-medium text-[#1C1917] dark:text-[#FAF8F5] tracking-tight">
                Revenue &amp; Velocity Dynamics
              </h2>
              <span className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-xs bg-[#FAF8F5] dark:bg-[#252220] text-[#B08D57] border border-[#E7E3D9] dark:border-[#292524]">
                Dual-Axis
              </span>
            </div>
            <p className="text-xs text-[#78716C] dark:text-[#A8A29E] mt-0.5 font-sans">
              Champagne area curve tracks gross revenue while columns plot order count
            </p>
          </div>

          {/* Timeframe Toggles */}
          <div className="flex items-center gap-1 bg-[#FAF8F5] dark:bg-[#161413] p-1 rounded-md border border-[#E7E3D9] dark:border-[#292524] self-start sm:self-auto">
            {['daily', 'weekly', 'monthly'].map((t) => (
              <button
                key={t}
                onClick={() => setTimeframe(t)}
                className={`px-3 py-1 text-xs font-medium rounded-xs uppercase tracking-wider transition cursor-pointer ${
                  timeframe === t
                    ? 'bg-[#1C1917] text-white dark:bg-[#FAF8F5] dark:text-[#1C1917] shadow-xs'
                    : 'text-[#78716C] dark:text-[#A8A29E] hover:text-[#1C1917] dark:hover:text-[#FAF8F5]'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Legend and Highlights */}
        <div className="flex flex-wrap items-center justify-between gap-3 py-3 text-xs">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#B08D57] inline-block"></span>
              <span className="font-medium text-[#44403C]">Revenue ({currency})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-xs bg-[#1C1917] inline-block"></span>
              <span className="font-medium text-[#44403C]">Orders (Units)</span>
            </div>
          </div>
          {peakItem && (
            <div className="text-[11px] text-[#78716C] flex items-center gap-1">
              <span>Peak:</span>
              <strong className="text-[#1C1917] font-semibold">{peakItem.label}</strong>
              <span>({currency}{peakItem.revenue.toLocaleString()})</span>
            </div>
          )}
        </div>

        {/* SVG Interactive Dual-Axis Area & Bar Chart */}
        <div className="relative w-full overflow-hidden select-none">
          <svg
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            className="w-full h-auto overflow-hidden block"
            onMouseLeave={() => setHoveredIndex(null)}
          >
            <defs>
              <linearGradient id="revenueGradLuxury" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#B08D57" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#B08D57" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Background Grid Horizontal Lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
              const y = paddingTop + plotHeight * ratio;
              const revVal = Math.round(maxRevenue * (1 - ratio));
              const ordVal = Math.round(maxOrders * (1 - ratio));
              return (
                <g key={i}>
                  <line
                    x1={paddingLeft}
                    y1={y}
                    x2={svgWidth - paddingRight}
                    y2={y}
                    stroke="#F4F1EA"
                    strokeDasharray="4 4"
                    strokeWidth="1"
                  />
                  {/* Left Axis: Revenue */}
                  <text
                    x={paddingLeft - 8}
                    y={y + 3.5}
                    textAnchor="end"
                    className="text-[9px] fill-[#78716C] font-mono"
                  >
                    {currency}{revVal >= 1000 ? `${(revVal / 1000).toFixed(1)}k` : revVal}
                  </text>
                  {/* Right Axis: Orders */}
                  <text
                    x={svgWidth - paddingRight + 8}
                    y={y + 3.5}
                    textAnchor="start"
                    className="text-[9px] fill-[#A8A29E] font-mono"
                  >
                    {ordVal}
                  </text>
                </g>
              );
            })}

            {/* Orders Secondary Axis: Vertical Bars */}
            {points.map((pt, idx) => {
              const barWidth = Math.max(Math.min(plotWidth / points.length - 8, 24), 10);
              const isHovered = hoveredIndex === idx;
              return (
                <rect
                  key={`bar-${idx}`}
                  x={pt.x - barWidth / 2}
                  y={pt.barY}
                  width={barWidth}
                  height={Math.max(pt.barHeight, 2)}
                  rx="2"
                  className={`transition-all duration-200 cursor-pointer ${
                    isHovered
                      ? 'fill-[#1C1917] opacity-90'
                      : 'fill-[#1C1917] opacity-25 hover:opacity-50'
                  }`}
                  onMouseEnter={() => setHoveredIndex(idx)}
                />
              );
            })}

            {/* Revenue Primary Axis: Area Fill & Curved Line */}
            <path d={areaPath} fill="url(#revenueGradLuxury)" />
            <path
              d={linePath}
              fill="none"
              stroke="#B08D57"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Interactive Circles & Trigger Areas */}
            {points.map((pt, idx) => {
              const isHovered = hoveredIndex === idx;
              return (
                <g key={`pt-${idx}`}>
                  <rect
                    x={pt.x - plotWidth / points.length / 2}
                    y={paddingTop}
                    width={plotWidth / points.length}
                    height={plotHeight}
                    fill="transparent"
                    className="cursor-pointer"
                    onMouseEnter={() => setHoveredIndex(idx)}
                  />

                  {isHovered && (
                    <line
                      x1={pt.x}
                      y1={paddingTop}
                      x2={pt.x}
                      y2={paddingTop + plotHeight}
                      stroke="#B08D57"
                      strokeWidth="1"
                      strokeDasharray="2 2"
                    />
                  )}

                  <circle
                    cx={pt.x}
                    cy={pt.yRev}
                    r={isHovered ? 5 : 2.5}
                    className={`transition-all ${
                      isHovered
                        ? 'fill-white stroke-[#B08D57] stroke-2'
                        : 'fill-[#B08D57]'
                    }`}
                  />

                  <text
                    x={pt.x}
                    y={svgHeight - 12}
                    textAnchor="middle"
                    className={`text-[10px] ${
                      isHovered ? 'fill-[#1C1917] font-bold' : 'fill-[#78716C]'
                    }`}
                  >
                    {pt.label}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Floating Interactive Tooltip with Boundary Clamping */}
          {hoveredIndex !== null && points[hoveredIndex] && (() => {
            const leftPct = (points[hoveredIndex].x / svgWidth) * 100;
            const clampX = leftPct < 15 ? 'translate-x-0' : leftPct > 85 ? '-translate-x-full' : '-translate-x-1/2';
            return (
              <div
                className={`absolute z-20 pointer-events-none bg-[#1C1917] text-[#FAF8F5] p-2.5 rounded-md shadow-xl text-xs space-y-1 transform ${clampX} -translate-y-full transition-all duration-75 border border-[#292524]`}
                style={{
                  left: `${leftPct}%`,
                  top: `${(points[hoveredIndex].yRev / svgHeight) * 100 - 4}%`,
                }}
              >
                <p className="font-serif text-[#FAF8F5] border-b border-[#292524] pb-1 text-[11px] tracking-wide">
                  {points[hoveredIndex].label}
                </p>
                <div className="flex items-center justify-between gap-4 pt-0.5">
                  <span className="text-[#B08D57] font-medium">Revenue:</span>
                  <span className="font-bold">
                    {currency}{points[hoveredIndex].revenue.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-[#A8A29E] font-medium">Orders:</span>
                  <span className="font-bold">{points[hoveredIndex].orders} units</span>
                </div>
              </div>
            );
          })()}
        </div>
      </div>

      {/* 2. Payment Methods Donut Chart */}
      <div className="lg:col-span-4 bg-white dark:bg-[#1C1917] rounded-xl border border-[#E7E3D9] dark:border-[#292524] p-4 sm:p-5 shadow-[0_1px_3px_rgba(28,25,23,0.04)] flex flex-col justify-between overflow-hidden min-w-0">
        <div>
          <div className="flex items-center justify-between pb-3 border-b border-[#E7E3D9] dark:border-[#292524]">
            <div>
              <h2 className="font-serif text-base font-medium text-[#1C1917] dark:text-[#FAF8F5] tracking-tight">Payment Settlement</h2>
              <p className="text-xs text-[#78716C] dark:text-[#A8A29E] mt-0.5 font-sans">Distribution by transaction channel</p>
            </div>
            <div className="p-2 bg-[#FAF8F5] dark:bg-[#252220] border border-[#E7E3D9] dark:border-[#292524] rounded-lg text-[#B08D57] shrink-0">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>

          {/* Donut SVG Presentation */}
          <div className="relative flex items-center justify-center my-4 sm:my-5 overflow-hidden">
            <svg width="160" height="160" viewBox="0 0 180 180" className="transform -rotate-90 block shrink-0">
              <circle
                cx="90"
                cy="90"
                r={donutRadius}
                fill="none"
                stroke="#F4F1EA"
                strokeWidth="16"
              />

              {/* Razorpay Arc (Online) */}
              <circle
                cx="90"
                cy="90"
                r={donutRadius}
                fill="none"
                stroke="#B08D57"
                strokeWidth="16"
                strokeDasharray={`${razorpayStroke} ${donutCircumference}`}
                strokeDashoffset="0"
                strokeLinecap="round"
                className="transition-all duration-700 cursor-pointer hover:stroke-[#967543]"
                onMouseEnter={() => setHoveredSlice('razorpay')}
                onMouseLeave={() => setHoveredSlice(null)}
              />

              {/* Cash on Delivery Arc (COD) */}
              <circle
                cx="90"
                cy="90"
                r={donutRadius}
                fill="none"
                stroke="#1C1917"
                strokeWidth="16"
                strokeDasharray={`${codStroke} ${donutCircumference}`}
                strokeDashoffset={-razorpayStroke}
                strokeLinecap="round"
                className="transition-all duration-700 cursor-pointer hover:stroke-[#292524]"
                onMouseEnter={() => setHoveredSlice('cod')}
                onMouseLeave={() => setHoveredSlice(null)}
              />
            </svg>

            {/* Donut Inner Hole Text */}
            <div className="absolute text-center select-none pointer-events-none">
              <span className="text-[10px] font-medium uppercase text-[#78716C] block tracking-wider">
                Volume
              </span>
              <span className="font-serif text-2xl font-normal text-[#1C1917] block leading-tight">
                {paymentData.total}
              </span>
              <span className="text-[11px] font-semibold text-[#B08D57] block">
                {currency}{paymentData.totalAmount ? paymentData.totalAmount.toLocaleString() : '0'}
              </span>
            </div>
          </div>
        </div>

        {/* Breakdown Items List */}
        <div className="space-y-3 pt-3 border-t border-[#E7E3D9]">
          {/* Razorpay */}
          <div
            className={`p-3 rounded-md border transition ${
              hoveredSlice === 'razorpay'
                ? 'bg-[#F7F3EB] border-[#B08D57]/40'
                : 'bg-[#FAF8F5] border-[#E7E3D9] hover:bg-[#F4F1EA]'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#B08D57]"></span>
                <span className="text-xs font-semibold text-[#1C1917]">Razorpay (Digital Gateway)</span>
              </div>
              <span className="text-xs font-bold text-[#1C1917]">{razorpayPercent}%</span>
            </div>
            <div className="mt-1 flex items-center justify-between text-[11px] text-[#78716C]">
              <span>{paymentData.razorpay?.count || 0} orders</span>
              <span className="font-medium text-[#1C1917]">
                {currency}{(paymentData.razorpay?.amount || 0).toLocaleString()}
              </span>
            </div>
          </div>

          {/* Cash on Delivery (COD) */}
          <div
            className={`p-3 rounded-md border transition ${
              hoveredSlice === 'cod'
                ? 'bg-[#F4F1EA] border-[#1C1917]/40'
                : 'bg-[#FAF8F5] border-[#E7E3D9] hover:bg-[#F4F1EA]'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#1C1917]"></span>
                <span className="text-xs font-semibold text-[#1C1917]">Cash on Delivery (Concierge)</span>
              </div>
              <span className="text-xs font-bold text-[#1C1917]">{codPercent}%</span>
            </div>
            <div className="mt-1 flex items-center justify-between text-[11px] text-[#78716C]">
              <span>{paymentData.cod?.count || 0} orders</span>
              <span className="font-medium text-[#1C1917]">
                {currency}{(paymentData.cod?.amount || 0).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
