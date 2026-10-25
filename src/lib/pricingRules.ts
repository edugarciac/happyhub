import { query } from '@/lib/db';

/** Reglas de precio activas hoy (rule_name → precio). Las usan /api/pricing/current, el cálculo de reservas y el chatbot. */
export async function getActivePricingRules(): Promise<Record<string, number>> {
  const result = await query(
    `SELECT rule_name, price
     FROM pricing_rules
     WHERE active = true
       AND (effective_from IS NULL OR effective_from <= CURRENT_DATE)
       AND (effective_to IS NULL OR effective_to >= CURRENT_DATE)
     ORDER BY id`
  );
  const rules: Record<string, number> = {};
  result.rows.forEach((row: any) => {
    rules[row.rule_name] = parseFloat(row.price);
  });
  return rules;
}
