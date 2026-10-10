// Pago de la señal tras la aprobación de la reserva (decisión del propietario, 2026-10-10)
export const PAYMENT_WINDOW_HOURS = 24;
export const BIZUM_PHONE = '624 645 517';
export const PAYMENT_METHODS = ['card', 'bizum'] as const;
export type BookingPaymentMethod = (typeof PAYMENT_METHODS)[number];

export function isBookingPaymentMethod(value: unknown): value is BookingPaymentMethod {
  return typeof value === 'string' && (PAYMENT_METHODS as readonly string[]).includes(value);
}

/** Fecha/hora límite en hora de Madrid: '11/10/2026, 18:30' */
export function formatDueAt(date: Date | string): string {
  return new Date(date).toLocaleString('es-ES', {
    timeZone: 'Europe/Madrid',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
