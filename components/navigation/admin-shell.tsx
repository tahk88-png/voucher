"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard, Users, Shield, Headphones, Store, CreditCard,
  BarChart3, Flag, Activity, Gauge, FileText, Settings, Menu, X,
  LogOut, ChevronRight, Mail,
} from "lucide-react";
import type { AdminRoleType } from "@/lib/admin/roles";

type NavItem = {
  label: string;
  href: string;
  icon: string;
  section: string;
};

type Props = {
  adminRole: AdminRoleType;
  email: string;
  navItems: NavItem[];
  children: React.ReactNode;
};

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard, Users, Shield, Headphones, Store, CreditCard,
  BarChart3, Flag, Activity, Gauge, FileText, Settings, Mail,
};

const ROLE_LABELS: Record<AdminRoleType, string> = {
  super_admin: "Super Admin",
  ops_admin: "Operations",
  billing_admin: "Billing",
  moderator: "Moderator",
  support_admin: "Support",
};

const ROLE_COLORS: Record<AdminRoleType, string> = {
  super_admin: "bg-red-100 text-red-700 border-red-200",
  ops_admin: "bg-blue-100 text-blue-700 border-blue-200",
  billing_admin: "bg-emerald-100 text-emerald-700 border-emerald-200",
  moderator: "bg-amber-100 text-amber-700 border-amber-200",
  support_admin: "bg-purple-100 text-purple-700 border-purple-200",
};

export function AdminShell({ adminRole, email, navItems, children }: Props) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Group items by section
  const groups: Record<string, NavItem[]> = {};
  for (const item of navItems) {
    if (!groups[item.section]) groups[item.section] = [];
    groups[item.section].push(item);
  }

  function isActive(href: string) {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  }

  const sidebar = (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-[var(--border)]">
        <Link href="/admin" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center">
            <Settings className="h-4 w-4 text-white" />
          </div>
          <span className="font-bold text-[var(--text)]">Admin</span>
        </Link>
        <div className={`mt-2 inline-flex items-center px-2 py-0.5 rounded-full border text-xs font-semibold ${ROLE_COLORS[adminRole]}`}>
          {ROLE_LABELS[adminRole]}
        </div>
      </div>

      {/* Nav groups */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-4">
        {Object.entries(groups).map(([section, items]) => (
          <div key={section}>
            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-faint)] px-2 mb-1">{section}</p>
            <div className="space-y-0.5">
              {items.map((item) => {
                const Icon = ICON_MAP[item.icon] || LayoutDashboard;
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition-colors ${
                      active
                        ? "bg-[var(--primary)]/10 text-[var(--primary)] font-semibold"
                        : "text-[var(--text-muted)] hover:bg-[var(--surface)] hover:text-[var(--text)]"
                    }`}
                  >
                    <Icon className="h-4 w-4 flex-shrink-0" />
                    {item.label}
                    {active && <ChevronRight className="h-3 w-3 ml-auto" />}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-[var(--border)]">
        <p className="text-xs text-[var(--text-faint)] truncate mb-2">{email}</p>
        <Link
          href="/app"
          className="flex items-center gap-2 text-xs text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
        >
          <LogOut className="h-3.5 w-3.5" />
          Back to App
        </Link>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-[var(--bg)]">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-60 flex-col border-r border-[var(--border)] bg-white/80 backdrop-blur-sm">
        {sidebar}
      </aside>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-64 bg-white shadow-xl">
            {sidebar}
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <header className="lg:hidden flex items-center gap-3 px-4 py-3 border-b border-[var(--border)] bg-white/90">
          <button onClick={() => setMobileOpen(true)} aria-label="Open menu" aria-expanded={mobileOpen} className="p-1.5">
            <Menu className="h-5 w-5" />
          </button>
          <span className="font-semibold text-sm text-[var(--text)]">Admin</span>
          <span className={`ml-auto px-2 py-0.5 rounded-full border text-[10px] font-semibold ${ROLE_COLORS[adminRole]}`}>
            {ROLE_LABELS[adminRole]}
          </span>
        </header>

        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
