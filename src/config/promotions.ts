import { OPENING_DATE, todayInMadrid } from './opening';

/**
 * Descuento de inauguración: 10% sobre el alquiler (no sobre extras) para
 * solicitudes hechas hasta el día de la inauguración (hora de Madrid) con
 * fecha de evento hasta el 30/12/2026.
 */
export const OPENING_DISCOUNT = {
  percent: 10,
  requestedUntil: OPENING_DATE,
  eventUntil: '2026-12-30',
  label: 'Descuento inauguración',
  requestedUntilLabel: '18/10',
  eventUntilLabel: '30/12/2026',
};

/** true si la promoción sigue abierta a nuevas solicitudes */
export function isOpeningDiscountActive(now: Date = new Date()): boolean {
  return todayInMadrid(now) <= OPENING_DISCOUNT.requestedUntil;
}

/** true si una solicitud hecha `now` para el evento 'YYYY-MM-DD' tiene descuento */
export function isOpeningDiscountEligible(eventDateStr: string, now: Date = new Date()): boolean {
  return isOpeningDiscountActive(now) && eventDateStr <= OPENING_DISCOUNT.eventUntil;
}

/** Importe del descuento sobre el alquiler (0 si no aplica) */
export function openingDiscountAmount(basePrice: number, eventDateStr: string, now: Date = new Date()): number {
  if (!isOpeningDiscountEligible(eventDateStr, now) || basePrice <= 0) return 0;
  return Math.round(basePrice * OPENING_DISCOUNT.percent) / 100;
}
