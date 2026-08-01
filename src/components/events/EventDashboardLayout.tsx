import Header from '@/components/Header';
import EventSidebar from './EventSidebar';
import EventTopBar from './EventTopBar';
import type { CollaborativeEvent, CollaborativeEventParticipant } from '@/utils/db/collaborative-events';

interface EventDashboardLayoutProps {
  event: CollaborativeEvent;
  participants: CollaborativeEventParticipant[];
  activeSection: string;
  children: React.ReactNode;
}

export default function EventDashboardLayout({
  event,
  participants,
  activeSection,
  children,
}: EventDashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="flex pt-16">
        <EventSidebar eventId={event.id} activeSection={activeSection} />
        <div className="flex-1 flex flex-col min-h-[calc(100vh-4rem)] overflow-hidden">
          <EventTopBar event={event} participants={participants} />
          <main className="flex-1 overflow-auto p-6 pb-24 md:pb-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
