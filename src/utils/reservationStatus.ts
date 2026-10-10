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

export function isValidTransition(from: ReservationStatus, to: ReservationStatus): boolean {
  return ALLOWED_TRANSITIONS[from]?.includes(to) ?? false;
}

export function getAvailableTransitions(current: ReservationStatus): ReservationStatus[] {
  return ALLOWED_TRANSITIONS[current] || [];
}
