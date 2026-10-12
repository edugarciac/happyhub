/**
 * Database-backed pricing utilities
 * Replaces hardcoded pricing with database queries
 */

import { query } from '../lib/db';
import { DEFAULT_PRICING_RULES, resolvePriceFromRules, TimeSlot } from './pricing';

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
  return { ...DEFAULT_PRICING_RULES };
}

export async function calculateBasePriceFromDb(
  date: Date,
  timeSlot: TimeSlot
): Promise<number | 'consult'> {
  const pricing = await getPricingRules();
  return resolvePriceFromRules(pricing, date, timeSlot);
}

export { getPricingRules };
