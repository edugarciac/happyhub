import { incompleteDepositAlertEmail, unmatchedPaymentAlertEmail } from '@/lib/emailTemplates';

describe('unmatchedPaymentAlertEmail', () => {
  it('includes amount, reason and session, escaping HTML', () => {
    const { subject, html } = unmatchedPaymentAlertEmail({
      reason: 'La reserva <b>RES-20261016-007</b> no existe',
      amount: 60,
      sessionId: 'cs_test_123',
      paymentType: 'deposit',
      reservationRef: 'RES-20261016-007',
      customerName: 'Ana',
      customerEmail: 'ana@example.com',
    });
    expect(subject).toBe('⚠️ Pago de 60 € sin reserva asociada (RES-20261016-007)');
    expect(html).toContain('cs_test_123');
    expect(html).toContain('60 €');
    expect(html).toContain('Ana · ana@example.com');
    expect(html).toContain('&lt;b&gt;RES-20261016-007&lt;/b&gt;');
    expect(html).not.toContain('<b>RES-');
  });

  it('falls back to the session id when there is no reservation reference', () => {
    const { subject, html } = unmatchedPaymentAlertEmail({ reason: 'sin metadatos', amount: 0, sessionId: 'cs_x', paymentType: 'deposit' });
    expect(subject).toContain('(cs_x)');
    expect(html).toContain('(ninguna)');
    expect(html).toContain('(desconocido)');
  });
});

describe('incompleteDepositAlertEmail', () => {
  it('shows paid, expected and missing amounts', () => {
    const { subject, html } = incompleteDepositAlertEmail({ code: 'RES-20261016-007', name: 'Ana', paid: 1, expected: 60, sessionId: 'cs_1' });
    expect(subject).toBe('⚠️ Señal incompleta: cobrados 1 € de 60 € (RES-20261016-007)');
    expect(html).toContain('59 €');
    expect(html).toContain('cs_1');
  });
});
