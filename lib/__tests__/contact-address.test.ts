import { describe, it, expect } from 'vitest';
import { isPlaceholderEmail, publicContactEmail } from '@/lib/contact-address';

describe('isPlaceholderEmail', () => {
  it.each([
    'support@example.com',
    'support@app.example.com',
    'help@example.org',
    'x@example.net',
    'support@localhost',
    'support@shop.test',
    'support@gifthub.local',
    'support@127.0.0.1',
    'not-an-address',
    '',
  ])('treats %s as a placeholder', (address) => {
    expect(isPlaceholderEmail(address)).toBe(true);
  });

  it.each(['support@gifthub.ee', 'help@mail.shop.eu', 'team@examples.com'])('accepts %s', (address) => {
    expect(isPlaceholderEmail(address)).toBe(false);
  });
});

describe('publicContactEmail', () => {
  it('returns null for placeholders and the address otherwise', () => {
    expect(publicContactEmail('support@example.com')).toBeNull();
    expect(publicContactEmail(null)).toBeNull();
    expect(publicContactEmail('support@gifthub.ee')).toBe('support@gifthub.ee');
  });
});
