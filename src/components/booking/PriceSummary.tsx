import { useBooking, EXTRAS, SelectedSlot } from './BookingContext';
import { formatDate } from '@/utils/formatters';
import { TIME_SLOTS } from '@/utils/pricing';

interface PriceSummaryProps {
  showDeposit?: boolean;
  compact?: boolean;
}

export default function PriceSummary({ showDeposit = true, compact = false }: PriceSummaryProps) {
  const { state, calculateTotalPrice, calculateExtrasPrice, calculateDepositAmount } = useBooking();

  const totalPrice = calculateTotalPrice();
  const extrasPrice = calculateExtrasPrice();
  const depositAmount = calculateDepositAmount();

  const getSlotLabel = (timeSlot: string): string => {
    const info = TIME_SLOTS.find(ts => ts.id === timeSlot);
    return info ? `${info.label} (${info.startTime}-${info.endTime})` : timeSlot;
  };

  if (compact) {
    return (
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Total:</span>
          <span className="text-2xl font-bold text-primary-600">
            {totalPrice === 'consult' ? 'A consultar' : `${totalPrice}€`}
          </span>
        </div>
        {showDeposit && totalPrice !== 'consult' && (
          <div className="flex justify-between items-center mt-2 text-sm">
            <span className="text-gray-500">Señal (30%):</span>
            <span className="font-semibold text-gray-700">{depositAmount}€</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-primary-50 to-secondary-50 rounded-xl p-6 border-2 border-primary-200">
      <h3 className="text-lg font-bold text-gray-900 mb-4">Resumen de tu reserva</h3>

      {/* Selected slots */}
      {state.selectedSlots.length > 0 && (
        <div className="mb-4 pb-4 border-b border-primary-200">
          <p className="text-sm font-medium text-gray-700 mb-2">
            {state.selectedSlots.length === 1 ? 'Franja horaria' : 'Franjas horarias'}
          </p>
          <div className="space-y-2">
            {state.selectedSlots.map((slot: SelectedSlot, i: number) => (
              <div key={i} className="flex justify-between items-start text-sm">
                <div>
                  <p className="font-medium text-gray-900">
                    {formatDate(slot.date, 'EEE, d MMM yyyy')}
                  </p>
                  <p className="text-xs text-gray-500">{getSlotLabel(slot.timeSlot)}</p>
                </div>
                <span className={`font-semibold ml-2 ${slot.price === 'consult' ? 'text-orange-600' : 'text-gray-700'}`}>
                  {slot.price === 'consult' ? 'A consultar' : `${slot.price}€`}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Guests */}
      {state.guests > 0 && (
        <div className="flex justify-between items-center mb-2">
          <span className="text-gray-600">Invitados:</span>
          <span className="font-medium">{state.guests} personas</span>
        </div>
      )}

      {/* Base price (total of all slots) */}
      {state.selectedSlots.length > 1 && state.basePrice !== 0 && (
        <div className="flex justify-between items-center mb-2">
          <span className="text-gray-600">Alquiler espacio:</span>
          <span className="font-medium">
            {state.basePrice === 'consult' ? 'A consultar' : `${state.basePrice}€`}
          </span>
        </div>
      )}
      {state.selectedSlots.length === 1 && state.basePrice !== 0 && (
        <div className="flex justify-between items-center mb-2">
          <span className="text-gray-600">Alquiler espacio:</span>
          <span className="font-medium">
            {state.basePrice === 'consult' ? 'A consultar' : `${state.basePrice}€`}
          </span>
        </div>
      )}

      {/* Extras */}
      {state.selectedExtras.length > 0 && (
        <div className="mt-3 pt-3 border-t border-primary-200">
          <p className="text-sm font-medium text-gray-700 mb-2">Servicios adicionales:</p>
          {state.selectedExtras.map(extraId => {
            const extra = EXTRAS.find(e => e.id === extraId);
            if (!extra) return null;
            const price = extra.priceType === 'per_person'
              ? extra.basePrice * state.guests
              : extra.basePrice;
            return (
              <div key={extraId} className="flex justify-between items-center text-sm mb-1">
                <span className="text-gray-600">
                  {extra.name}
                  {extra.priceType === 'per_person' && (
                    <span className="text-gray-400"> ({extra.basePrice}€ x {state.guests})</span>
                  )}
                </span>
                <span className="font-medium">{price}€</span>
              </div>
            );
          })}
          <div className="flex justify-between items-center mt-2 pt-2 border-t border-primary-100">
            <span className="text-gray-600">Subtotal extras:</span>
            <span className="font-medium">{extrasPrice}€</span>
          </div>
        </div>
      )}

      {/* Total */}
      <div className="mt-4 pt-4 border-t-2 border-primary-300">
        <div className="flex justify-between items-center">
          <span className="text-lg font-bold text-gray-900">Total:</span>
          <span className={`text-3xl font-bold ${totalPrice === 'consult' ? 'text-orange-600' : 'text-primary-600'}`}>
            {totalPrice === 'consult' ? 'A consultar' : `${totalPrice}€`}
          </span>
        </div>
      </div>

      {/* Deposit */}
      {showDeposit && totalPrice !== 'consult' && (
        <div className="mt-4 bg-white/50 rounded-lg p-4">
          <div className="flex justify-between items-center">
            <div>
              <p className="font-semibold text-gray-900">Señal a pagar ahora (30%)</p>
              <p className="text-xs text-gray-500">Resto: {totalPrice - depositAmount}€ el día del evento</p>
            </div>
            <span className="text-2xl font-bold text-green-600">{depositAmount}€</span>
          </div>
        </div>
      )}

      {/* Consult notice */}
      {totalPrice === 'consult' && (
        <div className="mt-4 bg-orange-50 rounded-lg p-3 text-sm text-orange-700">
          El precio incluye una franja nocturna que requiere consulta previa. Nos pondremos en contacto contigo.
        </div>
      )}
    </div>
  );
}
