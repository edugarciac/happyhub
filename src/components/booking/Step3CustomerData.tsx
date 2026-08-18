import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useBooking, EventType, PaymentMethod } from './BookingContext';
import PriceSummary from './PriceSummary';
import { ChevronLeft, ChevronRight, User, AlertCircle, FileText, Loader2, CreditCard } from 'lucide-react';

const customerSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  phone: z.string().min(9, 'Teléfono debe tener al menos 9 dígitos'),
  eventType: z.enum([
    'cumpleaños',
    'celebracion-familiar',
    'eventos-amigos',
    'eventos-colegio-trabajo',
    'taller',
    'otros'
  ], {
    errorMap: () => ({ message: 'Selecciona un tipo de evento' }),
  }),
  paymentMethod: z.enum(['card', 'bizum', 'cash'], {
    errorMap: () => ({ message: 'Selecciona un método de pago' }),
  }),
  message: z.string().optional(),
  needsKidsFurniture: z.boolean().optional(),
  acceptTerms: z.boolean().refine(val => val === true, {
    message: 'Debes aceptar los términos y condiciones',
  }),
});

type CustomerFormData = z.infer<typeof customerSchema>;

export default function Step3CustomerData() {
  const { state, dispatch, nextStep, prevStep, goToStep, calculateTotalPrice, calculateDepositAmount } = useBooking();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitErrorDetail, setSubmitErrorDetail] = useState<string | null>(null);
  const [showErrorDetail, setShowErrorDetail] = useState(false);
  const [isConflictError, setIsConflictError] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      name: state.name,
      email: state.email,
      phone: state.phone,
      eventType: state.eventType || undefined,
      paymentMethod: state.paymentMethod || undefined,
      message: state.message,
      needsKidsFurniture: state.needsKidsFurniture,
      acceptTerms: state.acceptTerms,
    },
  });

  const onSubmit = async (data: CustomerFormData) => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // Save customer data to context
      dispatch({
        type: 'SET_CUSTOMER_DATA',
        data: {
          name: data.name,
          email: data.email,
          phone: data.phone,
          eventType: data.eventType as EventType,
          paymentMethod: data.paymentMethod as PaymentMethod,
          message: data.message || '',
          needsKidsFurniture: data.needsKidsFurniture || false,
          acceptTerms: data.acceptTerms,
        },
      });

      // Calculate pricing
      const totalPrice = calculateTotalPrice();
      const depositAmount = calculateDepositAmount();

      if (totalPrice === 'consult') {
        setSubmitError('El precio debe estar definido para continuar');
        return;
      }

      // Format date and time for n8n
      const date = state.date;
      const dateStr = date ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}` : '';

      // Map timeSlot to time string
      const timeMap: Record<string, string> = {
        morning: '10:00',
        afternoon: '16:00',
        night: '22:00'
      };
      const timeStr = state.timeSlot ? timeMap[state.timeSlot] : '10:00';

      // Send reservation to n8n (which will handle WhatsApp, DB, Calendar, etc.)
      const response = await fetch('/api/webhook-reserva', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          // Customer data
          name: data.name,
          email: data.email,
          phone: data.phone,
          eventType: data.eventType,
          paymentMethod: data.paymentMethod,
          message: data.message || '',
          needsKidsFurniture: data.needsKidsFurniture || false,
          // Booking data
          date: dateStr,
          time: timeStr,
          timeSlot: state.timeSlot,
          guests: state.guests,
          duration: '4', // Default 4 hours
          extras: state.selectedExtras || [],
          // Pricing
          basePrice: state.basePrice,
          totalPrice,
          depositAmount,
          // Metadata
          source: 'web',
          timestamp: new Date().toISOString(),
        }),
      });

      const result = await response.json();

      // Handle specific error cases
      if (response.status === 409) {
        setSubmitError('Esta fecha y franja horaria ya esta reservada. Por favor, vuelve al paso 1 y elige otra fecha.');
        setSubmitErrorDetail(`HTTP ${response.status}: ${result.error || result.message || ''}`);
        setIsConflictError(true);
        setIsSubmitting(false);
        return;
      }

      if (response.status === 503) {
        setSubmitError('El servicio de reservas no esta disponible en este momento. Intentalo de nuevo en unos minutos.');
        setSubmitErrorDetail(`HTTP ${response.status}: ${result.detail || result.error || ''}`);
        setIsConflictError(false);
        setIsSubmitting(false);
        return;
      }

      if (!response.ok) {
        setSubmitError(result.error || 'Ha ocurrido un error al procesar tu reserva. Intentalo de nuevo.');
        setSubmitErrorDetail(`HTTP ${response.status}${result.step ? ` [${result.step}]` : ''}: ${result.detail || result.error || ''}`);
        setIsConflictError(false);
        setIsSubmitting(false);
        return;
      }

      if (!result.success) {
        setSubmitError(result.error || 'Error al procesar la reserva. Intentalo de nuevo.');
        setSubmitErrorDetail(result.step ? `Paso: ${result.step}` : '');
        setIsConflictError(false);
        setIsSubmitting(false);
        return;
      }

      // Success! reservation created
      const reservationId = result.reservationId;
      dispatch({
        type: 'SET_RESERVATION_ID',
        id: reservationId,
      });

      if (result.emailWarning) {
        dispatch({
          type: 'SET_EMAIL_WARNING',
          warning: result.emailWarning,
        });
      }

      // If card payment: redirect to Stripe for deposit
      if (data.paymentMethod === 'card') {
        try {
          const checkoutRes = await fetch('/api/create-checkout-session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              reservationId,
              type: 'deposit',
              name: data.name,
              email: data.email,
              phone: data.phone,
              eventType: data.eventType,
              message: data.message || '',
              date: dateStr,
              timeSlot: state.timeSlot,
              guests: state.guests,
              extras: state.selectedExtras || [],
              basePrice: state.basePrice || totalPrice,
              totalPrice,
              depositAmount,
            }),
          });

          const checkoutData = await checkoutRes.json();

          if (!checkoutRes.ok || !checkoutData.url) {
            setSubmitError('Error al iniciar el pago con tarjeta. Inténtalo de nuevo.');
            setIsSubmitting(false);
            return;
          }

          window.location.href = checkoutData.url;
          return;
        } catch (stripeError: any) {
          setSubmitError('No se pudo conectar con el sistema de pago. Inténtalo de nuevo.');
          setIsSubmitting(false);
          return;
        }
      }

      // Non-card payment: advance to confirmation step
      nextStep();
    } catch (error: any) {
      console.error('Error submitting reservation:', error);
      setSubmitError('No se ha podido conectar con el servidor. Comprueba tu conexion a internet.');
      setSubmitErrorDetail(error.message || '');
      setIsConflictError(false);
      setIsSubmitting(false);
    }
  };

  const eventTypes = [
    { value: 'cumpleaños', label: 'Cumpleaños' },
    { value: 'celebracion-familiar', label: 'Celebración familiar' },
    { value: 'eventos-amigos', label: 'Eventos con amigos' },
    { value: 'eventos-colegio-trabajo', label: 'Eventos de colegio/trabajo' },
    { value: 'taller', label: 'Taller' },
    { value: 'otros', label: 'Otros' },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-4">
          <User className="w-8 h-8 text-primary-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Tus datos</h2>
        <p className="text-gray-600">
          Completa tus datos para finalizar la reserva
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Customer form */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-6">Información de contacto</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre completo *
                  </label>
                  <input
                    type="text"
                    {...register('name')}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Tu nombre completo"
                  />
                  {errors.name && (
                    <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    {...register('email')}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="tu@email.com"
                  />
                  {errors.email && (
                    <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Teléfono *
                  </label>
                  <input
                    type="tel"
                    {...register('phone')}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="624 645 517"
                  />
                  {errors.phone && (
                    <p className="text-red-500 text-sm mt-1">{errors.phone.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de evento *
                  </label>
                  <select
                    {...register('eventType')}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">Selecciona un tipo</option>
                    {eventTypes.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                  {errors.eventType && (
                    <p className="text-red-500 text-sm mt-1">{errors.eventType.message}</p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4" />
                      Método de pago *
                    </div>
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { value: 'card', label: 'Tarjeta', icon: '💳' },
                      { value: 'bizum', label: 'Bizum', icon: '📱' },
                      { value: 'cash', label: 'Efectivo', icon: '💵' },
                    ].map((method) => (
                      <label
                        key={method.value}
                        className={`relative flex flex-col items-center gap-1 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                          errors.paymentMethod ? 'border-red-300' : 'border-gray-200'
                        } hover:border-primary-300`}
                      >
                        <input
                          type="radio"
                          value={method.value}
                          {...register('paymentMethod')}
                          className="sr-only peer"
                        />
                        <span className="text-2xl">{method.icon}</span>
                        <span className="text-sm font-medium text-gray-700 peer-checked:text-primary-600">{method.label}</span>
                        <div className="absolute inset-0 rounded-lg border-2 border-transparent peer-checked:border-primary-500 pointer-events-none" />
                      </label>
                    ))}
                  </div>
                  {errors.paymentMethod && (
                    <p className="text-red-500 text-sm mt-1">{errors.paymentMethod.message}</p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mensaje adicional (opcional)
                  </label>
                  <textarea
                    {...register('message')}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
                    placeholder="Cuéntanos cualquier detalle especial sobre tu evento..."
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      {...register('needsKidsFurniture')}
                      className="mt-1 w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm text-gray-700">
                      <span className="font-medium">¿Necesitas mesas y sillas para niños?</span>
                      <br />
                      <span className="text-gray-500">No tiene coste adicional ni afecta al aforo — solo nos ayuda a prepararlo todo antes de tu evento.</span>
                    </span>
                  </label>
                </div>
              </div>
            </div>

            {/* Terms and conditions */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-start gap-3 mb-4">
                <FileText className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" />
                <h3 className="text-lg font-bold text-gray-900">Términos y condiciones</h3>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 mb-4 max-h-40 overflow-y-auto text-sm text-gray-600">
                <h4 className="font-semibold mb-2">Política de reservas HappyHub</h4>
                <ul className="space-y-2 list-disc list-inside">
                  <li>Se requiere un depósito del 30% para confirmar la reserva.</li>
                  <li>El resto del pago se realizará el día del evento.</li>
                  <li>Cancelación gratuita hasta 15 días antes del evento.</li>
                  <li>Cancelaciones con menos de 15 días: se retiene el depósito.</li>
                  <li>Cambio de fecha gratuito hasta 30 días antes, sujeto a disponibilidad.</li>
                  <li>El aforo máximo es de 150 personas.</li>
                  <li>Se deberá dejar el espacio en condiciones razonables de limpieza.</li>
                </ul>
              </div>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  {...register('acceptTerms')}
                  className="mt-1 w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700">
                  He leído y acepto los{' '}
                  <a href="/terminos" target="_blank" className="text-primary-600 hover:underline">
                    términos y condiciones
                  </a>{' '}
                  y la{' '}
                  <a href="/politica-privacidad" target="_blank" className="text-primary-600 hover:underline">
                    política de privacidad
                  </a>
                  . *
                </span>
              </label>
              {errors.acceptTerms && (
                <p className="text-red-500 text-sm mt-2">{errors.acceptTerms.message}</p>
              )}
            </div>
          </div>

          {/* Price Summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-4">
              <PriceSummary showDeposit={true} />
            </div>
          </div>
        </div>

        {/* Error message */}
        {submitError && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg mt-6">
            <div className="flex items-start gap-3 text-red-800">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p>{submitError}</p>
                {submitErrorDetail && (
                  <button
                    type="button"
                    onClick={() => setShowErrorDetail(!showErrorDetail)}
                    className="text-xs text-gray-500 mt-2 hover:text-gray-700"
                  >
                    {showErrorDetail ? 'Ocultar detalles' : 'Ver detalles del error'}
                  </button>
                )}
                {showErrorDetail && submitErrorDetail && (
                  <pre className="text-xs text-gray-500 mt-1 bg-gray-100 p-2 rounded overflow-x-auto">{submitErrorDetail}</pre>
                )}
                <div className="mt-3">
                  {isConflictError ? (
                    <button
                      type="button"
                      onClick={() => { setSubmitError(null); setIsConflictError(false); goToStep(1); }}
                      className="text-sm font-medium text-primary-600 hover:text-primary-800"
                    >
                      Volver al calendario
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setSubmitError(null)}
                      className="text-sm font-medium text-primary-600 hover:text-primary-800"
                    >
                      Intentar de nuevo
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between mt-8">
          <button
            type="button"
            onClick={prevStep}
            disabled={isSubmitting}
            className="btn-outline flex items-center gap-2 disabled:opacity-50"
          >
            <ChevronLeft className="w-5 h-5" />
            Volver
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Procesando...
              </>
            ) : (
              <>
                Solicitar reserva
                <ChevronRight className="w-5 h-5" />
              </>
            )}
          </button>
        </div>
      </form>

      {/* Contact info */}
      <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
        <span>Recibirás confirmación por WhatsApp y email con los detalles de pago.</span>
      </div>
    </div>
  );
}
