// Inauguración de HappyHub (cuenta atrás)
export const OPENING_DATE = '2026-10-16';
export const OPENING_LABEL = '16 de octubre';

// El día de la inauguración no se alquila: las reservas empiezan al día siguiente
export const BOOKINGS_FROM_DATE = '2026-10-17';
export const BOOKINGS_FROM_LABEL = '17 de octubre';

const TIME_ZONE = 'Europe/Madrid';

/** Fecha de hoy en Madrid como 'YYYY-MM-DD' */
export function todayInMadrid(now: Date = new Date()): string {
  return now.toLocaleDateString('en-CA', { timeZone: TIME_ZONE });
}

/** Días naturales que faltan para la inauguración (0 = hoy, negativo = ya pasó) */
export function daysUntilOpening(now: Date = new Date()): number {
  const today = Date.parse(`${todayInMadrid(now)}T00:00:00Z`);
  const opening = Date.parse(`${OPENING_DATE}T00:00:00Z`);
  return Math.round((opening - today) / 86_400_000);
}

/** true si la fecha 'YYYY-MM-DD' es anterior a la inauguración */
export function isBeforeOpening(dateStr: string): boolean {
  return dateStr < OPENING_DATE;
}

/** true si en la fecha 'YYYY-MM-DD' todavía no se puede reservar */
export function isBeforeBookingStart(dateStr: string): boolean {
  return dateStr < BOOKINGS_FROM_DATE;
}

/** Fecha local (de un calendario) como 'YYYY-MM-DD' */
export function toDateStr(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
