import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

interface BookedSlot {
  date: Date;
  timeSlot: 'morning' | 'afternoon' | 'night';
}

interface AirtableRecord {
  id: string;
  fields: {
    'Evento - Fecha': string;
    'Evento - Franja': string;
    Status: string;
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { AIRTABLE_PERSONAL_ACCESS_TOKEN, AIRTABLE_BASE_ID, AIRTABLE_TABLE_ID } = process.env;

    // If Airtable credentials are not configured, return empty array (all available)
    if (!AIRTABLE_PERSONAL_ACCESS_TOKEN || !AIRTABLE_BASE_ID || !AIRTABLE_TABLE_ID) {
      console.warn('Airtable credentials not configured. Returning all slots as available.');
      return res.status(200).json({ bookedSlots: [] });
    }

    // Query Airtable for approved/confirmed reservations
    const airtableUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_ID}`;

    // Filter: Status is either 'Approved' or 'Confirmed'
    const filterFormula = "OR({Status} = 'Approved', {Status} = 'Confirmed')";

    const response = await axios.get(airtableUrl, {
      headers: {
        'Authorization': `Bearer ${AIRTABLE_PERSONAL_ACCESS_TOKEN}`,
      },
      params: {
        filterByFormula: filterFormula,
        fields: ['Evento - Fecha', 'Evento - Franja', 'Status'],
      },
    });

    const records: AirtableRecord[] = response.data.records || [];

    // Map Airtable records to BookedSlot format
    const bookedSlots: BookedSlot[] = records.map((record) => {
      const fecha = record.fields['Evento - Fecha']; // Format: "2025-01-15"
      const franja = record.fields['Evento - Franja']; // Format: "Mañana (11:00-14:30)"

      // Parse date
      const date = new Date(fecha);

      // Parse time slot
      let timeSlot: 'morning' | 'afternoon' | 'night' = 'morning';
      if (franja.includes('Tarde')) {
        timeSlot = 'afternoon';
      } else if (franja.includes('Noche')) {
        timeSlot = 'night';
      }

      return {
        date: date.toISOString(), // Send as ISO string to frontend
        timeSlot,
      };
    });

    return res.status(200).json({ bookedSlots });
  } catch (error: any) {
    console.error('Error fetching booked slots from Airtable:', error.response?.data || error.message);

    // If API fails, return empty array (better UX - show all as available)
    return res.status(200).json({ bookedSlots: [] });
  }
}
