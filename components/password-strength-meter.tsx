"use client";

import { useMemo } from "react";
import {
  checkPasswordStrength,
  getStrengthLabel,
  getStrengthColor,
} from "@/lib/password-strength";

interface PasswordStrengthMeterProps {
  password: string;
}

export default function PasswordStrengthMeter({
  password,
}: PasswordStrengthMeterProps) {
  const result = useMemo(() => checkPasswordStrength(password), [password]);

  if (!password) return null;

  const label = getStrengthLabel(result.score);
  const color = getStrengthColor(result.score);

  return (
    <div className="mt-2 space-y-1.5">
      {/* Strength bar */}
      <div className="flex gap-1">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-1.5 flex-1 rounded-full transition-all duration-300"
            style={{
              backgroundColor: i < result.score ? color : "var(--border)",
            }}
          />
        ))}
      </div>

      {/* Label */}
      <div className="flex items-center justify-between">
        <span
          className="text-xs font-medium transition-colors duration-300"
          style={{ color }}
        >
          {label}
        </span>
      </div>

      {/* Feedback */}
      {result.feedback.length > 0 && (
        <ul className="space-y-0.5">
          {result.feedback.map((msg, i) => (
            <li
              key={i}
              className="text-xs text-[var(--text-muted)] flex items-start gap-1.5"
            >
              <span className="mt-1 w-1 h-1 rounded-full bg-[var(--text-muted)] shrink-0" />
              {msg}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
