import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Head from 'next/head';
import Link from 'next/link';
import { User, Lock, Calendar, ChevronDown, ChevronUp, RefreshCw, Star, Users, Plus, ArrowRight } from 'lucide-react';
import type { CollaborativeEvent } from '@/utils/db/collaborative-events';

// -- Types --

interface UserProfile {
  id: number;
  email: string;
  name: string;
  phone?: string;
  role: string;
  authMethods: { password: boolean; google: boolean };
}

interface Reservation {
  id: string;
  reservationId: string;
  date: string;
  timeSlot: string;
  eventType: string;
  guests: number;
  extras: string[];
  basePrice: number;
  totalPrice: number;
  depositAmount: number;
  depositPaid: number;
  paymentStatus: string;
  status: string;
  message: string;
  createdAt: string;
}

// -- Schemas --

const profileSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  phone: z.string().regex(/^\+?[0-9]{9,15}$/, 'Número de teléfono inválido').or(z.literal('')),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'La contraseña actual es obligatoria'),
  newPassword: z.string()
    .min(8, 'Mínimo 8 caracteres')
    .regex(/[a-zA-Z]/, 'Debe contener letras')
    .regex(/[0-9]/, 'Debe contener números'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
});

type ProfileForm = z.infer<typeof profileSchema>;
type PasswordForm = z.infer<typeof passwordSchema>;

// -- Helpers --

const TIME_SLOT_LABELS: Record<string, string> = {
  morning: 'Mañana',
  afternoon: 'Tarde',
  night: 'Noche',
};

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  pending: { label: 'Pendiente', className: 'bg-yellow-100 text-yellow-800' },
  approved: { label: 'Aprobada', className: 'bg-green-100 text-green-800' },
  rejected: { label: 'Rechazada', className: 'bg-red-100 text-red-800' },
  paid: { label: 'Pagada', className: 'bg-blue-100 text-blue-800' },
  completed: { label: 'Realizada', className: 'bg-purple-100 text-purple-800' },
  cancelled: { label: 'Cancelada', className: 'bg-gray-100 text-gray-600' },
};

function formatDate(dateStr: string) {
  if (!dateStr) return 'N/A';
  return new Date(dateStr).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(amount);
}

// -- Component --

export default function AreaPrivadaPage() {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingReservations, setLoadingReservations] = useState(true);
  const [reservationsError, setReservationsError] = useState('');
  const [organizedEvents, setOrganizedEvents] = useState<CollaborativeEvent[]>([]);
  const [participatingEvents, setParticipatingEvents] = useState<CollaborativeEvent[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [profileMsg, setProfileMsg] = useState({ type: '', text: '' });
  const [passwordMsg, setPasswordMsg] = useState({ type: '', text: '' });
  const [expandedReservation, setExpandedReservation] = useState<string | null>(null);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [payingRemainingId, setPayingRemainingId] = useState<string | null>(null);
  const [payRemainingError, setPayRemainingError] = useState<string>('');

  // Review form state
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewHover, setReviewHover] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewMsg, setReviewMsg] = useState({ type: '', text: '' });

  const profileForm = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
  });

  const passwordForm = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
  });

  // Redirect if not authenticated, or to admin if admin user
  useEffect(() => {
    if (sessionStatus === 'unauthenticated') {
      router.push('/login');
    } else if (sessionStatus === 'authenticated' && (session?.user as any)?.role === 'admin') {
      router.replace('/admin/dashboard');
    }
  }, [sessionStatus, session, router]);

  // Fetch profile
  const fetchProfile = useCallback(async () => {
    try {
      const res = await fetch('/api/user/profile');
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
        profileForm.reset({ name: data.name || '', phone: data.phone || '' });
      }
    } catch {
      // silent
    } finally {
      setLoadingProfile(false);
    }
  }, [profileForm]);

  const fetchCollaborativeEvents = useCallback(async () => {
    try {
      const res = await fetch('/api/events/collaborative');
      if (res.ok) {
        const data = await res.json();
        setOrganizedEvents(data.organized || []);
        setParticipatingEvents(data.participating || []);
      }
    } catch {
      // silent
    } finally {
      setLoadingEvents(false);
    }
  }, []);

  // Fetch reservations
  const fetchReservations = useCallback(async () => {
    setLoadingReservations(true);
    setReservationsError('');
    try {
      const res = await fetch('/api/user/reservations');
      if (res.ok) {
        const data = await res.json();
        setReservations(data.reservations || []);
      } else {
        setReservationsError('No se pudieron cargar tus reservas. Inténtalo de nuevo más tarde');
      }
    } catch {
      setReservationsError('No se pudieron cargar tus reservas. Inténtalo de nuevo más tarde');
    } finally {
      setLoadingReservations(false);
    }
  }, []);

  useEffect(() => {
    if (sessionStatus === 'authenticated') {
      fetchProfile();
      fetchReservations();
      fetchCollaborativeEvents();
    }
  }, [sessionStatus, fetchProfile, fetchReservations, fetchCollaborativeEvents]);

  // Save profile
  const onSaveProfile = async (data: ProfileForm) => {
    setProfileMsg({ type: '', text: '' });
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (res.ok) {
        setProfileMsg({ type: 'success', text: 'Datos actualizados correctamente' });
        fetchProfile();
      } else {
        setProfileMsg({ type: 'error', text: result.error || 'Error al actualizar' });
      }
    } catch {
      setProfileMsg({ type: 'error', text: 'Error de conexión' });
    }
  };

  // Change password
  const onChangePassword = async (data: PasswordForm) => {
    setPasswordMsg({ type: '', text: '' });
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: data.currentPassword,
          newPassword: data.newPassword,
        }),
      });
      const result = await res.json();
      if (res.ok) {
        setPasswordMsg({ type: 'success', text: 'Contraseña actualizada correctamente' });
        passwordForm.reset();
      } else {
        setPasswordMsg({ type: 'error', text: result.error || 'Error al cambiar la contraseña' });
      }
    } catch {
      setPasswordMsg({ type: 'error', text: 'Error de conexión' });
    }
  };

  // Pay remaining balance
  const handlePayRemaining = async (reservationId: string) => {
    setPayingRemainingId(reservationId);
    setPayRemainingError('');
    try {
      const res = await fetch('/api/payments/remaining', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reservationId: parseInt(reservationId) }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) {
        setPayRemainingError(data.error || 'Error al iniciar el pago');
        setPayingRemainingId(null);
        return;
      }
      window.location.href = data.url;
    } catch {
      setPayRemainingError('No se pudo conectar con el servidor');
      setPayingRemainingId(null);
    }
  };

  // Submit review
  const onSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewTitle || reviewTitle.length < 3) {
      setReviewMsg({ type: 'error', text: 'El título debe tener al menos 3 caracteres' });
      return;
    }
    if (reviewRating === 0) {
      setReviewMsg({ type: 'error', text: 'Selecciona una valoración' });
      return;
    }
    setReviewSubmitting(true);
    setReviewMsg({ type: '', text: '' });
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: reviewTitle,
          rating: reviewRating,
          review_text: reviewText,
        }),
      });
      const result = await res.json();
      if (res.ok) {
        setReviewMsg({ type: 'success', text: 'Reseña enviada correctamente. Será revisada antes de publicarse.' });
        setReviewTitle('');
        setReviewRating(0);
        setReviewHover(0);
        setReviewText('');
      } else {
        setReviewMsg({ type: 'error', text: result.error || 'Error al enviar la reseña' });
      }
    } catch {
      setReviewMsg({ type: 'error', text: 'Error de conexión' });
    } finally {
      setReviewSubmitting(false);
    }
  };

  if (sessionStatus === 'loading' || sessionStatus === 'unauthenticated') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Área privada - HappyHub</title>
        <meta name="description" content="Tu área privada en HappyHub" />
      </Head>

      <div className="min-h-screen bg-gray-50 pt-28 pb-12">
        <div className="container-custom max-w-4xl">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Área privada</h1>

          {/* Datos personales */}
          <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
            <div className="flex items-center gap-3 mb-6">
              <User className="w-5 h-5 text-primary-600" />
              <h2 className="text-xl font-semibold text-gray-900">Datos personales</h2>
            </div>

            {loadingProfile ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
              </div>
            ) : profile ? (
              <>
                {/* Email (read-only) */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-500 mb-1">Email</label>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-900">{profile.email}</span>
                    <span className="text-xs text-gray-400">(Contacta con soporte para cambiar tu email)</span>
                  </div>
                </div>

                {/* Auth methods */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-500 mb-1">Cuentas vinculadas</label>
                  <div className="flex gap-2">
                    {profile.authMethods.password && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Email/Contraseña
                      </span>
                    )}
                    {profile.authMethods.google && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Google
                      </span>
                    )}
                  </div>
                </div>

                {/* Editable fields */}
                <form onSubmit={profileForm.handleSubmit(onSaveProfile)} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                      <input
                        {...profileForm.register('name')}
                        id="name"
                        className="block w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
                      />
                      {profileForm.formState.errors.name && (
                        <p className="text-red-500 text-sm mt-1">{profileForm.formState.errors.name.message}</p>
                      )}
                    </div>
                    <div>
                      <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                      <input
                        {...profileForm.register('phone')}
                        id="phone"
                        className="block w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
                        placeholder="+34612345678"
                      />
                      {profileForm.formState.errors.phone && (
                        <p className="text-red-500 text-sm mt-1">{profileForm.formState.errors.phone.message}</p>
                      )}
                    </div>
                  </div>

                  {profileMsg.text && (
                    <div className={`px-4 py-2 rounded-lg text-sm ${
                      profileMsg.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                    }`}>
                      {profileMsg.text}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={profileForm.formState.isSubmitting}
                    className="px-6 py-2.5 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition disabled:opacity-50"
                  >
                    {profileForm.formState.isSubmitting ? 'Guardando...' : 'Guardar cambios'}
                  </button>
                </form>

                {/* Password section */}
                <div className="mt-6 pt-6 border-t border-gray-100">
                  <button
                    onClick={() => setShowPasswordForm(!showPasswordForm)}
                    className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-primary-600 transition"
                  >
                    <Lock className="w-4 h-4" />
                    Cambiar contraseña
                    {showPasswordForm ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>

                  {showPasswordForm && (
                    <form onSubmit={passwordForm.handleSubmit(onChangePassword)} className="mt-4 space-y-4 max-w-sm">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña actual</label>
                        <input
                          {...passwordForm.register('currentPassword')}
                          type="password"
                          className="block w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
                        />
                        {passwordForm.formState.errors.currentPassword && (
                          <p className="text-red-500 text-sm mt-1">{passwordForm.formState.errors.currentPassword.message}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nueva contraseña</label>
                        <input
                          {...passwordForm.register('newPassword')}
                          type="password"
                          className="block w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
                        />
                        {passwordForm.formState.errors.newPassword && (
                          <p className="text-red-500 text-sm mt-1">{passwordForm.formState.errors.newPassword.message}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar contraseña</label>
                        <input
                          {...passwordForm.register('confirmPassword')}
                          type="password"
                          className="block w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
                        />
                        {passwordForm.formState.errors.confirmPassword && (
                          <p className="text-red-500 text-sm mt-1">{passwordForm.formState.errors.confirmPassword.message}</p>
                        )}
                      </div>

                      {passwordMsg.text && (
                        <div className={`px-4 py-2 rounded-lg text-sm ${
                          passwordMsg.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                        }`}>
                          {passwordMsg.text}
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={passwordForm.formState.isSubmitting}
                        className="px-6 py-2.5 bg-gray-800 text-white rounded-lg font-medium hover:bg-gray-900 transition disabled:opacity-50"
                      >
                        {passwordForm.formState.isSubmitting ? 'Actualizando...' : 'Actualizar contraseña'}
                      </button>
                    </form>
                  )}
                </div>
              </>
            ) : (
              <p className="text-gray-500">No se pudo cargar el perfil</p>
            )}
          </section>

          {/* Publicar reseña — solo si tiene reserva realizada */}
          {reservations.some(r => r.status === 'completed') && (
          <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
            <div className="flex items-center gap-3 mb-6">
              <Star className="w-5 h-5 text-primary-600" />
              <h2 className="text-xl font-semibold text-gray-900">Publicar reseña</h2>
            </div>

            <form onSubmit={onSubmitReview} className="space-y-5">
              {/* Title */}
              <div>
                <label htmlFor="review-title" className="block text-sm font-medium text-gray-700 mb-1">
                  Título <span className="text-red-500">*</span>
                </label>
                <input
                  id="review-title"
                  type="text"
                  value={reviewTitle}
                  onChange={(e) => setReviewTitle(e.target.value)}
                  minLength={3}
                  required
                  className="block w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
                  placeholder="Ej: Una experiencia increíble"
                />
              </div>

              {/* Star rating */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Valoración <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewRating(star)}
                      onMouseEnter={() => setReviewHover(star)}
                      onMouseLeave={() => setReviewHover(0)}
                      className="focus:outline-none transition-transform hover:scale-110"
                      aria-label={`${star} estrella${star > 1 ? 's' : ''}`}
                    >
                      <Star
                        className="w-8 h-8 transition-colors"
                        style={{
                          fill: (reviewHover || reviewRating) >= star ? '#f59e0b' : 'none',
                          color: (reviewHover || reviewRating) >= star ? '#f59e0b' : '#d1d5db',
                        }}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Review text */}
              <div>
                <label htmlFor="review-text" className="block text-sm font-medium text-gray-700 mb-1">
                  Comentario <span className="text-gray-400 font-normal">(opcional)</span>
                </label>
                <textarea
                  id="review-text"
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  maxLength={500}
                  rows={4}
                  className="block w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition resize-none"
                  placeholder="Cuéntanos cómo fue tu experiencia en HappyHub..."
                />
                <p className="text-xs text-gray-400 mt-1 text-right">{reviewText.length}/500</p>
              </div>

              {reviewMsg.text && (
                <div className={`px-4 py-2 rounded-lg text-sm ${
                  reviewMsg.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                }`}>
                  {reviewMsg.text}
                </div>
              )}

              <button
                type="submit"
                disabled={reviewSubmitting}
                className="px-6 py-2.5 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition disabled:opacity-50"
              >
                {reviewSubmitting ? 'Enviando...' : 'Enviar reseña'}
              </button>
            </form>
          </section>
          )}

          {/* Mis eventos colaborativos */}
          <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-purple-600" />
                <h2 className="text-xl font-semibold text-gray-900">Mis eventos</h2>
              </div>
              <Link
                href="/eventos/crear"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-purple-600 hover:text-purple-800 transition"
              >
                <Plus className="w-4 h-4" />
                Crear evento
              </Link>
            </div>

            {loadingEvents ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
              </div>
            ) : organizedEvents.length === 0 && participatingEvents.length === 0 ? (
              <div className="text-center py-10">
                <Users className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm mb-4">Aún no tienes eventos colaborativos</p>
                <Link
                  href="/eventos/crear"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-purple-600 text-white rounded-xl text-sm font-medium hover:bg-purple-700 transition"
                >
                  <Plus className="w-4 h-4" />
                  Crear mi primer evento
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {organizedEvents.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Que organizo</p>
                    <div className="space-y-2">
                      {organizedEvents.map((ev) => (
                        <Link
                          key={ev.id}
                          href={`/eventos/${ev.id}`}
                          className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:border-purple-300 hover:bg-purple-50 transition group"
                        >
                          <div>
                            <p className="font-medium text-gray-900 text-sm group-hover:text-purple-700">{ev.title}</p>
                            {ev.event_date && (
                              <p className="text-xs text-gray-400 mt-0.5">
                                {new Date(ev.event_date).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                              </p>
                            )}
                          </div>
                          <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-purple-500 flex-shrink-0" />
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {participatingEvents.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">En los que participo</p>
                    <div className="space-y-2">
                      {participatingEvents.map((ev) => (
                        <Link
                          key={ev.id}
                          href={`/eventos/${ev.id}`}
                          className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:border-purple-300 hover:bg-purple-50 transition group"
                        >
                          <div>
                            <p className="font-medium text-gray-900 text-sm group-hover:text-purple-700">{ev.title}</p>
                            {ev.event_date && (
                              <p className="text-xs text-gray-400 mt-0.5">
                                {new Date(ev.event_date).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                              </p>
                            )}
                          </div>
                          <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-purple-500 flex-shrink-0" />
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>

          {/* Mis reservas */}
          <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-primary-600" />
                <h2 className="text-xl font-semibold text-gray-900">Mis reservas</h2>
              </div>
              {!loadingReservations && (
                <button
                  onClick={fetchReservations}
                  className="text-gray-400 hover:text-primary-600 transition p-1"
                  title="Actualizar"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              )}
            </div>

            {loadingReservations ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
              </div>
            ) : reservationsError ? (
              <div className="text-center py-8">
                <p className="text-red-600 mb-4">{reservationsError}</p>
                <button
                  onClick={fetchReservations}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700 transition"
                >
                  Reintentar
                </button>
              </div>
            ) : reservations.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">Aún no tienes reservas</p>
                <Link
                  href="/reservas"
                  className="inline-block px-6 py-2.5 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition"
                >
                  Reserva tu fecha
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {reservations.map((reservation) => {
                  const isExpanded = expandedReservation === reservation.id;
                  const statusCfg = STATUS_CONFIG[reservation.status] || STATUS_CONFIG.pending;

                  return (
                    <div
                      key={reservation.id}
                      className="border border-gray-100 rounded-xl overflow-hidden hover:border-gray-200 transition"
                    >
                      {/* Summary row */}
                      <button
                        onClick={() => setExpandedReservation(isExpanded ? null : reservation.id)}
                        className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-50 transition"
                      >
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                          <div className="flex-shrink-0">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusCfg.className}`}>
                              {statusCfg.label}
                            </span>
                          </div>
                          <div className="min-w-0 flex-1">
                            <span className="text-sm font-medium text-gray-900">
                              {formatDate(reservation.date)}
                            </span>
                            <span className="text-gray-400 mx-2">-</span>
                            <span className="text-sm text-gray-600">
                              {TIME_SLOT_LABELS[reservation.timeSlot] || reservation.timeSlot}
                            </span>
                          </div>
                          <div className="hidden sm:flex items-center gap-4 text-sm text-gray-500">
                            <span>{reservation.eventType}</span>
                            <span>{reservation.guests} invitados</span>
                            <span className="font-medium text-gray-900">{formatCurrency(reservation.totalPrice)}</span>
                          </div>
                        </div>
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0 ml-2" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0 ml-2" />
                        )}
                      </button>

                      {/* Detail panel */}
                      {isExpanded && (
                        <div className="px-4 py-4 bg-gray-50 border-t border-gray-100">
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                            <div>
                              <span className="text-gray-500">Tipo de evento</span>
                              <p className="font-medium">{reservation.eventType}</p>
                            </div>
                            <div>
                              <span className="text-gray-500">Invitados</span>
                              <p className="font-medium">{reservation.guests}</p>
                            </div>
                            <div>
                              <span className="text-gray-500">Precio base</span>
                              <p className="font-medium">{formatCurrency(reservation.basePrice)}</p>
                            </div>
                            <div>
                              <span className="text-gray-500">Precio total</span>
                              <p className="font-medium">{formatCurrency(reservation.totalPrice)}</p>
                            </div>
                            <div>
                              <span className="text-gray-500">Depósito</span>
                              <p className="font-medium">{formatCurrency(reservation.depositAmount)}</p>
                            </div>
                            <div>
                              <span className="text-gray-500">Pagado</span>
                              <p className="font-medium">{formatCurrency(reservation.depositPaid)}</p>
                            </div>
                            {/* Remaining payment */}
                            {reservation.paymentStatus === 'deposit_paid' && (
                              <div className="col-span-2 sm:col-span-3 mt-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="text-sm font-medium text-amber-900">Pago restante pendiente</p>
                                    <p className="text-lg font-bold text-amber-800">
                                      {formatCurrency(reservation.totalPrice - reservation.depositPaid)}
                                    </p>
                                  </div>
                                  <button
                                    onClick={() => handlePayRemaining(reservation.id)}
                                    disabled={payingRemainingId === reservation.id}
                                    className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition disabled:opacity-50"
                                  >
                                    {payingRemainingId === reservation.id ? 'Redirigiendo...' : 'Pagar ahora →'}
                                  </button>
                                </div>
                                {payRemainingError && (
                                  <p className="text-red-600 text-xs mt-2">{payRemainingError}</p>
                                )}
                              </div>
                            )}
                            {reservation.paymentStatus === 'fully_paid' && (
                              <div className="col-span-2 sm:col-span-3 mt-2">
                                <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                                  ✓ Pago completo
                                </span>
                              </div>
                            )}
                            {reservation.extras.length > 0 && (
                              <div className="col-span-2 sm:col-span-3">
                                <span className="text-gray-500">Extras</span>
                                <div className="flex gap-2 mt-1 flex-wrap">
                                  {reservation.extras.map((extra, i) => (
                                    <span key={i} className="px-2 py-0.5 bg-white border border-gray-200 rounded text-xs">
                                      {extra}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                            {reservation.message && (
                              <div className="col-span-2 sm:col-span-3">
                                <span className="text-gray-500">Mensaje</span>
                                <p className="mt-1 text-gray-700">{reservation.message}</p>
                              </div>
                            )}
                            <div className="col-span-2 sm:col-span-3 text-xs text-gray-400">
                              Ref: {reservation.reservationId}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </div>
    </>
  );
}
