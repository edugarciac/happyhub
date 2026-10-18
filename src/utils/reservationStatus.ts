export type ReservationStatus = 'pending' | 'approved' | 'confirmed' | 'rejected' | 'cancelled' | 'completed';

export const STATUS_LABELS: Record<ReservationStatus, string> = {
  pending: 'Pendiente',
  approved: 'Aprobada (pendiente de pago)',
  confirmed: 'Confirmada',
  rejected: 'Cancelada',
  cancelled: 'Cancelada',
  completed: 'Evento Realizado',
};

export const STATUS_COLORS: Record<ReservationStatus, { bg: string; text: string }> = {
  pending: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
  approved: { bg: 'bg-amber-100', text: 'text-amber-800' },
  confirmed: { bg: 'bg-green-100', text: 'text-green-800' },
  rejected: { bg: 'bg-gray-100', text: 'text-gray-800' },
  cancelled: { bg: 'bg-gray-100', text: 'text-gray-800' },
  completed: { bg: 'bg-blue-100', text: 'text-blue-800' },
};

// No 'rejected' in pending transitions — only Aprobar or Cancelar.
// 'confirmed' no se elige a mano: llega al pagar la señal (webhook de Stripe o botón "Señal recibida (Bizum)").
export const ALLOWED_TRANSITIONS: Record<ReservationStatus, ReservationStatus[]> = {
  pending: ['approved', 'cancelled'],
  approved: ['cancelled'],
  confirmed: ['cancelled', 'completed'],
  rejected: ['pending'],
  cancelled: ['pending'],
  completed: [],
};

export const TRANSITION_LABELS: Record<ReservationStatus, string> = {
  approved: 'Aprobar',
  confirmed: 'Confirmar',
  rejected: 'Cancelar',
  cancelled: 'Cancelar',
  completed: 'Marcar Realizado',
  pending: 'Reabrir',
};

/** 'Marcar Realizado' solo con el total cobrado (a mano o por Stripe) */
function allowedByPayment(to: ReservationStatus, paymentStatus?: string | null): boolean {
  return to !== 'completed' || paymentStatus === 'fully_paid';
}

export function isValidTransition(from: ReservationStatus, to: ReservationStatus, paymentStatus?: string | null): boolean {
  return (ALLOWED_TRANSITIONS[from]?.includes(to) ?? false) && allowedByPayment(to, paymentStatus);
}

export function getAvailableTransitions(current: ReservationStatus, paymentStatus?: string | null): ReservationStatus[] {
  return (ALLOWED_TRANSITIONS[current] || []).filter((to) => allowedByPayment(to, paymentStatus));
}

/** Estado que ve el admin: una reserva confirmada se muestra según lo pagado */
export type DisplayStatus = Exclude<ReservationStatus, 'confirmed'> | 'deposit_paid' | 'fully_paid';

export function reservationDisplayStatus(status: ReservationStatus, paymentStatus?: string | null): DisplayStatus {
  if (status !== 'confirmed') return status;
  return paymentStatus === 'fully_paid' ? 'fully_paid' : 'deposit_paid';
}

export const DISPLAY_STATUS_LABELS: Record<DisplayStatus, string> = {
  pending: STATUS_LABELS.pending,
  approved: STATUS_LABELS.approved,
  deposit_paid: 'Señal pagada',
  fully_paid: 'Pagado',
  rejected: STATUS_LABELS.rejected,
  cancelled: STATUS_LABELS.cancelled,
  completed: STATUS_LABELS.completed,
};

export const DISPLAY_STATUS_COLORS: Record<DisplayStatus, { bg: string; text: string }> = {
  pending: STATUS_COLORS.pending,
  approved: STATUS_COLORS.approved,
  deposit_paid: { bg: 'bg-lime-100', text: 'text-lime-800' },
  fully_paid: { bg: 'bg-green-100', text: 'text-green-800' },
  rejected: STATUS_COLORS.rejected,
  cancelled: STATUS_COLORS.cancelled,
  completed: STATUS_COLORS.completed,
};

/** La reserva tiene la señal pagada y queda el resto: se puede marcar el pago total */
export function canMarkFullyPaid(status: ReservationStatus, paymentStatus?: string | null): boolean {
  return status === 'confirmed' && paymentStatus !== 'fully_paid';
}

/** Métodos para registrar a mano el pago total */
export const MANUAL_FULL_PAYMENT_METHODS = ['terminal', 'cash', 'transfer'] as const;
export type ManualFullPaymentMethod = (typeof MANUAL_FULL_PAYMENT_METHODS)[number];
export const REMAINING_PAYMENT_METHOD_LABELS: Record<string, string> = {
  terminal: 'datáfono',
  cash: 'efectivo',
  transfer: 'transferencia',
  card_link: 'enlace',
};
