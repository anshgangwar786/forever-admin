'use client';

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAdminAuth } from "../context/AdminAuthContext";
import {
  LayoutDashboard,
  PackagePlus,
  Package,
  FolderTree,
  Star,
  ShoppingBag,
  CreditCard,
  Users,
  ShieldCheck,
  Activity,
} from "lucide-react";

const Sidebar = () => {
  const pathname = usePathname();
  const { adminUser } = useAdminAuth();

  const navItems = [
    {
      group: "Overview",
      items: [
        {
          label: "Dashboard",
          href: "/dashboard",
          isActive: pathname === "/" || pathname === "/dashboard",
          icon: LayoutDashboard,
        },
      ],
    },
    {
      group: "Catalog & Inventory",
      items: [
        {
          label: "Add Product",
          href: "/add",
          isActive: pathname === "/add",
          icon: PackagePlus,
        },
        {
          label: "Product Catalog",
          href: "/list",
          isActive: pathname === "/list",
          icon: Package,
        },
        {
          label: "Categories",
          href: "/categories",
          isActive: pathname === "/categories",
          icon: FolderTree,
        },
        {
          label: "Reviews",
          href: "/reviews",
          isActive: pathname === "/reviews",
          icon: Star,
        },
      ],
    },
    {
      group: "Sales & Fulfillment",
      items: [
        {
          label: "Orders",
          href: "/orders",
          isActive: pathname === "/orders",
          icon: ShoppingBag,
        },
        {
          label: "Transactions",
          href: "/transactions",
          isActive: pathname === "/transactions" || pathname === "/admin/transactions",
          icon: CreditCard,
        },
      ],
    },
    {
      group: "Administration",
      items: [
        ...(adminUser?.role === "admin"
          ? [
              {
                label: "Users & Roles",
                href: "/users",
                isActive: pathname === "/users",
                icon: Users,
              },
            ]
          : []),
        {
          label: "Security (2FA)",
          href: "/security",
          isActive: pathname === "/security",
          icon: ShieldCheck,
        },
      ],
    },
  ];

  return (
    <aside className="w-16 sm:w-56 md:w-60 bg-[#1C1917] dark:bg-[#12100E] border-r border-[#292524] text-[#FAF8F5] shrink-0 h-full sticky top-[64px] max-h-[calc(100vh-64px)] overflow-y-auto flex flex-col justify-between py-5 select-none transition-all z-20 scrollbar-none">
      <div className="space-y-6 flex-1">
        {/* Status indicator */}
        <div className="px-3 sm:px-5 shrink-0">
          <p className="hidden sm:block text-[10px] uppercase tracking-[0.2em] text-[#78716C] font-semibold mb-1">
            Control Room
          </p>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#B08D57] animate-pulse shrink-0" />
            <span className="hidden sm:inline-block text-xs uppercase tracking-wider text-[#FAF8F5] font-medium">
              Live Atelier Sync
            </span>
          </div>
        </div>

        {/* Navigation Sections */}
        <nav className="space-y-5" aria-label="Sidebar navigation">
          {navItems.map((section) => (
            <div key={section.group} className="space-y-1">
              <p className="hidden sm:block px-5 text-[10px] uppercase tracking-[0.18em] text-[#78716C] font-medium">
                {section.group}
              </p>

              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const active = item.isActive;
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`relative flex items-center gap-3 px-3 sm:px-5 py-2.5 text-xs font-normal tracking-wide rounded-none transition-all duration-150 cursor-pointer ${
                        active
                          ? "bg-[#2A2725] text-[#FAF8F5] font-medium"
                          : "text-[#A8A29E] hover:text-[#FAF8F5] hover:bg-[#252220]"
                      }`}
                    >
                      {active && (
                        <span className="absolute left-0 top-0 bottom-0 w-1 bg-[#B08D57]" />
                      )}
                      <Icon className={`w-4 h-4 shrink-0 ${active ? "text-[#B08D57]" : "text-[#A8A29E]"}`} />
                      <span className="hidden sm:inline-block truncate">
                        {item.label}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </div>

      {/* Footer signature */}
      <div className="px-3 sm:px-5 pt-4 mt-6 border-t border-[#292524] text-[11px] text-[#78716C] shrink-0">
        <div className="hidden sm:flex flex-col gap-0.5">
          <span className="text-[#A8A29E] font-medium font-serif tracking-wide text-xs">
            Vellora Backroom
          </span>
          <span className="text-[10px] text-[#78716C]">v2.4 &bull; Quiet Luxury System</span>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
