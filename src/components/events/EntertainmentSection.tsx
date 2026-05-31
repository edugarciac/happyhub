// src/components/events/EntertainmentSection.tsx
import { useState } from 'react';
import { Music, Gamepad2 } from 'lucide-react';
import SpotifyPlaylistTab from './SpotifyPlaylistTab';
import ActivitiesTab from './ActivitiesTab';
import { Toaster } from 'react-hot-toast';

interface Props {
  eventId: number;
  isOrganizer: boolean;
  currentParticipantId: number | null;
  eventType: string | null;
}

type Tab = 'musica' | 'actividades';

export default function EntertainmentSection({ eventId, isOrganizer, currentParticipantId, eventType }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('musica');

  return (
    <div>
      <Toaster />
      {/* Sub-tabs */}
      <div className="flex border-b border-gray-200 bg-gray-50">
        <button
          onClick={() => setActiveTab('musica')}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'musica'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Music className="h-4 w-4" /> Música
        </button>
        <button
          onClick={() => setActiveTab('actividades')}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'actividades'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Gamepad2 className="h-4 w-4" /> Actividades
        </button>
      </div>

      {/* Tab content */}
      {activeTab === 'musica' && (
        <SpotifyPlaylistTab
          eventId={eventId}
          isOrganizer={isOrganizer}
          currentParticipantId={currentParticipantId}
        />
      )}
      {activeTab === 'actividades' && (
        <ActivitiesTab
          eventId={eventId}
          isOrganizer={isOrganizer}
          currentParticipantId={currentParticipantId}
          eventType={eventType}
        />
      )}
    </div>
  );
}
