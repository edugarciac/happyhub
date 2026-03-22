export type ReservationStatus = 'pending' | 'approved' | 'rejected' | 'cancelled' | 'completed';

export const STATUS_LABELS: Record<ReservationStatus, string> = {
  pending: 'Pendiente',
  approved: 'Aprobada',
  rejected: 'Cancelada',
  cancelled: 'Cancelada',
  completed: 'Evento Realizado',
};

export const STATUS_COLORS: Record<ReservationStatus, { bg: string; text: string }> = {
  pending: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
  approved: { bg: 'bg-green-100', text: 'text-green-800' },
  rejected: { bg: 'bg-gray-100', text: 'text-gray-800' },
  cancelled: { bg: 'bg-gray-100', text: 'text-gray-800' },
  completed: { bg: 'bg-blue-100', text: 'text-blue-800' },
};

/**
 * Allowed status transitions.
 * Each key maps to the set of statuses it can transition to.
 * Note: 'rejected' is kept for backwards compatibility but no longer offered as a transition.
 */
export const ALLOWED_TRANSITIONS: Record<ReservationStatus, ReservationStatus[]> = {
  pending: ['approved', 'cancelled'],
  approved: ['cancelled', 'completed'],
  rejected: ['pending'],
  cancelled: ['pending'],
  completed: [],
};

/**
 * Action labels for each transition (shown as buttons).
 */
export const TRANSITION_LABELS: Record<ReservationStatus, string> = {
  approved: 'Aprobar',
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
