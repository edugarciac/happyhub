/**
 * Utilidades para cálculo de precios según horarios y días
 * Basado en las tarifas oficiales de HappyHub
 */

export type TimeSlot = 'morning' | 'afternoon' | 'night';

export interface TimeSlotInfo {
  id: TimeSlot;
  label: string;
  startTime: string;
  endTime: string;
  earlyOpenTime?: string;
  description: string;
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
  const dateStr = date.toISOString().split('T')[0];
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
 * Calcula el precio base según el día y la franja horaria
 */
export function calculateBasePrice(date: Date, timeSlot: TimeSlot): number | 'consult' {
  // Horario nocturno siempre es "a consultar"
  if (timeSlot === 'night') {
    return 'consult';
  }

  const isWeekendDay = isWeekend(date);
  const isFridayDay = isFriday(date);
  const isHolidayDay = isHoliday(date);
  const isHolidayEveDay = isHolidayEve(date);

  // Fines de semana y festivos
  if (isWeekendDay || isHolidayDay) {
    if (timeSlot === 'morning') {
      return 130; // Sábados, domingos y festivos - Mañanas
    } else {
      return 170; // Sábados, domingos y festivos - Tardes
    }
  }

  // Viernes tarde o víspera de festivo tarde
  if ((isFridayDay || isHolidayEveDay) && timeSlot === 'afternoon') {
    return 140; // Viernes y vísperas de festivos - Tardes
  }

  // Días laborables (lunes a jueves) o viernes mañana
  return 110; // De lunes a viernes - Mañanas, De lunes a jueves - Tardes
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
  if (isWeekend(date)) {
    return 'Fin de semana';
  }
  if (isHoliday(date)) {
    return 'Festivo';
  }
  if (isHolidayEve(date) || isFriday(date)) {
    return 'Víspera de festivo';
  }
  return 'Día laborable';
}

/**
 * Obtiene todas las franjas horarias disponibles para una fecha con precios
 */
export function getAvailableTimeSlotsWithPricing(date: Date) {
  return TIME_SLOTS.map((slot) => ({
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
    fullDescription = `Horario nocturno - Precio a consultar`;
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
