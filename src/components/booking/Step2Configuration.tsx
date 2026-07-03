import { useState, useEffect } from 'react';
import { useBooking, Extra } from './BookingContext';
import PriceSummary from './PriceSummary';
import { isWeekend, isFriday, isHoliday, isHolidayEve, type TimeSlot } from '@/utils/pricing';
import { ChevronLeft, ChevronRight, Users, Package, Check, AlertCircle } from 'lucide-react';

export default function Step2Configuration() {
  const { state, dispatch, nextStep, prevStep, calculateExtrasPrice } = useBooking();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (state.services.length > 0) return;
    fetch('/api/services-catalog')
      .then(r => r.json())
      .then(data => {
        if (data.success && data.services) {
          const mapped: Extra[] = data.services.map((s: any) => ({
            id: String(s.id),
            name: s.title,
            priceType: 'fixed' as const,
            basePrice: parseFloat(s.price) || 0,
            description: s.description,
          }));
          dispatch({ type: 'SET_SERVICES', services: mapped });
        }
      })
      .catch((err) => console.warn('Failed to load services catalog:', err));
  }, []);

  // Calculate basePrice when arriving with a preselected date/slot (skipping step 1)
  useEffect(() => {
    if (!state.date || !state.timeSlot || state.basePrice !== 0) return;

    const fetchAndSetPrice = async () => {
      try {
        const res = await fetch('/api/pricing/current');
        if (!res.ok) return;
        const data = await res.json();
        if (!data.success) return;
        const pricing: Record<string, number> = data.pricing;

        const date = state.date!;
        const slot = state.timeSlot!;

        if (slot === 'night') {
          dispatch({ type: 'SET_BASE_PRICE', price: 'consult' });
          return;
        }

        let ruleKey: string;
        if (isHoliday(date)) {
          ruleKey = `holiday_${slot}`;
        } else if (isWeekend(date)) {
          ruleKey = `weekend_${slot}`;
        } else if ((isFriday(date) || isHolidayEve(date)) && slot === 'afternoon') {
          ruleKey = 'friday_afternoon';
        } else {
          ruleKey = `weekday_${slot}`;
        }

        dispatch({ type: 'SET_BASE_PRICE', price: pricing[ruleKey] || 110 });
      } catch {
        // fallback: leave price as-is
      }
    };

    fetchAndSetPrice();
  }, [state.date, state.timeSlot, state.basePrice, dispatch]);

  const handleGuestsChange = (value: number) => {
    const guests = Math.max(1, Math.min(50, value));
    dispatch({ type: 'SET_GUESTS', guests });
  };

  const handleExtraToggle = (extraId: string) => {
    dispatch({ type: 'TOGGLE_EXTRA', extraId });
  };

  const handleContinue = () => {
    if (state.guests < 1) {
      setError('Debe haber al menos 1 invitado');
      return;
    }
    if (state.guests > 50) {
      setError('El máximo de invitados es 50 personas');
      return;
    }
    setError(null);
    nextStep();
  };

  const getExtraPrice = (extra: Extra): string => {
    if (extra.priceType === 'per_person') {
      return `${extra.basePrice}€/persona`;
    }
    return `${extra.basePrice}€`;
  };

  const getExtraTotalPrice = (extra: Extra): number => {
    if (extra.priceType === 'per_person') {
      return extra.basePrice * state.guests;
    }
    return extra.basePrice;
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-4">
          <Package className="w-8 h-8 text-primary-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Configura tu evento</h2>
        <p className="text-gray-600">
          Indica el número de invitados y añade servicios adicionales
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Configuration */}
        <div className="lg:col-span-2 space-y-8">
          {/* Number of guests */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-primary-100 rounded-full p-2">
                <Users className="w-5 h-5 text-primary-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Número de invitados</h3>
            </div>

            <div className="flex items-center justify-center gap-4">
              <button
                onClick={() => handleGuestsChange(state.guests - 10)}
                className="w-12 h-12 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-xl font-bold text-gray-600 transition-colors"
              >
                -
              </button>
              <div className="flex-1 max-w-[200px]">
                <input
                  type="number"
                  value={state.guests}
                  onChange={(e) => handleGuestsChange(parseInt(e.target.value) || 0)}
                  min="1"
                  max="50"
                  className="w-full text-center text-4xl font-bold text-primary-600 border-2 border-gray-200 rounded-xl py-4 focus:border-primary-500 focus:outline-none"
                />
                <p className="text-center text-sm text-gray-500 mt-2">personas</p>
              </div>
              <button
                onClick={() => handleGuestsChange(state.guests + 10)}
                className="w-12 h-12 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-xl font-bold text-gray-600 transition-colors"
              >
                +
              </button>
            </div>

            <div className="mt-4 flex justify-center gap-2">
              {[10, 20, 30, 40, 50].map((num) => (
                <button
                  key={num}
                  onClick={() => handleGuestsChange(num)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    state.guests === num
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>

          </div>

          {/* Extras */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-primary-100 rounded-full p-2">
                <Package className="w-5 h-5 text-primary-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Servicios adicionales</h3>
              <span className="text-sm text-gray-500">(opcional)</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {state.services.map((extra) => {
                const isSelected = state.selectedExtras.includes(extra.id);
                const totalPrice = getExtraTotalPrice(extra);

                return (
                  <button
                    key={extra.id}
                    onClick={() => handleExtraToggle(extra.id)}
                    className={`relative p-4 rounded-xl border-2 text-left transition-all ${
                      isSelected
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    {/* Check icon */}
                    {isSelected && (
                      <div className="absolute top-2 right-2 bg-primary-600 rounded-full p-1">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    )}

                    <div className="pr-8">
                      <h4 className="font-semibold text-gray-900 mb-1">{extra.name}</h4>
                      {extra.description && (
                        <p className="text-sm text-gray-500 mb-2">{extra.description}</p>
                      )}
                      <div className="flex items-baseline gap-2">
                        <span className="text-lg font-bold text-primary-600">{totalPrice}€</span>
                        <span className="text-xs text-gray-400">
                          {getExtraPrice(extra)}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {state.selectedExtras.length > 0 && (
              <div className="mt-6 pt-4 border-t border-gray-200">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total servicios adicionales:</span>
                  <span className="text-xl font-bold text-primary-600">
                    {calculateExtrasPrice()}€
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Price Summary */}
        <div className="lg:col-span-1">
          <div className="sticky top-4">
            <PriceSummary showDeposit={false} />
          </div>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between">
        <button
          onClick={prevStep}
          className="btn-outline flex items-center gap-2"
        >
          <ChevronLeft className="w-5 h-5" />
          Volver
        </button>
        <button
          onClick={handleContinue}
          className="btn-primary flex items-center gap-2"
        >
          Continuar
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
