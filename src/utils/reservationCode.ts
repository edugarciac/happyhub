// Código visible de la reserva: RES-YYYYMMDD-NNN, donde NNN es el id de la tabla reservations.

export function buildReservationCode(date: string, dbId: number): string {
  return `RES-${date.replace(/-/g, '')}-${String(dbId).padStart(3, '0')}`;
}

/** Devuelve el id numérico de la reserva a partir de 'RES-YYYYMMDD-NNN' o de un id numérico. null si no se reconoce. */
export function parseReservationCode(code: unknown): number | null {
  const value = String(code ?? '').trim();
  const m = /^RES-\d{8}-(\d+)$/i.exec(value) || /^(\d+)$/.exec(value);
  if (!m) return null;
  const id = Number.parseInt(m[1], 10);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}
