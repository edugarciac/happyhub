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
 * Verifica si una fecha es festivo
 * TODO: Integrar con API de festivos o mantener lista actualizada
 */
export function isHoliday(date: Date): boolean {
  const holidays2025 = [
    '2025-01-01', // Año Nuevo
    '2025-01-06', // Reyes
    '2025-04-18', // Viernes Santo
    '2025-05-01', // Día del Trabajo
    '2025-08-15', // Asunción
    '2025-10-12', // Fiesta Nacional
    '2025-11-01', // Todos los Santos
    '2025-12-06', // Constitución
    '2025-12-08', // Inmaculada
    '2025-12-25', // Navidad
  ];

  const dateStr = date.toISOString().split('T')[0];
  return holidays2025.includes(dateStr);
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
