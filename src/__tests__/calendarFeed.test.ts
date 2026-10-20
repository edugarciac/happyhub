const query = jest.fn();
jest.mock('@/lib/db', () => ({ query: (...a: unknown[]) => query(...a), queryOne: jest.fn() }));
jest.mock('@/lib/reservationFlow', () => ({ ensureReservationFlowColumns: jest.fn().mockResolvedValue(undefined) }));
jest.mock('@/lib/contractAcceptance', () => ({ ensureContractAcceptancesTable: jest.fn().mockResolvedValue(undefined) }));

import { buildCalendarFeed, calendarFeedToken, calendarFeedUrl, isValidCalendarFeedToken } from '@/lib/calendarFeed';

describe('calendarFeed', () => {
  const env = process.env;
  beforeEach(() => {
    process.env = { ...env, NEXTAUTH_SECRET: 'test-secret' };
    delete process.env.CALENDAR_FEED_SECRET;
    query.mockReset();
  });
  afterAll(() => { process.env = env; });

  it('derives a stable secret token and validates it', () => {
    const token = calendarFeedToken()!;
    expect(token).toMatch(/^[0-9a-f]{32}$/);
    expect(isValidCalendarFeedToken(token)).toBe(true);
    expect(isValidCalendarFeedToken('0'.repeat(32))).toBe(false);
    expect(isValidCalendarFeedToken('short')).toBe(false);
    expect(calendarFeedUrl('https://www.happyhub.es/')).toBe(`https://www.happyhub.es/api/calendar/${token}.ics`);
  });

  it('changes the token when CALENDAR_FEED_SECRET is set', () => {
    const before = calendarFeedToken();
    process.env.CALENDAR_FEED_SECRET = 'rotated';
    expect(calendarFeedToken()).not.toBe(before);
  });

  it('builds events with status, times and details', async () => {
    query
      .mockResolvedValueOnce({ rows: [{
        id: 48, event_date: '2026-11-21', time_slot: 'afternoon', extra_hours: 2, extras: [{ id: 1, title: 'Globos', price: 40 }],
        event_type: 'cumpleaños', guests: 20, total_price: '200', deposit_amount: '60', payment_status: 'deposit_paid',
        payment_method: 'card', remaining_payment_method: null, status: 'confirmed', notes: null, needs_kids_furniture: true,
        updated_at: new Date('2026-10-19T10:00:00Z'), name: 'Ana', email: 'ana@example.com', phone: '600',
      }] })
      .mockResolvedValueOnce({ rows: [{ id: 3, slot_date: '2026-12-24', time_slot: 'night', reason: 'Nochebuena' }] });
    const ics = await buildCalendarFeed('https://www.happyhub.es');
    expect(ics).toContain('UID:reservation-48@happyhub.es');
    expect(ics).toContain('SUMMARY:✅ [Señal pagada] Ana · 20 pers. · Cumpleaños');
    expect(ics).toContain('DTSTART;TZID=Europe/Madrid:20261121T160000');
    expect(ics).toContain('DTEND;TZID=Europe/Madrid:20261121T220000');
    expect(ics.replace(/\r\n /g, '')).toContain('Pago: Señal pagada · falta 140 €');
    expect(ics).toContain('UID:blocked-3@happyhub.es');
    expect(ics).toContain('DTEND;TZID=Europe/Madrid:20261225T020000');
    expect(query.mock.calls[0][0]).toContain("r.status IN ('pending', 'approved', 'confirmed', 'completed')");
  });
});
