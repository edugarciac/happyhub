// Pago de la señal tras la aprobación de la reserva (decisión del propietario, 2026-10-10)
export const PAYMENT_WINDOW_HOURS = 24;
export const BIZUM_PHONE = '624 645 517';
/** Métodos para la señal. El resto y la fianza se pagan solo con tarjeta (enlace/QR o datáfono). */
export const PAYMENT_METHODS = ['card', 'bizum'] as const;

/** Fianza: preautorización en la tarjeta el día del evento (decisión del propietario, 2026-10-17) */
export const SECURITY_DEPOSIT_AMOUNT = 150;
/** Validez del bloqueo hecho por enlace/QR (pago iniciado por el cliente): 7 días según Stripe */
export const SECURITY_DEPOSIT_ONLINE_HOLD_DAYS = 7;
/** Validez orientativa del bloqueo en datáfono: 2 días Mastercard/Amex (Visa ~5) */
export const SECURITY_DEPOSIT_TERMINAL_HOLD_DAYS = 2;
export const SECURITY_DEPOSIT_STATUSES = ['none', 'held', 'released', 'captured', 'expired'] as const;
export type SecurityDepositStatus = (typeof SECURITY_DEPOSIT_STATUSES)[number];
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
