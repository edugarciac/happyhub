import { buildIcsCalendar, escapeIcsText, foldIcsLine } from '@/utils/icalendar';

describe('icalendar', () => {
  it('escapes special characters', () => {
    expect(escapeIcsText('a,b;c\\d\ne')).toBe('a\\,b\;c\\\\d\\ne');
  });

  it('folds long lines at 75 octets without splitting UTF-8 characters', () => {
    const line = 'DESCRIPTION:' + 'ñ'.repeat(60);
    const folded = foldIcsLine(line);
    const parts = folded.split('\r\n');
    expect(parts.length).toBeGreaterThan(1);
    parts.forEach((p) => expect(Buffer.byteLength(p, 'utf8')).toBeLessThanOrEqual(75));
    expect(parts.map((p, i) => (i === 0 ? p : p.slice(1))).join('')).toBe(line);
  });

  it('builds events in Madrid time, ending the next day when the end is before the start', () => {
    const ics = buildIcsCalendar(
      'HappyHub',
      [
        { uid: 'reservation-7@happyhub.es', date: '2026-11-21', start: '16:00', end: '22:00', summary: 'Ana, 20 pers.', status: 'CONFIRMED' },
        { uid: 'blocked-1@happyhub.es', date: '2026-12-31', start: '22:00', end: '02:00', summary: 'Bloqueado' },
      ],
      new Date('2026-10-20T10:00:00Z')
    );
    expect(ics.startsWith('BEGIN:VCALENDAR\r\n')).toBe(true);
    expect(ics).toContain('BEGIN:VTIMEZONE\r\nTZID:Europe/Madrid');
    expect(ics).toContain('DTSTART;TZID=Europe/Madrid:20261121T160000');
    expect(ics).toContain('DTEND;TZID=Europe/Madrid:20261121T220000');
    expect(ics).toContain('SUMMARY:Ana\\, 20 pers.');
    expect(ics).toContain('DTEND;TZID=Europe/Madrid:20270101T020000');
    expect(ics).toContain('DTSTAMP:20261020T100000Z');
    expect(ics.endsWith('END:VCALENDAR\r\n')).toBe(true);
  });
});
