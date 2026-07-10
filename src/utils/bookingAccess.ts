export function getBookingAllowedEmails(): string[] {
  return (process.env.NEXT_PUBLIC_BOOKING_ALLOWED_EMAILS || '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function isBookingAllowedEmail(email?: string | null): boolean {
  if (!email) return false;
  return getBookingAllowedEmails().includes(email.trim().toLowerCase());
}
