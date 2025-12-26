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
