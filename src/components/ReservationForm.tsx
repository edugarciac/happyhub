import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { reservationSchema, ReservationFormData } from '@/utils/validators';
import { calculatePrice, formatCurrency } from '@/utils/formatters';
import { createReservation } from '@/lib/apiClient';
import { Loader2 } from 'lucide-react';

interface ReservationFormProps {
  preselectedDate?: string;
  onSuccess?: (reservationId: string) => void;
}

export default function ReservationForm({ preselectedDate, onSuccess }: ReservationFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [selectedExtras, setSelectedExtras] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ReservationFormData>({
    resolver: zodResolver(reservationSchema),
    defaultValues: {
      date: preselectedDate || '',
      extras: [],
    },
  });

  const duration = watch('duration');
  const guests = watch('guests');

  const totalPrice = duration && guests ? calculatePrice(duration, guests, selectedExtras) : 0;

  const handleExtraToggle = (extra: string) => {
    setSelectedExtras((prev) =>
      prev.includes(extra) ? prev.filter((e) => e !== extra) : [...prev, extra]
    );
  };

  const onSubmit = async (data: ReservationFormData) => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const payload = {
        ...data,
        extras: selectedExtras,
        totalPrice,
      };

      const response = await createReservation(payload);

      if (response.data.success) {
        onSuccess?.(response.data.reservationId);
      }
    } catch (error: any) {
      console.error('Error creating reservation:', error);
      setSubmitError(
        error.response?.data?.message || 'Error al crear la reserva. Por favor, inténtalo de nuevo.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const extras = [
    { id: 'catering', name: 'Catering', description: '€15 por persona' },
    { id: 'animacion', name: 'Animación', description: '€150 fijo' },
    { id: 'decoracion', name: 'Decoración', description: '€100 fijo' },
    { id: 'fotografia', name: 'Fotografía', description: '€200 fijo' },
    { id: 'tarta', name: 'Tarta personalizada', description: '€50 fijo' },
  ];

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="label">Nombre completo *</label>
          <input
            type="text"
            {...register('name')}
            className="input-field"
            placeholder="Tu nombre completo"
          />
          {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
        </div>

        <div>
          <label className="label">Email *</label>
          <input
            type="email"
            {...register('email')}
            className="input-field"
            placeholder="tu@email.com"
          />
          {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
        </div>

        <div>
          <label className="label">Teléfono *</label>
          <input
            type="tel"
            {...register('phone')}
            className="input-field"
            placeholder="600 123 456"
          />
          {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone.message}</p>}
        </div>

        <div>
          <label className="label">Tipo de evento *</label>
          <select {...register('eventType')} className="input-field">
            <option value="">Selecciona un tipo</option>
            <option value="cumpleaños">Cumpleaños</option>
            <option value="comunion">Comunión</option>
            <option value="bautizo">Bautizo</option>
            <option value="otro">Otro</option>
          </select>
          {errors.eventType && <p className="text-red-500 text-sm mt-1">{errors.eventType.message}</p>}
        </div>

        <div>
          <label className="label">Fecha del evento *</label>
          <input type="date" {...register('date')} className="input-field" />
          {errors.date && <p className="text-red-500 text-sm mt-1">{errors.date.message}</p>}
        </div>

        <div>
          <label className="label">Hora *</label>
          <input type="time" {...register('time')} className="input-field" />
          {errors.time && <p className="text-red-500 text-sm mt-1">{errors.time.message}</p>}
        </div>

        <div>
          <label className="label">Número de invitados *</label>
          <input
            type="number"
            {...register('guests', { valueAsNumber: true })}
            className="input-field"
            placeholder="50"
            min="1"
            max="150"
          />
          {errors.guests && <p className="text-red-500 text-sm mt-1">{errors.guests.message}</p>}
        </div>

        <div>
          <label className="label">Duración *</label>
          <select {...register('duration')} className="input-field">
            <option value="">Selecciona duración</option>
            <option value="2h">2 horas - €200</option>
            <option value="3h">3 horas - €300</option>
            <option value="4h">4 horas - €400</option>
            <option value="5h">5 horas - €500</option>
          </select>
          {errors.duration && <p className="text-red-500 text-sm mt-1">{errors.duration.message}</p>}
        </div>
      </div>

      <div>
        <label className="label">Servicios adicionales</label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {extras.map((extra) => (
            <label
              key={extra.id}
              className="flex items-start space-x-3 p-4 border border-gray-300 rounded-lg cursor-pointer hover:border-primary-500 transition-colors"
            >
              <input
                type="checkbox"
                checked={selectedExtras.includes(extra.id)}
                onChange={() => handleExtraToggle(extra.id)}
                className="mt-1"
              />
              <div>
                <div className="font-medium">{extra.name}</div>
                <div className="text-sm text-gray-600">{extra.description}</div>
              </div>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="label">Método de pago *</label>
        <select {...register('paymentMethod')} className="input-field">
          <option value="">Selecciona método</option>
          <option value="card">Tarjeta de crédito/débito</option>
          <option value="transfer">Transferencia bancaria</option>
          <option value="cash">Efectivo (en el local)</option>
        </select>
        {errors.paymentMethod && (
          <p className="text-red-500 text-sm mt-1">{errors.paymentMethod.message}</p>
        )}
      </div>

      <div>
        <label className="label">Mensaje adicional (opcional)</label>
        <textarea
          {...register('message')}
          className="input-field resize-none"
          rows={4}
          placeholder="Cuéntanos más sobre tu evento..."
        />
      </div>

      {totalPrice > 0 && (
        <div className="bg-primary-50 p-6 rounded-lg">
          <div className="flex justify-between items-center text-lg font-semibold">
            <span>Total estimado:</span>
            <span className="text-2xl text-primary-600">{formatCurrency(totalPrice)}</span>
          </div>
        </div>
      )}

      {submitError && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
          {submitError}
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="animate-spin mr-2" />
            Procesando...
          </>
        ) : (
          'Confirmar reserva'
        )}
      </button>

      <p className="text-sm text-gray-600 text-center">
        Al confirmar, aceptas nuestros{' '}
        <a href="/terminos" className="text-primary-600 hover:underline">
          términos y condiciones
        </a>{' '}
        y{' '}
        <a href="/politica-privacidad" className="text-primary-600 hover:underline">
          política de privacidad
        </a>
        .
      </p>
    </form>
  );
}
