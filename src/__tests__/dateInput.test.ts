import { displayToIso, formatTyping, isoToDisplay } from '@/utils/dateInput';

describe('dateInput helpers', () => {
  it('converts ISO to dd/mm/aaaa', () => {
    expect(isoToDisplay('2026-10-17')).toBe('17/10/2026');
    expect(isoToDisplay('')).toBe('');
    expect(isoToDisplay(null)).toBe('');
    expect(isoToDisplay('17/10/2026')).toBe('');
  });

  it('auto-inserts slashes while typing and ignores non-digits', () => {
    expect(formatTyping('1')).toBe('1');
    expect(formatTyping('17')).toBe('17');
    expect(formatTyping('171')).toBe('17/1');
    expect(formatTyping('1710')).toBe('17/10');
    expect(formatTyping('17102026')).toBe('17/10/2026');
    expect(formatTyping('17/10/2026')).toBe('17/10/2026');
    expect(formatTyping('17-10-2026999')).toBe('17/10/2026');
  });

  it('parses dd/mm/aaaa to ISO, rejecting impossible dates', () => {
    expect(displayToIso('17/10/2026')).toBe('2026-10-17');
    expect(displayToIso('29/02/2028')).toBe('2028-02-29');
    expect(displayToIso('29/02/2026')).toBeNull();
    expect(displayToIso('31/04/2026')).toBeNull();
    expect(displayToIso('10/13/2026')).toBeNull();
    expect(displayToIso('17/10/26')).toBeNull();
  });
});
