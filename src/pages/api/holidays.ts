import type { NextApiRequest, NextApiResponse } from 'next';
import { query } from '@/lib/db';

interface HolidaysResponse {
  success: boolean;
  holidays?: string[];
  error?: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<HolidaysResponse>) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const result = await query<{ holiday_date: string }>(
      `SELECT TO_CHAR(holiday_date, 'YYYY-MM-DD') AS holiday_date FROM holidays ORDER BY holiday_date`
    );

    return res.status(200).json({
      success: true,
      holidays: result.rows.map((row) => row.holiday_date),
    });
  } catch (error) {
    console.error('Error fetching holidays:', error);
    return res.status(500).json({ success: false, error: 'Error al obtener festivos' });
  }
}
