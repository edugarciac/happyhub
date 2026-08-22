// src/components/events/CustomDetailsTab.tsx
import { useState, useEffect, useCallback } from 'react';
import { Sparkles, Lock } from 'lucide-react';
import ImageUpload from '@/components/admin/ImageUpload';
import { CUSTOM_DETAIL_IDEAS } from '@/data/customDetailIdeas';

interface CustomDetails {
  reminder_text_short: string | null;
  reminder_text_medium: string | null;
  internal_notes: string | null;
  image_url_1: string | null;
  image_url_2: string | null;
}

interface CustomDetailsTabProps {
  eventId: number;
  isOrganizer: boolean;
}

const EMPTY_DETAILS: CustomDetails = {
  reminder_text_short: '',
  reminder_text_medium: '',
  internal_notes: '',
  image_url_1: null,
  image_url_2: null,
};

export default function CustomDetailsTab({ eventId, isOrganizer }: CustomDetailsTabProps) {
  const [details, setDetails] = useState<CustomDetails>(EMPTY_DETAILS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  const fetchData = useCallback(async () => {
    const res = await fetch(`/api/events/collaborative/${eventId}/detalles`);
    if (res.ok) {
      const data = await res.json();
      if (data.details) {
        setDetails({
          reminder_text_short: data.details.reminder_text_short || '',
          reminder_text_medium: data.details.reminder_text_medium || '',
          internal_notes: data.details.internal_notes || '',
          image_url_1: data.details.image_url_1,
          image_url_2: data.details.image_url_2,
        });
      }
    }
    setLoading(false);
  }, [eventId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSaved(false);
    try {
      const res = await fetch(`/api/events/collaborative/${eventId}/detalles`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(details),
      });
      const data = await res.json();
      if (res.ok) {
        setSaved(true);
      } else {
        setError(data.error || 'Error al guardar');
      }
    } catch {
      setError('Error de conexión');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="text-gray-400 text-sm text-center py-12">Cargando...</p>;

  return (
    <div className="max-w-3xl">
      {/* Intro */}
      <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-xl p-4 flex items-start gap-3 mb-5">
        <Sparkles className="w-6 h-6 text-orange-500 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-bold text-orange-700 text-sm">¿Tienes una idea?</p>
          <p className="text-orange-600 text-xs mt-0.5">
            Cuéntanos qué te gustaría y te ayudamos a crear objetos personalizados para los asistentes,
            para que tu evento sea inolvidable.
          </p>
        </div>
      </div>

      {!isOrganizer && (
        <p className="text-gray-400 text-xs mb-4 flex items-center gap-1.5">
          <Lock className="w-3.5 h-3.5" /> Solo el organizador puede editar esta sección.
        </p>
      )}

      {/* Form */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 mb-5 flex flex-col gap-4">
        <div>
          <label className="block font-semibold text-gray-900 text-sm mb-1">
            Texto corto para recordatorios
          </label>
          <input
            value={details.reminder_text_short || ''}
            onChange={(e) => setDetails({ ...details, reminder_text_short: e.target.value })}
            maxLength={25}
            disabled={!isOrganizer}
            placeholder="Ej: ¡Trae tu gorra HappyHub!"
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-orange-400 disabled:bg-gray-50 disabled:text-gray-400"
          />
          <p className="text-xs text-gray-400 mt-1">{(details.reminder_text_short || '').length}/25</p>
        </div>

        <div>
          <label className="block font-semibold text-gray-900 text-sm mb-1">
            Texto para recordatorios
          </label>
          <input
            value={details.reminder_text_medium || ''}
            onChange={(e) => setDetails({ ...details, reminder_text_medium: e.target.value })}
            maxLength={40}
            disabled={!isOrganizer}
            placeholder="Ej: Recogeréis vuestro regalo sorpresa"
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-orange-400 disabled:bg-gray-50 disabled:text-gray-400"
          />
          <p className="text-xs text-gray-400 mt-1">{(details.reminder_text_medium || '').length}/40</p>
        </div>

        <div>
          <label className="block font-semibold text-gray-900 text-sm mb-1 flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-gray-400" /> Cuéntanos qué quieres (solo para HappyHub)
          </label>
          <p className="text-xs text-gray-400 mb-1">
            Este texto es solo uso interno de HappyHub para preparar los objetos — no se muestra a tus invitados ni en los recordatorios.
          </p>
          <textarea
            value={details.internal_notes || ''}
            onChange={(e) => setDetails({ ...details, internal_notes: e.target.value })}
            disabled={!isOrganizer}
            rows={5}
            placeholder="Describe con el máximo detalle posible qué te gustaría: tipo de objeto, colores, cantidades, presupuesto orientativo..."
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-orange-400 disabled:bg-gray-50 disabled:text-gray-400 resize-y"
          />
        </div>

        <div>
          <label className="block font-semibold text-gray-900 text-sm mb-2">
            Imágenes de referencia (opcional)
          </label>
          <div className="flex flex-wrap gap-4">
            {isOrganizer ? (
              <>
                <ImageUpload
                  value={details.image_url_1}
                  onChange={(url) => setDetails({ ...details, image_url_1: url })}
                  folder="custom-details"
                />
                <ImageUpload
                  value={details.image_url_2}
                  onChange={(url) => setDetails({ ...details, image_url_2: url })}
                  folder="custom-details"
                />
              </>
            ) : (
              [details.image_url_1, details.image_url_2].filter(Boolean).length === 0 && (
                <p className="text-gray-400 text-sm">Sin imágenes de referencia.</p>
              )
            )}
          </div>
        </div>

        {isOrganizer && (
          <div className="flex items-center gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-orange-500 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-orange-600 disabled:opacity-50"
            >
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
            {saved && <span className="text-green-600 text-xs font-semibold">✓ Guardado</span>}
            {error && <span className="text-red-500 text-xs font-semibold">{error}</span>}
          </div>
        )}
      </div>

      {/* Idea gallery */}
      <div>
        <h3 className="font-bold text-gray-900 text-sm mb-3">💡 Algunas ideas para inspirarte</h3>
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
          {CUSTOM_DETAIL_IDEAS.map((idea) => {
            const Icon = idea.icon;
            return (
              <div
                key={idea.id}
                className="bg-white border border-gray-200 rounded-xl p-3 flex flex-col items-center justify-center gap-2 aspect-square"
              >
                {idea.photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={idea.photoUrl} alt={idea.label} className="w-full h-full object-cover rounded-lg" />
                ) : (
                  <span className="flex items-center justify-center w-10 h-10 rounded-full bg-orange-50">
                    <Icon className="w-5 h-5 text-orange-500" />
                  </span>
                )}
                <span className="text-xs font-medium text-gray-600 text-center leading-tight">{idea.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
