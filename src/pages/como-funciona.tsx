import Head from 'next/head';
import Link from 'next/link';
import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface FaqItem {
  question: string;
  answer: string;
}

interface FaqCategory {
  title: string;
  emoji: string;
  faqs: FaqItem[];
}

const categories: FaqCategory[] = [
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
          'Ofrecemos tres franjas: Mañanas (11:00–14:30h), Tardes (16:30–20:30h) y Noches (22:00–02:00h). Cada franja incluye 30 minutos de acceso anticipado sin coste adicional.',
      },
      {
        question: '¿Qué pasa si quiero ampliar el horario?',
        answer:
          'Puedes solicitar una extensión horaria siempre que el espacio esté disponible. Consúltanos y te indicamos la tarifa adicional según el tramo.',
      },
      {
        question: '¿Cuál es la política de cancelación?',
        answer:
          'Ofrecemos cancelación gratuita hasta 15 días antes del evento. A partir de ese momento se aplica una penalización del 50% del depósito. Si cancelas con menos de 48h de antelación, el depósito no es reembolsable.',
      },
      {
        question: '¿Cómo funciona el pago?',
        answer:
          'Una vez confirmada tu solicitud, te enviamos un enlace de pago seguro vía Stripe. Se requiere un depósito del 30% para formalizar la reserva. El importe restante se abona el día del evento.',
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
          'Puedes acceder 30 minutos antes del inicio de tu franja horaria sin coste adicional. Si necesitas más tiempo para montar decoración o preparar el espacio, consúltanos.',
      },
      {
        question: '¿Qué incluye el alquiler del espacio?',
        answer:
          'El precio incluye el uso del espacio, mesas, sillas, equipo de sonido básico, WiFi, climatización y limpieza posterior al evento. Los servicios adicionales como catering, decoración o animación se contratan aparte.',
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
          'Nuestro equipo estará disponible por teléfono durante todo el evento para cualquier incidencia. Para eventos nocturnos o de mayor aforo, podemos asignar personal in situ bajo petición.',
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
          'La limpieza post-evento está incluida en el precio del alquiler. Solo te pedimos que recojas tus pertenencias y dejes el espacio en un orden mínimo antes de irte.',
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
          'El aforo máximo varía según la configuración del evento. Consúltanos con el número de asistentes previsto para que podamos orientarte sobre la distribución más adecuada.',
      },
      {
        question: '¿Se puede fumar en el espacio?',
        answer:
          'No está permitido fumar en el interior del espacio. Existe una zona exterior habilitada para fumadores.',
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

export default function ComoFunciona() {
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({});

  const toggleItem = (key: string) => {
    setOpenItems((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <>
      <Head>
        <title>¿Cómo lo hacemos? - HappyHub</title>
        <meta
          name="description"
          content="Todo lo que necesitas saber sobre cómo funciona HappyHub: reservas, pagos, normas y más."
        />
      </Head>

      {/* Hero */}
      <section className="bg-gradient-to-br from-primary-50 via-white to-secondary-50 pt-32 pb-16">
        <div className="container-custom text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 animate-fade-in">
            ¿Cómo lo hacemos?
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto animate-fade-in">
            Todo lo que necesitas saber para que tu evento salga perfecto.
          </p>
        </div>
      </section>

      {/* FAQ Categories */}
      <section className="py-20 bg-white">
        <div className="container-custom max-w-3xl">
          <div className="space-y-12">
            {categories.map((category) => (
              <div key={category.title}>
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                  <span className="text-3xl">{category.emoji}</span>
                  {category.title}
                </h2>

                <div className="space-y-3">
                  {category.faqs.map((faq, idx) => {
                    const key = `${category.title}-${idx}`;
                    const isOpen = !!openItems[key];

                    return (
                      <div
                        key={key}
                        className="bg-gray-50 rounded-2xl overflow-hidden border border-gray-100"
                      >
                        <button
                          onClick={() => toggleItem(key)}
                          className="w-full flex items-center justify-between text-left px-6 py-4 font-semibold text-gray-900 hover:bg-gray-100 transition-colors"
                          aria-expanded={isOpen}
                        >
                          <span>{faq.question}</span>
                          <ChevronDown
                            className={`w-5 h-5 text-primary-600 flex-shrink-0 ml-4 transition-transform duration-200 ${
                              isOpen ? 'rotate-180' : ''
                            }`}
                          />
                        </button>

                        {isOpen && (
                          <div className="px-6 pb-5 text-gray-600 leading-relaxed border-t border-gray-200 pt-4">
                            {faq.answer}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-gradient-to-r from-primary-600 to-primary-700">
        <div className="container-custom text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            ¿Tienes más preguntas?
          </h2>
          <p className="text-xl text-primary-50 mb-8 max-w-2xl mx-auto">
            Escríbenos por WhatsApp o por email y te respondemos enseguida
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/reservas"
              className="bg-white text-primary-600 hover:bg-primary-50 font-semibold py-4 px-8 rounded-xl transition-all shadow-lg hover:shadow-xl"
            >
              Reserva tu fecha
            </Link>
            <Link
              href="/contacto"
              className="bg-primary-800 text-white hover:bg-primary-900 font-semibold py-4 px-8 rounded-xl transition-all"
            >
              Contactar
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
