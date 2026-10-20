// Política de cancelación (Condiciones, apartado 5): con 15 días o más de antelación se devuelve el 100% de lo pagado.

export const FULL_REFUND_MIN_DAYS = 15;

/** 'YYYY-MM-DD' de hoy en hora de Madrid */
function todayInMadrid(now: Date): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Madrid', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
}

function utcDay(date: string): number {
  const [y, m, d] = date.slice(0, 10).split('-').map(Number);
  return Date.UTC(y, m - 1, d);
}

/** Días naturales entre hoy (Madrid) y la fecha del evento ('YYYY-MM-DD'). Negativo si ya pasó. */
export function daysUntilEvent(eventDate: string, now: Date = new Date()): number {
  return Math.round((utcDay(eventDate) - utcDay(todayInMadrid(now))) / 86400000);
}

export function isFullRefundEligible(eventDate: string, now: Date = new Date()): boolean {
  return daysUntilEvent(eventDate, now) >= FULL_REFUND_MIN_DAYS;
}

export const RESCHEDULE_MIN_DAYS = 3;

/**
 * Tramo de la política según los días que faltan:
 *  - full_refund: 15 días o más → se devuelve el 100%
 *  - reschedule:  entre 14 y 3 días → no se devuelve la señal, pero se puede cambiar la fecha
 *  - none:        menos de 3 días → ni devolución ni cambio de fecha
 */
export type CancellationTier = 'full_refund' | 'reschedule' | 'none';

export function cancellationTier(days: number): CancellationTier {
  if (days >= FULL_REFUND_MIN_DAYS) return 'full_refund';
  if (days >= RESCHEDULE_MIN_DAYS) return 'reschedule';
  return 'none';
}
