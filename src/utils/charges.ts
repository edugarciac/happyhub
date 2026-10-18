import { MAX_EXTRA_HOURS, extraHoursPrice } from '@/utils/pricing';

/** Conceptos de un cobro adicional sobre una reserva ya hecha */
export const CHARGE_CONCEPTS = ['extension', 'services', 'full_day', 'other'] as const;
export type ChargeConcept = (typeof CHARGE_CONCEPTS)[number];

export const CHARGE_CONCEPT_LABELS: Record<ChargeConcept, string> = {
  extension: 'Extensión de horario',
  services: 'Servicios adicionales',
  full_day: 'Día completo',
  other: 'Otros',
};

/** Tope de seguridad para un cobro adicional */
export const MAX_CHARGE_AMOUNT = 5000;

export type ChargeStatus = 'pending' | 'paid' | 'cancelled';

export interface ChargeInput {
  concept: ChargeConcept;
  hours: number | null;
  description: string;
  amount: number;
}

/** "Extensión de horario (2 h)", "Servicios adicionales: Photocall", "Otros: Limpieza extra" */
export function chargeConceptLabel(c: { concept: string; hours?: number | null; description?: string | null }): string {
  const base = CHARGE_CONCEPT_LABELS[c.concept as ChargeConcept] || c.concept;
  const detail = (c.description || '').trim();
  if (c.concept === 'extension' && c.hours) return `${base} (${c.hours} h)${detail ? `: ${detail}` : ''}`;
  return detail ? `${base}: ${detail}` : base;
}

/** Importe sugerido para la extensión de horario (mismo precio por hora que la reserva web) */
export function suggestedExtensionAmount(hours: number): number {
  return extraHoursPrice(hours);
}

export function validateChargeInput(body: any): { ok: true; value: ChargeInput } | { ok: false; error: string } {
  const concept = body?.concept;
  if (!CHARGE_CONCEPTS.includes(concept)) return { ok: false, error: 'Concepto no válido' };

  const description = typeof body.description === 'string' ? body.description.trim().slice(0, 500) : '';
  if (concept === 'other' && !description) return { ok: false, error: 'Describe el concepto del cobro' };

  let hours: number | null = null;
  if (concept === 'extension') {
    hours = Number(body.hours);
    if (!Number.isInteger(hours) || hours < 1 || hours > MAX_EXTRA_HOURS) {
      return { ok: false, error: `Las horas de extensión deben ser entre 1 y ${MAX_EXTRA_HOURS}` };
    }
  }

  const amount = Math.round(Number(body.amount) * 100) / 100;
  if (!Number.isFinite(amount) || amount <= 0) return { ok: false, error: 'El importe debe ser mayor que 0' };
  if (amount > MAX_CHARGE_AMOUNT) return { ok: false, error: `El importe no puede superar ${MAX_CHARGE_AMOUNT} €` };

  return { ok: true, value: { concept, hours, description, amount } };
}
