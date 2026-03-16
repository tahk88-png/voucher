"use client";

import { useVoiceSearch } from "@/hooks/use-voice-search";
import { cn } from "@/lib/utils";
import { Mic, MicOff } from "lucide-react";

interface VoiceSearchButtonProps {
  onResult: (transcript: string) => void;
  lang?: string;
  className?: string;
}

/**
 * Microphone button that activates Web Speech API speech recognition.
 * Shows a pulsing animation while listening and displays real-time transcript.
 */
export function VoiceSearchButton({
  onResult,
  lang,
  className,
}: VoiceSearchButtonProps) {
  const {
    transcript,
    isListening,
    isSupported,
    startListening,
    stopListening,
  } = useVoiceSearch({
    lang,
    onResult,
  });

  if (!isSupported) {
    return null;
  }

  return (
    <div className={cn("relative inline-flex items-center", className)}>
      <button
        type="button"
        onClick={isListening ? stopListening : startListening}
        className={cn(
          "relative h-10 w-10 rounded-[var(--r-sm)] flex items-center justify-center transition-all duration-200",
          isListening
            ? "bg-[var(--danger)]/10 text-[var(--danger)] border border-[var(--danger)]/30"
            : "bg-[var(--surface)] text-[var(--text-muted)] border border-[var(--border)] hover:border-[var(--border-strong)] hover:text-[var(--text)]"
        )}
        aria-label={isListening ? "Stop listening" : "Start voice search"}
        title={isListening ? "Tap to stop" : "Voice search"}
      >
        {/* Pulsing ring animation when listening */}
        {isListening && (
          <>
            <span className="absolute inset-0 rounded-[var(--r-sm)] border-2 border-[var(--danger)] animate-ping opacity-30" />
            <span className="absolute inset-0 rounded-[var(--r-sm)] border border-[var(--danger)]/50 animate-pulse" />
          </>
        )}

        {isListening ? (
          <MicOff className="h-4 w-4 relative z-10" />
        ) : (
          <Mic className="h-4 w-4" />
        )}
      </button>

      {/* Live transcript tooltip */}
      {isListening && transcript && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50 whitespace-nowrap max-w-[200px]">
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--r-sm)] px-3 py-1.5 shadow-lg text-xs text-[var(--text)] truncate">
            {transcript}
          </div>
          {/* Arrow */}
          <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-[var(--surface)] border-t border-l border-[var(--border)] rotate-45" />
        </div>
      )}
    </div>
  );
}
