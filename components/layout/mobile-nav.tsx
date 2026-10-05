"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, X } from "lucide-react"
import { useTranslations } from "next-intl"

export interface MobileNavLink {
  id: string
  label: string
  href: string
}

/**
 * Header menu for screens below `md`, where the inline nav is hidden.
 * Disclosure pattern: the toggle carries aria-expanded/aria-controls, focus
 * moves into the panel on open and back to the toggle on Escape, and the panel
 * closes on navigation.
 */
export function MobileNav({
  links,
  signInHref,
  signInLabel,
}: {
  links: MobileNavLink[]
  signInHref: string
  signInLabel: string
}) {
  const tNav = useTranslations("nav")
  const tSite = useTranslations("site")
  const [open, setOpen] = React.useState(false)
  const pathname = usePathname()
  const toggleRef = React.useRef<HTMLButtonElement>(null)
  const panelRef = React.useRef<HTMLDivElement>(null)
  const panelId = React.useId()

  // Close whenever the route changes.
  React.useEffect(() => {
    setOpen(false)
  }, [pathname])

  React.useEffect(() => {
    if (!open) return
    panelRef.current?.querySelector<HTMLElement>("a,button")?.focus()

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false)
        toggleRef.current?.focus()
      }
    }
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node
      if (!panelRef.current?.contains(target) && !toggleRef.current?.contains(target)) {
        setOpen(false)
      }
    }
    document.addEventListener("keydown", onKeyDown)
    document.addEventListener("pointerdown", onPointerDown)
    return () => {
      document.removeEventListener("keydown", onKeyDown)
      document.removeEventListener("pointerdown", onPointerDown)
    }
  }, [open])

  return (
    <div className="md:hidden">
      <button
        ref={toggleRef}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={open ? tNav("closeMenu") : tNav("openMenu")}
        onClick={() => setOpen((value) => !value)}
        className="inline-flex h-11 w-11 items-center justify-center rounded-[12px] text-[var(--text)] hover:bg-[var(--surface-dim)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
      >
        {open ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
      </button>

      <div
        ref={panelRef}
        id={panelId}
        hidden={!open}
        className="absolute inset-x-0 top-full border-b border-[var(--border)] bg-[var(--surface)] shadow-warm"
      >
        <nav aria-label={tSite("header.mainNavLabel")} className="mx-auto flex max-w-7xl flex-col px-4 py-3">
          {links.map((link) => {
            const current = pathname === link.href
            return (
              <Link
                key={link.id}
                href={link.href}
                aria-current={current ? "page" : undefined}
                onClick={() => setOpen(false)}
                className={`rounded-[12px] px-3 py-3 text-base font-medium hover:bg-[var(--surface-dim)] ${
                  current ? "text-[var(--text)] bg-[var(--surface-dim)]" : "text-[var(--text-muted)]"
                }`}
              >
                {link.label}
              </Link>
            )
          })}
          <Link
            href={signInHref}
            onClick={() => setOpen(false)}
            className="mt-2 rounded-[12px] bg-[var(--primary)] px-3 py-3 text-center text-base font-semibold text-[var(--primary-foreground)] hover:bg-[var(--primary-hover)]"
          >
            {signInLabel}
          </Link>
        </nav>
      </div>
    </div>
  )
}
