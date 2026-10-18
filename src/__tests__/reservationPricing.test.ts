import { computeReservationPrice } from '@/lib/reservationPricing';
import { query } from '@/lib/db';

jest.mock('@/lib/db', () => ({ query: jest.fn() }));
const mockQuery = query as jest.Mock;

// Después del plazo del descuento de inauguración, para que no influya
const AFTER_PROMO = new Date('2026-11-01T10:00:00Z');

function mockDb({ rules = { weekday_afternoon: 130, weekday_morning: 120 }, holidays = 0, services = [] as { id: number; price: string }[] } = {}) {
  mockQuery.mockImplementation((sql: string, params?: unknown[]) => {
    if (sql.includes('pricing_rules')) return { rows: Object.entries(rules).map(([rule_name, price]) => ({ rule_name, price: String(price) })) };
    if (sql.includes('holidays')) return { rows: Array.from({ length: holidays }, () => ({})) };
    if (sql.includes('service_catalog')) {
      const ids = (params?.[0] as string[]) || [];
      return { rows: services.filter((s) => ids.includes(String(s.id))) };
    }
    throw new Error(`unexpected query: ${sql}`);
  });
}

describe('computeReservationPrice', () => {
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(AFTER_PROMO);
  });
  afterEach(() => {
    jest.useRealTimers();
    mockQuery.mockReset();
  });

  it('adds 60 € per extra hour and services from the catalog', async () => {
    mockDb({ services: [{ id: 7, price: '50' }] });
    const price = await computeReservationPrice({ date: '2026-11-18', timeSlot: 'afternoon', extraHours: 2, extraIds: ['7'] });
    expect(price).toEqual({ ok: true, basePrice: 130, discount: 0, extrasTotal: 50, total: 300, deposit: 90 });
  });

  it('is "consult" on a holiday without price', async () => {
    mockDb({ holidays: 1 });
    expect(await computeReservationPrice({ date: '2026-12-07', timeSlot: 'afternoon', extraHours: 0, extraIds: [] })).toEqual({
      ok: false,
      reason: 'consult',
    });
  });

  it('rejects services that are not in the catalog', async () => {
    mockDb();
    expect(await computeReservationPrice({ date: '2026-11-18', timeSlot: 'morning', extraHours: 0, extraIds: ['999'] })).toEqual({
      ok: false,
      reason: 'unknown_extras',
    });
  });
});
