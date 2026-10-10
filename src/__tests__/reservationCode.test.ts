import { buildReservationCode, parseReservationCode } from '@/utils/reservationCode';

describe('reservationCode', () => {
  it('round-trips build and parse', () => {
    expect(parseReservationCode(buildReservationCode('2026-10-20', 5))).toBe(5);
    expect(parseReservationCode(buildReservationCode('2026-10-20', 1234))).toBe(1234);
  });

  it('accepts plain numeric ids (admin payment links)', () => {
    expect(parseReservationCode('42')).toBe(42);
    expect(parseReservationCode(42)).toBe(42);
  });

  it('rejects unknown formats', () => {
    expect(parseReservationCode('RES-1791624804086')).toBeNull(); // antiguo fallback sin id
    expect(parseReservationCode('')).toBeNull();
    expect(parseReservationCode(undefined)).toBeNull();
    expect(parseReservationCode('0')).toBeNull();
    expect(parseReservationCode("1 OR 1=1")).toBeNull();
  });
});
