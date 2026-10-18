/**
 * Utilidades para cálculo de precios según horarios y días
 * Basado en las tarifas oficiales de HappyHub
 */

export type TimeSlot = 'morning' | 'afternoon' | 'night';

/** Franjas que se pueden reservar. 'night' ya no se ofrece; se mantiene en el tipo solo para mostrar reservas antiguas. */
export const BOOKABLE_TIME_SLOTS: TimeSlot[] = ['morning', 'afternoon'];

export function isBookableTimeSlot(slot: unknown): slot is TimeSlot {
  return typeof slot === 'string' && (BOOKABLE_TIME_SLOTS as string[]).includes(slot);
}

export interface TimeSlotInfo {
  id: TimeSlot;
  label: string;
  startTime: string;
  endTime: string;
  earlyOpenTime?: string;
  description: string;
}

/** No abrimos de noche, pero la tarde se puede alargar unas horas */
export const AFTERNOON_EXTENSION_UNTIL = '23:00';
/** Precio de cada hora adicional al ampliar la tarde */
export const EXTRA_HOUR_PRICE = 60;
export const EXTRA_HOUR_LABEL = `Cada hora adicional: ${EXTRA_HOUR_PRICE} €`;
export const AFTERNOON_EXTENSION_TEXT = `La franja de tarde se puede ampliar hasta las ${AFTERNOON_EXTENSION_UNTIL}h.`;
export const AFTERNOON_EXTENSION_NOTE = `${AFTERNOON_EXTENSION_TEXT} ${EXTRA_HOUR_LABEL}.`;
/** Horas que se pueden añadir a la tarde (20:00 → 23:00) */
export const MAX_EXTRA_HOURS = 3;

export function isValidExtraHours(timeSlot: unknown, extraHours: unknown): boolean {
  if (!Number.isInteger(extraHours) || (extraHours as number) < 0 || (extraHours as number) > MAX_EXTRA_HOURS) return false;
  return extraHours === 0 || timeSlot === 'afternoon';
}

export function extraHoursPrice(extraHours: number): number {
  return extraHours * EXTRA_HOUR_PRICE;
}

export const TIME_SLOTS: TimeSlotInfo[] = [
  {
    id: 'morning',
    label: 'Mañana',
    startTime: '10:00',
    endTime: '14:00',
    description: 'Apertura a las 10:00h',
  },
  {
    id: 'afternoon',
    label: 'Tarde',
    startTime: '16:00',
    endTime: '20:00',
    description: 'Apertura a las 16:00h',
  },
  {
    id: 'night',
    label: 'Noche',
    startTime: '22:00',
    endTime: '02:00',
    earlyOpenTime: '21:30',
    description: 'Apertura a las 22:00h (21:30h sin coste adicional)',
  },
];

/** Hora de fin de la franja, ampliada con las horas adicionales ('20:00' + 2 → '22:00') */
export function slotEndTime(timeSlot: TimeSlot, extraHours = 0): string {
  const slot = TIME_SLOTS.find((ts) => ts.id === timeSlot);
  if (!slot) return '';
  const [h, m] = slot.endTime.split(':').map(Number);
  return `${String((h + extraHours) % 24).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/**
 * Verifica si una fecha es fin de semana (sábado o domingo)
 */
export function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6; // 0 = domingo, 6 = sábado
}

/**
 * Verifica si una fecha es viernes
 */
export function isFriday(date: Date): boolean {
  return date.getDay() === 5;
}

/**
 * Lista de festivos usada como fallback si no se ha podido cargar
 * la lista real desde /api/holidays (p.ej. fallo de red). Se mantiene
 * sincronizada a mano con la semilla de la migración 021_create_holidays.sql.
 */
const DEFAULT_HOLIDAYS = [
  '2026-01-01', '2026-01-06', '2026-04-03', '2026-04-06', '2026-05-01',
  '2026-05-25', '2026-06-24', '2026-08-15', '2026-09-11', '2026-09-21',
  '2026-10-12', '2026-12-08', '2026-12-25', '2026-12-26',
];

let holidayDates: Set<string> | null = null;
let holidayFetchPromise: Promise<void> | null = null;
let holidayFetchTimestamp = 0;
const HOLIDAY_CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

/**
 * Sustituye el conjunto de fechas festivas usado por isHoliday().
 */
export function setHolidayDates(dates: string[]): void {
  holidayDates = new Set(dates);
}

/**
 * Carga los festivos desde /api/holidays y los deja disponibles para
 * isHoliday(). Cachea el resultado 5 minutos; si la llamada falla y no
 * había festivos cargados todavía, usa DEFAULT_HOLIDAYS como resiliencia.
 */
export async function loadHolidaysFromApi(): Promise<void> {
  const now = Date.now();
  if (holidayDates && now - holidayFetchTimestamp < HOLIDAY_CACHE_DURATION) return;
  if (holidayFetchPromise) return holidayFetchPromise;

  holidayFetchPromise = (async () => {
    try {
      const res = await fetch('/api/holidays');
      if (!res.ok) throw new Error('Failed to fetch holidays');
      const data = await res.json();
      if (data.success && Array.isArray(data.holidays)) {
        setHolidayDates(data.holidays);
        holidayFetchTimestamp = Date.now();
      } else {
        throw new Error('Invalid holidays response');
      }
    } catch (error) {
      console.error('Error loading holidays, using fallback list:', error);
      if (!holidayDates) setHolidayDates(DEFAULT_HOLIDAYS);
    } finally {
      holidayFetchPromise = null;
    }
  })();

  return holidayFetchPromise;
}

/**
 * Verifica si una fecha es festivo, según los festivos cargados desde
 * /api/holidays (ver loadHolidaysFromApi). Antes de la primera carga,
 * usa DEFAULT_HOLIDAYS como resiliencia.
 */
export function isHoliday(date: Date): boolean {
  // Fecha local: toISOString() pasa a UTC y en España desplaza un día
  // las fechas creadas a medianoche local (p.ej. las del calendario).
  const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  const dates = holidayDates ?? new Set(DEFAULT_HOLIDAYS);
  return dates.has(dateStr);
}

/**
 * Verifica si una fecha es víspera de festivo
 */
export function isHolidayEve(date: Date): boolean {
  const nextDay = new Date(date);
  nextDay.setDate(nextDay.getDate() + 1);
  return isHoliday(nextDay);
}

/**
 * Devuelve la clave de pricing_rules que aplica a una fecha y franja.
 * Prioridad: festivo o víspera > fin de semana > viernes tarde > laborable.
 */
export function getPricingRuleKey(date: Date, timeSlot: TimeSlot): string {
  return getPricingRuleKeyFor(date, timeSlot, isHoliday(date) || isHolidayEve(date));
}

/** Igual que getPricingRuleKey, pero con el festivo/víspera ya resuelto (p.ej. en el servidor, desde la BD) */
export function getPricingRuleKeyFor(date: Date, timeSlot: TimeSlot, isHolidayOrEve: boolean): string {
  if (isHolidayOrEve) return `holiday_${timeSlot}`;
  if (isWeekend(date)) return `weekend_${timeSlot}`;
  if (isFriday(date) && timeSlot === 'afternoon') return 'friday_afternoon';
  return `weekday_${timeSlot}`;
}

/**
 * Calcula el precio a partir de las reglas de /api/pricing/current.
 * Un precio 0 o una regla ausente es "A consultar": nunca se inventa un precio.
 */
export function resolvePriceFromRules(
  rules: Record<string, number>,
  date: Date,
  timeSlot: TimeSlot
): number | 'consult' {
  if (timeSlot === 'night') return 'consult';
  const price = rules[getPricingRuleKey(date, timeSlot)];
  return price ? price : 'consult';
}

/** Total y señal (30%, redondeada hacia arriba) de una reserva. Lo usan el wizard y la API. */
export function bookingTotals(params: {
  basePrice: number;
  discount: number;
  extraHours: number;
  extrasTotal: number;
}): { total: number; deposit: number } {
  const total = params.basePrice - params.discount + extraHoursPrice(params.extraHours) + params.extrasTotal;
  return { total, deposit: Math.ceil(total * 0.3) };
}

/** Parrilla vigente, usada como fallback si no hay datos de la BD. 0 = "A consultar". */
export const DEFAULT_PRICING_RULES: Record<string, number> = {
  weekday_morning: 120,
  weekday_afternoon: 130,
  friday_afternoon: 180,
  weekend_morning: 160,
  weekend_afternoon: 200,
  holiday_morning: 0,
  holiday_afternoon: 0,
  night_consult: 0,
  night_consult_weekend: 0,
};

/**
 * Calcula el precio base según el día y la franja horaria (parrilla por defecto)
 */
export function calculateBasePrice(date: Date, timeSlot: TimeSlot): number | 'consult' {
  return resolvePriceFromRules(DEFAULT_PRICING_RULES, date, timeSlot);
}

/**
 * Obtiene información de la tarifa para mostrar al usuario
 */
export function getPriceLabel(date: Date, timeSlot: TimeSlot): string {
  const price = calculateBasePrice(date, timeSlot);

  if (price === 'consult') {
    return 'A consultar';
  }

  return `${price}€`;
}

/**
 * Obtiene la descripción del tipo de día para la tarifa
 */
export function getDayTypeDescription(date: Date): string {
  if (isHoliday(date)) {
    return 'Festivo';
  }
  if (isHolidayEve(date)) {
    return 'Víspera de festivo';
  }
  if (isWeekend(date)) {
    return 'Fin de semana';
  }
  if (isFriday(date)) {
    return 'Viernes';
  }
  return 'Día laborable';
}

/**
 * Obtiene todas las franjas horarias disponibles para una fecha con precios
 */
export function getAvailableTimeSlotsWithPricing(date: Date) {
  return TIME_SLOTS.filter((slot) => BOOKABLE_TIME_SLOTS.includes(slot.id)).map((slot) => ({
    ...slot,
    price: calculateBasePrice(date, slot.id),
    priceLabel: getPriceLabel(date, slot.id),
  }));
}

/**
 * Formatea la información completa de precio para mostrar al usuario
 */
export function formatPriceInfo(date: Date, timeSlot: TimeSlot): {
  price: number | 'consult';
  priceLabel: string;
  dayType: string;
  timeSlotLabel: string;
  fullDescription: string;
} {
  const price = calculateBasePrice(date, timeSlot);
  const priceLabel = getPriceLabel(date, timeSlot);
  const dayType = getDayTypeDescription(date);
  const timeSlotInfo = TIME_SLOTS.find((ts) => ts.id === timeSlot);
  const timeSlotLabel = timeSlotInfo?.label || '';

  let fullDescription = '';
  if (price === 'consult') {
    fullDescription = `${timeSlot === 'night' ? 'Horario nocturno' : dayType} - Precio a consultar`;
  } else {
    fullDescription = `${dayType} - ${timeSlotLabel}: ${priceLabel}`;
  }

  return {
    price,
    priceLabel,
    dayType,
    timeSlotLabel,
    fullDescription,
  };
}
