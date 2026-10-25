// Límites de uso del chatbot público: por IP (abuso) y por día (tope de coste).
// Se guarda solo un hash de la IP.
import crypto from 'crypto';
import type { NextApiRequest } from 'next';
import { query } from '@/lib/db';

export const CHAT_PER_IP_LIMIT = 20;
export const CHAT_PER_IP_WINDOW_MINUTES = 10;
/** Tope diario de mensajes de todos los clientes; se puede cambiar con CHAT_DAILY_LIMIT */
export const CHAT_DAILY_LIMIT = Number(process.env.CHAT_DAILY_LIMIT) || 1000;

let tableReady: Promise<void> | null = null;

function ensureChatUsageTable(): Promise<void> {
  if (!tableReady) {
    tableReady = (async () => {
      await query(`
        CREATE TABLE IF NOT EXISTS chat_usage (
          id         SERIAL PRIMARY KEY,
          ip_hash    CHAR(64) NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `);
      await query('CREATE INDEX IF NOT EXISTS chat_usage_ip_created_idx ON chat_usage (ip_hash, created_at)');
    })().catch((error) => {
      tableReady = null;
      throw error;
    });
  }
  return tableReady;
}

export function chatIpHash(req: NextApiRequest): string {
  const fwd = req.headers['x-forwarded-for'];
  const ip = (Array.isArray(fwd) ? fwd[0] : fwd)?.split(',')[0]?.trim() || req.socket?.remoteAddress || 'unknown';
  return crypto.createHash('sha256').update(ip).digest('hex');
}

/** Registra un mensaje si está dentro de los límites. Devuelve el límite superado, o null si puede pasar. */
export async function takeChatQuota(ipHash: string): Promise<'ip' | 'daily' | null> {
  await ensureChatUsageTable();
  const result = await query<{ per_ip: string; per_day: string }>(
    `SELECT
       COUNT(*) FILTER (WHERE ip_hash = $1 AND created_at > NOW() - make_interval(mins => $2)) AS per_ip,
       COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '1 day') AS per_day
     FROM chat_usage
     WHERE created_at > NOW() - INTERVAL '1 day'`,
    [ipHash, CHAT_PER_IP_WINDOW_MINUTES]
  );
  const { per_ip, per_day } = result.rows[0];
  if (Number(per_ip) >= CHAT_PER_IP_LIMIT) return 'ip';
  if (Number(per_day) >= CHAT_DAILY_LIMIT) return 'daily';

  await query('INSERT INTO chat_usage (ip_hash) VALUES ($1)', [ipHash]);
  // Limpieza: no se necesita más de un día de historial
  await query("DELETE FROM chat_usage WHERE created_at < NOW() - INTERVAL '2 days'");
  return null;
}
