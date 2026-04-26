import Head from 'next/head';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import EventCategoryPicker from '@/components/events/EventCategoryPicker';

export default function CrearEventoPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const [form, setForm] = useState({
    title: '',
    description: '',
    category: '',
    event_date: '',
    event_time: '',
    location: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login?redirect=/eventos/crear');
    }
  }, [status, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      const res = await fetch('/api/events/collaborative', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title,
          description: form.description || undefined,
          category: form.category || undefined,
          event_date: form.event_date || undefined,
          event_time: form.event_time || undefined,
          location: form.location || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Error al crear el evento');
        return;
      }

      const event = await res.json();
      router.push(`/eventos/${event.id}`);
    } catch {
      setError('Error de conexión. Inténtalo de nuevo.');
    } finally {
      setSaving(false);
    }
  };

  if (status === 'loading' || status === 'unauthenticated') {
    return null;
  }

  return (
    <>
      <Head>
        <title>Crear evento colaborativo – HappyHub</title>
      </Head>
      <Header />

      <main className="min-h-screen bg-gray-50 py-10 px-4">
        <div className="max-w-2xl mx-auto">
          <Link href="/area-privada" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6">
            <ArrowLeft className="w-4 h-4" />
            Volver al área privada
          </Link>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 md:p-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Crear evento colaborativo</h1>
            <p className="text-gray-500 text-sm mb-6">
              Organiza un evento con tu grupo. Invita a todos con un solo enlace.
            </p>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm mb-5">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre del evento *
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Ej: Fin de curso 2026 – 6ºB"
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Categoría
                </label>
                <EventCategoryPicker
                  value={form.category}
                  onChange={(val) => setForm({ ...form, category: val })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Cuéntales a tus invitados de qué va el evento..."
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha
                  </label>
                  <input
                    type="date"
                    value={form.event_date}
                    onChange={(e) => setForm({ ...form, event_date: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Hora
                  </label>
                  <input
                    type="time"
                    value={form.event_time}
                    onChange={(e) => setForm({ ...form, event_time: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Lugar
                </label>
                <input
                  type="text"
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  placeholder="Ej: HappyHub, Parque del Retiro, Por confirmar..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <button
                type="submit"
                disabled={saving || !form.title}
                className="w-full flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-50"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                {saving ? 'Creando evento...' : 'Crear evento'}
              </button>
            </form>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
