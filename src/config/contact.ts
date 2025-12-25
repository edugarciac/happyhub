// Información de contacto de HappyHub
// Este archivo centraliza todos los datos de contacto para facilitar actualizaciones

export const CONTACT_INFO = {
  email: 'happyhub.rovellat@gmail.com',
  phone: '638390600',
  phoneFormatted: '638 390 600',
  phoneInternational: '+34638390600',
  address: {
    street: 'C/ Rovellat, 25',
    postalCode: '08950',
    city: 'Esplugues de Llobregat',
    province: 'Barcelona',
    country: 'España',
    full: 'C/ Rovellat, 25, 08950 Esplugues de Llobregat, Barcelona, España',
  },
  schedule: {
    weekdays: 'Lunes - Viernes: 9:00 - 20:00',
    saturday: 'Sábados: 10:00 - 14:00',
    sunday: 'Domingos: Cerrado',
  },
  whatsapp: 'https://wa.me/34638390600',
  social: {
    // Añadir cuando estén disponibles
    facebook: '',
    instagram: '',
    twitter: '',
  },
} as const;
