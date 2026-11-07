import { useState } from 'react';
import dynamic from 'next/dynamic';
import { ChevronDown, MessageCircle } from 'lucide-react';

const ChatWidget = dynamic(() => import('@/components/ChatWidget'), { ssr: false });

/**
 * Acceso al chat arriba de cada página de la guía. Plegado para no empujar el contenido;
 * al abrirlo el chat aparece integrado justo debajo (en la tablet un chat flotante quedaba al final del marco).
 */
export default function GuideChatToggle({ basePath, kiosk }: { basePath: string; kiosk: boolean }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="mb-8">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className={`w-full flex items-center justify-between gap-3 bg-primary-600 hover:bg-primary-700 text-white rounded-2xl font-semibold ${
          kiosk ? 'px-5 py-4' : 'px-4 py-3'
        }`}
      >
        <span className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5" />
          {open ? 'Cerrar el asistente' : '¿Dudas? Pregunta al asistente'}
        </span>
        <ChevronDown className={`w-5 h-5 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="mt-3">
          <ChatWidget inline guideBasePath={basePath} />
        </div>
      )}
    </div>
  );
}
