import { stripeDeclineMessage } from '@/utils/stripeErrors';

describe('stripeDeclineMessage', () => {
  it('prefers decline_code over code', () => {
    expect(stripeDeclineMessage({ code: 'card_declined', decline_code: 'insufficient_funds' })).toBe('Fondos insuficientes');
  });
  it('maps 3DS failures', () => {
    expect(stripeDeclineMessage({ code: 'payment_intent_authentication_failure' })).toBe('Falló la verificación del banco (3D Secure)');
  });
  it('falls back to Stripe message, then to a generic text', () => {
    expect(stripeDeclineMessage({ code: 'weird_code', message: 'Your card was declined.' })).toBe('Your card was declined.');
    expect(stripeDeclineMessage(null)).toBe('Pago con tarjeta rechazado');
  });
});
