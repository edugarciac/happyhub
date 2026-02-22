import { useState, useEffect } from 'react';
import { useBooking } from './BookingContext';
import FullCalendar from '@/components/FullCalendar';
import { calculateBasePrice, TIME_SLOTS, type TimeSlot } from '@/utils/pricing';
import { formatDate } from '@/utils/formatters';
import { ChevronRight, Calendar, Clock, AlertCircle } from 'lucide-react';

interface BookedSlot {
  date: Date;
  timeSlot: TimeSlot;
}

export default function Step1Calendar() {
  const { state, dispatch, nextStep } = useBooking();
  const [bookedSlots, setBookedSlots] = useState<BookedSlot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBookedSlots = async () => {
      try {
        const response = await fetch('/api/google-calendar-slots');
        if (response.ok) {
          const data = await response.json();
          const slots = (data.bookedSlots || []).map((slot: any) => ({
            date: new Date(slot.date),
            timeSlot: slot.timeSlot,
          }));
          setBookedSlots(slots);
        }
      } catch (err) {
        console.error('Error fetching booked slots:', err);
        // Don't block user if calendar fetch fails
      } finally {
        setIsLoading(false);
      }
    };

    fetchBookedSlots();
  }, []);

  const handleSlotSelect = (date: Date, timeSlot: TimeSlot) => {
    dispatch({ type: 'SET_DATE', date });
    dispatch({ type: 'SET_TIME_SLOT', timeSlot });
    const price = calculateBasePrice(date, timeSlot);
    dispatch({ type: 'SET_BASE_PRICE', price });
  };

  const handleContinue = () => {
    if (!state.date || !state.timeSlot) {
      setError('Por favor, selecciona una fecha y franja horaria');
      return;
    }
    if (state.basePrice === 'consult') {
      setError('El horario nocturno requiere consulta previa. Por favor, contacta con nosotros.');
      return;
    }
    setError(null);
    nextStep();
  };

  const getTimeSlotLabel = (slot: TimeSlot): string => {
    const info = TIME_SLOTS.find(ts => ts.id === slot);
    return info ? `${info.label} (${info.startTime} - ${info.endTime})` : slot;
  };

  const getTimeSlotPrice = (date: Date, slot: TimeSlot): string => {
    const price = calculateBasePrice(date, slot);
    return price === 'consult' ? 'A consultar' : `${price}€`;
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-4">
          <Calendar className="w-8 h-8 text-primary-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Elige fecha y hora</h2>
        <p className="text-gray-600">
          Selecciona el día y la franja horaria para tu evento
        </p>
      </div>

      {/* Calendar */}
      {isLoading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando disponibilidad...</p>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-lg p-4 md:p-6">
          <FullCalendar onSlotSelect={handleSlotSelect} bookedSlots={bookedSlots} />
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-500 rounded"></div>
          <span>Disponible</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-500 rounded"></div>
          <span>Reservado</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-primary-600 rounded"></div>
          <span>Seleccionado</span>
        </div>
      </div>

      {/* Selection Summary */}
      {state.date && state.timeSlot && (
        <div className="bg-gradient-to-r from-primary-50 to-secondary-50 rounded-xl p-6 border-2 border-primary-300">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="bg-white rounded-full p-3 shadow">
                <Clock className="w-6 h-6 text-primary-600" />
              </div>
              <div>
                <p className="font-bold text-gray-900 text-lg">
                  {formatDate(state.date, 'EEEE, d MMMM yyyy')}
                </p>
                <p className="text-gray-600">
                  {getTimeSlotLabel(state.timeSlot)}
                </p>
              </div>
            </div>
            <div className="text-center md:text-right">
              <p className="text-sm text-gray-500">Precio base</p>
              <p className="text-3xl font-bold text-primary-600">
                {getTimeSlotPrice(state.date, state.timeSlot)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {/* Continue button */}
      <div className="flex justify-end">
        <button
          onClick={handleContinue}
          disabled={!state.date || !state.timeSlot}
          className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continuar
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 mb-2">Franjas horarias</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-blue-800">
          <div>
            <p className="font-medium">Mañana</p>
            <p>11:00 - 14:30h</p>
            <p className="text-blue-600 text-xs">Apertura 10:00h sin coste</p>
          </div>
          <div>
            <p className="font-medium">Tarde</p>
            <p>16:30 - 20:30h</p>
            <p className="text-blue-600 text-xs">Apertura 15:30h sin coste</p>
          </div>
          <div>
            <p className="font-medium">Noche</p>
            <p>22:00 - 02:00h</p>
            <p className="text-blue-600 text-xs">Precio a consultar</p>
          </div>
        </div>
      </div>
    </div>
  );
}
