// Traduce el motivo de un pago con tarjeta rechazado por Stripe a un texto corto en español para el panel.

const DECLINE_MESSAGES: Record<string, string> = {
  insufficient_funds: 'Fondos insuficientes',
  card_declined: 'Tarjeta rechazada por el banco',
  generic_decline: 'Tarjeta rechazada por el banco',
  do_not_honor: 'Tarjeta rechazada por el banco',
  expired_card: 'Tarjeta caducada',
  incorrect_cvc: 'CVC incorrecto',
  invalid_cvc: 'CVC incorrecto',
  incorrect_number: 'Número de tarjeta incorrecto',
  invalid_number: 'Número de tarjeta incorrecto',
  invalid_expiry_month: 'Fecha de caducidad incorrecta',
  invalid_expiry_year: 'Fecha de caducidad incorrecta',
  lost_card: 'Tarjeta denunciada como perdida',
  stolen_card: 'Tarjeta denunciada como robada',
  fraudulent: 'Rechazada por sospecha de fraude',
  card_velocity_exceeded: 'Límite de la tarjeta superado',
  withdrawal_count_limit_exceeded: 'Límite de la tarjeta superado',
  processing_error: 'Error al procesar la tarjeta',
  authentication_required: 'Falta la verificación del banco (3D Secure)',
  payment_intent_authentication_failure: 'Falló la verificación del banco (3D Secure)',
};

export function stripeDeclineMessage(error?: { decline_code?: string | null; code?: string | null; message?: string | null } | null): string {
  if (!error) return 'Pago con tarjeta rechazado';
  const key = error.decline_code || error.code || '';
  return DECLINE_MESSAGES[key] || error.message || 'Pago con tarjeta rechazado';
}
