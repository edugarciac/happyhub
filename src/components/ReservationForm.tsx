import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { reservationSchema, ReservationFormData } from '@/utils/validators';
import { isWeekend, isFriday, isHoliday, isHolidayEve, type TimeSlot } from '@/utils/pricing';
import { createReservation } from '@/lib/apiClient';
import { Loader2 } from 'lucide-react';

interface ReservationFormProps {
  preselectedDate?: string;
  preselectedTimeSlot?: TimeSlot;
  onSuccess?: (reservationId: string) => void;
}

export default function ReservationForm({
  preselectedDate,
  preselectedTimeSlot,
  onSuccess
}: ReservationFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [selectedExtras, setSelectedExtras] = useState<string[]>([]);
  const [pricing, setPricing] = useState<Record<string, number>>({});

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ReservationFormData>({
    resolver: zodResolver(reservationSchema),
    defaultValues: {
      date: preselectedDate || '',
      timeSlot: preselectedTimeSlot || undefined,
      extras: [],
      paymentMethod: 'card',
    },
  });

  useEffect(() => {
    // Fetch pricing from database
    const fetchPricing = async () => {
      try {
        const response = await fetch('/api/pricing/current');
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setPricing(data.pricing);
          }
        }
      } catch (error) {
        console.error('Error fetching pricing:', error);
      }
    };

    fetchPricing();

    if (preselectedTimeSlot) {
      setValue('timeSlot', preselectedTimeSlot);
    }
  }, [preselectedTimeSlot, setValue]);

  const date = watch('date');
  const timeSlot = watch('timeSlot');
  const guests = watch('guests');

  const calculatePriceFromDb = (dateStr: string, slot: TimeSlot): number | 'consult' => {
    if (slot === 'night') return 'consult';

    const date = new Date(dateStr);
    const isHolidayDay = isHoliday(date);
    const isWeekendDay = isWeekend(date);
    const isFridayDay = isFriday(date);
    const isHolidayEveDay = isHolidayEve(date);

    let ruleKey: string;

    if (isHolidayDay) {
      ruleKey = `holiday_${slot}`;
    } else if (isWeekendDay) {
      ruleKey = `weekend_${slot}`;
    } else if (isFridayDay && slot === 'afternoon') {
      ruleKey = 'friday_afternoon';
    } else if (isHolidayEveDay && slot === 'afternoon') {
      ruleKey = 'friday_afternoon';
    } else {
      ruleKey = `weekday_${slot}`;
    }

    return pricing[ruleKey] || 110;
  };

  const basePrice = date && timeSlot ? calculatePriceFromDb(date, timeSlot) : 0;
  const totalPrice = typeof basePrice === 'number' ? basePrice : 0;

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

      // Manejar errores específicos de n8n
      if (error.response?.status === 409) {
        // Slot ocupado
        setSubmitError(
          error.response?.data?.error ||
          'Lo siento, la fecha y franja horaria seleccionada ya está reservada. Por favor, selecciona otra fecha u horario.'
        );
      } else if (error.response?.data?.error) {
        // Error del workflow de n8n
        setSubmitError(error.response.data.error);
      } else if (error.response?.data?.message) {
        // Error general con mensaje
        setSubmitError(error.response.data.message);
      } else if (error.message) {
        // Error de red o conexión
        setSubmitError(`Error de conexión: ${error.message}`);
      } else {
        // Error genérico
        setSubmitError('Error al crear la reserva. Por favor, inténtalo de nuevo.');
      }
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

  const getTimeSlotLabel = (slot: TimeSlot): string => {
    switch (slot) {
      case 'morning':
        return 'Mañana (11:00-14:30)';
      case 'afternoon':
        return 'Tarde (16:30-20:30)';
      case 'night':
        return 'Noche (22:00-02:00)';
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {submitError && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-lg">
          {submitError}
        </div>
      )}

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
            placeholder="624 645 517"
          />
          {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone.message}</p>}
        </div>

        <div>
          <label className="label">Tipo de evento *</label>
          <select {...register('eventType')} className="input-field">
            <option value="">Selecciona un tipo</option>
            <option value="cumpleaños">Cumpleaños</option>
            <option value="celebracion-familiar">Celebración familiar</option>
            <option value="eventos-amigos">Eventos con amigos</option>
            <option value="eventos-colegio-trabajo">Eventos de colegio o trabajo</option>
            <option value="taller">Taller</option>
            <option value="otros">Otros</option>
          </select>
          {errors.eventType && <p className="text-red-500 text-sm mt-1">{errors.eventType.message}</p>}
        </div>

        <div>
          <label className="label">Fecha del evento *</label>
          <input type="date" {...register('date')} className="input-field" />
          {errors.date && <p className="text-red-500 text-sm mt-1">{errors.date.message}</p>}
        </div>

        <div>
          <label className="label">Franja horaria *</label>
          <select {...register('timeSlot')} className="input-field">
            <option value="">Selecciona franja</option>
            <option value="morning">{getTimeSlotLabel('morning')}</option>
            <option value="afternoon">{getTimeSlotLabel('afternoon')}</option>
            <option value="night">{getTimeSlotLabel('night')}</option>
          </select>
          {errors.timeSlot && <p className="text-red-500 text-sm mt-1">{errors.timeSlot.message}</p>}
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
          <label className="label">Método de pago *</label>
          <select {...register('paymentMethod')} className="input-field">
            <option value="">Selecciona método</option>
            <option value="card">Tarjeta de crédito/débito</option>
            <option value="bizum">Bizum</option>
            <option value="cash">Efectivo (en el local)</option>
          </select>
          {errors.paymentMethod && (
            <p className="text-red-500 text-sm mt-1">{errors.paymentMethod.message}</p>
          )}
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
        <label className="label">Mensaje adicional (opcional)</label>
        <textarea
          {...register('message')}
          className="input-field resize-none"
          rows={4}
          placeholder="Cuéntanos cualquier detalle especial sobre tu evento..."
        />
      </div>

      {totalPrice > 0 && (
        <div className="p-6 bg-gradient-to-r from-primary-50 to-secondary-50 rounded-xl border-2 border-primary-300">
          <div className="flex justify-between items-center mb-4">
            <span className="text-gray-700 font-medium">Precio base del espacio:</span>
            <span className="text-3xl font-bold text-primary-600">{totalPrice}€</span>
          </div>
          <p className="text-sm text-gray-600">
            * Los servicios extras se calcularán en el presupuesto final<br />
            * Se requiere un depósito del 30% para confirmar la reserva
          </p>
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 mb-2">ℹ️ Proceso de reserva</h4>
        <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
          <li>Enviamos tu solicitud para revisión (24h)</li>
          <li>Te contactamos para confirmar detalles</li>
          <li>Recibes enlace de pago seguro</li>
          <li>Confirmas con depósito del 30%</li>
        </ol>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Enviando solicitud...
          </>
        ) : (
          'Solicitar Reserva'
        )}
      </button>
    </form>
  );
}
