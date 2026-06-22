"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Megaphone, Ticket, ShoppingCart, BarChart3,
  CreditCard, FileText, Key, Users, Mail,
} from "lucide-react";

type NavItem = {
  label: string;
  href: string;
  icon: string;
};

type Props = {
  orgId: string;
  orgName: string;
  orgRole: string;
  navItems: NavItem[];
};

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard, Megaphone, Ticket, ShoppingCart, BarChart3,
  CreditCard, FileText, Key, Users, Mail,
};

const ROLE_COLORS: Record<string, string> = {
  owner: "bg-amber-100 text-amber-700",
  admin: "bg-blue-100 text-blue-700",
  finance: "bg-emerald-100 text-emerald-700",
  marketing: "bg-purple-100 text-purple-700",
  support: "bg-cyan-100 text-cyan-700",
  partner_cashier: "bg-orange-100 text-orange-700",
  auditor: "bg-gray-100 text-gray-700",
};

export function B2bOrgNav({ orgId, orgName, orgRole, navItems }: Props) {
  const pathname = usePathname();
  const basePath = `/app/b2b/orgs/${orgId}`;

  return (
    <div className="border-b border-[var(--border)] bg-white/80 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="flex items-center gap-3 py-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--primary)] to-[var(--primary-hover)] flex items-center justify-center">
            <LayoutDashboard className="h-4 w-4 text-white" />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-bold text-[var(--text)] truncate">{orgName}</h2>
          </div>
          <span className={`ml-auto text-[10px] px-2 py-0.5 rounded-full font-semibold ${ROLE_COLORS[orgRole] ?? "bg-gray-100 text-gray-600"}`}>
            {orgRole}
          </span>
        </div>

        {/* Tab navigation */}
        <nav className="flex gap-1 overflow-x-auto pb-px -mb-px">
          {navItems.map((item) => {
            const Icon = ICON_MAP[item.icon] || LayoutDashboard;
            const fullHref = `${basePath}${item.href}`;
            const isActive = item.href === ""
              ? pathname === basePath || pathname === `${basePath}/`
              : pathname.startsWith(fullHref);

            return (
              <Link
                key={fullHref}
                href={fullHref}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium whitespace-nowrap border-b-2 transition-colors ${
                  isActive
                    ? "border-[var(--primary)] text-[var(--primary)]"
                    : "border-transparent text-[var(--text-muted)] hover:text-[var(--text)] hover:border-[var(--border)]"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
