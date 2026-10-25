import { query } from '@/lib/db';
import { getActivePricingRules } from '@/lib/pricingRules';
import { openingDiscountAmount } from '@/config/promotions';
import { DEFAULT_PRICING_RULES, bookingTotals, getPricingRuleKeyFor, type TimeSlot } from '@/utils/pricing';

export type ServerPrice =
  | { ok: true; basePrice: number; discount: number; extrasTotal: number; total: number; deposit: number }
  | { ok: false; reason: 'consult' | 'unknown_extras' };

/** 'YYYY-MM-DD' + n días, sin pasar por UTC */
function addDays(dateStr: string, days: number): string {
  const d = new Date(`${dateStr}T12:00:00`);
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * Recalcula en el servidor el precio de una reserva con las mismas reglas que el
 * wizard (parrilla de pricing_rules, festivos, descuento, horas adicionales y
 * servicios del catálogo). Nunca se confía en el total que envía el navegador.
 */
export async function computeReservationPrice(params: {
  date: string;
  timeSlot: TimeSlot;
  extraHours: number;
  extraIds: string[];
}): Promise<ServerPrice> {
  const [rules, holidaysResult] = await Promise.all([
    getActivePricingRules(),
    query('SELECT 1 FROM holidays WHERE holiday_date IN ($1::date, $2::date)', [params.date, addDays(params.date, 1)]),
  ]);
  const ruleKey = getPricingRuleKeyFor(new Date(`${params.date}T12:00:00`), params.timeSlot, holidaysResult.rows.length > 0);
  // Igual que el wizard: si la BD no tiene reglas, se usa la parrilla por defecto
  const basePrice = (Object.keys(rules).length > 0 ? rules : DEFAULT_PRICING_RULES)[ruleKey];
  if (!basePrice) return { ok: false, reason: 'consult' };

  let extrasTotal = 0;
  const extraIds = Array.from(new Set(params.extraIds.map(String)));
  if (extraIds.length > 0) {
    const services = await query('SELECT id, price FROM service_catalog WHERE active = true AND id::text = ANY($1::text[])', [extraIds]);
    if (services.rows.length !== extraIds.length) return { ok: false, reason: 'unknown_extras' };
    extrasTotal = services.rows.reduce((sum: number, row: any) => sum + (parseFloat(row.price) || 0), 0);
  }

  const discount = openingDiscountAmount(basePrice, params.date);
  const { total, deposit } = bookingTotals({ basePrice, discount, extraHours: params.extraHours, extrasTotal });
  return { ok: true, basePrice, discount, extrasTotal, total, deposit };
}
