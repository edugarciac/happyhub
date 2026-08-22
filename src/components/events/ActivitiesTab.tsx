// src/components/events/ActivitiesTab.tsx
import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { ThumbsUp, Check, X, Trash2, Plus, BookOpen, Send } from 'lucide-react';
import ActivityAdvisor from './ActivityAdvisor';

interface Activity {
  id: number;
  title: string;
  description: string | null;
  proposed_by_name: string | null;
  proposed_by_participant_id: number | null;
  source_template_id: number | null;
  status: 'pending' | 'approved' | 'rejected';
  votes_count: number;
  user_voted: boolean;
  has_pending_proposal: boolean;
}

interface CatalogActivity {
  id: number;
  title: string;
  description: string | null;
  tags: string[];
}

interface Props {
  eventId: number;
  isOrganizer: boolean;
  currentParticipantId: number | null;
  eventType: string | null;
}

export default function ActivitiesTab({ eventId, isOrganizer, currentParticipantId, eventType }: Props) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdvisor, setShowAdvisor] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState({ title: '', description: '' });
  const [addingActivity, setAddingActivity] = useState(false);
  const [actionId, setActionId] = useState<number | null>(null);

  const [catalog, setCatalog] = useState<CatalogActivity[]>([]);
  const [catalogFiltered, setCatalogFiltered] = useState(true);
  const [loadingCatalog, setLoadingCatalog] = useState(true);
  const [addingFromCatalog, setAddingFromCatalog] = useState<number | null>(null);
  const [showCatalog, setShowCatalog] = useState(true);

  const fetchActivities = useCallback(async () => {
    const res = await fetch(`/api/events/collaborative/${eventId}/entertainment/activities`);
    if (res.ok) {
      const data = await res.json();
      setActivities(data.activities);
    }
    setLoading(false);
  }, [eventId]);

  const fetchCatalog = useCallback(async () => {
    const res = await fetch(`/api/events/collaborative/${eventId}/entertainment/activities/catalog`);
    if (res.ok) {
      const data = await res.json();
      setCatalog(data.activities);
      setCatalogFiltered(data.filtered);
    }
    setLoadingCatalog(false);
  }, [eventId]);

  useEffect(() => { fetchActivities(); fetchCatalog(); }, [fetchActivities, fetchCatalog]);

  const handleAddActivity = async (title: string, description: string) => {
    const res = await fetch(`/api/events/collaborative/${eventId}/entertainment/activities`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description: description || undefined }),
    });
    if (res.ok) {
      toast.success('Actividad añadida');
      fetchActivities();
    } else {
      toast.error('Error añadiendo actividad');
    }
  };

  const handleAddFromForm = async () => {
    if (!addForm.title.trim()) return;
    setAddingActivity(true);
    await handleAddActivity(addForm.title, addForm.description);
    setAddForm({ title: '', description: '' });
    setShowAddForm(false);
    setAddingActivity(false);
  };

  const handleAddFromCatalog = async (templateId: number) => {
    setAddingFromCatalog(templateId);
    try {
      const res = await fetch(
        `/api/events/collaborative/${eventId}/entertainment/activities/from-catalog/${templateId}`,
        { method: 'POST' }
      );
      if (res.ok) {
        toast.success('Actividad añadida al evento');
        fetchActivities();
      } else {
        toast.error('Error añadiendo actividad');
      }
    } finally {
      setAddingFromCatalog(null);
    }
  };

  const handlePropose = async (activityId: number) => {
    setActionId(activityId);
    try {
      const res = await fetch(
        `/api/events/collaborative/${eventId}/entertainment/activities/${activityId}/propose-catalog`,
        { method: 'POST' }
      );
      if (res.ok) {
        toast.success('Propuesta enviada al equipo de HappyHub');
        setActivities(prev => prev.map(a => a.id === activityId ? { ...a, has_pending_proposal: true } : a));
      } else {
        const data = await res.json();
        if (data.error === 'already_proposed') {
          setActivities(prev => prev.map(a => a.id === activityId ? { ...a, has_pending_proposal: true } : a));
        } else {
          toast.error(data.error || 'Error enviando la propuesta');
        }
      }
    } finally {
      setActionId(null);
    }
  };

  const handleVote = async (activityId: number) => {
    if (!currentParticipantId) { toast.error('Solo los invitados pueden votar'); return; }
    setActionId(activityId);
    const res = await fetch(
      `/api/events/collaborative/${eventId}/entertainment/activities/${activityId}/vote`,
      { method: 'POST' }
    );
    setActionId(null);
    if (res.ok) {
      const data = await res.json();
      setActivities(prev => prev.map(a =>
        a.id === activityId
          ? {
              ...a,
              user_voted: data.action === 'voted',
              votes_count: data.action === 'voted' ? a.votes_count + 1 : a.votes_count - 1,
            }
          : a
      ));
    }
  };

  const handleStatus = async (activityId: number, status: 'approved' | 'rejected') => {
    setActionId(activityId);
    const res = await fetch(
      `/api/events/collaborative/${eventId}/entertainment/activities/${activityId}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      }
    );
    setActionId(null);
    if (res.ok) {
      setActivities(prev => prev.map(a => a.id === activityId ? { ...a, status } : a));
    } else {
      toast.error('Error actualizando actividad');
    }
  };

  const handleDelete = async (activityId: number) => {
    setActionId(activityId);
    const res = await fetch(
      `/api/events/collaborative/${eventId}/entertainment/activities/${activityId}`,
      { method: 'DELETE' }
    );
    setActionId(null);
    if (res.ok) {
      setActivities(prev => prev.filter(a => a.id !== activityId));
      toast.success('Actividad eliminada');
    } else {
      toast.error('Error eliminando');
    }
  };

  if (loading) return <div className="p-6 text-gray-400 text-center">Cargando actividades...</div>;

  const approved = activities.filter(a => a.status === 'approved');
  const pending = activities.filter(a => a.status === 'pending');
  const rejected = activities.filter(a => a.status === 'rejected');
  const addedTitles = new Set(activities.map(a => a.title.trim().toLowerCase()));

  return (
    <div className="p-4 space-y-4">
      {/* Catálogo de actividades */}
      {!loadingCatalog && catalog.length > 0 && (
        <div className="border border-indigo-100 rounded-lg overflow-hidden">
          <button
            onClick={() => setShowCatalog(!showCatalog)}
            className="w-full flex items-center justify-between bg-indigo-50 px-3 py-2.5 text-left"
          >
            <span className="flex items-center gap-2 text-sm font-semibold text-indigo-800">
              <BookOpen className="h-4 w-4" />
              {catalogFiltered ? `Actividades para ${eventType}` : 'Catálogo de actividades'}
            </span>
            <span className="text-xs text-indigo-500">{showCatalog ? 'Ocultar' : 'Mostrar'}</span>
          </button>
          {showCatalog && (
            <div className="p-3">
              {!catalogFiltered && (
                <p className="text-xs text-gray-400 mb-2">Mostrando todas las actividades del catálogo</p>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {catalog.map(c => {
                  const alreadyAdded = addedTitles.has(c.title.trim().toLowerCase());
                  return (
                    <div key={c.id} className="border border-gray-100 rounded-lg p-2.5 flex items-start justify-between gap-2 bg-white">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900">{c.title}</p>
                        {c.description && <p className="text-xs text-gray-400 line-clamp-2">{c.description}</p>}
                      </div>
                      <button
                        onClick={() => handleAddFromCatalog(c.id)}
                        disabled={alreadyAdded || addingFromCatalog === c.id}
                        className="flex-shrink-0 text-xs font-semibold text-indigo-600 hover:text-indigo-800 disabled:text-gray-300 whitespace-nowrap"
                      >
                        {alreadyAdded ? 'Añadida' : addingFromCatalog === c.id ? '...' : '+ Añadir'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Banner IA */}
      <div className="flex items-center justify-between bg-purple-50 border border-purple-200 rounded-lg p-3">
        <span className="text-sm text-purple-800">
          <strong>✨ Asesor IA</strong> · Genera ideas de actividades según tu tipo de fiesta y participantes
        </span>
        <button
          onClick={() => setShowAdvisor(true)}
          className="bg-purple-600 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-purple-700"
        >
          Ver sugerencias
        </button>
      </div>

      {/* Formulario añadir actividad */}
      {showAddForm ? (
        <div className="border rounded-lg p-3 space-y-2 bg-gray-50">
          <input
            className="w-full border rounded-lg px-3 py-2 text-sm bg-white"
            placeholder="Título de la actividad *"
            value={addForm.title}
            onChange={e => setAddForm(f => ({ ...f, title: e.target.value }))}
            autoFocus
          />
          <textarea
            className="w-full border rounded-lg px-3 py-2 text-sm bg-white"
            rows={2}
            placeholder="Descripción (opcional)"
            value={addForm.description}
            onChange={e => setAddForm(f => ({ ...f, description: e.target.value }))}
          />
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowAddForm(false)} className="text-sm text-gray-500 px-3 py-1.5">
              Cancelar
            </button>
            <button
              onClick={handleAddFromForm}
              disabled={addingActivity || !addForm.title.trim()}
              className="flex items-center gap-1.5 bg-indigo-600 text-white text-sm px-3 py-1.5 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              <Plus className="h-3.5 w-3.5" />
              {addingActivity ? 'Añadiendo...' : 'Añadir'}
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-800 font-medium"
        >
          <Plus className="h-4 w-4" /> Proponer actividad propia
        </button>
      )}

      {/* Lista de actividades */}
      {activities.length === 0 ? (
        <p className="text-gray-400 text-center py-8 text-sm">Sin actividades todavía. ¡Elige una del catálogo o propón la primera!</p>
      ) : (
        <div className="space-y-3">
          {approved.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Aprobadas ({approved.length})
              </div>
              {approved.map(a => (
                <ActivityRow key={a.id} activity={a} isOrganizer={isOrganizer}
                  currentParticipantId={currentParticipantId}
                  actionId={actionId} onVote={handleVote} onStatus={handleStatus} onDelete={handleDelete}
                  onPropose={handlePropose} />
              ))}
            </div>
          )}
          {pending.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Pendientes ({pending.length})
              </div>
              {pending.map(a => (
                <ActivityRow key={a.id} activity={a} isOrganizer={isOrganizer}
                  currentParticipantId={currentParticipantId}
                  actionId={actionId} onVote={handleVote} onStatus={handleStatus} onDelete={handleDelete}
                  onPropose={handlePropose} />
              ))}
            </div>
          )}
          {isOrganizer && rejected.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Rechazadas ({rejected.length})
              </div>
              {rejected.map(a => (
                <ActivityRow key={a.id} activity={a} isOrganizer={isOrganizer}
                  currentParticipantId={currentParticipantId}
                  actionId={actionId} onVote={handleVote} onStatus={handleStatus} onDelete={handleDelete}
                  onPropose={handlePropose} />
              ))}
            </div>
          )}
        </div>
      )}

      {showAdvisor && (
        <ActivityAdvisor
          eventId={eventId}
          onAddActivity={handleAddActivity}
          onClose={() => setShowAdvisor(false)}
        />
      )}
    </div>
  );
}

function ActivityRow({ activity, isOrganizer, currentParticipantId, actionId, onVote, onStatus, onDelete, onPropose }: {
  activity: Activity;
  isOrganizer: boolean;
  currentParticipantId: number | null;
  actionId: number | null;
  onVote: (id: number) => void;
  onStatus: (id: number, status: 'approved' | 'rejected') => void;
  onDelete: (id: number) => void;
  onPropose: (id: number) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const busy = actionId === activity.id;
  const isOwnerOrOrganizer = isOrganizer || activity.proposed_by_participant_id === currentParticipantId;
  const canDelete = isOwnerOrOrganizer;
  const canPropose = isOwnerOrOrganizer && !activity.source_template_id;

  return (
    <div className={`border rounded-lg p-3 mb-1 ${
      activity.status === 'approved' ? 'bg-green-50 border-green-100' :
      activity.status === 'rejected' ? 'bg-gray-50 border-gray-100 opacity-60' :
      'bg-white border-gray-100'
    }`}>
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium">{activity.title}</div>
          {activity.proposed_by_name && (
            <div className="text-xs text-gray-500">Por {activity.proposed_by_name}</div>
          )}
          {activity.description && expanded && (
            <div className="text-xs text-gray-600 mt-1">{activity.description}</div>
          )}
          {activity.description && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-xs text-indigo-500 hover:text-indigo-700 mt-0.5"
            >
              {expanded ? 'Menos' : 'Ver descripción'}
            </button>
          )}
          {canPropose && (
            activity.has_pending_proposal ? (
              <span className="inline-block text-xs text-amber-600 mt-1">Propuesta enviada al catálogo</span>
            ) : (
              <button
                onClick={() => onPropose(activity.id)}
                disabled={busy}
                className="flex items-center gap-1 text-xs text-indigo-500 hover:text-indigo-700 mt-1"
              >
                <Send className="h-3 w-3" /> Proponer para el catálogo
              </button>
            )
          )}
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {/* Botón votar */}
          <button
            onClick={() => onVote(activity.id)}
            disabled={busy}
            className={`flex items-center gap-1 text-xs px-2 py-1 rounded-lg ${
              activity.user_voted
                ? 'bg-indigo-100 text-indigo-700'
                : 'bg-gray-100 text-gray-600 hover:bg-indigo-50 hover:text-indigo-600'
            }`}
          >
            <ThumbsUp className="h-3 w-3" /> {activity.votes_count}
          </button>

          {/* Approve/reject para organizador en pending */}
          {activity.status === 'pending' && isOrganizer && (
            <>
              <button onClick={() => onStatus(activity.id, 'approved')} disabled={busy}
                className="bg-green-100 text-green-700 hover:bg-green-200 p-1.5 rounded" title="Aprobar">
                <Check className="h-3.5 w-3.5" />
              </button>
              <button onClick={() => onStatus(activity.id, 'rejected')} disabled={busy}
                className="bg-red-100 text-red-700 hover:bg-red-200 p-1.5 rounded" title="Rechazar">
                <X className="h-3.5 w-3.5" />
              </button>
            </>
          )}

          {activity.status === 'approved' && (
            <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full">✓</span>
          )}

          {canDelete && (
            <button onClick={() => onDelete(activity.id)} disabled={busy}
              className="text-gray-300 hover:text-red-500 p-1" title="Eliminar">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
