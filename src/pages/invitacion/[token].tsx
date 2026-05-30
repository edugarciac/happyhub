import Head from 'next/head';
import { GetServerSideProps } from 'next';
import { useState } from 'react';

interface Participant {
  id: number;
  name: string;
  rsvp_status: string;
  rsvp_note: string | null;
}

interface Event {
  id: number;
  title: string;
  event_date: string | null;
  event_time: string | null;
  location: string | null;
  cover_image_url: string | null;
}

interface Props {
  participant: Participant;
  event: Event;
  token: string;
  invalid?: boolean;
}

export const getServerSideProps: GetServerSideProps<Props> = async (context) => {
  const token = context.params?.token as string;

  try {
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const res = await fetch(`${baseUrl}/api/rsvp/${token}`);
    if (!res.ok) {
      return { props: { participant: {} as Participant, event: {} as Event, token, invalid: true } };
    }
    const data = await res.json();
    return { props: { participant: data.participant, event: data.event, token, invalid: false } };
  } catch {
    return { props: { participant: {} as Participant, event: {} as Event, token, invalid: true } };
  }
};

const STATUS_LABELS: Record<string, string> = {
  confirmed: '✓ Confirmada tu asistencia',
  declined: '✗ Has declinado la invitación',
  maybe: '🤔 Has respondido "Quizás"',
  pending: 'Pendiente de respuesta',
};

const STATUS_COLORS: Record<string, string> = {
  confirmed: 'bg-green-50 text-green-700 border-green-200',
  declined: 'bg-red-50 text-red-700 border-red-200',
  maybe: 'bg-amber-50 text-amber-700 border-amber-200',
  pending: 'bg-gray-50 text-gray-500 border-gray-200',
};

export default function RsvpPage({ participant, event, token, invalid }: Props) {
  const [status, setStatus] = useState(participant?.rsvp_status || 'pending');
  const [note, setNote] = useState(participant?.rsvp_note || '');
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  if (invalid) {
    return (
      <>
        <Head><title>Enlace no válido — HappyHub</title></Head>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-lg p-8 max-w-sm w-full text-center">
            <div className="text-5xl mb-4">😕</div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">Enlace no válido</h1>
            <p className="text-gray-500 text-sm">Este enlace de invitación no es válido o ya ha expirado.</p>
          </div>
        </div>
      </>
    );
  }

  const formatDate = (date: string | null) => {
    if (!date) return null;
    return new Date(date).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  };

  const handleSubmit = async (newStatus: string) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/rsvp/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, note: note || null }),
      });
      if (res.ok) {
        setStatus(newStatus);
        setDone(true);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Head>
        <title>Invitación: {event.title} — HappyHub</title>
      </Head>
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg max-w-sm w-full overflow-hidden">
          <div className="bg-gradient-to-br from-violet-600 to-indigo-600 p-6 text-center text-white">
            <div className="text-4xl mb-2">🎉</div>
            <h1 className="text-xl font-bold">{event.title}</h1>
            {event.event_date && (
              <p className="text-violet-200 text-sm mt-1">📅 {formatDate(event.event_date)}</p>
            )}
            {event.event_time && (
              <p className="text-violet-200 text-sm">🕕 {event.event_time.slice(0, 5)}</p>
            )}
            {event.location && (
              <p className="text-violet-200 text-sm">📍 {event.location}</p>
            )}
          </div>

          <div className="p-6">
            {done ? (
              <div className={`rounded-xl border p-4 text-center ${STATUS_COLORS[status]}`}>
                <p className="font-semibold text-lg">{STATUS_LABELS[status]}</p>
                <p className="text-sm mt-1 opacity-80">Gracias, {participant.name}. El organizador ha sido notificado.</p>
                <button
                  onClick={() => setDone(false)}
                  className="mt-3 text-xs underline opacity-60 hover:opacity-100"
                >
                  Cambiar respuesta
                </button>
              </div>
            ) : (
              <>
                <p className="text-gray-700 font-semibold text-center mb-4">
                  Hola {participant.name}, ¿vendrás?
                </p>

                {status !== 'pending' && (
                  <div className={`rounded-lg border px-3 py-2 text-sm text-center mb-4 ${STATUS_COLORS[status]}`}>
                    Respuesta actual: {STATUS_LABELS[status]}
                  </div>
                )}

                <div className="flex flex-col gap-2 mb-4">
                  <button
                    onClick={() => handleSubmit('confirmed')}
                    disabled={saving}
                    className="w-full bg-green-600 text-white py-3 rounded-xl font-semibold hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    ✓ Confirmo asistencia
                  </button>
                  <button
                    onClick={() => handleSubmit('maybe')}
                    disabled={saving}
                    className="w-full bg-amber-500 text-white py-3 rounded-xl font-semibold hover:bg-amber-600 transition-colors disabled:opacity-50"
                  >
                    🤔 Quizás
                  </button>
                  <button
                    onClick={() => handleSubmit('declined')}
                    disabled={saving}
                    className="w-full bg-gray-100 text-gray-600 py-3 rounded-xl font-semibold hover:bg-gray-200 transition-colors disabled:opacity-50"
                  >
                    ✗ No puedo ir
                  </button>
                </div>

                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Nota opcional (alergias, etc.)"
                  rows={2}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 resize-none"
                />
              </>
            )}
          </div>

          <div className="border-t border-gray-100 px-6 py-3 text-center">
            <p className="text-xs text-gray-400">HappyHub — Tu espacio para celebrar</p>
          </div>
        </div>
      </div>
    </>
  );
}
