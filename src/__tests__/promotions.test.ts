import { isOpeningDiscountActive, isOpeningDiscountEligible, openingDiscountAmount } from '../config/promotions';

const at = (iso: string) => new Date(iso);

describe('opening discount', () => {
  it('applies 10% on the rental for eligible requests', () => {
    expect(openingDiscountAmount(130, '2026-11-10', at('2026-10-15T10:00:00Z'))).toBe(13);
    expect(openingDiscountAmount(200, '2026-12-30', at('2026-10-15T10:00:00Z'))).toBe(20);
  });

  it('is still active on the opening day (Madrid time)', () => {
    // 23:30 en Madrid del 18/10 (21:30 UTC, horario de verano)
    expect(isOpeningDiscountActive(at('2026-10-18T21:30:00Z'))).toBe(true);
  });

  it('ends after the opening day (Madrid time)', () => {
    // 00:30 en Madrid del 19/10 (22:30 UTC del 18/10)
    expect(isOpeningDiscountActive(at('2026-10-18T22:30:00Z'))).toBe(false);
    expect(openingDiscountAmount(130, '2026-11-10', at('2026-10-19T10:00:00Z'))).toBe(0);
  });

  it('does not apply to events after 30/12/2026', () => {
    expect(isOpeningDiscountEligible('2026-12-31', at('2026-10-15T10:00:00Z'))).toBe(false);
    expect(openingDiscountAmount(130, '2027-01-10', at('2026-10-15T10:00:00Z'))).toBe(0);
  });

  it('returns 0 when there is no rental price', () => {
    expect(openingDiscountAmount(0, '2026-11-10', at('2026-10-15T10:00:00Z'))).toBe(0);
  });
});
