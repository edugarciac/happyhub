import { useEffect, useRef, useState, type FormEvent } from 'react';
import { MessageCircle, Send, X } from 'lucide-react';
import { CONTACT_INFO } from '@/config/contact';
import { MAX_CHAT_MESSAGES, MAX_CHAT_MESSAGE_LENGTH } from '@/config/chat';
import { event as gaEvent } from '@/lib/analytics';
import { renderAssistantText } from '@/lib/chatFormat';

interface Turn {
  role: 'user' | 'assistant';
  content: string;
  handoff?: boolean;
}

interface ChatWidgetProps {
  /** Abierto al cargar (tablet de la sala) */
  defaultOpen?: boolean;
  /** Ruta base de la guía en los enlaces del asistente: '/guia-sala' o '/guia-sala/panel' en la tablet */
  guideBasePath?: string;
}

const GREETING = '¡Hola! Soy el asistente de HappyHub. Pregúntame por la sala, las normas, precios o fechas libres.';
const STORAGE_KEY = 'happyhub_chat';
// La conversación se olvida tras un rato sin usarla: en la tablet la usa el siguiente cliente
const STORAGE_TTL_MS = 30 * 60 * 1000;
const WHATSAPP_URL = `${CONTACT_INFO.whatsapp}?text=${encodeURIComponent('Hola HappyHub, tengo una duda:')}`;

function loadTurns(): Turn[] {
  try {
    const saved = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || 'null');
    if (saved && Date.now() - saved.at < STORAGE_TTL_MS && Array.isArray(saved.turns)) return saved.turns;
  } catch {
    /* sin almacenamiento: conversación nueva */
  }
  return [];
}

function saveTurns(turns: Turn[]) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ at: Date.now(), turns }));
  } catch {
    /* ignorar */
  }
}

/** Historial para la API: alterna cliente/asistente, empieza por el cliente y cabe en el límite */
function apiHistory(turns: Turn[]) {
  let history = turns.slice(-MAX_CHAT_MESSAGES);
  while (history.length && history[0].role !== 'user') history = history.slice(1);
  return history.map(({ role, content }) => ({ role, content }));
}

export default function ChatWidget({ defaultOpen = false, guideBasePath = '/guia-sala' }: ChatWidgetProps) {
  const [open, setOpen] = useState(defaultOpen);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => setTurns(loadTurns()), []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [turns, sending, open]);

  const toggle = () => {
    if (!open) gaEvent('chat_open', { page: window.location.pathname });
    setOpen(!open);
  };

  const send = async (e: FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || sending) return;

    const next: Turn[] = [...turns, { role: 'user', content: text }];
    setTurns(next);
    saveTurns(next);
    setInput('');
    setSending(true);
    gaEvent('chat_message', { page: window.location.pathname });

    let reply: Turn;
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: apiHistory(next) }),
      });
      const data = await res.json();
      reply = data.reply
        ? { role: 'assistant', content: data.reply, handoff: Boolean(data.handoff) }
        : { role: 'assistant', content: 'No he podido responder. Escríbenos por WhatsApp.', handoff: true };
    } catch {
      reply = { role: 'assistant', content: 'No hay conexión ahora mismo. Escríbenos por WhatsApp.', handoff: true };
    }
    const withReply = [...next, reply];
    setTurns(withReply);
    saveTurns(withReply);
    setSending(false);
  };

  return (
    <>
      {open && (
        <div
          role="dialog"
          aria-label="Asistente de HappyHub"
          className="fixed z-50 bottom-24 right-4 left-4 sm:left-auto sm:w-[380px] h-[min(560px,calc(100vh-8rem))] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden"
        >
          <div className="flex items-center justify-between px-4 py-3 bg-primary-600 text-white">
            <div>
              <p className="font-semibold">Asistente HappyHub</p>
              <p className="text-xs text-primary-50">Respuesta automática. Para algo importante, WhatsApp.</p>
            </div>
            <button onClick={toggle} aria-label="Cerrar chat" className="p-1 rounded-lg hover:bg-white/20">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
            {[{ role: 'assistant' as const, content: GREETING }, ...turns].map((t, i) => (
              <div key={i} className={t.role === 'user' ? 'flex justify-end' : 'flex flex-col items-start gap-2'}>
                {t.role === 'user' ? (
                  <p className="max-w-[85%] bg-primary-600 text-white rounded-2xl rounded-br-sm px-3 py-2 text-sm whitespace-pre-wrap">
                    {t.content}
                  </p>
                ) : (
                  <div
                    className="kb-content max-w-[90%] bg-white border border-gray-200 rounded-2xl rounded-bl-sm px-3 py-2 text-sm text-gray-800 space-y-2"
                    dangerouslySetInnerHTML={{ __html: renderAssistantText(t.content, guideBasePath) }}
                  />
                )}
                {t.handoff && (
                  <a
                    href={WHATSAPP_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => gaEvent('chat_handoff_whatsapp', { page: window.location.pathname })}
                    className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-full px-4 py-2"
                  >
                    <MessageCircle className="w-4 h-4" />
                    Hablar por WhatsApp
                  </a>
                )}
              </div>
            ))}
            {sending && (
              <div className="flex gap-1 px-3 py-2" aria-label="Escribiendo">
                {[0, 150, 300].map((d) => (
                  <span key={d} className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />
                ))}
              </div>
            )}
          </div>

          <form onSubmit={send} className="flex items-end gap-2 p-3 border-t border-gray-200 bg-white">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) send(e);
              }}
              rows={1}
              maxLength={MAX_CHAT_MESSAGE_LENGTH}
              placeholder="Escribe tu pregunta…"
              aria-label="Tu pregunta"
              className="flex-1 resize-none rounded-xl border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
            />
            <button
              type="submit"
              disabled={sending || !input.trim()}
              aria-label="Enviar"
              className="p-2.5 rounded-xl bg-primary-600 text-white disabled:opacity-40"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}

      <button
        onClick={toggle}
        aria-label={open ? 'Cerrar chat' : 'Abrir chat con el asistente'}
        className="fixed z-40 bottom-6 right-6 flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white shadow-lg rounded-full px-4 py-3 font-semibold"
      >
        {open ? <X className="w-5 h-5" /> : <MessageCircle className="w-5 h-5" />}
        <span className="hidden sm:inline">{open ? 'Cerrar' : '¿Dudas?'}</span>
      </button>
    </>
  );
}
