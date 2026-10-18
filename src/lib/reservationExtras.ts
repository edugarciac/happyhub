import { query } from '@/lib/db';

/** Servicio adicional tal como se contrató (precio congelado) */
export interface ReservationExtra {
  id: string;
  title: string;
  price: number;
}

/** Lee la columna `reservations.extras` sin fallar con datos antiguos o mal formados */
export function parseReservationExtras(value: unknown): ReservationExtra[] {
  const list = typeof value === 'string' ? safeJson(value) : value;
  if (!Array.isArray(list)) return [];
  return list
    .filter((e: any) => e && e.id !== undefined && e.id !== null)
    .map((e: any) => ({ id: String(e.id), title: String(e.title || ''), price: Number(e.price) || 0 }));
}

function safeJson(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    return [];
  }
}

export function extrasTotal(extras: ReservationExtra[]): number {
  return extras.reduce((sum, e) => sum + e.price, 0);
}

/**
 * Convierte los ids elegidos en servicios con título y precio. Los que ya estaban en la
 * reserva se conservan tal cual (aunque el catálogo haya cambiado); los nuevos tienen que
 * estar activos en `service_catalog`. Devuelve null si algún id no existe.
 */
export async function resolveReservationExtras(
  ids: unknown,
  current: ReservationExtra[] = []
): Promise<ReservationExtra[] | null> {
  if (!Array.isArray(ids)) return [];
  const wanted = Array.from(new Set(ids.map(String)));
  const kept = new Map(current.filter((e) => wanted.includes(e.id)).map((e) => [e.id, e]));
  const missing = wanted.filter((id) => !kept.has(id));
  if (missing.length > 0) {
    const result = await query('SELECT id, title, price FROM service_catalog WHERE active = true AND id::text = ANY($1::text[])', [missing]);
    if (result.rows.length !== missing.length) return null;
    result.rows.forEach((row: any) => kept.set(String(row.id), { id: String(row.id), title: row.title, price: parseFloat(row.price) || 0 }));
  }
  return wanted.map((id) => kept.get(id)!);
}
