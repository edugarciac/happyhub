import { daysUntilEvent, isFullRefundEligible } from '@/utils/cancellationPolicy';

describe('cancellationPolicy', () => {
  const at = (iso: string) => new Date(iso);

  it('counts calendar days in Madrid time', () => {
    expect(daysUntilEvent('2026-11-16', at('2026-11-01T10:00:00Z'))).toBe(15);
    // 23:30 UTC del 31/10 ya es 1/11 en Madrid
    expect(daysUntilEvent('2026-11-16', at('2026-10-31T23:30:00Z'))).toBe(15);
    expect(daysUntilEvent('2026-11-16T00:00:00.000Z', at('2026-11-16T08:00:00Z'))).toBe(0);
    expect(daysUntilEvent('2026-11-16', at('2026-11-20T08:00:00Z'))).toBe(-4);
  });

  it('is eligible from 15 days before the event', () => {
    expect(isFullRefundEligible('2026-11-16', at('2026-11-01T12:00:00Z'))).toBe(true);
    expect(isFullRefundEligible('2026-11-16', at('2026-11-02T12:00:00Z'))).toBe(false);
  });
});
