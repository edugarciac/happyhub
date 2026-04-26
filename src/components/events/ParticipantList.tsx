import { UserCheck, UserX, Clock, HelpCircle, Crown, Shield, User } from 'lucide-react';
import type { CollaborativeEventParticipant } from '@/utils/db/collaborative-events';

const RSVP_CONFIG = {
  confirmed: { label: 'Confirmado', icon: UserCheck, color: 'text-green-600 bg-green-50' },
  declined: { label: 'No va', icon: UserX, color: 'text-red-500 bg-red-50' },
  pending: { label: 'Pendiente', icon: Clock, color: 'text-yellow-600 bg-yellow-50' },
  maybe: { label: 'Quizás', icon: HelpCircle, color: 'text-gray-500 bg-gray-50' },
};

const ROLE_CONFIG = {
  organizer: { label: 'Organizador', icon: Crown, color: 'text-purple-700' },
  'co-organizer': { label: 'Co-organizador', icon: Shield, color: 'text-blue-600' },
  participant: { label: 'Participante', icon: User, color: 'text-gray-500' },
};

interface Props {
  participants: CollaborativeEventParticipant[];
  currentUserId?: number;
  isOrganizer?: boolean;
  onUpdateRsvp?: (pid: number, rsvp: string) => void;
}

export default function ParticipantList({ participants, currentUserId, isOrganizer, onUpdateRsvp }: Props) {
  if (participants.length === 0) {
    return (
      <p className="text-gray-400 text-sm text-center py-6">
        Aún no hay participantes. Comparte el enlace de invitación.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-gray-100">
      {participants.map((p) => {
        const rsvp = RSVP_CONFIG[p.rsvp_status];
        const role = ROLE_CONFIG[p.role];
        const RsvpIcon = rsvp.icon;
        const RoleIcon = role.icon;
        const isMe = p.user_id === currentUserId;

        return (
          <li key={p.id} className="flex items-center justify-between py-3 gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-semibold text-purple-700">
                  {p.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1">
                  <span className="font-medium text-gray-900 text-sm truncate">{p.name}</span>
                  {isMe && <span className="text-xs text-purple-600 font-medium">(tú)</span>}
                </div>
                <div className={`flex items-center gap-1 text-xs ${role.color}`}>
                  <RoleIcon className="w-3 h-3" />
                  <span>{role.label}</span>
                </div>
              </div>
            </div>

            <div className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full font-medium flex-shrink-0 ${rsvp.color}`}>
              <RsvpIcon className="w-3 h-3" />
              <span>{rsvp.label}</span>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
