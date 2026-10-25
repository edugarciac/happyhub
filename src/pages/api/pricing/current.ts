import type { NextApiRequest, NextApiResponse } from 'next';
import { getActivePricingRules } from '@/lib/pricingRules';

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
    const pricing = await getActivePricingRules();

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
