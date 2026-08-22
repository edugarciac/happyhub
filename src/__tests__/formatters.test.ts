import {
  formatCurrency,
  formatPhone,
  formatEventType,
  formatDuration,
  calculatePrice,
  truncateText,
  slugify,
} from '../utils/formatters';

describe('formatCurrency', () => {
  it('formats a whole number', () => {
    const result = formatCurrency(100);
    expect(result).toContain('100');
    expect(result).toContain('€');
  });

  it('formats a decimal number', () => {
    const result = formatCurrency(99.5);
    expect(result).toContain('99');
    expect(result).toContain('€');
  });

  it('formats zero', () => {
    const result = formatCurrency(0);
    expect(result).toContain('0');
    expect(result).toContain('€');
  });

  it('formats large numbers with grouping', () => {
    const result = formatCurrency(1500);
    expect(result).toContain('€');
  });
});

describe('formatPhone', () => {
  it('formats 9-digit Spanish number with spaces', () => {
    expect(formatPhone('612345678')).toBe('612 345 678');
  });

  it('returns original if not 9 digits', () => {
    expect(formatPhone('+34612345678')).toBe('+34612345678');
  });

  it('strips non-digits before formatting', () => {
    expect(formatPhone('612-345-678')).toBe('612 345 678');
  });
});

describe('formatEventType', () => {
  it('maps known event types', () => {
    expect(formatEventType('cumpleaños')).toBe('Cumpleaños');
    expect(formatEventType('comunion')).toBe('Comunión');
    expect(formatEventType('bautizo')).toBe('Bautizo');
    expect(formatEventType('otro')).toBe('Otro evento');
  });

  it('returns original string for unknown types', () => {
    expect(formatEventType('boda')).toBe('boda');
  });
});

describe('formatDuration', () => {
  it('replaces h with " horas"', () => {
    expect(formatDuration('2h')).toBe('2 horas');
    expect(formatDuration('5h')).toBe('5 horas');
  });
});

describe('calculatePrice', () => {
  it('returns base price for known durations without extras', () => {
    expect(calculatePrice('2h', 10)).toBe(200);
    expect(calculatePrice('3h', 10)).toBe(300);
    expect(calculatePrice('4h', 10)).toBe(400);
    expect(calculatePrice('5h', 10)).toBe(500);
  });

  it('returns 0 for unknown duration', () => {
    expect(calculatePrice('6h', 10)).toBe(0);
  });

  it('adds flat extras', () => {
    expect(calculatePrice('2h', 10, ['animacion'])).toBe(200 + 150);
    expect(calculatePrice('2h', 10, ['decoracion'])).toBe(200 + 100);
    expect(calculatePrice('2h', 10, ['fotografia'])).toBe(200 + 200);
    expect(calculatePrice('2h', 10, ['tarta'])).toBe(200 + 50);
  });

  it('adds catering per guest', () => {
    expect(calculatePrice('2h', 10, ['catering'])).toBe(200 + 15 * 10);
    expect(calculatePrice('2h', 20, ['catering'])).toBe(200 + 15 * 20);
  });

  it('adds multiple extras', () => {
    expect(calculatePrice('3h', 10, ['catering', 'animacion', 'tarta'])).toBe(
      300 + 15 * 10 + 150 + 50
    );
  });

  it('ignores unknown extras', () => {
    expect(calculatePrice('2h', 10, ['unknown'])).toBe(200);
  });
});

describe('truncateText', () => {
  it('returns short text unchanged', () => {
    expect(truncateText('Hello', 10)).toBe('Hello');
  });

  it('truncates and adds ellipsis for long text', () => {
    expect(truncateText('Hello World', 5)).toBe('Hello...');
  });

  it('returns text unchanged when equal to maxLength', () => {
    expect(truncateText('Hello', 5)).toBe('Hello');
  });
});

describe('slugify', () => {
  it('converts to lowercase', () => {
    expect(slugify('HELLO')).toBe('hello');
  });

  it('replaces spaces with hyphens', () => {
    expect(slugify('hello world')).toBe('hello-world');
  });

  it('removes special characters', () => {
    expect(slugify('hello!@#world')).toBe('helloworld');
  });

  it('collapses multiple separators', () => {
    expect(slugify('hello   world')).toBe('hello-world');
  });

  it('trims leading and trailing hyphens', () => {
    expect(slugify(' hello world ')).toBe('hello-world');
  });

  it('handles mixed input', () => {
    expect(slugify('Cumpleaños Infantil 2025!')).toBe('cumpleaos-infantil-2025');
  });
});
