import { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import AdminLayout from '@/components/admin/AdminLayout';
import { ArrowLeft, Lock, Trash2, Pencil, Check, X, CalendarX } from 'lucide-react';

type TimeSlot = 'morning' | 'afternoon' | 'night';

const TIME_SLOT_LABELS: Record<TimeSlot, string> = {
  morning: 'Mañana (10:00-14:00)',
  afternoon: 'Tarde (16:00-20:00)',
  night: 'Noche (22:00-02:00)',
};

const ALL_SLOTS: TimeSlot[] = ['morning', 'afternoon', 'night'];

interface BlockedSlot {
  id: number;
  date: string;
  timeSlot: TimeSlot;
  reason: string | null;
  createdBy: string | null;
  createdAt: string;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr + 'T12:00:00Z').toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function today(): string {
  return new Date().toISOString().split('T')[0];
}

export default function BlockedDates() {
  const [slots, setSlots] = useState<BlockedSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [showHistory, setShowHistory] = useState(false);

  // Form state
  const [startDate, setStartDate] = useState(today());
  const [endDate, setEndDate] = useState(today());
  const [selectedSlots, setSelectedSlots] = useState<TimeSlot[]>(['morning', 'afternoon', 'night']);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  // List state
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editReason, setEditReason] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<number[] | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchSlots = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/block-dates?includeHistory=${showHistory}`);
      const data = await res.json();
      setSlots(data.blockedSlots || []);
    } finally {
      setLoading(false);
    }
  }, [showHistory]);

  useEffect(() => {
    fetchSlots();
  }, [fetchSlots]);

  // Keep endDate >= startDate
  const handleStartDateChange = (val: string) => {
    setStartDate(val);
    if (endDate < val) setEndDate(val);
  };

  const toggleSlot = (slot: TimeSlot) => {
    setSelectedSlots((prev) =>
      prev.includes(slot) ? prev.filter((s) => s !== slot) : [...prev, slot]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (selectedSlots.length === 0) {
      setFormError('Selecciona al menos una franja horaria.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/block-dates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ startDate, endDate, timeSlots: selectedSlots, reason: reason || undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || 'Error al bloquear fechas.');
        return;
      }
      setFormSuccess(`${data.created} franja${data.created !== 1 ? 's' : ''} bloqueada${data.created !== 1 ? 's' : ''} correctamente.`);
      setReason('');
      setSelected(new Set());
      fetchSlots();
    } catch {
      setFormError('Error de conexión. Inténtalo de nuevo.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    setSelected(checked ? new Set(slots.map((s) => s.id)) : new Set());
  };

  const handleSelectRow = (id: number, checked: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id); else next.delete(id);
      return next;
    });
  };

  const confirmDelete = (ids: number[]) => setDeleteConfirm(ids);

  const executeDelete = async () => {
    if (!deleteConfirm || deleteConfirm.length === 0) return;
    setDeleting(true);
    try {
      await fetch('/api/admin/block-dates', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: deleteConfirm }),
      });
      setSelected(new Set());
      setDeleteConfirm(null);
      fetchSlots();
    } finally {
      setDeleting(false);
    }
  };

  const startEdit = (slot: BlockedSlot) => {
    setEditingId(slot.id);
    setEditReason(slot.reason || '');
  };

  const saveEdit = async (id: number) => {
    await fetch(`/api/admin/block-dates/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason: editReason || undefined }),
    });
    setEditingId(null);
    fetchSlots();
  };

  const cancelEdit = () => setEditingId(null);

  const allSelected = slots.length > 0 && selected.size === slots.length;
  const someSelected = selected.size > 0;

  return (
    <AdminLayout>
      <Head>
        <title>Bloquear fechas — HappyHub Admin</title>
      </Head>

      <div className="p-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link href="/admin/reservations" className="text-gray-400 hover:text-gray-600">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-2">
            <Lock className="w-6 h-6 text-amber-500" />
            <h1 className="text-2xl font-bold text-gray-900">Bloquear fechas</h1>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Nuevo bloqueo</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha inicio</label>
              <input
                type="date"
                value={startDate}
                min={today()}
                onChange={(e) => handleStartDateChange(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha fin</label>
              <input
                type="date"
                value={endDate}
                min={startDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                required
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Franjas horarias</label>
            <div className="flex flex-wrap gap-3 mb-2">
              {ALL_SLOTS.map((slot) => (
                <label key={slot} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedSlots.includes(slot)}
                    onChange={() => toggleSlot(slot)}
                    className="w-4 h-4 text-amber-500 border-gray-300 rounded focus:ring-amber-400"
                  />
                  <span className="text-sm text-gray-700">{TIME_SLOT_LABELS[slot]}</span>
                </label>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setSelectedSlots(selectedSlots.length === ALL_SLOTS.length ? [] : [...ALL_SLOTS])}
              className="text-xs text-amber-600 hover:text-amber-800 underline"
            >
              {selectedSlots.length === ALL_SLOTS.length ? 'Deseleccionar todas' : 'Seleccionar todas'}
            </button>
          </div>

          <div className="mb-5">
            <label className="block text-sm font-medium text-gray-700 mb-1">Motivo (opcional)</label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              maxLength={500}
              placeholder="Ej: Mantenimiento HVAC, Evento privado..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>

          {formError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{formError}</div>
          )}
          {formSuccess && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">{formSuccess}</div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 disabled:bg-amber-300 text-white font-medium px-5 py-2 rounded-lg transition-colors"
            >
              <CalendarX className="w-4 h-4" />
              {submitting ? 'Bloqueando...' : 'Bloquear fechas'}
            </button>
          </div>
        </form>

        {/* List */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="flex items-center justify-between p-4 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-800">
              Bloqueos activos
              {slots.length > 0 && <span className="ml-2 text-sm font-normal text-gray-500">({slots.length})</span>}
            </h2>
            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
              <input
                type="checkbox"
                checked={showHistory}
                onChange={(e) => setShowHistory(e.target.checked)}
                className="w-4 h-4 text-amber-500 border-gray-300 rounded"
              />
              Ver histórico
            </label>
          </div>

          {someSelected && (
            <div className="px-4 py-3 bg-amber-50 border-b border-amber-100 flex items-center justify-between">
              <span className="text-sm text-amber-700">{selected.size} seleccionado{selected.size !== 1 ? 's' : ''}</span>
              <button
                onClick={() => confirmDelete([...selected])}
                className="flex items-center gap-1 text-sm text-red-600 hover:text-red-800 font-medium"
              >
                <Trash2 className="w-4 h-4" />
                Eliminar seleccionados ({selected.size})
              </button>
            </div>
          )}

          {loading ? (
            <div className="p-8 text-center text-gray-400">Cargando...</div>
          ) : slots.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              No hay bloqueos activos. Usa el formulario de arriba para añadir fechas bloqueadas.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left">
                  <th className="px-4 py-3 w-10">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="w-4 h-4 text-amber-500 border-gray-300 rounded"
                    />
                  </th>
                  <th className="px-4 py-3 font-medium text-gray-600">Fecha</th>
                  <th className="px-4 py-3 font-medium text-gray-600">Franja</th>
                  <th className="px-4 py-3 font-medium text-gray-600">Motivo</th>
                  <th className="px-4 py-3 font-medium text-gray-600 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {slots.map((slot) => (
                  <tr key={slot.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selected.has(slot.id)}
                        onChange={(e) => handleSelectRow(slot.id, e.target.checked)}
                        className="w-4 h-4 text-amber-500 border-gray-300 rounded"
                      />
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-800">{formatDate(slot.date)}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">
                        {TIME_SLOT_LABELS[slot.timeSlot]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {editingId === slot.id ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={editReason}
                            onChange={(e) => setEditReason(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') saveEdit(slot.id);
                              if (e.key === 'Escape') cancelEdit();
                            }}
                            className="flex-1 border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                            autoFocus
                            maxLength={500}
                          />
                          <button onClick={() => saveEdit(slot.id)} className="text-green-600 hover:text-green-800">
                            <Check className="w-4 h-4" />
                          </button>
                          <button onClick={cancelEdit} className="text-gray-400 hover:text-gray-600">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <span className={slot.reason ? '' : 'text-gray-400 italic'}>
                          {slot.reason || 'Sin motivo'}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        {editingId !== slot.id && (
                          <button
                            onClick={() => startEdit(slot)}
                            className="text-gray-400 hover:text-gray-600"
                            title="Editar motivo"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => confirmDelete([slot.id])}
                          className="text-gray-400 hover:text-red-600"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Delete Confirm Dialog */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Confirmar eliminación</h3>
            <p className="text-gray-600 text-sm mb-6">
              ¿Eliminar <strong>{deleteConfirm.length} bloqueo{deleteConfirm.length !== 1 ? 's' : ''}</strong>?
              Esta acción no se puede deshacer.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                disabled={deleting}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg"
              >
                Cancelar
              </button>
              <button
                onClick={executeDelete}
                disabled={deleting}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:bg-red-300 rounded-lg"
              >
                {deleting ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
