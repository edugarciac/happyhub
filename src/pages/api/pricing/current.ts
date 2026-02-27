import type { NextApiRequest, NextApiResponse } from 'next';
import { query } from '../../../lib/db';

interface PricingResponse {
  success: boolean;
  pricing?: Record<string, number>;
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<PricingResponse>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    // Get active pricing rules
    const result = await query(
      `SELECT rule_name, price
       FROM pricing_rules
       WHERE active = true
         AND (effective_from IS NULL OR effective_from <= CURRENT_DATE)
         AND (effective_to IS NULL OR effective_to >= CURRENT_DATE)
       ORDER BY id`
    );

    // Convert to key-value object for easy lookup
    const pricing: Record<string, number> = {};
    result.rows.forEach((row: any) => {
      pricing[row.rule_name] = parseFloat(row.price);
    });

    return res.status(200).json({
      success: true,
      pricing,
    });
  } catch (error) {
    console.error('Error fetching pricing:', error);
    return res.status(500).json({
      success: false,
      error: 'Error al obtener precios',
    });
  }
}
