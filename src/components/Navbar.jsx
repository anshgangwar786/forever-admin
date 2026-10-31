'use client';

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAdminAuth } from "../context/AdminAuthContext";
import { useTheme } from "../context/ThemeContext";
import { Button, Badge, CommandPalette } from "./ui";
import {
  Search,
  Sun,
  Moon,
  ShieldCheck,
  ExternalLink,
  LogOut,
  Command,
} from "lucide-react";

const Navbar = () => {
  const { logout, adminUser } = useAdminAuth();
  const { theme, toggleTheme, mounted } = useTheme();
  const [paletteOpen, setPaletteOpen] = useState(false);

  const storeUrl =
    process.env.NEXT_PUBLIC_STORE_URL ||
    "http://localhost:5173";

  // Register Cmd+K / Ctrl+K keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <>
      <header className="h-[64px] shrink-0 sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6 lg:px-8 bg-[#FAF8F5]/90 dark:bg-[#1C1917]/90 backdrop-blur-md border-b border-[#E7E3D9] dark:border-[#292524] select-none transition-colors">
        {/* Brand & Workspace Identity */}
        <div className="flex items-center gap-3 sm:gap-4">
          <Link href="/dashboard" className="flex flex-col items-start focus:outline-none group">
            <span className="font-serif text-lg sm:text-xl tracking-[0.2em] font-medium text-[#1C1917] dark:text-[#FAF8F5] uppercase group-hover:text-[#B08D57] transition-colors">
              Vellora
            </span>
            <span className="text-[9px] tracking-[0.3em] text-[#78716C] dark:text-[#A8A29E] uppercase -mt-0.5 font-sans font-medium">
              Mission Control
            </span>
          </Link>

          <Badge variant="accent" size="sm" className="hidden sm:inline-flex">
            {adminUser?.role === "seller" ? "Seller Desk" : "Admin Director"}
          </Badge>
        </div>

        {/* Global Search Bar (Quick Action Command Trigger) */}
        <div className="flex-1 max-w-md mx-4 hidden md:block">
          <button
            type="button"
            onClick={() => setPaletteOpen(true)}
            className="w-full flex items-center justify-between px-3.5 py-1.5 text-xs text-[#78716C] dark:text-[#A8A29E] bg-white dark:bg-[#161413] border border-[#E7E3D9] dark:border-[#292524] rounded-lg hover:border-[#B08D57] dark:hover:border-[#B08D57] transition-all cursor-pointer shadow-2xs text-left"
          >
            <div className="flex items-center gap-2.5">
              <Search className="w-3.5 h-3.5 text-[#B08D57]" />
              <span>Search orders, catalog, pages...</span>
            </div>
            <kbd className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono font-medium text-[#78716C] dark:text-[#A8A29E] bg-[#F4F1EA] dark:bg-[#252220] rounded border border-[#E7E3D9] dark:border-[#38332E]">
              <Command className="w-2.5 h-2.5" /> K
            </kbd>
          </button>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Mobile search trigger */}
          <button
            type="button"
            onClick={() => setPaletteOpen(true)}
            className="md:hidden p-2 text-[#78716C] dark:text-[#A8A29E] hover:text-[#1C1917] dark:hover:text-[#FAF8F5] rounded-lg transition-colors cursor-pointer"
            aria-label="Search"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Theme Toggle Button */}
          {mounted && (
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2 text-[#78716C] dark:text-[#A8A29E] hover:text-[#1C1917] dark:hover:text-[#FAF8F5] hover:bg-[#F4F1EA] dark:hover:bg-[#292524] rounded-lg transition-colors cursor-pointer"
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-[#B08D57]" />
              ) : (
                <Moon className="w-4 h-4 text-[#78716C]" />
              )}
            </button>
          )}

          {/* User profile details */}
          {adminUser && (
            <div className="hidden lg:flex flex-col text-right pr-1">
              <span className="text-xs font-medium text-[#1C1917] dark:text-[#FAF8F5] leading-tight">
                {adminUser.storeName || adminUser.name || "Administrator"}
              </span>
              <span className="text-[11px] text-[#78716C] dark:text-[#A8A29E]">
                {adminUser.email}
              </span>
            </div>
          )}

          {/* 2FA Security */}
          <Link href="/security">
            <Button
              variant="outline"
              size="sm"
              className="hidden sm:inline-flex"
              icon={<ShieldCheck className="w-3.5 h-3.5 text-[#B08D57]" />}
            >
              2FA Security
            </Button>
          </Link>

          {/* Storefront Link */}
          <a href={storeUrl} target="_blank" rel="noopener noreferrer">
            <Button
              variant="outline"
              size="sm"
              iconRight={<ExternalLink className="w-3 h-3 ml-1" />}
            >
              Storefront
            </Button>
          </a>

          {/* Sign Out */}
          <Button
            variant="ghost"
            size="sm"
            onClick={logout}
            icon={<LogOut className="w-3.5 h-3.5" />}
            className="text-[#78716C] dark:text-[#A8A29E] hover:text-[#8E2824] dark:hover:text-[#FAECEB]"
          >
            <span className="hidden sm:inline">Sign Out</span>
          </Button>
        </div>
      </header>

      {/* Global Command Palette */}
      <CommandPalette
        isOpen={paletteOpen}
        onClose={() => setPaletteOpen(false)}
      />
    </>
  );
};

export default Navbar;
