import {
  isValidTransition,
  getAvailableTransitions,
  STATUS_LABELS,
  STATUS_COLORS,
  ALLOWED_TRANSITIONS,
  TRANSITION_LABELS,
} from '../utils/reservationStatus';
import type { ReservationStatus } from '../utils/reservationStatus';

describe('isValidTransition', () => {
  it('allows pending → approved', () => {
    expect(isValidTransition('pending', 'approved')).toBe(true);
  });

  it('allows pending → cancelled', () => {
    expect(isValidTransition('pending', 'cancelled')).toBe(true);
  });

  it('disallows pending → completed', () => {
    expect(isValidTransition('pending', 'completed')).toBe(false);
  });

  it('allows approved → cancelled', () => {
    expect(isValidTransition('approved', 'cancelled')).toBe(true);
  });

  it('disallows approved → completed (must be paid/confirmed first)', () => {
    expect(isValidTransition('approved', 'completed')).toBe(false);
  });

  it('disallows choosing confirmed manually (it comes from the deposit payment)', () => {
    expect(isValidTransition('approved', 'confirmed')).toBe(false);
  });

  it('allows confirmed → completed and confirmed → cancelled', () => {
    expect(isValidTransition('confirmed', 'completed')).toBe(true);
    expect(isValidTransition('confirmed', 'cancelled')).toBe(true);
  });

  it('disallows approved → pending', () => {
    expect(isValidTransition('approved', 'pending')).toBe(false);
  });

  it('allows rejected → pending (reopen)', () => {
    expect(isValidTransition('rejected', 'pending')).toBe(true);
  });

  it('disallows rejected → approved directly', () => {
    expect(isValidTransition('rejected', 'approved')).toBe(false);
  });

  it('allows cancelled → pending (reopen)', () => {
    expect(isValidTransition('cancelled', 'pending')).toBe(true);
  });

  it('disallows completed → anything', () => {
    expect(isValidTransition('completed', 'pending')).toBe(false);
    expect(isValidTransition('completed', 'approved')).toBe(false);
    expect(isValidTransition('completed', 'cancelled')).toBe(false);
  });
});

describe('getAvailableTransitions', () => {
  it('returns [approved, cancelled] for pending', () => {
    expect(getAvailableTransitions('pending')).toEqual(['approved', 'cancelled']);
  });

  it('returns [cancelled] for approved (confirmation comes from the payment)', () => {
    expect(getAvailableTransitions('approved')).toEqual(['cancelled']);
  });

  it('returns [cancelled, completed] for confirmed', () => {
    expect(getAvailableTransitions('confirmed')).toEqual(['cancelled', 'completed']);
  });

  it('returns [pending] for rejected', () => {
    expect(getAvailableTransitions('rejected')).toEqual(['pending']);
  });

  it('returns [pending] for cancelled', () => {
    expect(getAvailableTransitions('cancelled')).toEqual(['pending']);
  });

  it('returns [] for completed', () => {
    expect(getAvailableTransitions('completed')).toEqual([]);
  });
});

describe('STATUS_LABELS', () => {
  it('has labels for all statuses', () => {
    const statuses: ReservationStatus[] = ['pending', 'approved', 'rejected', 'cancelled', 'completed'];
    statuses.forEach((status) => {
      expect(STATUS_LABELS[status]).toBeTruthy();
    });
  });
});

describe('STATUS_COLORS', () => {
  it('has bg and text for all statuses', () => {
    const statuses: ReservationStatus[] = ['pending', 'approved', 'rejected', 'cancelled', 'completed'];
    statuses.forEach((status) => {
      expect(STATUS_COLORS[status].bg).toBeTruthy();
      expect(STATUS_COLORS[status].text).toBeTruthy();
    });
  });
});

describe('TRANSITION_LABELS', () => {
  it('has labels for all statuses', () => {
    const statuses: ReservationStatus[] = ['pending', 'approved', 'rejected', 'cancelled', 'completed'];
    statuses.forEach((status) => {
      expect(TRANSITION_LABELS[status]).toBeTruthy();
    });
  });
});

describe('ALLOWED_TRANSITIONS completeness', () => {
  it('defines transitions for all statuses', () => {
    const statuses: ReservationStatus[] = ['pending', 'approved', 'rejected', 'cancelled', 'completed'];
    statuses.forEach((status) => {
      expect(ALLOWED_TRANSITIONS).toHaveProperty(status);
      expect(Array.isArray(ALLOWED_TRANSITIONS[status])).toBe(true);
    });
  });
});
