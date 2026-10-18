import { chargeConceptLabel, suggestedExtensionAmount, validateChargeInput } from '@/utils/charges';
import { extraChargeEmail, extraChargePaidEmail } from '@/lib/emailTemplates';

describe('validateChargeInput', () => {
  it('accepts a 1-3 hour extension', () => {
    expect(validateChargeInput({ concept: 'extension', hours: 2, amount: 120 })).toEqual({
      ok: true,
      value: { concept: 'extension', hours: 2, description: '', amount: 120 },
    });
  });

  it('rejects extension hours outside 1-3', () => {
    expect(validateChargeInput({ concept: 'extension', hours: 0, amount: 60 }).ok).toBe(false);
    expect(validateChargeInput({ concept: 'extension', hours: 4, amount: 240 }).ok).toBe(false);
  });

  it('requires a description for "other"', () => {
    expect(validateChargeInput({ concept: 'other', amount: 30 })).toEqual({ ok: false, error: 'Describe el concepto del cobro' });
    expect(validateChargeInput({ concept: 'other', description: ' Limpieza extra ', amount: 30 })).toMatchObject({
      ok: true,
      value: { description: 'Limpieza extra', hours: null },
    });
  });

  it('rejects unknown concepts and bad amounts', () => {
    expect(validateChargeInput({ concept: 'tip', amount: 10 }).ok).toBe(false);
    expect(validateChargeInput({ concept: 'full_day', amount: 0 }).ok).toBe(false);
    expect(validateChargeInput({ concept: 'full_day', amount: 'abc' }).ok).toBe(false);
    expect(validateChargeInput({ concept: 'full_day', amount: 5001 }).ok).toBe(false);
  });

  it('rounds the amount to cents', () => {
    expect(validateChargeInput({ concept: 'full_day', amount: '99.999' })).toMatchObject({ ok: true, value: { amount: 100 } });
  });
});

describe('chargeConceptLabel', () => {
  it('labels each concept', () => {
    expect(chargeConceptLabel({ concept: 'extension', hours: 2 })).toBe('Extensión de horario (2 h)');
    expect(chargeConceptLabel({ concept: 'services', description: 'Photocall, Decoración' })).toBe('Servicios adicionales: Photocall, Decoración');
    expect(chargeConceptLabel({ concept: 'full_day' })).toBe('Día completo');
    expect(chargeConceptLabel({ concept: 'other', description: 'Limpieza extra' })).toBe('Otros: Limpieza extra');
  });

  it('suggests 60 EUR per extension hour', () => {
    expect(suggestedExtensionAmount(3)).toBe(180);
  });
});

describe('extra charge emails', () => {
  const params = {
    name: 'Ana',
    code: 'RES-20261120-012',
    date: '2026-11-20',
    timeSlot: 'afternoon',
    concept: 'Extensión de horario (2 h)',
    amount: 120,
    payUrl: 'https://www.happyhub.es/pagar/cargo/abc',
    expiresAt: new Date('2026-11-20T23:00:00Z'),
  };

  it('payment link email has reservation number, concept, amount and pay button', () => {
    const { subject, html } = extraChargeEmail(params);
    expect(subject).toBe('Reserva RES-20261120-012: pago de Extensión de horario (2 h) (120 €)');
    expect(html).toContain('RES-20261120-012');
    expect(html).toContain('Extensión de horario (2 h)');
    expect(html).toContain('<strong>120 €</strong>');
    expect(html).toContain('href="https://www.happyhub.es/pagar/cargo/abc"');
    expect(html).toContain('Pagar 120 €');
    expect(html).toContain('21/11/2026, 00:00'); // 23:00 UTC = 00:00 Madrid (CET)
  });

  it('escapes the concept', () => {
    expect(extraChargeEmail({ ...params, concept: '<b>x</b>' }).html).not.toContain('<b>x</b>');
  });

  it('paid email confirms the amount', () => {
    const { subject, html } = extraChargePaidEmail({ name: 'Ana', code: params.code, date: params.date, concept: params.concept, amount: 120 });
    expect(subject).toContain('Pago recibido');
    expect(html).toContain('120 €');
  });
});
