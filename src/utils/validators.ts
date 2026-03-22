import { z } from 'zod';

export const reservationSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  phone: z.string().min(9, 'Teléfono debe tener al menos 9 dígitos'),
  eventType: z.enum([
    'cumpleaños',
    'celebracion-familiar',
    'eventos-amigos',
    'eventos-colegio-trabajo',
    'taller',
    'otros'
  ], {
    errorMap: () => ({ message: 'Selecciona un tipo de evento válido' }),
  }),
  date: z.string().min(1, 'Selecciona una fecha'),
  timeSlot: z.enum(['morning', 'afternoon', 'night'], {
    errorMap: () => ({ message: 'Selecciona una franja horaria válida' }),
  }),
  guests: z.number().min(1, 'Debe haber al menos 1 invitado').max(150, 'Máximo 150 invitados'),
  extras: z.array(z.string()).optional(),
  paymentMethod: z.enum(['card', 'bizum', 'cash'], {
    errorMap: () => ({ message: 'Selecciona un método de pago válido' }),
  }),
  message: z.string().optional(),
});

export type ReservationFormData = z.infer<typeof reservationSchema>;

export const contactSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  subject: z.string().min(5, 'El asunto debe tener al menos 5 caracteres'),
  message: z.string().min(10, 'El mensaje debe tener al menos 10 caracteres'),
});

export type ContactFormData = z.infer<typeof contactSchema>;

export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export function validatePhone(phone: string): boolean {
  const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/;
  return phoneRegex.test(phone);
}

export function validateDate(date: string): boolean {
  const selectedDate = new Date(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return selectedDate >= today;
}

export const reviewSchema = z.object({
  reservation_id: z.number().int().positive('ID de reserva inválido'),
  rating: z.number().int().min(1, 'La valoración debe ser entre 1 y 5 estrellas').max(5, 'La valoración debe ser entre 1 y 5 estrellas'),
  review_text: z.string().max(500, 'La reseña no puede exceder 500 caracteres').optional(),
});

export type ReviewFormData = z.infer<typeof reviewSchema>;

export function isReservationEligibleForReview(reservation: {
  status: string;
  event_date: string;
}): boolean {
  // Only 'confirmed' reservations can be reviewed
  if (reservation.status !== 'confirmed') {
    return false;
  }

  // Event must be in the past
  const eventDate = new Date(reservation.event_date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return eventDate < today;
}

// Admin CRUD schemas
export const eventTypeSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  description: z.string().optional(),
  icon: z.string().max(10, 'El icono no puede exceder 10 caracteres').optional(),
});

export type EventTypeFormData = z.infer<typeof eventTypeSchema>;

export const partnerSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  service_type: z.string().min(2, 'El tipo de servicio es obligatorio'),
  email: z.string().email('Email invalido').optional(),
  phone: z.string().min(9, 'Telefono invalido').optional(),
  description: z.string().optional(),
  price_range: z.string().optional(),
  logo_url: z.string().url('URL invalida').optional().or(z.literal('')),
  website: z.string().url('URL invalida').optional().or(z.literal('')),
  active: z.boolean().default(true),
});

export type PartnerFormData = z.infer<typeof partnerSchema>;

export const serviceSchema = z.object({
  reservation_id: z.number().int().positive('ID de reserva inválido'),
  partner_id: z.number().int().positive('ID de partner invalido').optional(),
  service_name: z.string().min(2, 'El nombre del servicio es obligatorio'),
  service_type: z.string().min(2, 'El tipo de servicio es obligatorio'),
  price: z.number().min(0, 'El precio debe ser positivo'),
  status: z.enum(['pending', 'confirmed', 'completed', 'cancelled']).default('pending'),
  notes: z.string().optional(),
});

export type ServiceFormData = z.infer<typeof serviceSchema>;
