'use client';

import React from 'react';
import Link from 'next/link';
import { 
  ShoppingBag, 
  AlertTriangle, 
  MessageSquare, 
  ShieldAlert, 
  ShieldCheck, 
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { Badge } from '../ui';

export default function NeedsAttentionSection({
  pendingOrdersCount = 0,
  lowStockCount = 0,
  pendingReviewsCount = 0,
  twoFactorEnabled = false,
}) {
  const needsAttention = pendingOrdersCount > 0 || lowStockCount > 0 || pendingReviewsCount > 0 || !twoFactorEnabled;

  if (!needsAttention) {
    return (
      <div className="bg-white dark:bg-[#1C1917] rounded-xl border border-[#E7E3D9] dark:border-[#292524] p-4 flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#EBF3EC] dark:bg-[#1A2E1F] text-[#2E5A36] dark:text-[#A3E635] rounded-lg">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-medium text-[#1C1917] dark:text-[#FAF8F5]">
              All Mission Control operations clear
            </h3>
            <p className="text-[11px] text-[#78716C] dark:text-[#A8A29E]">
              No backlogged orders, healthy stock inventory, all customer reviews reviewed.
            </p>
          </div>
        </div>
        <Badge variant="success" size="sm">Operational Normal</Badge>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-[#1C1917] rounded-xl border border-[#E7E3D9] dark:border-[#292524] p-4 sm:p-5 shadow-2xs">
      <div className="flex items-center justify-between pb-3 border-b border-[#E7E3D9] dark:border-[#292524] mb-3">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#8C581E] animate-pulse" />
          <h2 className="font-serif text-sm font-medium text-[#1C1917] dark:text-[#FAF8F5]">
            Attention Required
          </h2>
          <span className="text-[11px] text-[#78716C] dark:text-[#A8A29E]">
            Critical actions pending administrator review
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Pending Orders */}
        <Link
          href="/orders"
          className="group p-3 rounded-lg border border-[#E7E3D9] dark:border-[#292524] bg-[#FAF8F5] dark:bg-[#161413] hover:border-[#B08D57] dark:hover:border-[#B08D57] transition-all flex items-center justify-between"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 rounded-md bg-[#FAF2E6] dark:bg-[#382613] text-[#8C581E] shrink-0">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="text-xs font-semibold text-[#1C1917] dark:text-[#FAF8F5] block truncate">
                {pendingOrdersCount} Order{pendingOrdersCount === 1 ? '' : 's'} Pending
              </span>
              <span className="text-[10px] text-[#78716C] dark:text-[#A8A29E] truncate block">
                Awaiting packing &amp; dispatch
              </span>
            </div>
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-[#A8A29E] group-hover:text-[#B08D57] group-hover:translate-x-0.5 transition-all shrink-0" />
        </Link>

        {/* Low Stock Items */}
        <Link
          href="/list"
          className="group p-3 rounded-lg border border-[#E7E3D9] dark:border-[#292524] bg-[#FAF8F5] dark:bg-[#161413] hover:border-[#B08D57] dark:hover:border-[#B08D57] transition-all flex items-center justify-between"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 rounded-md bg-[#FAECEB] dark:bg-[#3D1A18] text-[#8E2824] shrink-0">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="text-xs font-semibold text-[#1C1917] dark:text-[#FAF8F5] block truncate">
                {lowStockCount} Item{lowStockCount === 1 ? '' : 's'} Low Stock
              </span>
              <span className="text-[10px] text-[#78716C] dark:text-[#A8A29E] truncate block">
                Under safety buffer (&le;15)
              </span>
            </div>
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-[#A8A29E] group-hover:text-[#B08D57] group-hover:translate-x-0.5 transition-all shrink-0" />
        </Link>

        {/* Pending Reviews */}
        <Link
          href="/reviews"
          className="group p-3 rounded-lg border border-[#E7E3D9] dark:border-[#292524] bg-[#FAF8F5] dark:bg-[#161413] hover:border-[#B08D57] dark:hover:border-[#B08D57] transition-all flex items-center justify-between"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 rounded-md bg-[#EBF2F8] dark:bg-[#1A2E3D] text-[#2A4B6B] dark:text-[#60A5FA] shrink-0">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="text-xs font-semibold text-[#1C1917] dark:text-[#FAF8F5] block truncate">
                {pendingReviewsCount} Review{pendingReviewsCount === 1 ? '' : 's'} Pending
              </span>
              <span className="text-[10px] text-[#78716C] dark:text-[#A8A29E] truncate block">
                Needs moderation before publish
              </span>
            </div>
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-[#A8A29E] group-hover:text-[#B08D57] group-hover:translate-x-0.5 transition-all shrink-0" />
        </Link>

        {/* 2FA Security status */}
        <Link
          href="/security"
          className="group p-3 rounded-lg border border-[#E7E3D9] dark:border-[#292524] bg-[#FAF8F5] dark:bg-[#161413] hover:border-[#B08D57] dark:hover:border-[#B08D57] transition-all flex items-center justify-between"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className={`p-2 rounded-md shrink-0 ${twoFactorEnabled ? 'bg-[#EBF3EC] dark:bg-[#1A2E1F] text-[#2E5A36]' : 'bg-[#FAF2E6] dark:bg-[#382613] text-[#8C581E]'}`}>
              {twoFactorEnabled ? <ShieldCheck className="w-4 h-4" /> : <ShieldAlert className="w-4 h-4" />}
            </div>
            <div className="min-w-0">
              <span className="text-xs font-semibold text-[#1C1917] dark:text-[#FAF8F5] block truncate">
                {twoFactorEnabled ? '2FA Active' : '2FA Protection Off'}
              </span>
              <span className="text-[10px] text-[#78716C] dark:text-[#A8A29E] truncate block">
                {twoFactorEnabled ? 'Account secured' : 'Recommended for directors'}
              </span>
            </div>
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-[#A8A29E] group-hover:text-[#B08D57] group-hover:translate-x-0.5 transition-all shrink-0" />
        </Link>
      </div>
    </div>
  );
}
