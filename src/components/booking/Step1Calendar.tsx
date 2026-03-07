import { useState, useEffect } from 'react';
import { useBooking, SelectedSlot } from './BookingContext';
import FullCalendar from '@/components/FullCalendar';
import { isWeekend, isFriday, isHoliday, isHolidayEve, TIME_SLOTS, type TimeSlot } from '@/utils/pricing';
import { formatDate } from '@/utils/formatters';
import { ChevronRight, Calendar, Clock, AlertCircle, X } from 'lucide-react';

interface BookedSlot {
  date: Date;
  timeSlot: TimeSlot;
}

export default function Step1Calendar() {
  const { state, dispatch, nextStep } = useBooking();
  const [bookedSlots, setBookedSlots] = useState<BookedSlot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pricingLoading, setPricingLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pricing, setPricing] = useState<Record<string, number>>({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const pricingRes = await fetch('/api/pricing/current');
        if (pricingRes.ok) {
          const pricingData = await pricingRes.json();
          if (pricingData.success) {
            setPricing(pricingData.pricing);
            setPricingLoading(false);
          }
        } else {
          setPricingLoading(false);
        }

        const slotsRes = await fetch('/api/booked-slots');
        if (slotsRes.ok) {
          const data = await slotsRes.json();
          const slots = (data.bookedSlots || []).map((slot: any) => ({
            date: new Date(slot.date),
            timeSlot: slot.timeSlot,
          }));
          setBookedSlots(slots);
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setPricingLoading(false);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const calculatePriceFromDb = (date: Date, slot: TimeSlot): number | 'consult' => {
    if (slot === 'night') return 'consult';

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

  const handleSlotSelect = (date: Date, timeSlot: TimeSlot) => {
    setError(null);

    if (pricingLoading) {
      setError('Cargando precios, espera un momento...');
      return;
    }

    const price = calculatePriceFromDb(date, timeSlot);
    const slot: SelectedSlot = { date, timeSlot, price };
    dispatch({ type: 'TOGGLE_SLOT', slot });
  };

  const handleRemoveSlot = (slot: SelectedSlot) => {
    dispatch({ type: 'TOGGLE_SLOT', slot });
  };

  const handleContinue = () => {
    if (state.selectedSlots.length === 0) {
      setError('Por favor, selecciona al menos una franja horaria');
      return;
    }

    setError(null);
    nextStep();
  };

  const getTimeSlotLabel = (slot: TimeSlot): string => {
    const info = TIME_SLOTS.find(ts => ts.id === slot);
    return info ? `${info.label} (${info.startTime} - ${info.endTime})` : slot;
  };

  const formatSlotPrice = (price: number | 'consult'): string => {
    return price === 'consult' ? 'A consultar' : `${price}€`;
  };

  const hasConsult = state.selectedSlots.some((s: SelectedSlot) => s.price === 'consult');
  const totalDisplay = hasConsult
    ? 'A consultar'
    : state.basePrice === 0
    ? null
    : `${state.basePrice}€`;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-4">
          <Calendar className="w-8 h-8 text-primary-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Elige fecha y hora</h2>
        <p className="text-gray-600">
          Selecciona una o más franjas horarias para tu evento
        </p>
        {pricingLoading && (
          <p className="text-sm text-yellow-600 mt-2">Cargando precios...</p>
        )}
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
          <FullCalendar
            onSlotSelect={handleSlotSelect}
            bookedSlots={bookedSlots}
            selectedSlots={state.selectedSlots}
          />
        </div>
      )}

      {/* Selected slots summary */}
      {state.selectedSlots.length > 0 && (
        <div className="bg-gradient-to-r from-primary-50 to-secondary-50 rounded-xl p-6 border-2 border-primary-300">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-white rounded-full p-2 shadow">
              <Clock className="w-5 h-5 text-primary-600" />
            </div>
            <h3 className="font-bold text-gray-900 text-lg">
              {state.selectedSlots.length === 1 ? 'Franja seleccionada' : `${state.selectedSlots.length} franjas seleccionadas`}
            </h3>
          </div>

          <div className="space-y-2 mb-4">
            {state.selectedSlots.map((slot: SelectedSlot, i: number) => (
              <div
                key={i}
                className="flex items-center justify-between bg-white rounded-lg px-4 py-3 shadow-sm"
              >
                <div>
                  <p className="font-semibold text-gray-900 text-sm">
                    {formatDate(slot.date, 'EEEE, d MMMM yyyy')}
                  </p>
                  <p className="text-gray-500 text-xs">{getTimeSlotLabel(slot.timeSlot)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`font-bold text-sm ${slot.price === 'consult' ? 'text-orange-600' : 'text-primary-600'}`}>
                    {formatSlotPrice(slot.price)}
                  </span>
                  <button
                    onClick={() => handleRemoveSlot(slot)}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                    title="Eliminar esta franja"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Total */}
          <div className="flex items-center justify-between pt-3 border-t border-primary-200">
            <span className="text-sm text-gray-600">Precio base total</span>
            <span className={`text-2xl font-bold ${hasConsult ? 'text-orange-600' : 'text-primary-600'}`}>
              {totalDisplay}
            </span>
          </div>

          {hasConsult && (
            <p className="text-xs text-orange-600 mt-2">
              Una de las franjas seleccionadas (nocturna) requiere consulta previa. El equipo se pondrá en contacto contigo para confirmar el precio.
            </p>
          )}
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
          disabled={state.selectedSlots.length === 0}
          className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continuar
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
