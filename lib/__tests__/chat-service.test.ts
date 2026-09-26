import { describe, it, expect, vi, afterEach } from 'vitest';

vi.mock('@/lib/prisma', () => ({ prisma: {} }));
vi.mock('../prisma', () => ({ prisma: {} }));

import { getFallbackResponse, getSystemPrompt, getHumanSupportHint } from '@/lib/chat-service';

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('chat fallback responses', () => {
  it('greets only on a whole-word greeting', () => {
    expect(getFallbackResponse('hi')).toMatch(/automated assistant/);
    expect(getFallbackResponse('Hey there!')).toMatch(/automated assistant/);
    expect(getFallbackResponse('Привет')).toMatch(/automated assistant/);
    // "this", "which", "shipping" all contain "hi" and used to trigger the greeting.
    expect(getFallbackResponse('which shipping options do you have?')).not.toMatch(/automated assistant/);
    expect(getFallbackResponse('this is broken')).not.toMatch(/automated assistant/);
  });

  it('never hands out a placeholder support address', () => {
    vi.stubEnv('NEXT_PUBLIC_APP_URL', 'http://localhost:3000');
    vi.stubEnv('CONTACT_EMAIL', '');
    expect(getHumanSupportHint()).not.toContain('@');
    expect(getFallbackResponse('something else')).not.toContain('support@localhost');

    vi.stubEnv('CONTACT_EMAIL', 'help@gifthub.ee');
    expect(getHumanSupportHint()).toBe('help@gifthub.ee');
  });
});

describe('chat system prompt', () => {
  it('uses the GiftHub brand and presents the assistant as automated', () => {
    vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://app.example.com');
    const prompt = getSystemPrompt();
    expect(prompt).toContain('ABOUT GIFTHUB');
    expect(prompt).not.toMatch(/VOUCHR/i);
    expect(prompt).toMatch(/automated/);
  });
});
