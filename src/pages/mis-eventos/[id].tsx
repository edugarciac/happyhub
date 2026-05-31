import Head from 'next/head';
import { GetServerSideProps } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import {
  ensureCollaborativeEventsSchema,
  getCollaborativeEventById,
  getParticipants,
  getTimeline,
  getParticipantByUserId,
  type CollaborativeEvent,
  type CollaborativeEventParticipant,
  type CollaborativeEventTimeline,
} from '@/utils/db/collaborative-events';
import EventDashboardLayout from '@/components/events/EventDashboardLayout';
import EventTimeline from '@/components/events/EventTimeline';
import GuestList from '@/components/events/GuestList';
import GiftSection from '@/components/events/GiftSection';
import EntertainmentSection from '@/components/events/EntertainmentSection';

interface Props {
  event: CollaborativeEvent;
  participants: CollaborativeEventParticipant[];
  milestones: CollaborativeEventTimeline[];
  isOrganizer: boolean;
  currentParticipantId: number | null;
  section: string;
}

export const getServerSideProps: GetServerSideProps<Props> = async (context) => {
  const session = await getServerSession(context.req, context.res, authOptions);
  if (!session?.user) {
    return { redirect: { destination: `/login?redirect=/mis-eventos/${context.params?.id}`, permanent: false } };
  }

  await ensureCollaborativeEventsSchema();

  const eventId = parseInt(context.params?.id as string, 10);
  if (isNaN(eventId)) return { notFound: true };

  const event = await getCollaborativeEventById(eventId);
  if (!event) return { notFound: true };

  const userId = parseInt((session.user as any).id as string, 10);
  const participant = await getParticipantByUserId(eventId, userId);
  const isOrganizer = event.organizer_id === userId;

  if (!participant && !isOrganizer) {
    return { redirect: { destination: '/area-privada', permanent: false } };
  }

  const [participants, milestones] = await Promise.all([
    getParticipants(eventId),
    getTimeline(eventId),
  ]);

  const section = (context.query.section as string) || 'timeline';

  return {
    props: {
      event: JSON.parse(JSON.stringify(event)),
      participants: JSON.parse(JSON.stringify(participants)),
      milestones: JSON.parse(JSON.stringify(milestones)),
      isOrganizer,
      currentParticipantId: participant?.id ?? null,
      section,
    },
  };
};

function SectionPlaceholder({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-64 text-gray-400">
      <div className="text-4xl mb-3">🚧</div>
      <p className="font-medium">Sección <strong>{label}</strong> — próximamente</p>
    </div>
  );
}

export default function MisEventosDashboard({ event, participants, milestones, isOrganizer, currentParticipantId, section }: Props) {
  const renderSection = () => {
    switch (section) {
      case 'timeline':
        return (
          <EventTimeline
            eventId={event.id}
            initialMilestones={milestones}
            eventDate={event.event_date}
            eventType={event.category}
            isOrganizer={isOrganizer}
          />
        );
      case 'info': return <SectionPlaceholder label="Info" />;
      case 'invitados':
        return (
          <GuestList
            eventId={event.id}
            isOrganizer={isOrganizer}
            inviteCode={event.invite_code}
          />
        );
      case 'regalo':
        return (
          <GiftSection
            eventId={event.id}
            isOrganizer={isOrganizer}
            currentParticipantId={currentParticipantId}
            eventType={event.category}
          />
        );
      case 'entretenimiento':
        return (
          <EntertainmentSection
            eventId={event.id}
            isOrganizer={isOrganizer}
            currentParticipantId={currentParticipantId}
            eventType={event.category}
          />
        );
      case 'detalles': return <SectionPlaceholder label="Detalles" />;
      case 'servicios': return <SectionPlaceholder label="Servicios" />;
      case 'fotos': return <SectionPlaceholder label="Fotos" />;
      case 'mensajes': return <SectionPlaceholder label="Mensajes" />;
      default: return <SectionPlaceholder label={section} />;
    }
  };

  return (
    <>
      <Head>
        <title>{event.title} – Mis Eventos | HappyHub</title>
      </Head>
      <EventDashboardLayout event={event} participants={participants} activeSection={section}>
        {renderSection()}
      </EventDashboardLayout>
    </>
  );
}
