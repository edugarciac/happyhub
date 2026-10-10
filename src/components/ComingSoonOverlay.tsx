import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BOOKINGS_FROM_LABEL, OPENING_LABEL } from '@/config/opening';
import { useDaysUntilOpening } from '@/components/OpeningCountdown';

const STORAGE_KEY = 'happyhub_opening_popup_dismissed';

/** Popup de entrada con la cuenta atrás. Una vez por sesión, y solo hasta el día de la inauguración. */
export default function ComingSoonOverlay() {
  const days = useDaysUntilOpening();
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    try {
      setDismissed(!!sessionStorage.getItem(STORAGE_KEY));
    } catch {
      setDismissed(false);
    }
  }, []);

  const visible = !dismissed && days !== null && days >= 0;

  useEffect(() => {
    document.body.style.overflow = visible ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [visible]);

  const close = () => {
    try { sessionStorage.setItem(STORAGE_KEY, '1'); } catch { /* ignore */ }
    setDismissed(true);
  };

  if (!visible) return null;

  const isToday = days === 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#05585B]/95 p-6" onClick={close}>
      <div
        className="relative max-w-lg w-full bg-white rounded-3xl shadow-2xl px-8 sm:px-10 pt-10 pb-10 text-center"
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={close}
          aria-label="Cerrar y ver la web"
          className="absolute top-4 right-4 w-9 h-9 rounded-full bg-[#EAF6F5] text-[#05585B] font-bold"
        >
          ✕
        </button>

        <img src="/happyhub_logo_cara.png" alt="HappyHub" className="w-20 h-20 object-contain mx-auto mb-3" />

        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#F86F24]">
          {isToday ? '¡Hoy es el día!' : 'Inauguración'}
        </p>
        <h1
          className="font-bold text-4xl sm:text-5xl text-[#05585B] mt-1 leading-tight"
          style={{ fontFamily: 'var(--font-fredoka, inherit)' }}
        >
          {OPENING_LABEL}
        </h1>

        <div className="my-7 flex flex-col items-center">
          {isToday ? (
            <span className="text-6xl">🎉</span>
          ) : (
            <>
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {days === 1 ? 'Solo queda' : 'Quedan'}
              </span>
              <span className="text-7xl sm:text-8xl font-extrabold text-[#F86F24] leading-none tabular-nums">{days}</span>
              <span className="text-lg font-bold text-[#05585B] mt-1">{days === 1 ? 'día' : 'días'}</span>
            </>
          )}
        </div>

        <p className="text-slate-600 text-sm mb-7">
          {isToday
            ? `¡Abrimos las puertas de HappyHub! Ya puedes reservar tu celebración a partir del ${BOOKINGS_FROM_LABEL}.`
            : `Ya puedes reservar tu celebración a partir del ${BOOKINGS_FROM_LABEL}. 🎈`}
        </p>

        <div className="flex flex-wrap gap-3 justify-center">
          <Link
            href="/disponibilidad"
            onClick={close}
            className="bg-[#F86F24] text-white font-extrabold text-sm px-6 py-3.5 rounded-2xl shadow-lg"
          >
            Ver fechas disponibles
          </Link>
          <button onClick={close} className="border-2 border-[#19AAA4] text-[#05585B] font-bold text-sm px-6 py-3.5 rounded-2xl">
            Ver la web
          </button>
        </div>
      </div>
    </div>
  );
}
