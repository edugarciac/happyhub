// Preguntas frecuentes de HappyHub. Fuente única para /como-funciona y /guia-sala.

export interface FaqItem {
  question: string;
  answer: string;
}

export interface FaqCategory {
  title: string;
  emoji: string;
  faqs: FaqItem[];
}

export const FAQ_CATEGORIES: FaqCategory[] = [
  {
    title: 'La reserva',
    emoji: '📅',
    faqs: [
      {
        question: '¿Cómo puedo reservar el espacio?',
        answer:
          'Selecciona la fecha y franja horaria en nuestro calendario de disponibilidad y rellena el formulario de reserva. Nuestro equipo revisará tu solicitud y te contactará en menos de 24h para confirmar los detalles.',
      },
      {
        question: '¿Cuánto tiempo de antelación necesito para reservar?',
        answer:
          'Recomendamos reservar con al menos 2 semanas de antelación para garantizar disponibilidad, especialmente en fines de semana y festivos. Para eventos de última hora, consúltanos directamente por WhatsApp.',
      },
      {
        question: '¿Cuáles son las franjas horarias disponibles?',
        answer:
          'Ofrecemos dos franjas: Mañanas (10:00–14:00h) y Tardes (16:00–20:00h). No abrimos de noche, pero la franja de tarde se puede ampliar hasta las 23:00h. Cada hora adicional cuesta 60 €.',
      },
      {
        question: '¿Qué pasa si quiero ampliar el horario?',
        answer:
          'Puedes solicitar una extensión horaria siempre que el espacio esté disponible. La tarde se puede alargar hasta las 23:00h. Cada hora adicional cuesta 60 €.',
      },
      {
        question: '¿Cuál es la política de cancelación?',
        answer:
          'Si cancelas con 15 días o más de antelación, te devolvemos el depósito. Entre 14 y 3 días antes no hay devolución, pero puedes cambiar la fecha del evento (sujeto a disponibilidad). Con menos de 3 días de antelación, no se devuelve el depósito.',
      },
      {
        question: '¿Cómo funciona el pago?',
        answer:
          'Cuando aprobamos tu solicitud, pagas una señal del 30% (con tarjeta o Bizum) en las 24 horas siguientes. El día del evento, antes de empezar, pagas el resto con tarjeta (con un enlace o QR en tu móvil, o en nuestro datáfono) y se bloquea una fianza de 150 € en tu tarjeta de crédito o débito. La fianza no es un cobro: la liberamos en cuanto revisamos el espacio, como máximo en 7 días. Bizum solo se admite para la señal. Detalle completo en los términos y condiciones.',
      },
    ],
  },
  {
    title: 'El día de tu evento',
    emoji: '🎉',
    faqs: [
      {
        question: '¿A qué hora puedo acceder el día del evento?',
        answer:
          'Puedes acceder 30 minutos antes del inicio de tu franja horaria sin coste adicional. Si necesitas más tiempo para montar decoración o preparar el espacio, puedes contratar 1 hora adicional de acceso anticipado por 30 €.',
      },
      {
        question: '¿Qué incluye el alquiler del espacio?',
        answer:
          'El precio incluye el uso del espacio, mesas, sillas, equipo de sonido básico, WiFi, climatización y la limpieza general tras el evento, siempre que el espacio se deje recogido. Los servicios adicionales como catering, decoración o animación se contratan aparte.',
      },
      {
        question: '¿Puedo traer comida y bebida de fuera?',
        answer:
          'Sí, puedes traer tu propio catering o contratar el nuestro. Si traes bebidas alcohólicas, deben ser para consumo privado. No está permitida la venta de alcohol sin licencia.',
      },
      {
        question: '¿Hay aparcamiento disponible?',
        answer:
          'Hay zonas de aparcamiento en las inmediaciones del espacio. Consúltanos para más información sobre las opciones disponibles según el día y el horario.',
      },
      {
        question: '¿Hay alguien del equipo presente durante el evento?',
        answer:
          'Nuestro equipo estará disponible por teléfono durante todo el evento para cualquier incidencia. Para eventos de mayor aforo, podemos asignar personal in situ bajo petición.',
      },
    ],
  },
  {
    title: 'Decoración y limpieza',
    emoji: '✨',
    faqs: [
      {
        question: '¿Puedo decorar el espacio a mi gusto?',
        answer:
          'Sí, puedes traer tu propia decoración o contratar la nuestra. El espacio es tuyo durante tu franja horaria y puedes personalizarlo libremente.',
      },
      {
        question: '¿Qué materiales están prohibidos?',
        answer:
          'No está permitido el uso de confeti, purpurina, bengalas ni cualquier material que pueda dañar las superficies o dificultar la limpieza. Tampoco se pueden fijar elementos en paredes o techos con clavos o tornillos.',
      },
      {
        question: '¿Puedo pegar cosas en las paredes?',
        answer:
          'Sí, pero solo con materiales que no dañen la pintura: cinta de carrocero, velcro adhesivo removible o ganchos de ventosa. Queda prohibido el uso de celo normal, cinta americana o cualquier pegamento.',
      },
      {
        question: '¿Quién se encarga de la limpieza?',
        answer:
          'Al terminar, el espacio debe quedar completamente recogido y en las mismas condiciones en que te lo entregamos: residuos recogidos, mobiliario en su sitio y decoración retirada. Si no es así, se cobrarán 50 € por la limpieza posterior.',
      },
      {
        question: '¿Qué ocurre si se produce algún desperfecto?',
        answer:
          'Los desperfectos que superen el desgaste normal del uso serán facturados al responsable de la reserva. Por eso recomendamos revisar el espacio a la llegada y comunicarnos cualquier incidencia preexistente.',
      },
    ],
  },
  {
    title: 'Normas del espacio',
    emoji: '📋',
    faqs: [
      {
        question: '¿Hay un límite de personas?',
        answer:
          'Sí, el aforo máximo es de 50 personas, contando adultos y niños.',
      },
      {
        question: '¿Se puede fumar en el espacio?',
        answer:
          'No. Está prohibido fumar cigarrillos y usar vapers o cigarrillos electrónicos en el interior del espacio.',
      },
      {
        question: '¿Se admiten mascotas?',
        answer:
          'No se admiten mascotas en el interior del espacio, salvo animales de asistencia debidamente acreditados.',
      },
      {
        question: '¿Hay alguna restricción de música o ruido?',
        answer:
          'El volumen de la sala está limitado para asegurar que no se sobrepasa el límite legal de música. El espacio dispone de aislamiento acústico, pero debemos cumplir con la normativa vigente especialmente en horario nocturno.',
      },
      {
        question: '¿Se puede usar equipo de sonido propio o contratar un DJ?',
        answer:
          'No se puede conectar tu propio equipo de música. Sin embargo, podemos ayudarte a contratar animación musical profesional que se adapte a tu evento. Consúltanos con antelación y te ofrecemos opciones.',
      },
    ],
  },
];
