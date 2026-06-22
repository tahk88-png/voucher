"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ChevronDown, User, Store, Shield, Building2 } from "lucide-react";

export type RoleSwitcherMerchant = {
  merchantId: string;
  merchantSlug: string;
  merchantName: string;
  role: string;
};

export type RoleSwitcherOrg = {
  orgId: string;
  orgName: string;
  role: string;
};

type Props = {
  roles: string[];
  merchantMemberships: RoleSwitcherMerchant[];
  adminRole?: string | null;
  orgMemberships?: RoleSwitcherOrg[];
};

export function RoleSwitcher({ roles, merchantMemberships, adminRole, orgMemberships = [] }: Props) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Only show if user has more than one role context
  const contexts: { label: string; href: string; icon: React.ElementType; badge?: string; active: boolean }[] = [];

  // Consumer context
  contexts.push({
    label: "My Dashboard",
    href: "/app",
    icon: User,
    active: pathname.startsWith("/app") && !pathname.startsWith("/app/b2b"),
  });

  // Merchant contexts
  for (const m of merchantMemberships) {
    contexts.push({
      label: m.merchantName,
      href: `/merchant/${m.merchantSlug}`,
      icon: Store,
      badge: m.role === "merchant_admin" ? "Admin" : "Staff",
      active: pathname.startsWith(`/merchant/${m.merchantSlug}`),
    });
  }

  // B2B org contexts
  for (const o of orgMemberships) {
    contexts.push({
      label: o.orgName,
      href: `/app/b2b/orgs/${o.orgId}`,
      icon: Building2,
      badge: o.role,
      active: pathname.includes(`/b2b/orgs/${o.orgId}`),
    });
  }

  // Admin context
  if (roles.includes("platform_admin")) {
    contexts.push({
      label: "Platform Admin",
      href: "/admin",
      icon: Shield,
      badge: adminRole ?? undefined,
      active: pathname.startsWith("/admin"),
    });
  }

  if (contexts.length <= 1) return null;

  const activeCtx = contexts.find((c) => c.active) || contexts[0];

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-white/60 hover:bg-white/90 transition text-left text-sm"
      >
        <activeCtx.icon className="h-4 w-4 text-[var(--text-muted)] flex-shrink-0" />
        <span className="flex-1 truncate font-medium text-[var(--text)]">{activeCtx.label}</span>
        {activeCtx.badge && (
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] font-semibold">
            {activeCtx.badge}
          </span>
        )}
        <ChevronDown className={`h-3.5 w-3.5 text-[var(--text-faint)] transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 right-0 bottom-full mb-1 z-50 rounded-lg border border-[var(--border)] bg-white shadow-lg overflow-hidden">
            <p className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--text-faint)] border-b border-[var(--border)]">
              Switch context
            </p>
            {contexts.map((ctx) => {
              const Icon = ctx.icon;
              return (
                <Link
                  key={ctx.href}
                  href={ctx.href}
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-2.5 px-3 py-2.5 text-sm transition-colors ${
                    ctx.active
                      ? "bg-[var(--primary)]/10 text-[var(--primary)] font-semibold"
                      : "text-[var(--text)] hover:bg-[var(--surface)]"
                  }`}
                >
                  <Icon className="h-4 w-4 flex-shrink-0" />
                  <span className="flex-1 truncate">{ctx.label}</span>
                  {ctx.badge && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-neutral-100 text-neutral-600 font-medium">
                      {ctx.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
