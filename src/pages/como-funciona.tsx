import Head from 'next/head';
import Link from 'next/link';
import { Check, Calendar, MessageSquare, CreditCard, PartyPopper } from 'lucide-react';

export default function ComoFunciona() {
  const steps = [
    {
      number: '1',
      icon: Calendar,
      title: 'Consulta Disponibilidad',
      description: 'Revisa nuestro calendario interactivo y selecciona la fecha y franja horaria que mejor se adapte a tu evento.',
      details: [
        'Calendario actualizado en tiempo real',
        'Tres franjas horarias: Mañana, Tarde y Noche',
        'Tarifas transparentes según día y horario',
      ],
    },
    {
      number: '2',
      icon: MessageSquare,
      title: 'Solicita tu Reserva',
      description: 'Rellena el formulario con los detalles de tu evento. Nuestro equipo revisará tu solicitud personalmente.',
      details: [
        'Formulario simple y rápido',
        'Selecciona servicios extras (catering, animación, etc.)',
        'Cuéntanos tus necesidades especiales',
      ],
    },
    {
      number: '3',
      icon: Check,
      title: 'Confirmación Personal',
      description: 'Revisaremos tu solicitud y te contactaremos para confirmar todos los detalles y enviarte el presupuesto final.',
      details: [
        'Contacto telefónico o por email',
        'Presupuesto personalizado',
        'Resolución de dudas',
      ],
    },
    {
      number: '4',
      icon: CreditCard,
      title: 'Reserva y Pago',
      description: 'Una vez confirmado, realizas el pago del depósito (30%) para asegurar tu fecha. El resto se abona el día del evento.',
      details: [
        'Depósito del 30% para reservar',
        'Pago seguro con Stripe',
        'Resto el día del evento',
      ],
    },
    {
      number: '5',
      icon: PartyPopper,
      title: '¡A Celebrar!',
      description: 'El día del evento, nuestro espacio estará preparado y listo para que disfrutes de una celebración inolvidable.',
      details: [
        'Espacio preparado y limpio',
        'Acceso desde 30 min antes',
        'Soporte durante el evento',
      ],
    },
  ];

  const faqs = [
    {
      question: '¿Cuánto tiempo dura cada franja horaria?',
      answer: 'Cada franja tiene una duración base. Mañanas: 3.5h (11:00-14:30h), Tardes: 4h (16:30-20:30h), Noches: 4h (22:00-02:00h). Puedes solicitar extensión horaria.',
    },
    {
      question: '¿Puedo cancelar mi reserva?',
      answer: 'Sí, ofrecemos cancelación gratuita hasta 15 días antes del evento. Consulta nuestra política completa de cancelaciones.',
    },
    {
      question: '¿Qué incluye el alquiler del espacio?',
      answer: 'El precio del alquiler incluye el uso del espacio, mesas, sillas, equipo de sonido básico, wifi y limpieza. Los servicios extras (catering, decoración, etc.) se contratan aparte.',
    },
    {
      question: '¿Puedo traer mi propia decoración?',
      answer: 'Sí, puedes traer tu propia decoración. Solo te pedimos que no uses confeti, purpurina ni elementos que puedan dañar las instalaciones.',
    },
    {
      question: '¿Cuántas personas caben en el espacio?',
      answer: 'Nuestro espacio tiene capacidad para hasta 150 personas cómodamente.',
    },
  ];

  return (
    <>
      <Head>
        <title>Cómo Funciona - HappyHub</title>
        <meta
          name="description"
          content="Descubre lo fácil que es reservar tu espacio para eventos en HappyHub. Proceso simple en 5 pasos."
        />
      </Head>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-50 via-white to-secondary-50 pt-32 pb-16">
        <div className="container-custom text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 animate-fade-in">
            ¿Cómo Funciona?
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto animate-fade-in">
            Reservar tu espacio para eventos en HappyHub es <strong>fácil, rápido y seguro</strong>.
            Te guiamos en cada paso para que tu experiencia sea perfecta.
          </p>
        </div>
      </section>

      {/* Steps Section */}
      <section className="py-20 bg-white">
        <div className="container-custom">
          <div className="space-y-16">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isEven = index % 2 === 0;

              return (
                <div
                  key={step.number}
                  className={`flex flex-col ${
                    isEven ? 'lg:flex-row' : 'lg:flex-row-reverse'
                  } items-center gap-12 lg:gap-20`}
                >
                  {/* Icon and Number */}
                  <div className="flex-shrink-0 relative">
                    <div className="w-32 h-32 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-2xl">
                      <Icon className="w-16 h-16 text-white" />
                    </div>
                    <div className="absolute -top-4 -right-4 w-16 h-16 bg-secondary-500 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                      {step.number}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 text-center lg:text-left">
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                      {step.title}
                    </h2>
                    <p className="text-lg text-gray-600 mb-6">{step.description}</p>
                    <ul className="space-y-3">
                      {step.details.map((detail, idx) => (
                        <li key={idx} className="flex items-start gap-3 text-gray-700">
                          <Check className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" />
                          <span>{detail}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-primary-600 to-primary-700">
        <div className="container-custom text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            ¿Listo para empezar?
          </h2>
          <p className="text-xl text-primary-50 mb-8 max-w-2xl mx-auto">
            Consulta nuestra disponibilidad y solicita tu reserva en menos de 5 minutos
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

      {/* FAQ Section */}
      <section className="py-20 bg-gray-50">
        <div className="container-custom">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Preguntas Frecuentes
            </h2>
            <p className="text-xl text-gray-600">
              Resolvemos tus dudas más comunes
            </p>
          </div>

          <div className="max-w-3xl mx-auto space-y-6">
            {faqs.map((faq, index) => (
              <details
                key={index}
                className="bg-white rounded-2xl p-6 shadow-md hover:shadow-lg transition-shadow group"
              >
                <summary className="font-semibold text-lg text-gray-900 cursor-pointer list-none flex items-center justify-between">
                  {faq.question}
                  <span className="text-primary-600 text-2xl group-open:rotate-45 transition-transform">
                    +
                  </span>
                </summary>
                <p className="mt-4 text-gray-600 leading-relaxed">{faq.answer}</p>
              </details>
            ))}
          </div>

          <div className="text-center mt-12">
            <p className="text-gray-600 mb-4">¿Tienes más preguntas?</p>
            <Link
              href="/contacto"
              className="text-primary-600 hover:text-primary-700 font-semibold underline"
            >
              Contacta con nosotros
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
