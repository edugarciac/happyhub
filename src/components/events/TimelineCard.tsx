import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { CollaborativeEventTimeline } from '@/utils/db/collaborative-events';

interface TimelineCardProps {
  milestone: CollaborativeEventTimeline;
  isToday: boolean;
  isSelected: boolean;
  onClick: () => void;
  onDelete: () => void;
  isOrganizer: boolean;
}

function cardStyle(milestone: CollaborativeEventTimeline, isToday: boolean) {
  if (milestone.completed) return 'border-green-400 bg-green-50';
  if (isToday && milestone.phase === 'during') return 'border-amber-400 bg-amber-50 border-dashed';
  if (isToday && milestone.phase === 'before') return 'border-amber-500 bg-yellow-50';
  if (milestone.phase === 'after') return 'border-gray-200 bg-gray-50 opacity-60';
  return 'border-gray-200 bg-white';
}

export default function TimelineCard({
  milestone, isToday, isSelected, onClick, onDelete, isOrganizer,
}: TimelineCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: milestone.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative flex-shrink-0 w-[110px] border-2 rounded-xl p-2 text-center cursor-pointer select-none transition-shadow ${
        cardStyle(milestone, isToday)
      } ${isSelected ? 'ring-2 ring-violet-400 ring-offset-1' : ''}`}
      onClick={onClick}
    >
      {/* Drag handle */}
      {isOrganizer && (
        <div
          {...attributes}
          {...listeners}
          className="absolute inset-0 rounded-xl cursor-grab active:cursor-grabbing"
          onClick={(e) => e.stopPropagation()}
        />
      )}

      {/* Delete button */}
      {isOrganizer && (
        <button
          className="absolute -top-2 -left-2 w-5 h-5 bg-gray-200 hover:bg-red-400 hover:text-white text-gray-500 rounded-full flex items-center justify-center text-[10px] z-10 transition-colors"
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          title="Eliminar hito"
        >
          ✕
        </button>
      )}

      {/* Completado badge */}
      {milestone.completed && (
        <div className="absolute -top-2 -right-2 w-5 h-5 bg-green-500 text-white rounded-full flex items-center justify-center text-[10px] z-10">
          ✓
        </div>
      )}

      {/* HOY badge */}
      {isToday && milestone.phase !== 'after' && !milestone.completed && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-500 text-white text-[8px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap z-10">
          HOY
        </div>
      )}

      <div className="text-xl mb-1 mt-1">{milestone.emoji || '📌'}</div>
      <div className="text-[11px] font-semibold text-gray-800 leading-tight line-clamp-2">
        {milestone.title}
      </div>
      {milestone.time && (
        <div className="text-[10px] text-gray-500 mt-1">{milestone.time.slice(0, 5)}</div>
      )}
    </div>
  );
}
