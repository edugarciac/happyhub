// Código limpio y verificado para el nodo "Preparar Datos"
// Este archivo es solo para referencia, copia el código dentro de n8n

const data = items[0].json.body || items[0].json;

// Formatear fecha para Google Calendar
const eventDate = new Date(data.date);

const timeSlots = {
  morning: {
    start: '11:00:00',
    end: '14:30:00',
    label: 'Mañana (11:00-14:30)'
  },
  afternoon: {
    start: '16:30:00',
    end: '20:30:00',
    label: 'Tarde (16:30-20:30)'
  },
  night: {
    start: '22:00:00',
    end: '02:00:00',
    label: 'Noche (22:00-02:00)'
  }
};

const slot = timeSlots[data.timeSlot];

if (!slot) {
  throw new Error(`Invalid timeSlot: ${data.timeSlot}`);
}

// Google Calendar requiere formato RFC3339 con timezone
const timezone = 'Europe/Madrid'; // UTC+1/+2 (España)
const startDateTime = `${data.date}T${slot.start}+01:00`;
let endDateTime = `${data.date}T${slot.end}+01:00`;

// Si es noche, el final es al día siguiente
if (data.timeSlot === 'night') {
  const nextDay = new Date(eventDate);
  nextDay.setDate(nextDay.getDate() + 1);
  endDateTime = `${nextDay.toISOString().split('T')[0]}T${slot.end}+01:00`;
}

const formattedDate = eventDate.toLocaleDateString('es-ES', {
  weekday: 'long',
  year: 'numeric',
  month: 'long',
  day: 'numeric'
});

const paymentLabels = {
  card: 'Tarjeta',
  bizum: 'Bizum',
  cash: 'Efectivo'
};

const eventTypeLabels = {
  'cumpleaños': 'Cumpleaños',
  'celebracion-familiar': 'Celebración familiar',
  'eventos-amigos': 'Eventos con amigos',
  'eventos-colegio-trabajo': 'Eventos de colegio o trabajo',
  'taller': 'Taller',
  'otros': 'Otros'
};

return [{
  json: {
    ...data,
    startDateTime,
    endDateTime,
    timeSlotLabel: slot.label,
    formattedDate,
    paymentMethodLabel: paymentLabels[data.paymentMethod] || data.paymentMethod,
    eventTypeLabel: eventTypeLabels[data.eventType] || data.eventType,
    calendarId: 'happyhub.rovellat@gmail.com'
  }
}];
