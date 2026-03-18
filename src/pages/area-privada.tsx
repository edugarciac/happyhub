import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Head from 'next/head';
import Link from 'next/link';
import User from 'lucide-react/dist/esm/icons/user';
import Lock from 'lucide-react/dist/esm/icons/lock';
import Calendar from 'lucide-react/dist/esm/icons/calendar';
import ChevronDown from 'lucide-react/dist/esm/icons/chevron-down';
import ChevronUp from 'lucide-react/dist/esm/icons/chevron-up';
import RefreshCw from 'lucide-react/dist/esm/icons/refresh-cw';

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
  const [profileMsg, setProfileMsg] = useState({ type: '', text: '' });
  const [passwordMsg, setPasswordMsg] = useState({ type: '', text: '' });
  const [expandedReservation, setExpandedReservation] = useState<string | null>(null);
  const [showPasswordForm, setShowPasswordForm] = useState(false);

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
    }
  }, [sessionStatus, fetchProfile, fetchReservations]);

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
        setShowPasswordForm(false);
      } else {
        setPasswordMsg({ type: 'error', text: result.error || 'Error al cambiar la contraseña' });
      }
    } catch {
      setPasswordMsg({ type: 'error', text: 'Error de conexión' });
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
