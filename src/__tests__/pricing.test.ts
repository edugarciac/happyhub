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

  it('returns 130 for weekend morning', () => {
    expect(calculateBasePrice(new Date('2025-01-04'), 'morning')).toBe(130); // Saturday
  });

  it('returns 170 for weekend afternoon', () => {
    expect(calculateBasePrice(new Date('2025-01-04'), 'afternoon')).toBe(170); // Saturday
  });

  it('returns 130 for holiday morning', () => {
    expect(calculateBasePrice(new Date('2026-05-01'), 'morning')).toBe(130); // Día del Trabajo (Friday)
  });

  it('returns 170 for holiday afternoon', () => {
    expect(calculateBasePrice(new Date('2026-05-01'), 'afternoon')).toBe(170);
  });

  it('returns 140 for Friday afternoon', () => {
    expect(calculateBasePrice(new Date('2025-01-03'), 'afternoon')).toBe(140);
  });

  it('returns 110 for Friday morning (weekday rate)', () => {
    expect(calculateBasePrice(new Date('2025-01-03'), 'morning')).toBe(110);
  });

  it('returns 140 for holiday eve afternoon', () => {
    // Jan 5 (Monday) is holiday eve of Reyes, but it's also within a holiday week
    // Use Jun 23 (Tuesday, eve of Jun 24 holiday)
    expect(calculateBasePrice(new Date('2026-06-23'), 'afternoon')).toBe(140);
  });

  it('returns 110 for regular weekday morning', () => {
    expect(calculateBasePrice(new Date('2025-01-07'), 'morning')).toBe(110); // Tuesday
  });

  it('returns 110 for regular weekday afternoon (Mon-Thu)', () => {
    expect(calculateBasePrice(new Date('2025-01-07'), 'afternoon')).toBe(110); // Tuesday
  });
});

describe('getPriceLabel', () => {
  it('returns "A consultar" for night slot', () => {
    expect(getPriceLabel(new Date('2025-01-06'), 'night')).toBe('A consultar');
  });

  it('returns formatted euro price for morning weekday', () => {
    expect(getPriceLabel(new Date('2025-01-07'), 'morning')).toBe('110€');
  });

  it('returns formatted euro price for weekend afternoon', () => {
    expect(getPriceLabel(new Date('2025-01-04'), 'afternoon')).toBe('170€');
  });
});

describe('getDayTypeDescription', () => {
  it('returns "Fin de semana" for Saturday', () => {
    expect(getDayTypeDescription(new Date('2025-01-04'))).toBe('Fin de semana');
  });

  it('returns "Festivo" for a holiday', () => {
    expect(getDayTypeDescription(new Date('2026-05-01'))).toBe('Festivo');
  });

  it('returns "Víspera de festivo" for Friday', () => {
    expect(getDayTypeDescription(new Date('2025-01-03'))).toBe('Víspera de festivo');
  });

  it('returns "Víspera de festivo" for day before a holiday', () => {
    expect(getDayTypeDescription(new Date('2026-06-23'))).toBe('Víspera de festivo');
  });

  it('returns "Día laborable" for regular weekday', () => {
    expect(getDayTypeDescription(new Date('2025-01-07'))).toBe('Día laborable');
  });
});

describe('getAvailableTimeSlotsWithPricing', () => {
  it('returns 3 time slots', () => {
    const slots = getAvailableTimeSlotsWithPricing(new Date('2025-01-07'));
    expect(slots).toHaveLength(3);
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
    const night = slots.find((s) => s.id === 'night');
    expect(morning?.price).toBe(110);
    expect(afternoon?.price).toBe(110);
    expect(night?.price).toBe('consult');
  });
});

describe('formatPriceInfo', () => {
  it('returns full info for a weekday morning', () => {
    const info = formatPriceInfo(new Date('2025-01-07'), 'morning');
    expect(info.price).toBe(110);
    expect(info.priceLabel).toBe('110€');
    expect(info.dayType).toBe('Día laborable');
    expect(info.timeSlotLabel).toBe('Mañana');
    expect(info.fullDescription).toBe('Día laborable - Mañana: 110€');
  });

  it('returns "consult" info for night slot', () => {
    const info = formatPriceInfo(new Date('2025-01-07'), 'night');
    expect(info.price).toBe('consult');
    expect(info.priceLabel).toBe('A consultar');
    expect(info.fullDescription).toBe('Horario nocturno - Precio a consultar');
  });

  it('returns weekend afternoon info', () => {
    const info = formatPriceInfo(new Date('2025-01-04'), 'afternoon');
    expect(info.price).toBe(170);
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
