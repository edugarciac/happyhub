// Conversión entre el valor interno de fecha ('YYYY-MM-DD') y lo que ve el usuario ('dd/mm/aaaa').

/** 'YYYY-MM-DD' -> 'dd/mm/aaaa' ('' si no es válida) */
export function isoToDisplay(iso: string | null | undefined): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || '');
  return m ? `${m[3]}/${m[2]}/${m[1]}` : '';
}

/** Formatea lo que va tecleando el usuario: solo dígitos, con barras automáticas. */
export function formatTyping(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

/** 'dd/mm/aaaa' -> 'YYYY-MM-DD', o null si está incompleta o no existe (p. ej. 31/02/2026). */
export function displayToIso(display: string): string | null {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(display);
  if (!m) return null;
  const [, dd, mm, yyyy] = m;
  const d = new Date(Date.UTC(Number(yyyy), Number(mm) - 1, Number(dd)));
  if (d.getUTCFullYear() !== Number(yyyy) || d.getUTCMonth() !== Number(mm) - 1 || d.getUTCDate() !== Number(dd)) {
    return null;
  }
  return `${yyyy}-${mm}-${dd}`;
}
