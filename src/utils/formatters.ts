import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount);
}

export function formatDate(date: string | Date, formatStr: string = 'dd/MM/yyyy'): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, formatStr, { locale: es });
}

export function formatDateTime(date: string | Date): string {
  return formatDate(date, "dd/MM/yyyy 'a las' HH:mm");
}

export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 9) {
    return cleaned.replace(/(\d{3})(\d{3})(\d{3})/, '$1 $2 $3');
  }
  return phone;
}

export function formatEventType(type: string): string {
  const types: Record<string, string> = {
    cumpleaños: 'Cumpleaños',
    comunion: 'Comunión',
    bautizo: 'Bautizo',
    otro: 'Otro evento',
  };
  return types[type] || type;
}

export function formatDuration(duration: string): string {
  return duration.replace('h', ' horas');
}

export function calculatePrice(duration: string, guests: number, extras: string[] = []): number {
  const basePrices: Record<string, number> = {
    '2h': 200,
    '3h': 300,
    '4h': 400,
    '5h': 500,
  };

  const extraPrices: Record<string, number> = {
    catering: 15,
    animacion: 150,
    decoracion: 100,
    fotografia: 200,
    tarta: 50,
  };

  let total = basePrices[duration] || 0;

  extras.forEach((extra) => {
    if (extra === 'catering') {
      total += extraPrices[extra] * guests;
    } else {
      total += extraPrices[extra] || 0;
    }
  });

  return total;
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
