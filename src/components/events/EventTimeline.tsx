import { useState, useCallback } from 'react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  horizontalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import type { CollaborativeEventTimeline } from '@/utils/db/collaborative-events';
import TimelineCard from './TimelineCard';
import TimelineDetailPanel from './TimelineDetailPanel';
import AddMilestoneModal from './AddMilestoneModal';

interface EventTimelineProps {
  eventId: number;
  initialMilestones: CollaborativeEventTimeline[];
  eventDate: string | null;
  eventType: string | null;
  isOrganizer: boolean;
}

function isEventToday(eventDate: string | null): boolean {
  if (!eventDate) return false;
  const today = new Date().toISOString().slice(0, 10);
  return eventDate.slice(0, 10) === today;
}

export default function EventTimeline({
  eventId, initialMilestones, eventDate, eventType, isOrganizer,
}: EventTimelineProps) {
  const [milestones, setMilestones] = useState(initialMilestones);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const today = isEventToday(eventDate);
  const selected = milestones.find((m) => m.id === selectedId) ?? null;

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setMilestones((prev) => {
      const oldIndex = prev.findIndex((m) => m.id === active.id);
      const newIndex = prev.findIndex((m) => m.id === over.id);
      const reordered = arrayMove(prev, oldIndex, newIndex);

      fetch(`/api/events/collaborative/${eventId}/timeline/reorder`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderedIds: reordered.map((m) => m.id) }),
      });

      return reordered;
    });
  }, [eventId]);

  const handleDelete = useCallback(async (id: number) => {
    if (!confirm('¿Eliminar este hito del timeline?')) return;
    const res = await fetch(`/api/events/collaborative/${eventId}/timeline/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setMilestones((prev) => prev.filter((m) => m.id !== id));
      if (selectedId === id) setSelectedId(null);
    }
  }, [eventId, selectedId]);

  const handleUpdate = useCallback((updated: CollaborativeEventTimeline) => {
    setMilestones((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
  }, []);

  const total = milestones.length;
  const done = milestones.filter((m) => m.completed).length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <div>
      {/* Barra de progreso */}
      <div className="flex items-center gap-3 mb-6 bg-white border border-gray-200 rounded-xl p-3">
        <span className="text-xs font-semibold text-blue-600 whitespace-nowrap">ANTES</span>
        <div className="flex-1 relative h-2 bg-gray-200 rounded-full">
          <div
            className="h-full bg-gradient-to-r from-green-400 to-amber-400 rounded-full transition-all"
            style={{ width: `${pct}%` }}
          />
          {today && (
            <div
              className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-amber-500 border-2 border-white rounded-full shadow"
              style={{ left: `${pct}%`, transform: 'translate(-50%, -50%)' }}
            />
          )}
        </div>
        <span className="text-xs font-semibold text-gray-400 whitespace-nowrap">DESPUÉS</span>
        <span className="text-xs text-gray-400">{done}/{total}</span>
      </div>

      {/* Etiquetas de fase */}
      <div className="flex text-[10px] font-bold text-gray-400 mb-2 gap-2 uppercase">
        <span className="text-blue-500">◀ Antes</span>
        <span className="flex-1 text-center text-amber-500">Durante</span>
        <span className="text-green-500">Después ▶</span>
      </div>

      {/* Timeline horizontal con dnd-kit */}
      <div className="overflow-x-auto pb-3">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={milestones.map((m) => m.id)} strategy={horizontalListSortingStrategy}>
            <div className="flex gap-3 items-start min-w-max">
              {milestones.length === 0 && (
                <div className="text-gray-400 text-sm py-10 px-6">
                  No hay hitos aún.{isOrganizer ? ' Añade el primero.' : ''}
                </div>
              )}
              {milestones.map((m) => (
                <TimelineCard
                  key={m.id}
                  milestone={m}
                  isToday={today}
                  isSelected={selectedId === m.id}
                  onClick={() => setSelectedId(selectedId === m.id ? null : m.id)}
                  onDelete={() => handleDelete(m.id)}
                  isOrganizer={isOrganizer}
                />
              ))}

              {isOrganizer && (
                <button
                  onClick={() => setShowAddModal(true)}
                  className="flex-shrink-0 w-[90px] border-2 border-dashed border-violet-300 rounded-xl p-3 text-center bg-violet-50 hover:bg-violet-100 transition-colors cursor-pointer"
                >
                  <div className="text-2xl text-violet-500">+</div>
                  <div className="text-[10px] font-semibold text-violet-500">Añadir hito</div>
                </button>
              )}
            </div>
          </SortableContext>
        </DndContext>
      </div>

      {/* Panel de detalle */}
      {selected && (
        <TimelineDetailPanel
          milestone={selected}
          onClose={() => setSelectedId(null)}
          onUpdate={handleUpdate}
          eventId={eventId}
          isOrganizer={isOrganizer}
        />
      )}

      {/* Modal añadir hito */}
      {showAddModal && (
        <AddMilestoneModal
          eventId={eventId}
          eventType={eventType}
          existingTypes={milestones.map((m) => m.hito_type).filter(Boolean) as string[]}
          onClose={() => setShowAddModal(false)}
          onAdded={(m) => setMilestones((prev) => [...prev, m])}
        />
      )}
    </div>
  );
}
