import { formatPhoneForWhatsApp, buildWhatsAppUrl } from '../utils/phone';

describe('formatPhoneForWhatsApp', () => {
  it('adds 34 prefix to 9-digit Spanish number', () => {
    expect(formatPhoneForWhatsApp('612345678')).toBe('34612345678');
  });

  it('keeps number with existing 34 prefix', () => {
    expect(formatPhoneForWhatsApp('34612345678')).toBe('34612345678');
  });

  it('strips non-digit characters', () => {
    expect(formatPhoneForWhatsApp('+34 612 345 678')).toBe('34612345678');
  });

  it('replaces leading 0 with 34', () => {
    expect(formatPhoneForWhatsApp('0612345678')).toBe('34612345678');
  });

  it('handles number with dashes', () => {
    expect(formatPhoneForWhatsApp('612-345-678')).toBe('34612345678');
  });

  it('handles number with parentheses', () => {
    expect(formatPhoneForWhatsApp('(612) 345 678')).toBe('34612345678');
  });
});

describe('buildWhatsAppUrl', () => {
  it('builds correct wa.me URL', () => {
    expect(buildWhatsAppUrl('612345678')).toBe('https://wa.me/34612345678');
  });

  it('returns null for null input', () => {
    expect(buildWhatsAppUrl(null)).toBeNull();
  });

  it('returns null for undefined input', () => {
    expect(buildWhatsAppUrl(undefined)).toBeNull();
  });

  it('returns null for empty string', () => {
    expect(buildWhatsAppUrl('')).toBeNull();
  });

  it('returns null for whitespace-only string', () => {
    expect(buildWhatsAppUrl('   ')).toBeNull();
  });

  it('builds URL from international format', () => {
    expect(buildWhatsAppUrl('+34 612 345 678')).toBe('https://wa.me/34612345678');
  });
});
