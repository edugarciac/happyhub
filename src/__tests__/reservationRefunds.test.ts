const queryOne = jest.fn();
const query = jest.fn();
const sessionsRetrieve = jest.fn();
const refundsCreate = jest.fn();
const piRetrieve = jest.fn();
const piCancel = jest.fn();
const sendEmail = jest.fn().mockResolvedValue(true);

jest.mock('@/lib/db', () => ({ queryOne: (...a: unknown[]) => queryOne(...a), query: (...a: unknown[]) => query(...a) }));
jest.mock('@/lib/stripe', () => ({
  stripe: {
    checkout: { sessions: { retrieve: (...a: unknown[]) => sessionsRetrieve(...a) } },
    refunds: { create: (...a: unknown[]) => refundsCreate(...a) },
    paymentIntents: { retrieve: (...a: unknown[]) => piRetrieve(...a), cancel: (...a: unknown[]) => piCancel(...a) },
  },
}));
jest.mock('@/lib/reservationFlow', () => ({ ensureReservationFlowColumns: jest.fn().mockResolvedValue(undefined) }));
jest.mock('@/lib/reservationCharges', () => ({ ensureReservationChargesTable: jest.fn().mockResolvedValue(undefined) }));
jest.mock('@/lib/mailer', () => ({ sendEmail: (...a: unknown[]) => sendEmail(...a), getAdminEmails: () => ['admin@example.com'] }));

import { getRefundPlan, refundAndNotify } from '@/lib/reservationRefunds';

const baseRow = {
  event_date: '2099-12-31',
  payment_status: 'deposit_paid',
  payment_method: 'card',
  deposit_amount: '60',
  total_price: '200',
  stripe_deposit_session_id: 'cs_dep',
  stripe_remaining_session_id: null,
  remaining_payment_method: null,
  security_deposit_status: 'none',
  security_deposit_method: null,
  security_deposit_payment_intent: null,
  security_deposit_amount_held: null,
  refunded_amount: null,
  name: 'Ana',
  email: 'ana@example.com',
  phone: '600000000',
};

const paidSession = (pi: string, amount: number, refunded = 0) => ({
  payment_status: 'paid',
  payment_intent: { id: pi, amount_received: amount, latest_charge: { amount, amount_refunded: refunded } },
});

beforeEach(() => {
  jest.clearAllMocks();
  query.mockResolvedValue({ rows: [] });
});

describe('getRefundPlan', () => {
  it('refunds a card deposit through Stripe', async () => {
    queryOne.mockResolvedValue(baseRow);
    sessionsRetrieve.mockResolvedValue(paidSession('pi_dep', 6000));
    const plan = await getRefundPlan(7);
    expect(plan?.eligible).toBe(true);
    expect(plan?.stripe).toEqual([{ label: 'Señal', amount: 60, paymentIntentId: 'pi_dep' }]);
    expect(plan?.manual).toEqual([]);
  });

  it('treats an unpaid stored session as a manual (Bizum) deposit', async () => {
    queryOne.mockResolvedValue({ ...baseRow, payment_method: 'bizum' });
    sessionsRetrieve.mockResolvedValue({ payment_status: 'unpaid', payment_intent: null });
    const plan = await getRefundPlan(7);
    expect(plan?.stripe).toEqual([]);
    expect(plan?.manual).toEqual([{ label: 'Señal', amount: 60, method: 'Bizum' }]);
  });

  it('only refunds what is still not refunded and includes remaining, extra charges and the hold', async () => {
    queryOne.mockResolvedValue({
      ...baseRow,
      payment_status: 'fully_paid',
      remaining_payment_method: 'card_link',
      stripe_remaining_session_id: 'cs_rem',
      security_deposit_status: 'held',
      security_deposit_method: 'card_link',
      security_deposit_payment_intent: 'pi_hold',
      security_deposit_amount_held: '150',
    });
    sessionsRetrieve.mockImplementation((id: string) =>
      Promise.resolve(id === 'cs_dep' ? paidSession('pi_dep', 6000, 6000) : id === 'cs_rem' ? paidSession('pi_rem', 14000, 4000) : paidSession('pi_x', 3000))
    );
    query.mockResolvedValue({ rows: [{ concept: 'extension', hours: 1, description: '', amount: '30', paid_method: 'card', stripe_session_id: 'cs_x' }] });
    const plan = await getRefundPlan(7);
    expect(plan?.stripe.map((i) => [i.label, i.amount])).toEqual([
      ['Resto del pago', 100],
      [expect.stringContaining('Cobro adicional'), 30],
    ]);
    expect(plan?.stripeTotal).toBe(130);
    expect(plan?.stripeHold).toEqual({ amount: 150, paymentIntentId: 'pi_hold' });
  });

  it('lists the remaining payment by terminal as manual', async () => {
    queryOne.mockResolvedValue({ ...baseRow, payment_status: 'fully_paid', remaining_payment_method: 'terminal' });
    sessionsRetrieve.mockResolvedValue(paidSession('pi_dep', 6000));
    const plan = await getRefundPlan(7);
    expect(plan?.manual).toEqual([{ label: 'Resto del pago', amount: 140, method: 'datáfono' }]);
  });
});

describe('refundAndNotify', () => {
  it('refunds with an idempotency key, stores the total and does not email admins when nothing is pending', async () => {
    queryOne.mockResolvedValue(baseRow);
    sessionsRetrieve.mockResolvedValue(paidSession('pi_dep', 6000));
    refundsCreate.mockResolvedValue({ id: 're_1' });
    const plan = (await getRefundPlan(7))!;
    const { result, warning } = await refundAndNotify(plan);
    expect(refundsCreate).toHaveBeenCalledWith(
      expect.objectContaining({ payment_intent: 'pi_dep', amount: 6000 }),
      { idempotencyKey: 'refund-7-pi_dep-6000' }
    );
    expect(result.refundedTotal).toBe(60);
    expect(query).toHaveBeenCalledWith(expect.stringContaining('refunded_amount = COALESCE(refunded_amount, 0) + $1'), [60, 7]);
    expect(sendEmail).not.toHaveBeenCalled();
    expect(warning).toBeUndefined();
  });

  it('keeps going when Stripe fails and alerts the admins', async () => {
    queryOne.mockResolvedValue(baseRow);
    sessionsRetrieve.mockResolvedValue(paidSession('pi_dep', 6000));
    refundsCreate.mockRejectedValue(new Error('charge_disputed'));
    const plan = (await getRefundPlan(7))!;
    const { result, warning } = await refundAndNotify(plan);
    expect(result.refundedTotal).toBe(0);
    expect(result.failed).toHaveLength(1);
    expect(sendEmail).toHaveBeenCalledWith(expect.objectContaining({ to: ['admin@example.com'] }));
    expect(warning).toContain('Devolver pagos');
  });
});
