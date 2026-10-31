'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  LayoutDashboard,
  Package,
  PlusCircle,
  FolderTree,
  ShoppingBag,
  CreditCard,
  MessageSquare,
  Users,
  ShieldCheck,
  ArrowRight,
  ExternalLink,
  X,
} from 'lucide-react';

const NAVIGATION_ITEMS = [
  { id: 'dashboard', name: 'Dashboard & Overview', href: '/dashboard', icon: LayoutDashboard, category: 'Navigation' },
  { id: 'orders', name: 'Orders & Fulfillment', href: '/orders', icon: ShoppingBag, category: 'Navigation' },
  { id: 'catalog', name: 'Product Catalog', href: '/list', icon: Package, category: 'Navigation' },
  { id: 'add-product', name: 'Add New Product', href: '/add', icon: PlusCircle, category: 'Navigation' },
  { id: 'categories', name: 'Catalog Taxonomy & Categories', href: '/categories', icon: FolderTree, category: 'Navigation' },
  { id: 'transactions', name: 'Transactions & Settlements', href: '/transactions', icon: CreditCard, category: 'Navigation' },
  { id: 'reviews', name: 'Customer Reviews Moderation', href: '/reviews', icon: MessageSquare, category: 'Navigation' },
  { id: 'users', name: 'Users & Roles Management', href: '/users', icon: Users, category: 'Navigation' },
  { id: 'security', name: 'Two-Factor Authentication & Security', href: '/security', icon: ShieldCheck, category: 'Navigation' },
];

export const CommandPalette = ({ isOpen, onClose }) => {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  const filteredItems = NAVIGATION_ITEMS.filter((item) =>
    item.name.toLowerCase().includes(query.toLowerCase()) ||
    item.category.toLowerCase().includes(query.toLowerCase())
  );

  const handleSelect = (item) => {
    onClose();
    router.push(item.href);
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;

      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredItems.length));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % Math.max(1, filteredItems.length));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredItems[selectedIndex]) {
          handleSelect(filteredItems[selectedIndex]);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredItems, selectedIndex]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4"
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-[#1C1917]/50 backdrop-blur-xs transition-opacity duration-200"
      />

      {/* Palette Card */}
      <div className="relative w-full max-w-xl bg-white dark:bg-[#1C1917] border border-[#E7E3D9] dark:border-[#292524] rounded-xl shadow-2xl overflow-hidden z-10 animate-fadeIn">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-[#E7E3D9] dark:border-[#292524] gap-3 bg-[#FAF8F5]/60 dark:bg-[#161413]">
          <Search className="w-5 h-5 text-[#B08D57] shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Search pages, orders, catalog, actions..."
            className="w-full bg-transparent border-none text-[#1C1917] dark:text-[#FAF8F5] placeholder-[#A8A29E] text-sm focus:outline-none focus:ring-0"
          />
          <kbd className="hidden sm:inline-block px-2 py-0.5 text-[10px] uppercase font-mono text-[#78716C] dark:text-[#A8A29E] bg-[#F4F1EA] dark:bg-[#292524] rounded border border-[#E7E3D9] dark:border-[#38332E]">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2">
          {filteredItems.length === 0 ? (
            <div className="py-8 text-center text-xs text-[#78716C] dark:text-[#A8A29E]">
              No navigation commands found for "{query}".
            </div>
          ) : (
            <div className="space-y-1">
              <div className="px-3 py-1.5 text-[11px] font-medium uppercase tracking-wider text-[#A8A29E]">
                Navigation & Shortcuts
              </div>
              {filteredItems.map((item, index) => {
                const Icon = item.icon;
                const isSelected = index === selectedIndex;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelect(item)}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-colors cursor-pointer text-left ${
                      isSelected
                        ? 'bg-[#F7F3EB] dark:bg-[#2C2318] text-[#1C1917] dark:text-[#FAF8F5]'
                        : 'text-[#44403C] dark:text-[#D6D3D1] hover:bg-[#FAF8F5] dark:hover:bg-[#252220]'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`p-1.5 rounded-md ${isSelected ? 'bg-white dark:bg-[#1C1917] text-[#B08D57]' : 'bg-[#F4F1EA] dark:bg-[#292524] text-[#78716C]'}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="truncate">{item.name}</span>
                    </div>
                    <ArrowRight className={`w-3.5 h-3.5 transition-transform ${isSelected ? 'translate-x-0 text-[#B08D57]' : 'opacity-0'}`} />
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-4 py-2 border-t border-[#E7E3D9] dark:border-[#292524] bg-[#FAF8F5] dark:bg-[#161413] flex items-center justify-between text-[11px] text-[#A8A29E]">
          <div className="flex items-center gap-3">
            <span><kbd className="font-mono bg-white dark:bg-[#292524] px-1.5 py-0.5 rounded border border-[#E7E3D9] dark:border-[#38332E]">↑</kbd> <kbd className="font-mono bg-white dark:bg-[#292524] px-1.5 py-0.5 rounded border border-[#E7E3D9] dark:border-[#38332E]">↓</kbd> to navigate</span>
            <span><kbd className="font-mono bg-white dark:bg-[#292524] px-1.5 py-0.5 rounded border border-[#E7E3D9] dark:border-[#38332E]">↵</kbd> to select</span>
          </div>
          <span className="font-serif italic text-xs text-[#78716C]">Vellora Quick Finder</span>
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;
