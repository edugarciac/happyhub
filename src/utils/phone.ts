/**
 * Format phone number for wa.me deep links.
 * Strips non-digits, adds Spanish country code 34 if missing.
 */
export function formatPhoneForWhatsApp(phone: string): string {
  let cleaned = phone.replace(/\D/g, '');

  // If starts with 0, assume Spanish number
  if (cleaned.startsWith('0')) {
    cleaned = '34' + cleaned.slice(1);
  }

  // If 9 digits without country code, assume Spanish
  if (!cleaned.startsWith('34') && cleaned.length === 9) {
    cleaned = '34' + cleaned;
  }

  return cleaned;
}

/**
 * Build a wa.me URL from a phone number.
 * Returns null if phone is empty/undefined.
 */
export function buildWhatsAppUrl(phone: string | null | undefined): string | null {
  if (!phone || phone.trim() === '') return null;
  return `https://wa.me/${formatPhoneForWhatsApp(phone)}`;
}
