import { ArrowRight, ChevronDown, Star, Users, Clock } from 'lucide-react';

const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

export default function Hero() {
  const scrollToFeatures = () => {
    const element = document.getElementById('features');
    if (element) element.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative flex items-center overflow-hidden mt-20 min-h-[calc(100vh-5rem)]">

      {/* Full-screen video background */}
      <video
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
      >
        <source src="/happyhub_coming.mp4" type="video/mp4" />
        <img src="/Happyhub-coming2026.jpeg" alt="HappyHub" className="absolute inset-0 w-full h-full object-cover" />
      </video>

      {/* Gradient only on the left — keeps right side of video fully visible */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent" />
      {/* Subtle top/bottom vignette */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-black/10" />

      {/* Content — left half only */}
      <div className="container-custom relative z-10 w-full">
        <div className="max-w-xl animate-slide-up">

          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm text-white/90 px-4 py-2 rounded-full text-sm font-semibold mb-8 border border-white/20">
            <span className="w-2 h-2 rounded-full bg-primary-400 animate-pulse" />
            Espacio disponible · Apertura Julio 2026
          </div>

          <h1 className="text-5xl md:text-6xl xl:text-7xl font-bold text-white leading-[1.05] tracking-tight mb-6">
            Celebra Momentos <span className="text-primary-300">Inolvidables</span>
          </h1>

          <p className="text-lg md:text-xl text-white/80 leading-relaxed mb-10">
            Espacio polivalente para todo tipo de celebraciones. Cumpleaños, eventos familiares, con amigos, o de colegio y trabajo. Cada detalle cobra vida.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 mb-10">
            <a
              href="/reservas"
              className="inline-flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-500 text-white px-8 py-4 rounded-2xl font-bold text-lg transition-all duration-200 shadow-xl hover:scale-105 cursor-pointer"
            >
              Reserva tu fecha
              <ArrowRight className="w-5 h-5" />
            </a>
            <a
              href="https://wa.me/34624645517"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white border border-white/30 px-8 py-4 rounded-2xl font-bold text-lg transition-all duration-200 cursor-pointer"
            >
              <WhatsAppIcon className="w-5 h-5" />
              Cuéntanos tu idea
            </a>
          </div>

          <div className="flex flex-wrap gap-5 text-sm text-white/70">
            <div className="flex items-center gap-1.5">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              <span className="font-semibold text-white">4.9/5</span> valoración
            </div>
            <span className="text-white/30">·</span>
            <div className="flex items-center gap-1.5">
              <Users className="w-4 h-4 text-primary-300" />
              Hasta <span className="font-semibold text-white mx-1">50 personas</span>
            </div>
            <span className="text-white/30">·</span>
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-primary-300" />
              Respuesta en <span className="font-semibold text-white mx-1">24h</span>
            </div>
          </div>
        </div>
      </div>

      {/* Floating WhatsApp card — bottom right, over the video */}
      <a
        href="https://wa.me/34624645517"
        target="_blank"
        rel="noopener noreferrer"
        className="absolute bottom-10 right-10 bg-white/95 backdrop-blur-sm p-4 rounded-2xl shadow-2xl hover:scale-105 transition-transform duration-200 cursor-pointer z-10 hidden md:flex items-center gap-3"
      >
        <div className="bg-gradient-to-br from-green-400 to-emerald-500 text-white p-2.5 rounded-xl">
          <WhatsAppIcon className="w-6 h-6" />
        </div>
        <div>
          <div className="font-bold text-gray-900 text-sm">Cuéntanos</div>
          <div className="text-xs text-gray-500">Que tienes en mente</div>
        </div>
      </a>

      {/* Scroll indicator */}
      <button
        onClick={scrollToFeatures}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/50 hover:text-white transition-colors animate-bounce cursor-pointer z-10"
        aria-label="Scroll hacia abajo"
      >
        <ChevronDown className="w-8 h-8" />
      </button>
    </section>
  );
}
