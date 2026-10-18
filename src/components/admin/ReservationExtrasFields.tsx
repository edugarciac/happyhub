import { useEffect, useState } from 'react';
import { EXTRA_HOUR_PRICE, MAX_EXTRA_HOURS, extraHoursPrice, slotEndTime } from '@/utils/pricing';

export interface ExtraOption {
  id: string;
  title: string;
  price: number;
}

export interface ExtrasValue {
  extraHours: number;
  extraIds: string[];
}

interface Props {
  timeSlot: string;
  value: ExtrasValue;
  /** Servicios ya guardados en la reserva: se muestran aunque ya no estén en el catálogo y con su precio contratado */
  stored?: ExtraOption[];
  /** `priceDelta`: lo que cambia el total con esta selección (para ajustar el precio) */
  onChange: (next: ExtrasValue, priceDelta: number) => void;
}

/** Horas adicionales (solo tarde) y servicios del catálogo, como en la reserva por calendario */
export default function ReservationExtrasFields({ timeSlot, value, stored = [], onChange }: Props) {
  const [catalog, setCatalog] = useState<ExtraOption[]>([]);

  useEffect(() => {
    fetch('/api/services-catalog')
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.services) {
          setCatalog(data.services.map((s: any) => ({ id: String(s.id), title: s.title, price: parseFloat(s.price) || 0 })));
        }
      })
      .catch((err) => console.warn('Failed to load services catalog:', err));
  }, []);

  const options = [...stored, ...catalog.filter((c) => !stored.some((s) => s.id === c.id))];
  const priceOf = (id: string) => options.find((o) => o.id === id)?.price || 0;

  const setHours = (hours: number) =>
    onChange({ ...value, extraHours: hours }, extraHoursPrice(hours) - extraHoursPrice(value.extraHours));

  const toggleExtra = (id: string) => {
    const selected = value.extraIds.includes(id);
    onChange(
      { ...value, extraIds: selected ? value.extraIds.filter((x) => x !== id) : [...value.extraIds, id] },
      selected ? -priceOf(id) : priceOf(id)
    );
  };

  return (
    <div className="space-y-4">
      {timeSlot === 'afternoon' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Horas adicionales</label>
          <p className="text-xs text-gray-500 mb-2">De 20:00 a 23:00h, {EXTRA_HOUR_PRICE} € por hora.</p>
          <div className="grid grid-cols-4 gap-2">
            {Array.from({ length: MAX_EXTRA_HOURS + 1 }, (_, hours) => (
              <button
                key={hours}
                type="button"
                onClick={() => setHours(hours)}
                className={`px-2 py-2 rounded-lg border text-sm transition-colors ${
                  value.extraHours === hours
                    ? 'border-primary-600 bg-primary-50 text-primary-700 font-semibold'
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {hours === 0 ? 'Sin horas' : `+${hours}h`}
                <span className="block text-xs font-normal text-gray-500">
                  {hours === 0 ? 'hasta 20:00' : `hasta ${slotEndTime('afternoon', hours)} · ${extraHoursPrice(hours)} €`}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {options.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Servicios adicionales</label>
          <div className="space-y-2">
            {options.map((o) => (
              <label key={o.id} className="flex items-center justify-between gap-2 text-sm text-gray-700 cursor-pointer">
                <span className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={value.extraIds.includes(o.id)}
                    onChange={() => toggleExtra(o.id)}
                    className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  {o.title}
                </span>
                <span className="text-gray-500 whitespace-nowrap">{o.price} €</span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
