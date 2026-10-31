'use client';

import React from 'react';
import Link from 'next/link';
import { 
  Package, 
  AlertTriangle, 
  Award, 
  UserCheck, 
  ExternalLink, 
  CheckCircle2, 
} from 'lucide-react';
import { Button, Badge } from '../ui';

const getImageSrc = (img) => {
  if (!img) return null;
  if (Array.isArray(img)) return getImageSrc(img[0]);
  if (typeof img === 'object' && img?.src) return img.src;
  return img;
};

export default function OperationalInsightsSection({
  currency = '$',
  orderStatusCounts = {
    pending: 0,
    processing: 0,
    shipped: 0,
    delivered: 0,
    cancelled: 0,
    returned: 0,
    total: 0,
  },
  topProducts = [],
  lowStockProducts = [],
  customerInsights = {
    newUsers: 0,
    returningUsers: 0,
    repeatRate: 0,
    avgOrdersPerUser: 1.2,
    totalUsers: 0,
  },
  onQuickRestock,
}) {
  const totalOrders = orderStatusCounts.total || 1;
  const statusItems = [
    { label: 'Pending', count: orderStatusCounts.pending, color: 'bg-[#B08D57]' },
    { label: 'Confirmed / Proc', count: orderStatusCounts.processing, color: 'bg-[#2A4B6B]' },
    { label: 'Shipped', count: orderStatusCounts.shipped, color: 'bg-[#44403C]' },
    { label: 'Delivered', count: orderStatusCounts.delivered, color: 'bg-[#2E5A36]' },
    { label: 'Cancelled', count: orderStatusCounts.cancelled, color: 'bg-[#8E2824]' },
    { label: 'Returned', count: orderStatusCounts.returned, color: 'bg-[#8C581E]' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5">
      {/* 1. Order Status Breakdown */}
      <div className="bg-white dark:bg-[#1C1917] rounded-xl border border-[#E7E3D9] dark:border-[#292524] p-4 sm:p-5 shadow-[0_1px_3px_rgba(28,25,23,0.04)] flex flex-col justify-between overflow-hidden min-w-0 hover:shadow-[0_4px_16px_-2px_rgba(28,25,23,0.06)] transition-shadow">
        <div className="min-w-0">
          <div className="flex items-center justify-between pb-3 border-b border-[#E7E3D9] dark:border-[#292524] gap-2">
            <div className="min-w-0">
              <h3 className="font-serif text-sm font-medium text-[#1C1917] dark:text-[#FAF8F5] tracking-tight truncate">Fulfillment Pipeline</h3>
              <p className="text-[11px] text-[#78716C] dark:text-[#A8A29E] truncate">Order cycle distribution</p>
            </div>
            <div className="p-1.5 bg-[#FAF8F5] dark:bg-[#252220] border border-[#E7E3D9] dark:border-[#292524] text-[#B08D57] rounded-md shrink-0">
              <Package className="w-4 h-4" />
            </div>
          </div>

          <div className="mt-4 space-y-2.5">
            {statusItems.map((item) => {
              const percent = Math.round((item.count / totalOrders) * 100);
              return (
                <div key={item.label} className="min-w-0">
                  <div className="flex justify-between text-xs mb-1 gap-1">
                    <span className="font-medium text-[#44403C] truncate">{item.label}</span>
                    <span className="text-[#78716C] font-mono text-[11px] shrink-0">
                      {item.count} ({percent}%)
                    </span>
                  </div>
                  <div className="w-full bg-[#F4F1EA] h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`${item.color} h-full rounded-full transition-all duration-500`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-[#E7E3D9] flex items-center justify-between text-xs gap-1 min-w-0">
          <span className="text-[#78716C] text-[11px] truncate">Completion Rate:</span>
          <span className="font-semibold text-[#2E5A36] shrink-0">
            {Math.round(((orderStatusCounts.delivered || 0) / totalOrders) * 100)}%
          </span>
        </div>
      </div>

      {/* 2. Top Products */}
      <div className="bg-white dark:bg-[#1C1917] rounded-xl border border-[#E7E3D9] dark:border-[#292524] p-4 sm:p-5 shadow-[0_1px_3px_rgba(28,25,23,0.04)] flex flex-col justify-between overflow-hidden min-w-0 hover:shadow-[0_4px_16px_-2px_rgba(28,25,23,0.06)] transition-shadow">
        <div className="min-w-0">
          <div className="flex items-center justify-between pb-3 border-b border-[#E7E3D9] dark:border-[#292524] gap-2">
            <div className="min-w-0">
              <h3 className="font-serif text-sm font-medium text-[#1C1917] dark:text-[#FAF8F5] tracking-tight truncate">Signature Pieces</h3>
              <p className="text-[11px] text-[#78716C] dark:text-[#A8A29E] truncate">Highest volume catalog items</p>
            </div>
            <div className="p-1.5 bg-[#FAF8F5] dark:bg-[#252220] border border-[#E7E3D9] dark:border-[#292524] text-[#B08D57] rounded-md shrink-0">
              <Award className="w-4 h-4" />
            </div>
          </div>

          <div className="mt-3 divide-y divide-[#E7E3D9] dark:divide-[#292524]">
            {topProducts.length === 0 ? (
              <p className="py-6 text-center text-xs text-[#78716C]">No sales recorded yet</p>
            ) : (
              topProducts.slice(0, 4).map((p, idx) => {
                const imgUrl = getImageSrc(p.image);
                return (
                  <div key={p._id || idx} className="py-2.5 flex items-center gap-2.5 min-w-0">
                    <div className="w-9 h-9 rounded-md bg-[#FAF8F5] border border-[#E7E3D9] overflow-hidden shrink-0 flex items-center justify-center">
                      {imgUrl ? (
                        <img src={imgUrl} alt={p.name} className="w-full h-full object-cover" />
                      ) : (
                        <Package className="w-4 h-4 text-[#A8A29E]" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-[#1C1917] truncate font-serif" title={p.name}>
                        {p.name}
                      </p>
                      <p className="text-[11px] text-[#78716C] truncate">
                        {p.unitsSold || 0} units &bull; <span className="font-medium text-[#1C1917]">{currency}{(p.revenue || 0).toLocaleString()}</span>
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-[10px] font-medium px-1.5 sm:px-2 py-0.5 rounded-xs bg-[#FAF8F5] border border-[#E7E3D9] text-[#44403C]">
                        {p.stock !== undefined ? `${p.stock} left` : 'In stock'}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <Link
          href="/list"
          className="mt-3 pt-3 border-t border-[#E7E3D9] text-[11px] font-semibold text-[#1C1917] hover:text-[#B08D57] flex items-center justify-between transition-colors min-w-0"
        >
          <span className="truncate">View Catalog Inventory</span>
          <ExternalLink className="w-3 h-3 shrink-0 ml-1" />
        </Link>
      </div>

      {/* 3. Low-Stock Alerts */}
      <div className="bg-white dark:bg-[#1C1917] rounded-xl border border-[#E7E3D9] dark:border-[#292524] p-4 sm:p-5 shadow-[0_1px_3px_rgba(28,25,23,0.04)] flex flex-col justify-between overflow-hidden min-w-0 hover:shadow-[0_4px_16px_-2px_rgba(28,25,23,0.06)] transition-shadow">
        <div className="min-w-0">
          <div className="flex items-center justify-between pb-3 border-b border-[#E7E3D9] dark:border-[#292524] gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <h3 className="font-serif text-sm font-medium text-[#1C1917] dark:text-[#FAF8F5] tracking-tight truncate">Inventory Watch</h3>
              {lowStockProducts.length > 0 && (
                <Badge variant="warning" size="sm">
                  {lowStockProducts.length} Alert{lowStockProducts.length > 1 ? 's' : ''}
                </Badge>
              )}
            </div>
            <div className="p-1.5 bg-[#FAF8F5] dark:bg-[#252220] border border-[#E7E3D9] dark:border-[#292524] text-[#8C581E] rounded-md shrink-0">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>

          <div className="mt-3 space-y-2.5">
            {lowStockProducts.length === 0 ? (
              <div className="py-8 text-center text-xs text-[#78716C] dark:text-[#A8A29E] flex flex-col items-center gap-1.5">
                <CheckCircle2 className="w-5 h-5 text-[#2E5A36]" />
                <span className="font-medium text-[#1C1917] dark:text-[#FAF8F5]">All catalog inventory healthy</span>
                <span className="text-[11px] text-[#A8A29E]">No items below threshold (&le;15)</span>
              </div>
            ) : (
              lowStockProducts.slice(0, 4).map((p, idx) => (
                <div
                  key={p._id || idx}
                  className="p-2.5 rounded-md bg-[#FAF8F5] dark:bg-[#161413] border border-[#E7E3D9] dark:border-[#292524] flex items-center justify-between gap-2 min-w-0"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-[#1C1917] dark:text-[#FAF8F5] truncate font-serif" title={p.name}>
                      {p.name}
                    </p>
                    <p className="text-[10px] text-[#78716C] dark:text-[#A8A29E] truncate">
                      {p.category} {p.subCategory ? `• ${p.subCategory}` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span
                      className={`text-[10px] font-semibold px-1.5 sm:px-2 py-0.5 rounded-xs ${
                        (p.stock || 0) <= 5
                          ? 'bg-[#FAECEB] dark:bg-[#3D1A18] text-[#8E2824] border border-[#E8C4C2] dark:border-[#522320]'
                          : 'bg-[#FAF2E6] dark:bg-[#382613] text-[#8C581E] border border-[#EAD7BA] dark:border-[#4D361D]'
                      }`}
                    >
                      {p.stock || 0} left
                    </span>
                    <button
                      onClick={() => onQuickRestock && onQuickRestock(p)}
                      className="px-2 py-1 text-[10px] uppercase tracking-wider font-semibold bg-[#1C1917] text-white dark:bg-[#FAF8F5] dark:text-[#1C1917] hover:bg-[#292524] rounded-xs transition cursor-pointer"
                    >
                      Restock
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-[#E7E3D9] dark:border-[#292524] text-[11px] text-[#78716C] dark:text-[#A8A29E] truncate">
          Alert threshold: &le; 15 units in atelier stock
        </div>
      </div>

      {/* 4. Customer Insights */}
      <div className="bg-white dark:bg-[#1C1917] rounded-xl border border-[#E7E3D9] dark:border-[#292524] p-4 sm:p-5 shadow-[0_1px_3px_rgba(28,25,23,0.04)] flex flex-col justify-between overflow-hidden min-w-0 hover:shadow-[0_4px_16px_-2px_rgba(28,25,23,0.06)] transition-shadow">
        <div className="min-w-0">
          <div className="flex items-center justify-between pb-3 border-b border-[#E7E3D9] dark:border-[#292524] gap-2">
            <div className="min-w-0">
              <h3 className="font-serif text-sm font-medium text-[#1C1917] dark:text-[#FAF8F5] tracking-tight truncate">Client Loyalty</h3>
              <p className="text-[11px] text-[#78716C] dark:text-[#A8A29E] truncate">Patron retention &amp; repeat purchases</p>
            </div>
            <div className="p-1.5 bg-[#FAF8F5] dark:bg-[#252220] border border-[#E7E3D9] dark:border-[#292524] text-[#B08D57] rounded-md shrink-0">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>

          <div className="mt-4 space-y-4">
            <div className="bg-[#FAF8F5] dark:bg-[#161413] p-3 rounded-md border border-[#E7E3D9] dark:border-[#292524]">
              <span className="text-[10px] font-medium uppercase tracking-[0.14em] text-[#78716C] block truncate">
                Repeat Patron Rate
              </span>
              <div className="mt-1 flex items-baseline justify-between gap-1">
                <span className="font-serif text-2xl font-normal text-[#1C1917]">
                  {customerInsights.repeatRate || 0}%
                </span>
                <Badge variant="success" size="sm">
                  Optimal
                </Badge>
              </div>
              <p className="text-[10px] text-[#A8A29E] mt-0.5 truncate">High-end retail benchmark: ~28-35%</p>
            </div>

            <div className="min-w-0">
              <div className="flex justify-between text-xs text-[#44403C] mb-1.5 gap-1 min-w-0">
                <span className="flex items-center gap-1.5 truncate">
                  <span className="w-2 h-2 rounded-full bg-[#B08D57] shrink-0"></span>
                  <span className="truncate">New ({customerInsights.newUsers})</span>
                </span>
                <span className="flex items-center gap-1.5 truncate">
                  <span className="w-2 h-2 rounded-full bg-[#1C1917] shrink-0"></span>
                  <span className="truncate">Returning ({customerInsights.returningUsers})</span>
                </span>
              </div>
              <div className="w-full bg-[#F4F1EA] h-1.5 rounded-full overflow-hidden flex">
                <div
                  className="bg-[#B08D57] h-full"
                  style={{
                    width: `${
                      customerInsights.totalUsers > 0
                        ? (customerInsights.newUsers / customerInsights.totalUsers) * 100
                        : 50
                    }%`,
                  }}
                />
                <div
                  className="bg-[#1C1917] h-full"
                  style={{
                    width: `${
                      customerInsights.totalUsers > 0
                        ? (customerInsights.returningUsers / customerInsights.totalUsers) * 100
                        : 50
                    }%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-[#E7E3D9] flex items-center justify-between text-xs text-[#78716C] gap-1 min-w-0">
          <span className="truncate">Avg Orders / Patron:</span>
          <span className="font-semibold text-[#1C1917] shrink-0">{customerInsights.avgOrdersPerUser} purchases</span>
        </div>
      </div>
    </div>
  );
}
