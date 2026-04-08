import { CalendarDays, Sparkles, PartyPopper } from 'lucide-react';

const steps = [
  {
    number: '01',
    icon: CalendarDays,
    title: 'Elige tu fecha',
    description: 'Consulta la disponibilidad online en tiempo real y reserva el día y franja horaria que mejor te venga.',
  },
  {
    number: '02',
    icon: Sparkles,
    title: 'Personaliza tu evento',
    description: 'Cuéntanos qué tienes en mente: decoración, catering, música, servicios extra. Lo adaptamos todo a ti.',
  },
  {
    number: '03',
    icon: PartyPopper,
    title: '¡A celebrar!',
    description: 'Llega y disfruta. Nuestro equipo se encarga de que todo esté perfecto para que solo tengas que disfrutar.',
  },
];

export default function HowItWorks() {
  return (
    <section className="py-24 bg-orange-50">
      <div className="container-custom">
        <div className="text-center mb-16">
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-100 text-orange-700 font-semibold text-sm mb-6 border border-orange-200">
            <Sparkles className="w-4 h-4" />
            Así de fácil
          </span>
          <h2 className="text-4xl md:text-5xl font-bold text-stone-900 mb-4 tracking-tight">
            Reservar en 3 pasos
          </h2>
          <p className="text-lg text-gray-600 max-w-xl mx-auto">
            Sin complicaciones, sin sorpresas. De la idea a la celebración en minutos.
          </p>
        </div>

        <div className="relative grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Connecting dashed line — desktop only */}
          <div className="hidden md:block absolute top-12 left-1/3 right-1/3 h-px border-t-2 border-dashed border-orange-300 z-0" />

          {steps.map(({ number, icon: Icon, title, description }) => (
            <div key={number} className="relative flex flex-col items-center text-center z-10">
              {/* Number circle */}
              <div className="relative mb-6">
                <div className="w-20 h-20 rounded-full bg-orange-500 flex items-center justify-center shadow-lg shadow-orange-200">
                  <Icon className="w-9 h-9 text-white" />
                </div>
                <span className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-stone-900 text-white text-xs font-bold flex items-center justify-center">
                  {number}
                </span>
              </div>

              <h3 className="text-xl font-bold text-stone-900 mb-3">{title}</h3>
              <p className="text-gray-600 leading-relaxed max-w-xs">{description}</p>
            </div>
          ))}
        </div>

        <div className="text-center mt-14">
          <a
            href="/reservas"
            className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-10 py-4 rounded-2xl font-bold text-lg transition-all duration-200 shadow-lg shadow-orange-200 hover:scale-105 cursor-pointer"
          >
            Empezar ahora
            <PartyPopper className="w-5 h-5" />
          </a>
        </div>
      </div>
    </section>
  );
}
