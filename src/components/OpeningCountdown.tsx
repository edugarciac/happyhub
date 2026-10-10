import { useEffect, useState } from 'react';
import { OPENING_LABEL, daysUntilOpening } from '@/config/opening';

/** Días que faltan para la inauguración, calculado en cliente (evita desajustes de hidratación). null hasta montar. */
export function useDaysUntilOpening(): number | null {
  const [days, setDays] = useState<number | null>(null);
  useEffect(() => {
    setDays(daysUntilOpening());
    const id = setInterval(() => setDays(daysUntilOpening()), 60_000);
    return () => clearInterval(id);
  }, []);
  return days;
}

/** Tarjeta de cuenta atrás para el Hero. Desaparece tras el día de la inauguración. */
export default function OpeningCountdown() {
  const days = useDaysUntilOpening();
  if (days === null || days < 0) return null;

  return (
    <div className="inline-flex items-stretch rounded-2xl overflow-hidden shadow-xl shadow-orange-500/30 mb-8 border-2 border-orange-300">
      <div className="bg-white text-orange-600 px-5 py-3 flex flex-col items-center justify-center min-w-[5.5rem]">
        <span className="text-4xl font-extrabold leading-none tabular-nums">{days === 0 ? '🎉' : days}</span>
        <span className="text-[11px] font-bold uppercase tracking-wide mt-1">
          {days === 0 ? 'hoy' : days === 1 ? 'día' : 'días'}
        </span>
      </div>
      <div className="bg-orange-500 text-white px-5 py-3 flex flex-col justify-center">
        <span className="text-xs font-semibold uppercase tracking-wide text-white/90">
          {days === 0 ? '¡Hoy inauguramos!' : 'Inauguración'}
        </span>
        <span className="text-xl md:text-2xl font-extrabold leading-tight">{OPENING_LABEL}</span>
      </div>
    </div>
  );
}
