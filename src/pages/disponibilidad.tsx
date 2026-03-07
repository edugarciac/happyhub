export async function getServerSideProps() {
  return { redirect: { destination: '/reservas', permanent: true } };
}

import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import FullCalendar from '@/components/FullCalendar';
import { formatDate } from '@/utils/formatters';
import { isWeekend, isFriday, isHoliday, isHolidayEve, type TimeSlot } from '@/utils/pricing';

interface SelectedSlot {
  date: Date;
  timeSlot: TimeSlot;
  price: number | 'consult';
}

export default function Disponibilidad() {
  const [selectedSlots, setSelectedSlots] = useState<SelectedSlot[]>([]);
  const [bookedSlots, setBookedSlots] = useState<{ date: Date; timeSlot: TimeSlot }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pricing, setPricing] = useState<Record<string, number>>({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const pricingRes = await fetch('/api/pricing/current');
        if (pricingRes.ok) {
          const pricingData = await pricingRes.json();
          if (pricingData.success) {
            setPricing(pricingData.pricing);
          }
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
      } catch (error) {
        console.error('Error fetching data:', error);
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
    const price = calculatePriceFromDb(date, timeSlot);
    const exists = selectedSlots.some(
      (s: SelectedSlot) =>
        s.date.getFullYear() === date.getFullYear() &&
        s.date.getMonth() === date.getMonth() &&
        s.date.getDate() === date.getDate() &&
        s.timeSlot === timeSlot
    );

    if (exists) {
      setSelectedSlots((prev: SelectedSlot[]) =>
        prev.filter(
          (s: SelectedSlot) =>
            !(
              s.date.getFullYear() === date.getFullYear() &&
              s.date.getMonth() === date.getMonth() &&
              s.date.getDate() === date.getDate() &&
              s.timeSlot === timeSlot
            )
        )
      );
    } else {
      setSelectedSlots((prev: SelectedSlot[]) => [...prev, { date, timeSlot, price }]);
    }
  };

  const handleReserve = () => {
    if (selectedSlots.length === 0) return;
    // Pass the first slot via URL for backward compat; wizard will start at step 1
    const first = selectedSlots[0];
    const dateStr = first.date.toISOString().split('T')[0];
    window.location.href = `/reservas?date=${dateStr}&timeSlot=${first.timeSlot}`;
  };

  const getTimeSlotLabel = (slot: TimeSlot): string => {
    switch (slot) {
      case 'morning': return 'Mañana (11:00-14:30)';
      case 'afternoon': return 'Tarde (16:30-20:30)';
      case 'night': return 'Noche (22:00-02:00)';
    }
  };

  const hasConsult = selectedSlots.some((s: SelectedSlot) => s.price === 'consult');
  const totalPrice = hasConsult
    ? 'A consultar'
    : selectedSlots.reduce((sum: number, s: SelectedSlot) => sum + (s.price as number), 0);

  return (
    <>
      <Head>
        <title>Disponibilidad - HappyHub</title>
        <meta name="description" content="Consulta las fechas disponibles para tu evento en HappyHub" />
      </Head>

      <section className="pt-24 pb-8 bg-white min-h-screen">
        <div className="container-custom max-w-[1600px]">
          <div className="mb-6 text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Elige Fecha y Hora</h1>
            <p className="text-sm text-gray-500">
              Puedes seleccionar varias franjas | Verde = Disponible | Rojo = Reservado | M = Mañana | T = Tarde | N = Noche
            </p>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Cargando disponibilidad...</p>
              </div>
            </div>
          ) : (
            <FullCalendar
              onSlotSelect={handleSlotSelect}
              bookedSlots={bookedSlots}
              selectedSlots={selectedSlots}
            />
          )}

          {/* Selection summary */}
          {selectedSlots.length > 0 && (
            <div className="mt-8 max-w-3xl mx-auto">
              <div className="card bg-gradient-to-r from-primary-50 to-secondary-50 border-2 border-primary-300">
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  {selectedSlots.length === 1 ? 'Franja seleccionada' : `${selectedSlots.length} franjas seleccionadas`}
                </h3>

                <div className="space-y-2 mb-4">
                  {selectedSlots.map((slot, i) => (
                    <div key={i} className="flex justify-between items-center bg-white rounded-lg px-4 py-2 shadow-sm">
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">
                          {formatDate(slot.date, 'EEEE, d MMMM yyyy')}
                        </p>
                        <p className="text-gray-500 text-xs">{getTimeSlotLabel(slot.timeSlot)}</p>
                      </div>
                      <span className={`font-bold text-sm ${slot.price === 'consult' ? 'text-orange-600' : 'text-primary-600'}`}>
                        {slot.price === 'consult' ? 'A consultar' : `${slot.price}€`}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-3 border-t border-primary-200">
                  <div>
                    <div className="text-sm text-gray-600">Precio base total</div>
                    <div className={`text-4xl font-bold ${hasConsult ? 'text-orange-600' : 'text-primary-600'}`}>
                      {typeof totalPrice === 'number' ? `${totalPrice}€` : totalPrice}
                    </div>
                  </div>
                  {!hasConsult ? (
                    <button onClick={handleReserve} className="btn-primary whitespace-nowrap px-8">
                      Solicitar Reserva
                    </button>
                  ) : (
                    <Link href="/contacto" className="btn-secondary whitespace-nowrap px-8">
                      Consultar disponibilidad
                    </Link>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="py-16 bg-gray-50">
        <div className="container-custom">
          <div className="bg-white rounded-2xl p-8 shadow-lg">
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Información importante</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="border-l-4 border-primary-500 pl-4">
                <h3 className="font-bold text-gray-900 mb-3 text-lg">⏰ Franjas Horarias</h3>
                <div className="space-y-2 text-gray-600">
                  <p><strong>Mañanas:</strong> 11:00 - 14:30h</p>
                  <p className="text-sm">Apertura anticipada desde las 10:00h sin coste</p>
                  <p><strong>Tardes:</strong> 16:30 - 20:30h</p>
                  <p className="text-sm">Apertura anticipada desde las 15:30h sin coste</p>
                  <p><strong>Noches:</strong> 22:00 - 02:00h</p>
                  <p className="text-sm">Apertura anticipada desde las 21:30h sin coste</p>
                </div>
              </div>

              <div className="border-l-4 border-secondary-500 pl-4">
                <h3 className="font-bold text-gray-900 mb-3 text-lg">💰 Tarifas</h3>
                <div className="space-y-2 text-gray-600 text-sm">
                  <p><strong>Lunes a Viernes - Mañanas:</strong> {pricing.weekday_morning || 110}€</p>
                  <p><strong>Lunes a Jueves - Tardes:</strong> {pricing.weekday_afternoon || 110}€</p>
                  <p><strong>Viernes - Tardes:</strong> {pricing.friday_afternoon || 155}€</p>
                  <p><strong>Fines de semana - Mañanas:</strong> {pricing.weekend_morning || 145}€</p>
                  <p><strong>Fines de semana - Tardes:</strong> {pricing.weekend_afternoon || 185}€</p>
                  <p><strong>Nocturno:</strong> A consultar</p>
                </div>
              </div>

              <div className="border-l-4 border-primary-500 pl-4">
                <h3 className="font-bold text-gray-900 mb-3 text-lg">💳 Forma de Pago</h3>
                <p className="text-gray-600 mb-2">
                  Una vez aprobada tu solicitud, te enviaremos un enlace de pago seguro.
                </p>
                <p className="text-gray-600">
                  Se requiere un <strong>depósito del 30%</strong> para confirmar la reserva.
                </p>
                <p className="text-gray-600 mt-2">El resto se abona el día del evento.</p>
              </div>

              <div className="border-l-4 border-secondary-500 pl-4">
                <h3 className="font-bold text-gray-900 mb-3 text-lg">🔄 Cancelaciones</h3>
                <p className="text-gray-600 mb-2">
                  Cancelación <strong>gratuita hasta 15 días</strong> antes del evento.
                </p>
                <p className="text-gray-600">Consulta nuestra política completa de cancelaciones.</p>
              </div>

              <div className="border-l-4 border-primary-500 pl-4">
                <h3 className="font-bold text-gray-900 mb-3 text-lg">👥 Capacidad</h3>
                <p className="text-gray-600">
                  Nuestro espacio tiene capacidad para hasta <strong>150 personas</strong> cómodamente.
                </p>
              </div>

              <div className="border-l-4 border-secondary-500 pl-4">
                <h3 className="font-bold text-gray-900 mb-3 text-lg">🎉 Servicios Extras</h3>
                <p className="text-gray-600 mb-2">
                  Los precios mostrados son <strong>solo del alquiler del espacio</strong>.
                </p>
                <p className="text-gray-600">
                  Podrás añadir catering, decoración, animación y más servicios en el siguiente paso.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="container-custom text-center">
          <h2 className="section-title mb-4">¿Tienes dudas?</h2>
          <p className="text-xl text-gray-600 mb-8">
            Nuestro equipo está disponible para ayudarte con cualquier pregunta
          </p>
          <Link href="/contacto" className="btn-secondary">
            Contacta con nosotros
          </Link>
        </div>
      </section>
    </>
  );
}
