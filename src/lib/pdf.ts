import { jsPDF } from 'jspdf';

interface ReservationData {
  reservationId: string;
  name: string;
  email: string;
  phone: string;
  date: string;
  timeSlot: string;
  guests: number;
  eventType: string;
  extras: string[];
  basePrice: number;
  totalPrice: number;
  depositAmount: number;
  message?: string;
}

const TIME_SLOT_LABELS: Record<string, string> = {
  morning: 'Mañana (10:00-14:00)',
  afternoon: 'Tarde (16:00-20:00)',
  night: 'Noche (22:00-02:00)',
};

const EVENT_TYPE_LABELS: Record<string, string> = {
  'cumpleaños': 'Cumpleaños',
  'celebracion-familiar': 'Celebración familiar',
  'eventos-amigos': 'Eventos con amigos',
  'eventos-colegio-trabajo': 'Eventos de colegio/trabajo',
  'taller': 'Taller',
  'otros': 'Otros',
};

const EXTRAS_LABELS: Record<string, string> = {
  'catering': 'Catering',
  'animacion': 'Animación infantil',
  'decoracion': 'Decoración temática',
  'fotografia': 'Fotografía profesional',
  'tarta': 'Tarta personalizada',
};

export function generateContractPDF(reservation: ReservationData): Buffer {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  let yPos = 20;

  // Helper function to add centered text
  const addCenteredText = (text: string, y: number, fontSize: number = 12, style: 'normal' | 'bold' = 'normal') => {
    doc.setFontSize(fontSize);
    doc.setFont('helvetica', style);
    doc.text(text, pageWidth / 2, y, { align: 'center' });
  };

  // Helper function to add a line
  const addLine = (x1: number, y: number, x2: number) => {
    doc.setDrawColor(200, 200, 200);
    doc.line(x1, y, x2, y);
  };

  // Header
  addCenteredText('HAPPYHUB', yPos, 24, 'bold');
  yPos += 8;
  addCenteredText('Espacio de celebraciones', yPos, 12, 'normal');
  yPos += 15;

  // Contract title
  doc.setFillColor(37, 99, 235);
  doc.rect(margin, yPos, pageWidth - 2 * margin, 12, 'F');
  doc.setTextColor(255, 255, 255);
  addCenteredText('CONTRATO DE RESERVA', yPos + 8, 14, 'bold');
  doc.setTextColor(0, 0, 0);
  yPos += 25;

  // Reservation ID
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(`Nº de Reserva: ${reservation.reservationId}`, margin, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(`Fecha de emisión: ${new Date().toLocaleDateString('es-ES')}`, pageWidth - margin, yPos, { align: 'right' });
  yPos += 12;
  addLine(margin, yPos, pageWidth - margin);
  yPos += 10;

  // Section: Client Data
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('DATOS DEL CLIENTE', margin, yPos);
  yPos += 8;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(`Nombre: ${reservation.name}`, margin, yPos);
  yPos += 6;
  doc.text(`Email: ${reservation.email}`, margin, yPos);
  yPos += 6;
  doc.text(`Teléfono: ${reservation.phone}`, margin, yPos);
  yPos += 12;

  // Section: Event Details
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('DETALLES DEL EVENTO', margin, yPos);
  yPos += 8;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');

  const eventDate = new Date(reservation.date);
  const formattedDate = eventDate.toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  doc.text(`Fecha: ${formattedDate}`, margin, yPos);
  yPos += 6;
  doc.text(`Horario: ${TIME_SLOT_LABELS[reservation.timeSlot] || reservation.timeSlot}`, margin, yPos);
  yPos += 6;
  doc.text(`Tipo de evento: ${EVENT_TYPE_LABELS[reservation.eventType] || reservation.eventType}`, margin, yPos);
  yPos += 6;
  doc.text(`Número de invitados: ${reservation.guests} personas`, margin, yPos);
  yPos += 12;

  // Section: Services
  if (reservation.extras.length > 0) {
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text('SERVICIOS ADICIONALES', margin, yPos);
    yPos += 8;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');

    reservation.extras.forEach((extra) => {
      doc.text(`• ${EXTRAS_LABELS[extra] || extra}`, margin + 5, yPos);
      yPos += 6;
    });
    yPos += 6;
  }

  // Section: Pricing
  addLine(margin, yPos, pageWidth - margin);
  yPos += 8;
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('DESGLOSE ECONÓMICO', margin, yPos);
  yPos += 8;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');

  // Pricing table
  const priceX = pageWidth - margin - 50;
  doc.text('Alquiler del espacio:', margin, yPos);
  doc.text(`${reservation.basePrice}€`, priceX, yPos, { align: 'right' });
  yPos += 6;

  if (reservation.extras.length > 0) {
    const extrasPrice = reservation.totalPrice - reservation.basePrice;
    doc.text('Servicios adicionales:', margin, yPos);
    doc.text(`${extrasPrice}€`, priceX, yPos, { align: 'right' });
    yPos += 6;
  }

  addLine(margin, yPos, pageWidth - margin);
  yPos += 6;

  doc.setFont('helvetica', 'bold');
  doc.text('TOTAL:', margin, yPos);
  doc.text(`${reservation.totalPrice}€`, priceX, yPos, { align: 'right' });
  yPos += 10;

  doc.setFont('helvetica', 'normal');
  doc.text('Señal pagada (30%):', margin, yPos);
  doc.setTextColor(34, 139, 34);
  doc.text(`${reservation.depositAmount}€`, priceX, yPos, { align: 'right' });
  doc.setTextColor(0, 0, 0);
  yPos += 6;

  doc.text('Resto pendiente:', margin, yPos);
  doc.text(`${reservation.totalPrice - reservation.depositAmount}€`, priceX, yPos, { align: 'right' });
  yPos += 15;

  // Section: Terms and Conditions
  addLine(margin, yPos, pageWidth - margin);
  yPos += 8;
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('TÉRMINOS Y CONDICIONES', margin, yPos);
  yPos += 8;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');

  const terms = [
    '1. Cancelación con 15 días o más de antelación: se devuelve el 100% del depósito.',
    '2. Entre 14 y 3 días antes del evento: no se devuelve el depósito, pero se puede cambiar la fecha (sujeto a disponibilidad). Con menos de 3 días: no hay devolución ni cambio de fecha.',
    '3. Pagos: señal del 30% al aprobar la reserva (tarjeta o Bizum). El día del evento, antes de empezar: resto con tarjeta (enlace/QR o datáfono, no Bizum) y bloqueo de una fianza de 150 € en tarjeta de crédito o débito, que se libera tras revisar el espacio (máx. 7 días). Sin pago del resto y fianza no comienza el evento.',
    '4. El aforo máximo permitido es de 50 personas.',
    '5. El cliente se compromete a dejar el espacio completamente recogido y en las mismas condiciones en que fue entregado. Si no es así, se cobrarán 50 € por la limpieza posterior.',
    '6. HappyHub no se hace responsable de objetos olvidados en las instalaciones.',
    '7. Está prohibido fumar cigarrillos y usar vapers o cigarrillos electrónicos en el interior del espacio.',
    '8. Cualquier daño a las instalaciones será responsabilidad del cliente.',
    '9. El responsable de la reserva debe ser mayor de edad y estar presente durante todo el evento. Responde del comportamiento de los asistentes.',
    '10. Prohibido servir o permitir el consumo de alcohol a menores de 18 años.',
    '11. HappyHub se reserva el derecho de admisión y puede dar por finalizado el evento, sin devolución, ante incumplimientos graves no corregidos tras aviso.',
    '12. Acceso al espacio 30 minutos antes del inicio, sin coste. 1 hora adicional de acceso anticipado: 30 €.',
    '13. Condiciones completas en www.happyhub.es/terminos.',
  ];

  terms.forEach((term) => {
    const lines = doc.splitTextToSize(term, pageWidth - 2 * margin);
    doc.text(lines, margin, yPos);
    yPos += lines.length * 4 + 2;
  });

  // Footer
  yPos = doc.internal.pageSize.getHeight() - 30;
  addLine(margin, yPos, pageWidth - margin);
  yPos += 8;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  addCenteredText('HAPPYHUB CB - NIF E26649814 - C/ Rovellat 27, Esplugues de Llobregat', yPos, 10);
  yPos += 5;
  doc.setFontSize(9);
  addCenteredText('WhatsApp: 624 645 517 | Email: hola@happyhub.es | Web: www.happyhub.es', yPos, 9);

  // Return as Buffer for Node.js API
  const pdfOutput = doc.output('arraybuffer');
  return Buffer.from(pdfOutput);
}
