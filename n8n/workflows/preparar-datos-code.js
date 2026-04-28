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

// Google Calendar requiere formato ISO 8601 con timezone Z (UTC)
// Crear objetos Date con la hora local y convertir a UTC
const startDate = new Date(`${data.date}T${slot.start}`);
const endDate = new Date(`${data.date}T${slot.end}`);

// Si es noche, el final es al día siguiente
if (data.timeSlot === 'night') {
  endDate.setDate(endDate.getDate() + 1);
}

// Convertir a ISO string (formato UTC con Z al final)
const startDateTime = startDate.toISOString();
const endDateTime = endDate.toISOString();

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
    calendarId: 'hola@happyhub.es'
  }
}];
