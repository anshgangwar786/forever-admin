'use client';

import React from 'react';

/**
 * Lets the admin link each attribute value (e.g. Color = "Silver Gray") to one product image,
 * so the storefront swaps the photo when a shopper picks that option.
 *
 * images: [{ ref, src, label }] — ref is an existing image URL or "upload:<slot>" for a file not yet uploaded
 * links:  [{ attribute, value, image }] — image is one of the refs above
 */
const VariantImagePicker = ({ attributes = [], images = [], links = [], onChange }) => {
  const usableAttributes = attributes.filter((a) => a.name?.trim() && a.values?.length > 0);
  if (usableAttributes.length === 0 || images.length === 0) return null;

  const imageRefs = new Set(images.map((img) => img.ref));
  const linkFor = (attribute, value) =>
    links.find((l) => l.attribute === attribute && l.value === value && imageRefs.has(l.image));

  const setLink = (attribute, value, imageRef) => {
    const rest = links.filter((l) => !(l.attribute === attribute && l.value === value));
    onChange(imageRef ? [...rest, { attribute, value, image: imageRef }] : rest);
  };

  return (
    <div className="space-y-3">
      <p className="text-[11px] text-[#78716C] dark:text-[#A8A29E]">
        Pick which photo the storefront shows when a shopper selects each option. Leave blank to keep the current photo.
      </p>
      {usableAttributes.map((attr) => (
        <div key={attr.name} className="space-y-1.5">
          <span className="block text-[10px] font-semibold uppercase tracking-wider text-[#78716C] dark:text-[#A8A29E]">
            {attr.name.trim()}
          </span>
          {attr.values.map((value) => {
            const current = linkFor(attr.name.trim(), value);
            return (
              <div key={value} className="flex items-center gap-2 flex-wrap">
                <span className="min-w-24 text-xs font-medium text-[#1C1917] dark:text-[#FAF8F5]">{value}</span>
                <button
                  type="button"
                  onClick={() => setLink(attr.name.trim(), value, null)}
                  className={`h-10 px-2 rounded-md border text-[10px] font-medium cursor-pointer transition ${
                    !current
                      ? 'border-[#B08D57] bg-[#F7F3EB] text-[#1C1917] dark:bg-[#252220] dark:text-[#FAF8F5]'
                      : 'border-[#E7E3D9] dark:border-[#292524] text-[#78716C] hover:border-[#B08D57]'
                  }`}
                >
                  None
                </button>
                {images.map((img) => {
                  const selected = current?.image === img.ref;
                  return (
                    <button
                      type="button"
                      key={img.ref}
                      title={img.label}
                      onClick={() => setLink(attr.name.trim(), value, img.ref)}
                      className={`w-10 h-10 rounded-md overflow-hidden border-2 cursor-pointer transition ${
                        selected ? 'border-[#B08D57] ring-2 ring-[#B08D57]/30' : 'border-transparent opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img src={img.src} alt={img.label} className="w-full h-full object-cover" />
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
};

export default VariantImagePicker;
