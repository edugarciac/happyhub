import type { NextApiRequest, NextApiResponse } from 'next';
import { query } from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'GET') {
      const result = await query('SELECT * FROM partners ORDER BY name ASC');
      return res.json(result.rows);
    }

    if (req.method === 'POST') {
      const { name, service_type, email, phone, description, price_range, logo_url, website, active } = req.body;
      const result = await query(
        `INSERT INTO partners (name, service_type, email, phone, description, price_range, logo_url, website, active)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
        [name, service_type, email || null, phone || null, description || null, price_range || null, logo_url || null, website || null, active ?? true]
      );
      return res.status(201).json(result.rows[0]);
    }

    if (req.method === 'PUT') {
      const { id, name, service_type, email, phone, description, price_range, logo_url, website, active } = req.body;
      if (!id) return res.status(400).json({ error: 'ID requerido' });
      const result = await query(
        `UPDATE partners SET name=$1, service_type=$2, email=$3, phone=$4, description=$5, price_range=$6, logo_url=$7, website=$8, active=$9, updated_at=NOW()
         WHERE id=$10 RETURNING *`,
        [name, service_type, email || null, phone || null, description || null, price_range || null, logo_url || null, website || null, active ?? true, id]
      );
      if (result.rowCount === 0) return res.status(404).json({ error: 'Partner no encontrado' });
      return res.json(result.rows[0]);
    }

    if (req.method === 'DELETE') {
      const { id } = req.query;
      if (!id) return res.status(400).json({ error: 'ID requerido' });
      await query('DELETE FROM partners WHERE id=$1', [id]);
      return res.json({ ok: true });
    }

    res.setHeader('Allow', 'GET,POST,PUT,DELETE');
    return res.status(405).end();
  } catch (err: any) {
    console.error('Partners API error:', err);
    return res.status(500).json({ error: err.message });
  }
}
