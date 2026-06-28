import { useState } from 'react';
import { useRouter } from 'next/router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { signIn } from 'next-auth/react';
import Head from 'next/head';
import Link from 'next/link';
import GoogleSignInButton from '../components/GoogleSignInButton';
import { event as gaEvent } from '@/lib/analytics';

const registerSchema = z.object({
  email: z.string().email('Por favor, introduce una dirección de email válida'),
  password: z
    .string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .regex(/[a-zA-Z]/, 'La contraseña debe contener letras')
    .regex(/[0-9]/, 'La contraseña debe contener números'),
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  phone: z.string().regex(/^\+?[0-9]{9,15}$/, 'Introduce un número de teléfono válido (ej: +34612345678)'),
});

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterForm) => {
    setLoading(true);
    setError('');

    try {
      console.log('Enviando registro...', { email: data.email, name: data.name });

      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      console.log('Response status:', response.status);

      let result;
      try {
        result = await response.json();
        console.log('Response data:', result);
      } catch (parseError) {
        console.error('Error parsing JSON response:', parseError);
        setError('Error al procesar la respuesta del servidor. Intenta de nuevo');
        setLoading(false);
        return;
      }

      if (!response.ok) {
        const errorMsg = result.error || `Error al registrarse (código ${response.status})`;
        console.error('Registration failed:', errorMsg);
        setError(errorMsg);
        setLoading(false);
        return;
      }

      if (!result.success) {
        console.error('Registration returned success=false:', result.error);
        setError(result.error || 'Error al crear la cuenta');
        setLoading(false);
        return;
      }

      console.log('Registration successful, redirecting to verification pending');
      gaEvent('sign_up', { method: 'email' });

      // Store token for resend functionality
      if (result.token) {
        localStorage.setItem('token', result.token);
      }

      // Redirect to verification-pending page
      router.push(`/verificacion-pendiente?email=${encodeURIComponent(data.email)}`);
    } catch (err: any) {
      console.error('Register exception:', err);

      if (err.name === 'TypeError' && err.message.includes('fetch')) {
        setError('Error de red. Verifica tu conexión a internet y reintenta');
      } else if (err.name === 'AbortError') {
        setError('La solicitud tardó demasiado. Intenta de nuevo');
      } else {
        setError(`Error inesperado: ${err.message}. Por favor, contacta con soporte`);
      }

      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setError('');
    try {
      gaEvent('sign_up', { method: 'google' });
      await signIn('google', { callbackUrl: '/' });
    } catch (err) {
      setError('Error al registrarse con Google');
      setGoogleLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Crear cuenta - HappyHub</title>
        <meta name="description" content="Crea tu cuenta en HappyHub" />
      </Head>

      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-ocean-light/20 to-primary/10 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="bg-white rounded-lg shadow-lg p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-primary mb-2">HappyHub</h1>
              <p className="text-gray-600">Crea tu cuenta para reservar espacios</p>
            </div>

            {/* Error message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6">
                {error}
              </div>
            )}

            {/* Register form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre completo
                </label>
                <input
                  {...register('name')}
                  id="name"
                  type="text"
                  autoComplete="name"
                  className="block w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition"
                  placeholder="Juan Pérez"
                />
                {errors.name && (
                  <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  {...register('email')}
                  id="email"
                  type="email"
                  autoComplete="email"
                  className="block w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition"
                  placeholder="tu@email.com"
                />
                {errors.email && (
                  <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                  Teléfono
                </label>
                <input
                  {...register('phone')}
                  id="phone"
                  type="tel"
                  autoComplete="tel"
                  className="block w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition"
                  placeholder="+34612345678"
                />
                {errors.phone && (
                  <p className="text-red-500 text-sm mt-1">{errors.phone.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Contraseña
                </label>
                <input
                  {...register('password')}
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  className="block w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition"
                  placeholder="••••••••"
                />
                {errors.password && (
                  <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Mínimo 8 caracteres, debe incluir letras y números
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {loading ? (
                  <span className="flex items-center">
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Creando cuenta...
                  </span>
                ) : (
                  'Crear cuenta'
                )}
              </button>
            </form>

            {/* Google Sign In - Only show if configured */}
            {process.env.NEXT_PUBLIC_GOOGLE_OAUTH_ENABLED === 'true' && (
              <>
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">O regístrate con</span>
                  </div>
                </div>
                <GoogleSignInButton onClick={handleGoogleSignIn} loading={googleLoading} />
              </>
            )}

            {/* Login link */}
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                ¿Ya tienes cuenta?{' '}
                <Link
                  href="/login"
                  className="font-medium text-primary hover:text-primary/80 transition"
                >
                  Inicia sesión aquí
                </Link>
              </p>
            </div>
          </div>

          {/* Back to home */}
          <div className="text-center">
            <Link href="/" className="text-sm text-gray-600 hover:text-gray-800 transition">
              ← Volver al inicio
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
