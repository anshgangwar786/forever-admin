'use client';

import React from 'react';

/**
 * Per-option price adjustments, e.g. Size = "XL" → +20 or Size = "S" → −10.
 * The storefront and checkout price a selection as: base price + adjustments, then the product discount.
 *
 * prices: [{ attribute, value, priceDelta }]
 */
const VariantPriceEditor = ({ attributes = [], prices = [], onChange, basePrice = 0, currency = '$' }) => {
  const usableAttributes = attributes.filter((a) => a.name?.trim() && a.values?.length > 0);
  if (usableAttributes.length === 0) return null;

  const base = Number(basePrice) || 0;
  const deltaFor = (attribute, value) =>
    prices.find((p) => p.attribute === attribute && p.value === value)?.priceDelta ?? '';

  const setDelta = (attribute, value, raw) => {
    const rest = prices.filter((p) => !(p.attribute === attribute && p.value === value));
    const num = raw === '' || raw === '-' ? null : Number(raw);
    onChange(num === null || !Number.isFinite(num) || num === 0 ? rest : [...rest, { attribute, value, priceDelta: num }]);
  };

  return (
    <div className="space-y-3">
      <p className="text-[11px] text-[#78716C] dark:text-[#A8A29E]">
        Optional. Add or subtract from the base price for specific options (e.g. XL +20). Leave blank to use the base price.
      </p>
      {usableAttributes.map((attr) => {
        const name = attr.name.trim();
        return (
          <div key={name} className="space-y-1.5">
            <span className="block text-[10px] font-semibold uppercase tracking-wider text-[#78716C] dark:text-[#A8A29E]">
              {name}
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {attr.values.map((value) => {
                const delta = deltaFor(name, value);
                const final = base + (Number(delta) || 0);
                return (
                  <label key={value} className="flex items-center gap-2 text-xs">
                    <span className="min-w-20 font-medium text-[#1C1917] dark:text-[#FAF8F5] truncate" title={value}>{value}</span>
                    <span className="text-[#78716C]">±{currency}</span>
                    <input
                      type="number"
                      step="0.01"
                      inputMode="decimal"
                      value={delta}
                      onChange={(e) => setDelta(name, value, e.target.value)}
                      placeholder="0"
                      aria-label={`Price adjustment for ${name} ${value}`}
                      className="w-20 px-2 py-1 bg-white dark:bg-[#1C1917] border border-[#E7E3D9] dark:border-[#292524] rounded-md text-xs text-[#1C1917] dark:text-[#FAF8F5] focus:border-[#B08D57] outline-none"
                    />
                    <span className={`text-[11px] ${final < 0 ? 'text-[#8E2824] font-semibold' : 'text-[#78716C]'}`}>
                      = {currency}{Math.round(final * 100) / 100}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default VariantPriceEditor;
