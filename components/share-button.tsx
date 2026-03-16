"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { WarmCard } from "@/components/warm-card";
import { WarmButton } from "@/components/warm-button";
import {
  generateShareUrl,
  shareTargets,
  type ShareItemType,
} from "@/lib/social-sharing";
import { showSuccess } from "@/lib/toast-helpers";
import {
  Share2,
  MessageCircle,
  Facebook,
  Twitter,
  Send,
  Mail,
  Link,
  Check,
  Copy,
  X,
  Gift,
} from "lucide-react";

interface ShareButtonProps {
  type: ShareItemType;
  id: string;
  title: string;
  description?: string;
  referralCode?: string;
  className?: string;
  variant?: "primary" | "outline" | "ghost";
  size?: "sm" | "md";
}

const ICON_MAP: Record<string, React.ReactNode> = {
  MessageCircle: <MessageCircle className="h-5 w-5" />,
  Facebook: <Facebook className="h-5 w-5" />,
  Twitter: <Twitter className="h-5 w-5" />,
  Send: <Send className="h-5 w-5" />,
  Mail: <Mail className="h-5 w-5" />,
  Link: <Link className="h-5 w-5" />,
};

/**
 * Share button that opens a share sheet with platform options.
 * Generates a referral tracking link and provides copy-to-clipboard.
 */
export function ShareButton({
  type,
  id,
  title,
  description,
  referralCode,
  className,
  variant = "outline",
  size = "md",
}: ShareButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const shareUrl = generateShareUrl(type, id, referralCode);
  const shareText = referralCode
    ? `${title} - Share & earn 10% back!`
    : title;

  const handleShare = async (targetId: string) => {
    const target = shareTargets.find((t) => t.id === targetId);
    if (!target) return;

    if (targetId === "copy") {
      try {
        await navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        showSuccess("Link copied to clipboard!");
        setTimeout(() => setCopied(false), 2000);
      } catch {
        // Fallback: select text from hidden input
        const input = document.createElement("input");
        input.value = shareUrl;
        document.body.appendChild(input);
        input.select();
        document.execCommand("copy");
        document.body.removeChild(input);
        setCopied(true);
        showSuccess("Link copied!");
        setTimeout(() => setCopied(false), 2000);
      }
      return;
    }

    // Use native share API if available for mobile
    if (
      typeof navigator !== "undefined" &&
      navigator.share &&
      targetId !== "email"
    ) {
      try {
        await navigator.share({
          title: shareText,
          text: description || shareText,
          url: shareUrl,
        });
        setIsOpen(false);
        return;
      } catch {
        // Fall through to URL-based sharing
      }
    }

    // Open share URL in new window
    const url = target.getUrl(shareUrl, shareText);
    window.open(url, "_blank", "width=600,height=400,noopener,noreferrer");
  };

  return (
    <div className="relative">
      <WarmButton
        variant={variant}
        size={size}
        onClick={() => setIsOpen(!isOpen)}
        className={className}
      >
        <Share2 className="h-4 w-4 mr-1.5" />
        Share
      </WarmButton>

      {/* Share sheet overlay */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Sheet */}
          <div className="absolute z-50 right-0 top-full mt-2 w-80 animate-in fade-in slide-in-from-top-2 duration-200">
            <WarmCard padding="none" className="shadow-xl overflow-hidden">
              {/* Header */}
              <div className="px-4 py-3 border-b border-[var(--border)] bg-gradient-to-r from-[var(--bg-2)] to-[var(--accent)]/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Share2 className="h-4 w-4 text-[var(--primary)]" />
                    <h3 className="text-sm font-semibold text-[var(--text)]">
                      Share this {type}
                    </h3>
                  </div>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="h-6 w-6 flex items-center justify-center rounded-full hover:bg-[var(--surface-dim)] transition-colors"
                  >
                    <X className="h-3.5 w-3.5 text-[var(--text-muted)]" />
                  </button>
                </div>
              </div>

              {/* Referral message */}
              {referralCode && (
                <div className="px-4 py-2.5 bg-[var(--success)]/5 border-b border-[var(--border)]">
                  <div className="flex items-center gap-2">
                    <Gift className="h-4 w-4 text-[var(--success)]" />
                    <p className="text-xs text-[var(--text-muted)]">
                      <span className="font-semibold text-[var(--success)]">
                        Share &amp; earn 10%
                      </span>{" "}
                      when your friends redeem!
                    </p>
                  </div>
                </div>
              )}

              {/* Share targets grid */}
              <div className="p-4">
                <div className="grid grid-cols-3 gap-3">
                  {shareTargets.map((target) => (
                    <button
                      key={target.id}
                      onClick={() => handleShare(target.id)}
                      className="flex flex-col items-center gap-1.5 p-3 rounded-[var(--r-md)] hover:bg-[var(--surface-dim)] transition-all duration-150 group"
                    >
                      <div
                        className="h-10 w-10 rounded-full flex items-center justify-center transition-transform group-hover:scale-110"
                        style={{ backgroundColor: `${target.color}15` }}
                      >
                        <span style={{ color: target.color }}>
                          {target.id === "copy" && copied
                            ? <Check className="h-5 w-5" />
                            : ICON_MAP[target.icon] || <Link className="h-5 w-5" />}
                        </span>
                      </div>
                      <span className="text-[10px] font-medium text-[var(--text-muted)] group-hover:text-[var(--text)]">
                        {target.id === "copy" && copied
                          ? "Copied!"
                          : target.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Share link preview */}
              <div className="px-4 pb-3">
                <div className="flex items-center gap-2 p-2 bg-[var(--surface-dim)] rounded-[var(--r-sm)] border border-[var(--border)]">
                  <input
                    type="text"
                    readOnly
                    value={shareUrl}
                    className="flex-1 bg-transparent text-xs text-[var(--text-muted)] font-mono outline-none truncate"
                  />
                  <button
                    onClick={() => handleShare("copy")}
                    className="shrink-0 p-1 rounded hover:bg-[var(--surface)] transition-colors"
                    aria-label="Copy link"
                  >
                    {copied ? (
                      <Check className="h-3.5 w-3.5 text-[var(--success)]" />
                    ) : (
                      <Copy className="h-3.5 w-3.5 text-[var(--text-faint)]" />
                    )}
                  </button>
                </div>
              </div>
            </WarmCard>
          </div>
        </>
      )}
    </div>
  );
}
