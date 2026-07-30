import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Check, Info } from 'lucide-react';

interface PriceRow {
  day: string;
  morning: number | 'consult';
  afternoon: number | 'consult';
  night: 'consult';
  highlight?: boolean;
}

const INCLUDED = [
  'Uso exclusivo del espacio',
  'Mobiliario básico (mesas y sillas)',
  'Sistema de sonido',
  'Microondas y nevera',
  'Limpieza final',
  'Apertura anticipada sin coste extra',
];

export default function PricingTable() {
  const [pricing, setPricing] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
      } finally {
        setLoading(false);
      }
    };

    fetchPricing();
  }, []);

  const pricingRows: PriceRow[] = [
    {
      day: 'Lunes a Jueves',
      morning: pricing.weekday_morning ?? 110,
      afternoon: pricing.weekday_afternoon ?? 110,
      night: 'consult'
    },
    {
      day: 'Viernes',
      morning: pricing.weekday_morning ?? 110,
      afternoon: pricing.friday_afternoon ?? 155,
      night: 'consult',
      highlight: true
    },
    {
      day: 'Sábados y Domingos',
      morning: pricing.weekend_morning ?? 145,
      afternoon: pricing.weekend_afternoon ?? 185,
      night: 'consult',
      highlight: true
    },
    {
      day: 'Festivos',
      morning: pricing.holiday_morning ?? 145,
      afternoon: pricing.holiday_afternoon ?? 185,
      night: 'consult',
      highlight: true
    },
  ];

  const formatPrice = (price: number | 'consult') => {
    if (price === 'consult' || price === 0) return 'Consultar';
    return `${price}€`;
  };

  return (
    <section className="py-16 bg-gradient-to-br from-primary-50 to-secondary-50">
      <div className="container-custom">
        <h2 className="text-3xl font-bold text-gray-900 text-center mb-4">Tarifas</h2>
        <p className="text-gray-600 text-center mb-12 max-w-2xl mx-auto">
          Precios transparentes según día y franja horaria. Sin sorpresas ni costes ocultos.
        </p>

        <div className="max-w-5xl mx-auto">
          {/* Pricing Table */}
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-8">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-primary-600 text-white">
                  <tr>
                    <th className="px-6 py-4 text-left font-semibold">Día</th>
                    <th className="px-6 py-4 text-center font-semibold">
                      <div>Mañana</div>
                      <div className="text-xs font-normal opacity-80">11:00 - 14:30</div>
                    </th>
                    <th className="px-6 py-4 text-center font-semibold">
                      <div>Tarde</div>
                      <div className="text-xs font-normal opacity-80">16:30 - 20:30</div>
                    </th>
                    <th className="px-6 py-4 text-center font-semibold">
                      <div>Noche</div>
                      <div className="text-xs font-normal opacity-80">22:00 - 02:00</div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {pricingRows.map((row, index) => (
                    <tr
                      key={index}
                      className={row.highlight ? 'bg-primary-50' : 'bg-white'}
                    >
                      <td className="px-6 py-4">
                        <span className={`font-medium ${row.highlight ? 'text-primary-700' : 'text-gray-900'}`}>
                          {row.day}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-2xl font-bold text-gray-900">
                          {formatPrice(row.morning)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-2xl font-bold text-gray-900">
                          {formatPrice(row.afternoon)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-lg text-gray-500">
                          {formatPrice(row.night)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-start gap-2 text-sm text-gray-600">
              <Info className="w-4 h-4 text-primary-500 flex-shrink-0 mt-0.5" />
              <span>¿Necesitas más tiempo? Puedes ampliar tu franja horaria según disponibilidad — consúltanos para conocer la tarifa adicional.</span>
            </div>
          </div>

          {/* What's included */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Check className="w-5 h-5 text-green-500" />
                ¿Qué incluye el precio?
              </h3>
              <ul className="space-y-3">
                {INCLUDED.map((item, index) => (
                  <li key={index} className="flex items-center gap-3 text-gray-700">
                    <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Info className="w-5 h-5 text-primary-500" />
                Información importante
              </h3>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start gap-3">
                  <span className="text-primary-500 font-bold">•</span>
                  <span><strong>Depósito 30%</strong> para confirmar reserva</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-primary-500 font-bold">•</span>
                  <span>Resto el día del evento</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-primary-500 font-bold">•</span>
                  <span><strong>Cancelación gratuita</strong> hasta 15 días antes</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-primary-500 font-bold">•</span>
                  <span>Servicios extras disponibles (catering, animación...)</span>
                </li>
              </ul>
            </div>
          </div>

          {/* CTA */}
          <div className="text-center">
            <Link
              href="/reservas"
              className="btn-primary text-lg px-8 py-4 inline-flex items-center gap-2"
            >
              Reserva tu fecha
            </Link>
            <p className="text-sm text-gray-500 mt-4">
              Precios vigentes desde enero 2025
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
