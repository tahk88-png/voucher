"use client";

import { useState, useCallback, useRef, useEffect } from "react";

interface UseVoiceSearchOptions {
  /** Language for speech recognition (default: browser locale) */
  lang?: string;
  /** Auto-submit after speech ends */
  onResult?: (transcript: string) => void;
  /** Continuous listening mode */
  continuous?: boolean;
}

interface UseVoiceSearchReturn {
  /** Current transcript text */
  transcript: string;
  /** Whether the mic is actively listening */
  isListening: boolean;
  /** Whether the browser supports Web Speech API */
  isSupported: boolean;
  /** Start listening for speech */
  startListening: () => void;
  /** Stop listening */
  stopListening: () => void;
  /** Clear the transcript */
  clearTranscript: () => void;
}

/**
 * Hook for Web Speech API voice-to-text.
 * Provides real-time transcript, listening state, and browser support detection.
 */
export function useVoiceSearch(
  options: UseVoiceSearchOptions = {}
): UseVoiceSearchReturn {
  const { lang, onResult, continuous = false } = options;
  const [transcript, setTranscript] = useState("");
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  // Check browser support
  const isSupported =
    typeof window !== "undefined" &&
    ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

  const createRecognition = useCallback(() => {
    if (!isSupported) return null;

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.continuous = continuous;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    if (lang) {
      recognition.lang = lang;
    }

    return recognition;
  }, [isSupported, continuous, lang]);

  const startListening = useCallback(() => {
    if (!isSupported) return;

    // Stop existing instance
    if (recognitionRef.current) {
      recognitionRef.current.abort();
    }

    const recognition = createRecognition();
    if (!recognition) return;

    recognitionRef.current = recognition;
    setTranscript("");

    let finalTranscript = "";

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
        } else {
          interim += result[0].transcript;
        }
      }
      setTranscript(finalTranscript + interim);
    };

    recognition.onend = () => {
      setIsListening(false);
      if (finalTranscript.trim()) {
        onResult?.(finalTranscript.trim());
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error("Speech recognition error:", event.error);
      setIsListening(false);
    };

    recognition.onstart = () => {
      setIsListening(true);
    };

    try {
      recognition.start();
    } catch (err) {
      console.error("Failed to start speech recognition:", err);
      setIsListening(false);
    }
  }, [isSupported, createRecognition, onResult]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  }, []);

  const clearTranscript = useCallback(() => {
    setTranscript("");
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  return {
    transcript,
    isListening,
    isSupported,
    startListening,
    stopListening,
    clearTranscript,
  };
}

// Extend window for TypeScript
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}
