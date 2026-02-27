/**
 * Database-backed pricing utilities
 * Replaces hardcoded pricing with database queries
 */

import { query } from '../lib/db';
import { isWeekend, isFriday, isHoliday, isHolidayEve, TimeSlot } from './pricing';

// Cache for pricing rules (5 minutes)
let pricingCache: Record<string, number> | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

async function getPricingRules(): Promise<Record<string, number>> {
  const now = Date.now();

  // Return cached if still valid
  if (pricingCache && now - cacheTimestamp < CACHE_DURATION) {
    return pricingCache;
  }

  try {
    const result = await query(
      `SELECT rule_name, price
       FROM pricing_rules
       WHERE active = true
         AND (effective_from IS NULL OR effective_from <= CURRENT_DATE)
         AND (effective_to IS NULL OR effective_to >= CURRENT_DATE)`
    );

    const pricing: Record<string, number> = {};
    result.rows.forEach((row: any) => {
      pricing[row.rule_name] = parseFloat(row.price);
    });

    pricingCache = pricing;
    cacheTimestamp = now;

    return pricing;
  } catch (error) {
    console.error('Error fetching pricing from database:', error);
    // Fallback to hardcoded if DB fails
    return getHardcodedPricing();
  }
}

function getHardcodedPricing(): Record<string, number> {
  return {
    weekday_morning: 110,
    weekday_afternoon: 110,
    friday_afternoon: 155,
    weekend_morning: 145,
    weekend_afternoon: 185,
    holiday_morning: 145,
    holiday_afternoon: 185,
    night_consult: 0,
    night_consult_weekend: 0,
  };
}

export async function calculateBasePriceFromDb(
  date: Date,
  timeSlot: TimeSlot
): Promise<number | 'consult'> {
  // Night is always consult
  if (timeSlot === 'night') {
    return 'consult';
  }

  const pricing = await getPricingRules();

  // Determine day type
  const isHolidayDay = isHoliday(date);
  const isWeekendDay = isWeekend(date);
  const isFridayDay = isFriday(date);
  const isHolidayEveDay = isHolidayEve(date);

  let ruleKey: string;

  if (isHolidayDay) {
    ruleKey = `holiday_${timeSlot}`;
  } else if (isWeekendDay) {
    ruleKey = `weekend_${timeSlot}`;
  } else if (isFridayDay && timeSlot === 'afternoon') {
    ruleKey = 'friday_afternoon';
  } else if (isHolidayEveDay && timeSlot === 'afternoon') {
    ruleKey = 'friday_afternoon'; // Same price as Friday
  } else {
    ruleKey = `weekday_${timeSlot}`;
  }

  const price = pricing[ruleKey];

  if (price === undefined) {
    console.warn(`No pricing rule found for: ${ruleKey}, using fallback`);
    return 110; // Fallback price
  }

  return price === 0 ? 'consult' : price;
}

export { getPricingRules };
