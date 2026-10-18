import {
  isWeekend,
  isFriday,
  isHoliday,
  isHolidayEve,
  calculateBasePrice,
  getPriceLabel,
  getDayTypeDescription,
  getAvailableTimeSlotsWithPricing,
  formatPriceInfo,
  getPricingRuleKey,
  resolvePriceFromRules,
  TIME_SLOTS,
} from '../utils/pricing';

describe('isWeekend', () => {
  it('returns true for Saturday', () => {
    expect(isWeekend(new Date('2025-01-04'))).toBe(true); // Saturday
  });

  it('returns true for Sunday', () => {
    expect(isWeekend(new Date('2025-01-05'))).toBe(true); // Sunday
  });

  it('returns false for Monday', () => {
    expect(isWeekend(new Date('2025-01-06'))).toBe(false);
  });

  it('returns false for Wednesday', () => {
    expect(isWeekend(new Date('2025-01-08'))).toBe(false);
  });

  it('returns false for Friday', () => {
    expect(isWeekend(new Date('2025-01-03'))).toBe(false);
  });
});

describe('isFriday', () => {
  it('returns true for Friday', () => {
    expect(isFriday(new Date('2025-01-03'))).toBe(true);
  });

  it('returns false for Saturday', () => {
    expect(isFriday(new Date('2025-01-04'))).toBe(false);
  });

  it('returns false for Thursday', () => {
    expect(isFriday(new Date('2025-01-02'))).toBe(false);
  });
});

describe('isHoliday', () => {
  it('returns true for known holidays', () => {
    expect(isHoliday(new Date('2026-01-01'))).toBe(true); // Año Nuevo
    expect(isHoliday(new Date('2026-01-06'))).toBe(true); // Reyes
    expect(isHoliday(new Date('2026-12-25'))).toBe(true); // Navidad
  });

  it('returns false for regular weekdays', () => {
    expect(isHoliday(new Date('2025-01-02'))).toBe(false);
    expect(isHoliday(new Date('2025-03-15'))).toBe(false);
  });
});

describe('isHolidayEve', () => {
  it('returns true for the day before a holiday', () => {
    // Dec 31 is eve of Jan 1 (Año Nuevo) — but crosses year boundary.
    // Jan 5 is eve of Jan 6 (Reyes)
    expect(isHolidayEve(new Date('2026-01-05'))).toBe(true);
  });

  it('returns false for a day not before a holiday', () => {
    expect(isHolidayEve(new Date('2025-01-02'))).toBe(false);
  });
});

describe('calculateBasePrice', () => {
  it('returns "consult" for night slot regardless of day', () => {
    expect(calculateBasePrice(new Date('2025-01-06'), 'night')).toBe('consult');
    expect(calculateBasePrice(new Date('2025-01-04'), 'night')).toBe('consult');
  });

  it('returns 160 for weekend morning', () => {
    expect(calculateBasePrice(new Date('2025-01-04'), 'morning')).toBe(160); // Saturday
  });

  it('returns 200 for weekend afternoon', () => {
    expect(calculateBasePrice(new Date('2025-01-04'), 'afternoon')).toBe(200); // Saturday
  });

  it('returns "consult" for both slots on a holiday', () => {
    expect(calculateBasePrice(new Date('2026-05-01'), 'morning')).toBe('consult'); // Día del Trabajo (Friday)
    expect(calculateBasePrice(new Date('2026-05-01'), 'afternoon')).toBe('consult');
  });

  it('returns "consult" for both slots on a holiday eve', () => {
    // Jun 23 (Tuesday, eve of Jun 24 holiday)
    expect(calculateBasePrice(new Date('2026-06-23'), 'morning')).toBe('consult');
    expect(calculateBasePrice(new Date('2026-06-23'), 'afternoon')).toBe('consult');
  });

  it('returns "consult" on a weekend day that is a holiday eve', () => {
    // Sun Oct 11 2026 is the eve of Oct 12
    expect(calculateBasePrice(new Date('2026-10-11'), 'morning')).toBe('consult');
  });

  it('returns 180 for Friday afternoon', () => {
    expect(calculateBasePrice(new Date('2025-01-03'), 'afternoon')).toBe(180);
  });

  it('returns 120 for Friday morning (weekday rate)', () => {
    expect(calculateBasePrice(new Date('2025-01-03'), 'morning')).toBe(120);
  });

  it('returns 120 for regular weekday morning', () => {
    expect(calculateBasePrice(new Date('2025-01-07'), 'morning')).toBe(120); // Tuesday
  });

  it('returns 130 for regular weekday afternoon (Mon-Thu)', () => {
    expect(calculateBasePrice(new Date('2025-01-07'), 'afternoon')).toBe(130); // Tuesday
  });
});

describe('isHoliday with local dates', () => {
  it('matches calendar dates built at local midnight', () => {
    expect(isHoliday(new Date(2026, 9, 12))).toBe(true);
    expect(isHoliday(new Date(2026, 9, 13))).toBe(false);
    expect(isHolidayEve(new Date(2026, 9, 11))).toBe(true);
  });
});

describe('resolvePriceFromRules', () => {
  const rules = {
    weekday_morning: 120,
    weekday_afternoon: 130,
    friday_afternoon: 180,
    weekend_morning: 160,
    weekend_afternoon: 200,
    holiday_morning: 0,
    holiday_afternoon: 0,
  };

  it('uses the DB rules for each day type', () => {
    expect(resolvePriceFromRules(rules, new Date('2025-01-07'), 'afternoon')).toBe(130);
    expect(resolvePriceFromRules(rules, new Date('2025-01-03'), 'afternoon')).toBe(180);
    expect(resolvePriceFromRules(rules, new Date('2025-01-04'), 'morning')).toBe(160);
  });

  it('treats price 0 as "consult" instead of falling back to a fixed price', () => {
    expect(resolvePriceFromRules(rules, new Date('2026-06-23'), 'afternoon')).toBe('consult');
  });

  it('treats a missing rule as "consult"', () => {
    expect(resolvePriceFromRules({}, new Date('2025-01-07'), 'morning')).toBe('consult');
  });

  it('maps holidays and eves to holiday_* rules', () => {
    expect(getPricingRuleKey(new Date('2026-06-23'), 'morning')).toBe('holiday_morning');
    expect(getPricingRuleKey(new Date('2026-06-24'), 'afternoon')).toBe('holiday_afternoon');
  });
});

describe('getPriceLabel', () => {
  it('returns "A consultar" for night slot', () => {
    expect(getPriceLabel(new Date('2025-01-06'), 'night')).toBe('A consultar');
  });

  it('returns formatted euro price for morning weekday', () => {
    expect(getPriceLabel(new Date('2025-01-07'), 'morning')).toBe('120€');
  });

  it('returns formatted euro price for weekend afternoon', () => {
    expect(getPriceLabel(new Date('2025-01-04'), 'afternoon')).toBe('200€');
  });
});

describe('getDayTypeDescription', () => {
  it('returns "Fin de semana" for Saturday', () => {
    expect(getDayTypeDescription(new Date('2025-01-04'))).toBe('Fin de semana');
  });

  it('returns "Festivo" for a holiday', () => {
    expect(getDayTypeDescription(new Date('2026-05-01'))).toBe('Festivo');
  });

  it('returns "Viernes" for Friday', () => {
    expect(getDayTypeDescription(new Date('2025-01-03'))).toBe('Viernes');
  });

  it('returns "Víspera de festivo" for day before a holiday', () => {
    expect(getDayTypeDescription(new Date('2026-06-23'))).toBe('Víspera de festivo');
  });

  it('returns "Día laborable" for regular weekday', () => {
    expect(getDayTypeDescription(new Date('2025-01-07'))).toBe('Día laborable');
  });
});

describe('getAvailableTimeSlotsWithPricing', () => {
  it('returns only bookable slots (morning, afternoon)', () => {
    const slots = getAvailableTimeSlotsWithPricing(new Date('2025-01-07'));
    expect(slots.map((s) => s.id)).toEqual(['morning', 'afternoon']);
  });

  it('includes price and priceLabel for each slot', () => {
    const slots = getAvailableTimeSlotsWithPricing(new Date('2025-01-07'));
    slots.forEach((slot) => {
      expect(slot).toHaveProperty('price');
      expect(slot).toHaveProperty('priceLabel');
      expect(slot).toHaveProperty('id');
      expect(slot).toHaveProperty('label');
    });
  });

  it('returns correct prices for a weekday', () => {
    const slots = getAvailableTimeSlotsWithPricing(new Date('2025-01-07'));
    const morning = slots.find((s) => s.id === 'morning');
    const afternoon = slots.find((s) => s.id === 'afternoon');
    expect(morning?.price).toBe(120);
    expect(afternoon?.price).toBe(130);
  });
});

describe('formatPriceInfo', () => {
  it('returns full info for a weekday morning', () => {
    const info = formatPriceInfo(new Date('2025-01-07'), 'morning');
    expect(info.price).toBe(120);
    expect(info.priceLabel).toBe('120€');
    expect(info.dayType).toBe('Día laborable');
    expect(info.timeSlotLabel).toBe('Mañana');
    expect(info.fullDescription).toBe('Día laborable - Mañana: 120€');
  });

  it('returns "consult" info for night slot', () => {
    const info = formatPriceInfo(new Date('2025-01-07'), 'night');
    expect(info.price).toBe('consult');
    expect(info.priceLabel).toBe('A consultar');
    expect(info.fullDescription).toBe('Horario nocturno - Precio a consultar');
  });

  it('returns weekend afternoon info', () => {
    const info = formatPriceInfo(new Date('2025-01-04'), 'afternoon');
    expect(info.price).toBe(200);
    expect(info.dayType).toBe('Fin de semana');
    expect(info.timeSlotLabel).toBe('Tarde');
  });
});

describe('TIME_SLOTS constant', () => {
  it('has 3 defined time slots', () => {
    expect(TIME_SLOTS).toHaveLength(3);
  });

  it('contains morning, afternoon, night', () => {
    const ids = TIME_SLOTS.map((s) => s.id);
    expect(ids).toEqual(['morning', 'afternoon', 'night']);
  });

  it('each slot has required fields', () => {
    TIME_SLOTS.forEach((slot) => {
      expect(slot.label).toBeTruthy();
      expect(slot.startTime).toBeTruthy();
      expect(slot.endTime).toBeTruthy();
      expect(slot.description).toBeTruthy();
    });
  });
});

import { isValidExtraHours, extraHoursPrice, slotEndTime } from '@/utils/pricing';

describe('extra hours', () => {
  it('prices each extra hour at 60 €', () => {
    expect(extraHoursPrice(0)).toBe(0);
    expect(extraHoursPrice(3)).toBe(180);
  });

  it('extends the afternoon end time up to 23:00', () => {
    expect(slotEndTime('afternoon')).toBe('20:00');
    expect(slotEndTime('afternoon', 3)).toBe('23:00');
  });

  it('only allows 0-3 whole hours, and only in the afternoon', () => {
    expect(isValidExtraHours('afternoon', 2)).toBe(true);
    expect(isValidExtraHours('morning', 0)).toBe(true);
    expect(isValidExtraHours('morning', 1)).toBe(false);
    expect(isValidExtraHours('afternoon', 4)).toBe(false);
    expect(isValidExtraHours('afternoon', 1.5)).toBe(false);
    expect(isValidExtraHours('afternoon', '1')).toBe(false);
  });
});
