import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import AdminLayout from '@/components/admin/AdminLayout';

function jsonHeaders(): HeadersInit {
  return { 'Content-Type': 'application/json' };
}

const TIME_SLOT_OPTIONS = [
  { value: 'morning', label: 'Mañana (11:00–14:30)' },
  { value: 'afternoon', label: 'Tarde (16:30–20:30)' },
  { value: 'night', label: 'Noche (22:00–02:00)' },
];

interface FormData {
  name: string;
  email: string;
  phone: string;
  eventDate: string;
  timeSlot: string;
  eventType: string;
  guests: string;
  totalPrice: string;
  depositAmount: string;
  securityDeposit: string;
  notes: string;
}

export default function CreateReservation() {
  const router = useRouter();
  const [eventTypes, setEventTypes] = useState<{ id: number; name: string; icon: string }[]>([]);

  useEffect(() => {
    fetch('/api/event-types').then(r => r.json()).then(d => {
      if (d.success) setEventTypes(d.eventTypes);
    }).catch(() => {});
  }, []);

  const [form, setForm] = useState<FormData>({
    name: '',
    email: '',
    phone: '',
    eventDate: '',
    timeSlot: '',
    eventType: '',
    guests: '',
    totalPrice: '',
    depositAmount: '',
    securityDeposit: '200',
    notes: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const validate = (): string | null => {
    if (!form.name.trim()) return 'El nombre es obligatorio';
    if (!form.email.trim()) return 'El email es obligatorio';
    if (!form.eventDate) return 'La fecha del evento es obligatoria';
    if (!form.timeSlot) return 'La franja horaria es obligatoria';
    if (!form.eventType) return 'El tipo de evento es obligatorio';
    if (!form.guests || parseInt(form.guests) < 1 || parseInt(form.guests) > 150)
      return 'Los invitados deben estar entre 1 y 150';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    setError('');

    try {
      const res = await fetch('/api/admin/reservations', {
        method: 'POST',
        headers: jsonHeaders(),
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          eventDate: form.eventDate,
          timeSlot: form.timeSlot,
          eventType: form.eventType,
          guests: parseInt(form.guests),
          totalPrice: parseFloat(form.totalPrice) || 0,
          depositAmount: parseFloat(form.depositAmount) || 0,
          securityDeposit: parseFloat(form.securityDeposit) || 200,
          notes: form.notes.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Error al crear la reserva');
        setSaving(false);
        return;
      }

      router.push('/admin/reservations');
    } catch {
      setError('Error de conexion');
      setSaving(false);
    }
  };

  return (
    <AdminLayout>
      <Head>
        <title>Nueva Reserva - Admin HappyHub</title>
      </Head>

      <div className="max-w-2xl mx-auto">
        {/* Page header */}
        <div className="flex items-center gap-4 mb-6">
          <Link href="/admin/reservations" className="p-2 text-gray-500 hover:text-gray-700 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Nueva Reserva</h1>
            <p className="text-gray-500 text-sm">Crear una reserva manualmente</p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="bg-white rounded-xl shadow p-6 space-y-6">
            {error && (
              <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">{error}</div>
            )}

            {/* Client data */}
            <div>
              <h2 className="text-base font-semibold text-gray-800 mb-4">Datos del cliente</h2>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Nombre completo"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      placeholder="cliente@email.com"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                    <input
                      type="tel"
                      name="phone"
                      value={form.phone}
                      onChange={handleChange}
                      placeholder="+34 600 000 000"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Event data */}
            <div>
              <h2 className="text-base font-semibold text-gray-800 mb-4">Datos del evento</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha del evento <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="eventDate"
                    value={form.eventDate}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Franja horaria <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="timeSlot"
                    value={form.timeSlot}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="">Seleccionar franja</option>
                    {TIME_SLOT_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo de evento <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="eventType"
                    value={form.eventType}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="">Seleccionar tipo</option>
                    {eventTypes.map((t) => (
                      <option key={t.id} value={t.name}>{t.icon ? `${t.icon} ` : ''}{t.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Invitados <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="guests"
                    min="1"
                    max="150"
                    value={form.guests}
                    onChange={handleChange}
                    placeholder="1–150"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Pricing */}
            <div>
              <h2 className="text-base font-semibold text-gray-800 mb-4">Precios</h2>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Precio total (EUR)</label>
                  <input
                    type="number"
                    name="totalPrice"
                    min="0"
                    step="0.01"
                    value={form.totalPrice}
                    onChange={handleChange}
                    placeholder="0.00"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Señal (EUR)</label>
                  <input
                    type="number"
                    name="depositAmount"
                    min="0"
                    step="0.01"
                    value={form.depositAmount}
                    onChange={handleChange}
                    placeholder="0.00"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fianza (EUR)</label>
                  <input
                    type="number"
                    name="securityDeposit"
                    min="0"
                    step="0.01"
                    value={form.securityDeposit}
                    onChange={handleChange}
                    placeholder="200.00"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
              <textarea
                name="notes"
                value={form.notes}
                onChange={handleChange}
                rows={3}
                placeholder="Observaciones, peticiones especiales..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <Link
                href="/admin/reservations"
                className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium rounded-lg transition-colors text-center"
              >
                Cancelar
              </Link>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
              >
                {saving ? 'Creando...' : 'Crear Reserva'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}
