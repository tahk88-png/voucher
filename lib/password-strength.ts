/**
 * Password strength validation and scoring.
 *
 * Returns a result with:
 * - valid: whether the password meets minimum requirements
 * - score: 0-4 strength score
 * - feedback: array of improvement suggestions
 */

export interface PasswordStrengthResult {
  valid: boolean;
  score: number; // 0-4
  feedback: string[];
}

export function checkPasswordStrength(password: string): PasswordStrengthResult {
  const feedback: string[] = [];
  let score = 0;

  if (!password) {
    return { valid: false, score: 0, feedback: ['Enter a password'] };
  }

  // Length checks
  if (password.length < 8) {
    feedback.push('Must be at least 8 characters');
  } else {
    score += 1;
    if (password.length >= 12) {
      score += 1;
    }
  }

  // Uppercase check
  if (!/[A-Z]/.test(password)) {
    feedback.push('Add an uppercase letter');
  } else {
    score += 0.5;
  }

  // Lowercase check
  if (!/[a-z]/.test(password)) {
    feedback.push('Add a lowercase letter');
  } else {
    score += 0.25;
  }

  // Number check
  if (!/[0-9]/.test(password)) {
    feedback.push('Add a number');
  } else {
    score += 0.5;
  }

  // Special character check
  if (!/[^A-Za-z0-9]/.test(password)) {
    feedback.push('Add a special character (!@#$%^&*)');
  } else {
    score += 0.75;
  }

  // Penalize common patterns
  const commonPatterns = [
    /^12345/,
    /password/i,
    /qwerty/i,
    /abc123/i,
    /(.)\1{3,}/, // 4+ repeating chars
  ];
  for (const pattern of commonPatterns) {
    if (pattern.test(password)) {
      score = Math.max(0, score - 1);
      feedback.push('Avoid common patterns');
      break;
    }
  }

  // Cap score at 4
  const finalScore = Math.min(4, Math.round(score));

  // Valid means all core rules pass: 8+ chars, uppercase, number, special
  const valid =
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[0-9]/.test(password) &&
    /[^A-Za-z0-9]/.test(password);

  return { valid, score: finalScore, feedback };
}

export function getStrengthLabel(score: number): string {
  switch (score) {
    case 0:
      return 'Very weak';
    case 1:
      return 'Weak';
    case 2:
      return 'Fair';
    case 3:
      return 'Strong';
    case 4:
      return 'Very strong';
    default:
      return '';
  }
}

export function getStrengthColor(score: number): string {
  switch (score) {
    case 0:
      return '#ef4444'; // red
    case 1:
      return '#f97316'; // orange
    case 2:
      return '#eab308'; // yellow
    case 3:
      return '#22c55e'; // green
    case 4:
      return '#16a34a'; // dark green
    default:
      return '#d1d5db';
  }
}
