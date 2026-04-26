import Head from 'next/head';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ArrowLeft, Calendar, MapPin, Users, Clock, Loader2 } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ParticipantList from '@/components/events/ParticipantList';
import TimelineEditor from '@/components/events/TimelineEditor';
import InviteShareCard from '@/components/events/InviteShareCard';
import type { CollaborativeEvent, CollaborativeEventParticipant, CollaborativeEventTimeline } from '@/utils/db/collaborative-events';

type Tab = 'info' | 'participantes' | 'timeline';

const STATUS_LABELS: Record<string, string> = {
  planning: 'En planificación',
  active: 'Activo',
  'event-day': 'Día del evento',
  completed: 'Completado',
  cancelled: 'Cancelado',
};

const STATUS_COLORS: Record<string, string> = {
  planning: 'bg-yellow-100 text-yellow-800',
  active: 'bg-green-100 text-green-800',
  'event-day': 'bg-purple-100 text-purple-800',
  completed: 'bg-gray-100 text-gray-600',
  cancelled: 'bg-red-100 text-red-700',
};

export default function EventoDashboardPage() {
  const router = useRouter();
  const { id } = router.query;
  const { data: session, status: authStatus } = useSession();

  const [event, setEvent] = useState<CollaborativeEvent | null>(null);
  const [participants, setParticipants] = useState<CollaborativeEventParticipant[]>([]);
  const [timeline, setTimeline] = useState<CollaborativeEventTimeline[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<Tab>('info');

  const currentUserId = session?.user ? parseInt((session.user as any).id as string, 10) : undefined;

  const fetchData = useCallback(async () => {
    if (!id) return;
    try {
      const res = await fetch(`/api/events/collaborative/${id}`);
      if (res.status === 401) { router.push('/login'); return; }
      if (res.status === 403) { setError('No tienes acceso a este evento'); setLoading(false); return; }
      if (!res.ok) { setError('Evento no encontrado'); setLoading(false); return; }

      const data = await res.json();
      setEvent(data.event);
      setParticipants(data.participants);
      setTimeline(data.timeline);
    } catch {
      setError('Error al cargar el evento');
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => {
    if (authStatus === 'unauthenticated') {
      router.replace(`/login?redirect=/eventos/${id}`);
      return;
    }
    if (authStatus === 'authenticated' && id) {
      fetchData();
    }
  }, [authStatus, id, fetchData, router]);

  const isOrganizer = event?.organizer_id === currentUserId;
  const myParticipant = participants.find((p) => p.user_id === currentUserId);
  const canEdit = isOrganizer || myParticipant?.role === 'co-organizer';

  const handleAddTimeline = async (entry: Omit<CollaborativeEventTimeline, 'id'>) => {
    const res = await fetch(`/api/events/collaborative/${id}/timeline`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entry),
    });
    if (res.ok) {
      const newEntry = await res.json();
      setTimeline((prev) => [...prev, newEntry].sort((a, b) => a.sort_order - b.sort_order || a.time.localeCompare(b.time)));
    }
  };

  const handleUpdateTimeline = async (tid: number, data: Partial<CollaborativeEventTimeline>) => {
    const res = await fetch(`/api/events/collaborative/${id}/timeline/${tid}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      const updated = await res.json();
      setTimeline((prev) => prev.map((e) => (e.id === tid ? updated : e)));
    }
  };

  const handleDeleteTimeline = async (tid: number) => {
    await fetch(`/api/events/collaborative/${id}/timeline/${tid}`, { method: 'DELETE' });
    setTimeline((prev) => prev.filter((e) => e.id !== tid));
  };

  if (loading || authStatus === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  if (error) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-600 font-medium mb-4">{error}</p>
            <Link href="/area-privada" className="text-purple-600 hover:underline text-sm">
              Volver al área privada
            </Link>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (!event) return null;

  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: 'info', label: 'Info' },
    { id: 'participantes', label: 'Participantes', count: participants.length },
    { id: 'timeline', label: 'Timeline', count: timeline.length || undefined },
  ];

  return (
    <>
      <Head>
        <title>{event.title} – HappyHub</title>
      </Head>
      <Header />

      <main className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-3xl mx-auto">
          <Link href="/area-privada" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4">
            <ArrowLeft className="w-4 h-4" />
            Mis eventos
          </Link>

          {/* Header */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-4">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h1 className="text-xl font-bold text-gray-900">{event.title}</h1>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[event.status]}`}>
                    {STATUS_LABELS[event.status]}
                  </span>
                </div>
                <div className="flex flex-wrap gap-3 text-sm text-gray-500">
                  {event.event_date && (
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {new Date(event.event_date).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                      {event.event_time && ` · ${event.event_time.slice(0, 5)}`}
                    </span>
                  )}
                  {event.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {event.location}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {participants.length} participante{participants.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="flex border-b border-gray-200">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'text-purple-700 border-b-2 border-purple-600 bg-purple-50'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab.label}
                  {tab.count !== undefined && (
                    <span className="ml-1.5 bg-gray-100 text-gray-600 text-xs px-1.5 py-0.5 rounded-full">
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>

            <div className="p-6">
              {activeTab === 'info' && (
                <div className="space-y-5">
                  {event.description && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 mb-1">Descripción</h3>
                      <p className="text-gray-600 text-sm whitespace-pre-wrap">{event.description}</p>
                    </div>
                  )}

                  <InviteShareCard inviteCode={event.invite_code} eventTitle={event.title} />

                  {myParticipant && myParticipant.rsvp_status === 'pending' && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                      <p className="text-sm font-medium text-yellow-800 mb-3">¿Vas a asistir?</p>
                      <div className="flex gap-2">
                        {(['confirmed', 'maybe', 'declined'] as const).map((status) => (
                          <button
                            key={status}
                            onClick={async () => {
                              await fetch(`/api/events/collaborative/${id}/participants/${myParticipant.id}`, {
                                method: 'PATCH',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ rsvp_status: status }),
                              });
                              setParticipants((prev) =>
                                prev.map((p) => (p.id === myParticipant.id ? { ...p, rsvp_status: status } : p))
                              );
                            }}
                            className={`text-xs px-3 py-1.5 rounded-lg font-medium border transition-colors ${
                              status === 'confirmed' ? 'border-green-300 text-green-700 hover:bg-green-50' :
                              status === 'declined' ? 'border-red-300 text-red-600 hover:bg-red-50' :
                              'border-gray-300 text-gray-600 hover:bg-gray-50'
                            }`}
                          >
                            {status === 'confirmed' ? '✅ Voy' : status === 'maybe' ? '🤔 Quizás' : '❌ No voy'}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'participantes' && (
                <ParticipantList
                  participants={participants}
                  currentUserId={currentUserId}
                  isOrganizer={isOrganizer}
                />
              )}

              {activeTab === 'timeline' && (
                <TimelineEditor
                  timeline={timeline}
                  participants={participants}
                  eventId={event.id}
                  canEdit={canEdit}
                  onAdd={handleAddTimeline}
                  onUpdate={handleUpdateTimeline}
                  onDelete={handleDeleteTimeline}
                />
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
