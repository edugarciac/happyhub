// Inauguración de HappyHub. Las reservas solo se aceptan desde esta fecha.
export const OPENING_DATE = '2026-10-16';
export const OPENING_LABEL = '16 de octubre';

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

/** Fecha local (de un calendario) como 'YYYY-MM-DD' */
export function toDateStr(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
