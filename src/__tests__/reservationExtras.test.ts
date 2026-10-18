import { parseReservationExtras, resolveReservationExtras, extrasTotal } from '@/lib/reservationExtras';
import { query } from '@/lib/db';

jest.mock('@/lib/db', () => ({ query: jest.fn() }));
const mockQuery = query as jest.Mock;

const CATALOG = [
  { id: 1, title: 'Decoración', price: '50.00' },
  { id: 2, title: 'Photocall', price: '30' },
];

beforeEach(() => {
  mockQuery.mockReset();
  mockQuery.mockImplementation((_sql: string, params: unknown[]) => {
    const ids = params[0] as string[];
    return { rows: CATALOG.filter((s) => ids.includes(String(s.id))) };
  });
});

describe('resolveReservationExtras', () => {
  it('resolves catalog ids with title and price', async () => {
    expect(await resolveReservationExtras(['1', 2])).toEqual([
      { id: '1', title: 'Decoración', price: 50 },
      { id: '2', title: 'Photocall', price: 30 },
    ]);
  });

  it('returns null when a service is not active in the catalog', async () => {
    expect(await resolveReservationExtras(['1', '99'])).toBeNull();
  });

  it('keeps already stored services with their contracted price without querying', async () => {
    const stored = [{ id: '99', title: 'Retirado', price: 80 }];
    expect(await resolveReservationExtras(['99'], stored)).toEqual(stored);
    expect(mockQuery).not.toHaveBeenCalled();
  });

  it('drops stored services that are no longer selected', async () => {
    const stored = [{ id: '99', title: 'Retirado', price: 80 }];
    expect(await resolveReservationExtras(['2'], stored)).toEqual([{ id: '2', title: 'Photocall', price: 30 }]);
  });

  it('treats a missing list as no services', async () => {
    expect(await resolveReservationExtras(undefined)).toEqual([]);
  });
});

describe('parseReservationExtras', () => {
  it('parses JSON strings and ignores bad data', () => {
    expect(parseReservationExtras('[{"id":1,"title":"A","price":"10"}]')).toEqual([{ id: '1', title: 'A', price: 10 }]);
    expect(parseReservationExtras('nope')).toEqual([]);
    expect(parseReservationExtras(null)).toEqual([]);
  });

  it('sums the total', () => {
    expect(extrasTotal([{ id: '1', title: 'A', price: 10 }, { id: '2', title: 'B', price: 5.5 }])).toBe(15.5);
  });
});
