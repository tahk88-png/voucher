/**
 * Content Moderation — checks text for banned words, spam patterns, and sentiment.
 * Returns a moderation decision with flags and confidence score.
 */

export interface ModerationResult {
  approved: boolean;
  flags: string[];
  confidence: number; // 0-1, higher = more confident in decision
  suggestedAction: 'approve' | 'flag_for_review' | 'reject';
}

const BANNED_WORDS = [
  'scam', 'fraud', 'fake', 'counterfeit', 'illegal',
  'hack', 'exploit', 'phishing', 'malware', 'virus',
  'nigger', 'faggot', 'retard', 'slut', 'whore',
  'kill yourself', 'die', 'murder',
];

const NEGATIVE_KEYWORDS = [
  'terrible', 'horrible', 'awful', 'disgusting', 'worst',
  'hate', 'angry', 'furious', 'ripoff', 'rip-off', 'waste',
  'trash', 'garbage', 'useless', 'pathetic', 'scummy',
  'never again', 'do not buy', 'stay away', 'avoid',
];

const POSITIVE_KEYWORDS = [
  'great', 'excellent', 'amazing', 'wonderful', 'fantastic',
  'love', 'awesome', 'perfect', 'best', 'recommend',
  'happy', 'satisfied', 'quality', 'impressive', 'superb',
  'thank', 'helpful', 'friendly', 'professional',
];

const URL_PATTERN = /https?:\/\/[^\s]+/gi;
const EXCESSIVE_CAPS_THRESHOLD = 0.6; // 60% uppercase = suspicious
const EXCESSIVE_PUNCTUATION_PATTERN = /([!?.])\1{2,}/g; // 3+ repeated punctuation
const REPEATED_CHARS_PATTERN = /(.)\1{4,}/g; // 5+ repeated characters

export function moderateContent(text: string): ModerationResult {
  const flags: string[] = [];
  let score = 0; // negative = bad, positive = good

  if (!text || text.trim().length === 0) {
    return { approved: true, flags: [], confidence: 1, suggestedAction: 'approve' };
  }

  const lowerText = text.toLowerCase();
  const words = lowerText.split(/\s+/);

  // 1. Banned words check (highest severity)
  for (const banned of BANNED_WORDS) {
    if (lowerText.includes(banned)) {
      flags.push(`banned_word: "${banned}"`);
      score -= 30;
    }
  }

  // 2. Spam pattern checks
  // ALL CAPS check (only for texts longer than 10 chars)
  if (text.length > 10) {
    const alphaChars = text.replace(/[^a-zA-Z]/g, '');
    const upperChars = text.replace(/[^A-Z]/g, '');
    if (alphaChars.length > 0 && upperChars.length / alphaChars.length > EXCESSIVE_CAPS_THRESHOLD) {
      flags.push('excessive_caps');
      score -= 10;
    }
  }

  // Excessive punctuation
  if (EXCESSIVE_PUNCTUATION_PATTERN.test(text)) {
    flags.push('excessive_punctuation');
    score -= 5;
  }

  // Repeated characters (e.g., "aaaaaaa")
  if (REPEATED_CHARS_PATTERN.test(text)) {
    flags.push('repeated_characters');
    score -= 5;
  }

  // URL detection
  const urlMatches = text.match(URL_PATTERN);
  if (urlMatches && urlMatches.length > 0) {
    flags.push(`contains_urls (${urlMatches.length})`);
    score -= 8 * urlMatches.length;
  }

  // Very short or very long content
  if (text.trim().length < 5) {
    flags.push('too_short');
    score -= 5;
  }
  if (text.length > 5000) {
    flags.push('too_long');
    score -= 5;
  }

  // 3. Sentiment analysis (simple keyword-based)
  let negativeCount = 0;
  let positiveCount = 0;

  for (const kw of NEGATIVE_KEYWORDS) {
    if (lowerText.includes(kw)) negativeCount++;
  }
  for (const kw of POSITIVE_KEYWORDS) {
    if (lowerText.includes(kw)) positiveCount++;
  }

  if (negativeCount > 3 && positiveCount === 0) {
    flags.push(`highly_negative_sentiment (${negativeCount} negative keywords)`);
    score -= 10;
  } else if (negativeCount > positiveCount * 2 && negativeCount > 2) {
    flags.push(`negative_sentiment (${negativeCount} negative vs ${positiveCount} positive)`);
    score -= 5;
  }

  // Determine result
  const hasBannedWord = flags.some(f => f.startsWith('banned_word'));
  let suggestedAction: ModerationResult['suggestedAction'];
  let approved: boolean;
  let confidence: number;

  if (hasBannedWord) {
    suggestedAction = 'reject';
    approved = false;
    confidence = 0.95;
  } else if (score <= -15) {
    suggestedAction = 'flag_for_review';
    approved = false;
    confidence = Math.min(0.9, 0.5 + Math.abs(score) * 0.02);
  } else if (score <= -5) {
    suggestedAction = 'flag_for_review';
    approved = false;
    confidence = 0.5 + Math.abs(score) * 0.02;
  } else {
    suggestedAction = 'approve';
    approved = true;
    confidence = Math.min(0.95, 0.7 + positiveCount * 0.03);
  }

  return { approved, flags, confidence: Math.round(confidence * 100) / 100, suggestedAction };
}
