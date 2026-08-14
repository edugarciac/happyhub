import { useState } from 'react';
import { useRouter } from 'next/router';
import { MessageSquarePlus, X } from 'lucide-react';

export default function FeedbackWidget() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleClose = () => {
    setOpen(false);
    setSent(false);
    setMessage('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    setSending(true);
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: message.trim(), pagePath: router.asPath }),
      });
      if (res.ok) {
        setSent(true);
        setMessage('');
      }
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 left-6 z-40 bg-white text-gray-500 hover:text-primary-600 border border-gray-200 shadow-lg rounded-full p-3 transition-colors flex items-center justify-center"
        title="Enviar feedback"
        aria-label="Enviar feedback"
      >
        <MessageSquarePlus className="w-5 h-5" />
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-end md:items-center justify-center md:justify-start p-4 md:pl-6" onClick={handleClose}>
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900 text-sm">¿Alguna sugerencia o problema?</h3>
              <button onClick={handleClose} className="text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            {sent ? (
              <div className="text-center py-4">
                <p className="text-sm text-gray-700">¡Gracias! Hemos recibido tu feedback.</p>
                <button
                  onClick={handleClose}
                  className="mt-3 text-xs text-primary-600 hover:text-primary-700 font-medium"
                >
                  Cerrar
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Cuéntanos qué mejorarías..."
                  rows={4}
                  autoFocus
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 resize-none"
                />
                <button
                  type="submit"
                  disabled={sending || !message.trim()}
                  className="mt-3 w-full bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-50"
                >
                  {sending ? 'Enviando...' : 'Enviar feedback'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
