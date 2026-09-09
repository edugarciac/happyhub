import { useEffect, useState } from 'react';
import { CONTACT_INFO } from '@/config/contact';

const STORAGE_KEY = 'happyhub_intro_dismissed';

export default function ComingSoonOverlay() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!sessionStorage.getItem(STORAGE_KEY)) setVisible(true);
  }, []);

  useEffect(() => {
    document.body.style.overflow = visible ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [visible]);

  const close = () => {
    sessionStorage.setItem(STORAGE_KEY, '1');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#05585B]/95 p-6">
      <div className="relative max-w-lg w-full bg-white rounded-3xl shadow-2xl px-8 sm:px-10 py-12 text-center">
        <button
          onClick={close}
          aria-label="Cerrar y ver la web"
          className="absolute top-4 right-4 w-9 h-9 rounded-full bg-[#EAF6F5] text-[#05585B] font-bold"
        >
          ✕
        </button>

        <div className="w-36 h-36 mx-auto -mt-28 mb-2 relative">
          <svg viewBox="0 0 168 168" className="-rotate-90">
            <circle cx="84" cy="84" r="70" fill="none" stroke="#EAF6F5" strokeWidth="14" />
            <circle
              cx="84" cy="84" r="70" fill="none" stroke="#F86F24" strokeWidth="14"
              strokeLinecap="round" strokeDasharray="439.8" strokeDashoffset="35.2"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <img src="/happyhub_logo_cara.png" alt="HappyHub" className="w-28 h-28 object-contain" />
          </div>
          <span className="absolute -bottom-1 -right-1 bg-[#05585B] text-white text-[13px] font-bold px-2.5 py-1 rounded-full border-[3px] border-white">
            92%
          </span>
        </div>

        <h1 className="font-bold text-2xl text-[#05585B] mt-4" style={{ fontFamily: 'var(--font-fredoka, inherit)' }}>
          ¡Ya casi estamos listos!
        </h1>
        <p className="text-slate-600 text-sm mt-2 mb-7">
          Estamos dando los últimos toques a HappyHub. Abrimos muy pronto 🎈
        </p>

        <div className="flex items-center justify-center mb-7">
          <div className="flex flex-col items-center gap-1.5 w-24">
            <div className="w-8 h-8 rounded-full bg-[#19AAA4] text-white text-sm font-bold flex items-center justify-center">✓</div>
            <span className="text-[11px] font-semibold text-[#05585B]">Reforma</span>
          </div>
          <div className="h-[3px] w-9 bg-[#19AAA4] mb-6" />
          <div className="flex flex-col items-center gap-1.5 w-24">
            <div className="w-8 h-8 rounded-full bg-[#19AAA4] text-white text-sm font-bold flex items-center justify-center">✓</div>
            <span className="text-[11px] font-semibold text-[#05585B]">Decoración</span>
          </div>
          <div className="h-[3px] w-9 bg-[#EAF6F5] mb-6" />
          <div className="flex flex-col items-center gap-1.5 w-24">
            <div className="w-8 h-8 rounded-full bg-[#F9BA17] text-white text-sm font-bold flex items-center justify-center animate-pulse">🎉</div>
            <span className="text-[11px] font-semibold text-[#05585B]">Apertura</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 justify-center">
          <a
            href={`${CONTACT_INFO.whatsapp}?text=Quiero%20saber%20cuando%20abre%20HappyHub`}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-[#F86F24] text-white font-extrabold text-sm px-6 py-3.5 rounded-2xl shadow-lg"
          >
            Avísame cuando abráis
          </a>
          <button onClick={close} className="border-2 border-[#19AAA4] text-[#05585B] font-bold text-sm px-6 py-3.5 rounded-2xl">
            Ver la web igualmente
          </button>
        </div>
      </div>
    </div>
  );
}
