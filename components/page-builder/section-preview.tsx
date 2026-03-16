"use client"

import {
  Sparkles,
  ShoppingBag,
  Star,
  MousePointerClick,
  Image,
  Type,
  Award,
  Gift,
  Grid3X3,
  Calendar,
  DollarSign,
  FileText,
  HelpCircle,
  Mail,
  Phone,
  MapPin,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"

interface SectionPreviewProps {
  sectionId: string
  label: string
}

const SECTION_META: Record<
  string,
  { icon: LucideIcon; color: string; preview: () => React.ReactNode }
> = {
  hero: {
    icon: Sparkles,
    color: "#E8985E",
    preview: () => (
      <div className="rounded-lg overflow-hidden">
        <div
          className="h-20 rounded-lg flex flex-col items-center justify-center"
          style={{
            background: "linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)",
          }}
        >
          <div className="h-3 w-28 rounded bg-white/40 mb-2" />
          <div className="h-2 w-20 rounded bg-white/25 mb-2" />
          <div className="h-5 w-16 rounded-full bg-white/50" />
        </div>
      </div>
    ),
  },
  value_props: {
    icon: Award,
    color: "#7C9A5E",
    preview: () => (
      <div className="grid grid-cols-3 gap-1.5">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="rounded-md p-2 flex flex-col items-center"
            style={{ background: "var(--surface-dim)" }}
          >
            <div className="h-3 w-3 rounded-full mb-1" style={{ background: "var(--primary)" }} />
            <div className="h-1.5 w-8 rounded bg-[var(--border)]" />
          </div>
        ))}
      </div>
    ),
  },
  featured_products: {
    icon: ShoppingBag,
    color: "#5E8CA8",
    preview: () => (
      <div className="grid grid-cols-3 gap-1.5">
        {[0, 1, 2].map((i) => (
          <div key={i} className="rounded-md overflow-hidden" style={{ background: "var(--surface-dim)" }}>
            <div className="h-8 bg-[var(--border)]/40" />
            <div className="p-1.5">
              <div className="h-1.5 w-full rounded bg-[var(--border)] mb-1" />
              <div className="h-1.5 w-8 rounded bg-[var(--primary)]/40" />
            </div>
          </div>
        ))}
      </div>
    ),
  },
  featured_vouchers: {
    icon: Gift,
    color: "#A85E8C",
    preview: () => (
      <div className="grid grid-cols-3 gap-1.5">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="rounded-md p-2 border border-dashed border-[var(--border)]"
            style={{ background: "var(--surface-dim)" }}
          >
            <Gift className="h-3 w-3 text-[var(--text-muted)] mx-auto mb-1" />
            <div className="h-1.5 w-full rounded bg-[var(--border)]" />
          </div>
        ))}
      </div>
    ),
  },
  rental_packages: {
    icon: Grid3X3,
    color: "#8C5EA8",
    preview: () => (
      <div className="grid grid-cols-3 gap-1.5">
        {[0, 1, 2].map((i) => (
          <div key={i} className="rounded-md p-2" style={{ background: "var(--surface-dim)" }}>
            <div className="h-1.5 w-full rounded bg-[var(--border)] mb-1" />
            <div className="h-1.5 w-8 rounded bg-[var(--primary)]/40" />
            <div className="h-4 w-10 rounded-full bg-[var(--primary)]/30 mx-auto mt-1.5" />
          </div>
        ))}
      </div>
    ),
  },
  categories: {
    icon: Grid3X3,
    color: "#5EA89A",
    preview: () => (
      <div className="grid grid-cols-3 gap-1">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="h-5 rounded flex items-center justify-center"
            style={{ background: "var(--surface-dim)" }}
          >
            <div className="h-1.5 w-6 rounded bg-[var(--border)]" />
          </div>
        ))}
      </div>
    ),
  },
  availability: {
    icon: Calendar,
    color: "#5E6FA8",
    preview: () => (
      <div className="rounded-md p-2" style={{ background: "var(--surface-dim)" }}>
        <div className="grid grid-cols-7 gap-0.5">
          {Array.from({ length: 14 }).map((_, i) => (
            <div
              key={i}
              className="h-2.5 w-full rounded-sm"
              style={{
                background:
                  i === 3 || i === 7 || i === 11
                    ? "var(--primary)"
                    : "var(--border)",
                opacity: i === 3 || i === 7 || i === 11 ? 0.6 : 0.3,
              }}
            />
          ))}
        </div>
      </div>
    ),
  },
  testimonials: {
    icon: Star,
    color: "#C4A35A",
    preview: () => (
      <div className="grid grid-cols-3 gap-1.5">
        {[0, 1, 2].map((i) => (
          <div key={i} className="rounded-md p-2" style={{ background: "var(--surface-dim)" }}>
            <Star className="h-2.5 w-2.5 text-[var(--primary)] mb-1" />
            <div className="h-1 w-full rounded bg-[var(--border)] mb-0.5" />
            <div className="h-1 w-3/4 rounded bg-[var(--border)]" />
          </div>
        ))}
      </div>
    ),
  },
  gallery: {
    icon: Image,
    color: "#5EA87C",
    preview: () => (
      <div className="grid grid-cols-3 gap-1">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="h-6 rounded"
            style={{
              background: `linear-gradient(135deg, var(--accent) ${i * 10}%, var(--surface-dim) 100%)`,
            }}
          />
        ))}
      </div>
    ),
  },
  pricing: {
    icon: DollarSign,
    color: "#5EA85E",
    preview: () => (
      <div className="grid grid-cols-3 gap-1.5">
        {["S", "M", "L"].map((tier) => (
          <div
            key={tier}
            className="rounded-md p-1.5 text-center"
            style={{
              background: "var(--surface-dim)",
              border: tier === "M" ? "1px solid var(--primary)" : "none",
            }}
          >
            <div className="text-[8px] font-bold text-[var(--text-muted)]">{tier}</div>
            <div className="h-1 w-6 rounded bg-[var(--border)] mx-auto mt-1" />
          </div>
        ))}
      </div>
    ),
  },
  rental_terms: {
    icon: FileText,
    color: "#8C8C5E",
    preview: () => (
      <div className="rounded-md p-2" style={{ background: "var(--surface-dim)" }}>
        <div className="space-y-1">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex items-center gap-1">
              <div className="h-1.5 w-1.5 rounded-full bg-[var(--primary)]/50" />
              <div className="h-1 flex-1 rounded bg-[var(--border)]" />
            </div>
          ))}
        </div>
      </div>
    ),
  },
  faq: {
    icon: HelpCircle,
    color: "#A8785E",
    preview: () => (
      <div className="space-y-1">
        {[0, 1, 2].map((i) => (
          <div key={i} className="rounded p-1.5 flex items-center gap-1" style={{ background: "var(--surface-dim)" }}>
            <HelpCircle className="h-2 w-2 text-[var(--text-muted)] shrink-0" />
            <div className="h-1 flex-1 rounded bg-[var(--border)]" />
          </div>
        ))}
      </div>
    ),
  },
  newsletter: {
    icon: Mail,
    color: "#5E5EA8",
    preview: () => (
      <div className="rounded-md p-2 text-center" style={{ background: "var(--surface-dim)" }}>
        <Mail className="h-3 w-3 text-[var(--text-muted)] mx-auto mb-1" />
        <div className="h-3 w-full rounded bg-[var(--border)]/30 mb-1" />
        <div className="h-4 w-12 rounded-full bg-[var(--primary)]/30 mx-auto" />
      </div>
    ),
  },
  contact: {
    icon: Phone,
    color: "#5EA8A8",
    preview: () => (
      <div className="rounded-md p-2" style={{ background: "var(--surface-dim)" }}>
        <div className="flex items-center gap-1 mb-1">
          <Phone className="h-2 w-2 text-[var(--text-muted)]" />
          <div className="h-1 w-12 rounded bg-[var(--border)]" />
        </div>
        <div className="flex items-center gap-1">
          <Mail className="h-2 w-2 text-[var(--text-muted)]" />
          <div className="h-1 w-16 rounded bg-[var(--border)]" />
        </div>
      </div>
    ),
  },
  map: {
    icon: MapPin,
    color: "#A85E5E",
    preview: () => (
      <div
        className="h-14 rounded-md flex items-center justify-center"
        style={{ background: "var(--surface-dim)" }}
      >
        <MapPin className="h-4 w-4 text-[var(--text-muted)]" />
      </div>
    ),
  },
}

const fallbackMeta = {
  icon: Type,
  color: "#888888",
  preview: () => (
    <div className="h-10 rounded-md flex items-center justify-center" style={{ background: "var(--surface-dim)" }}>
      <div className="h-1.5 w-16 rounded bg-[var(--border)]" />
    </div>
  ),
}

export function SectionPreview({ sectionId, label }: SectionPreviewProps) {
  const meta = SECTION_META[sectionId] || fallbackMeta
  const Preview = meta.preview

  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <div
          className="h-5 w-5 rounded flex items-center justify-center"
          style={{ background: meta.color + "20" }}
        >
          <meta.icon className="h-3 w-3" style={{ color: meta.color }} />
        </div>
        <span className="text-xs font-medium text-[var(--text)]">{label}</span>
      </div>
      <Preview />
    </div>
  )
}

export function getSectionIcon(sectionId: string): LucideIcon {
  return (SECTION_META[sectionId] || fallbackMeta).icon
}

export function getSectionColor(sectionId: string): string {
  return (SECTION_META[sectionId] || fallbackMeta).color
}
