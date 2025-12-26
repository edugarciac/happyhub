import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import FullCalendar from '@/components/FullCalendar';
import { formatDate } from '@/utils/formatters';
import { calculateBasePrice, type TimeSlot } from '@/utils/pricing';

export default function Disponibilidad() {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot | null>(null);
  const [bookedSlots, setBookedSlots] = useState<{ date: Date; timeSlot: TimeSlot }[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch booked slots from Airtable via API
  useEffect(() => {
    const fetchBookedSlots = async () => {
      try {
        const response = await fetch('/api/booked-slots');
        if (response.ok) {
          const data = await response.json();
          // Parse ISO string dates to Date objects
          const slots = (data.bookedSlots || []).map((slot: any) => ({
            date: new Date(slot.date),
            timeSlot: slot.timeSlot,
          }));
          setBookedSlots(slots);
        }
      } catch (error) {
        console.error('Error fetching booked slots:', error);
        // If API fails, show all as available (better UX than blocking everything)
      } finally {
        setIsLoading(false);
      }
    };

    fetchBookedSlots();
  }, []);

  const handleSlotSelect = (date: Date, timeSlot: TimeSlot) => {
    setSelectedDate(date);
    setSelectedTimeSlot(timeSlot);
  };

  const handleReserve = () => {
    if (selectedDate && selectedTimeSlot) {
      const dateStr = selectedDate.toISOString().split('T')[0];
      window.location.href = `/reservas?date=${dateStr}&timeSlot=${selectedTimeSlot}`;
    }
  };

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

  const getTimeSlotPrice = (date: Date, slot: TimeSlot): string => {
    const price = calculateBasePrice(date, slot);
    return price === 'consult' ? 'A consultar' : `${price}€`;
  };

  return (
    <>
      <Head>
        <title>Disponibilidad - HappyHub</title>
        <meta name="description" content="Consulta las fechas disponibles para tu evento en HappyHub" />
      </Head>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-50 to-secondary-50 pt-32 pb-8">
        <div className="container-custom text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Consulta Disponibilidad
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-2">
            Selecciona la fecha y franja horaria perfecta para tu celebración
          </p>
          <p className="text-sm text-gray-500">
            Verde = Disponible | Rojo = Reservado | M = Mañana | T = Tarde | N = Noche
          </p>
        </div>
      </section>

      {/* Full screen calendar */}
      <section className="py-8 bg-white min-h-screen">
        <div className="container-custom max-w-[1600px]">
          {isLoading ? (
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Cargando disponibilidad...</p>
              </div>
            </div>
          ) : (
            <FullCalendar onSlotSelect={handleSlotSelect} bookedSlots={bookedSlots} />
          )}

          {/* Selection summary */}
          {selectedDate && selectedTimeSlot && (
            <div className="mt-8 max-w-3xl mx-auto">
              <div className="card bg-gradient-to-r from-primary-50 to-secondary-50 border-2 border-primary-300">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="flex-1 text-center md:text-left">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                      Selección actual
                    </h3>
                    <p className="text-lg text-gray-700">
                      <span className="font-semibold">
                        {formatDate(selectedDate, 'EEEE, d MMMM yyyy')}
                      </span>
                    </p>
                    <p className="text-md text-gray-600 mt-1">
                      {getTimeSlotLabel(selectedTimeSlot)}
                    </p>
                  </div>
                  <div className="flex flex-col items-center gap-3">
                    <div className="text-center">
                      <div className="text-sm text-gray-600 mb-1">Precio base</div>
                      <div className="text-4xl font-bold text-primary-600">
                        {getTimeSlotPrice(selectedDate, selectedTimeSlot)}
                      </div>
                    </div>
                    {calculateBasePrice(selectedDate, selectedTimeSlot) !== 'consult' ? (
                      <button
                        onClick={handleReserve}
                        className="btn-primary whitespace-nowrap px-8"
                      >
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
                  <p><strong>Lunes a Viernes - Mañanas:</strong> 110€</p>
                  <p><strong>Lunes a Jueves - Tardes:</strong> 110€</p>
                  <p><strong>Viernes - Tardes:</strong> 140€</p>
                  <p><strong>Fines de semana - Mañanas:</strong> 130€</p>
                  <p><strong>Fines de semana - Tardes:</strong> 170€</p>
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
                <p className="text-gray-600 mt-2">
                  El resto se abona el día del evento.
                </p>
              </div>

              <div className="border-l-4 border-secondary-500 pl-4">
                <h3 className="font-bold text-gray-900 mb-3 text-lg">🔄 Cancelaciones</h3>
                <p className="text-gray-600 mb-2">
                  Cancelación <strong>gratuita hasta 15 días</strong> antes del evento.
                </p>
                <p className="text-gray-600">
                  Consulta nuestra política completa de cancelaciones.
                </p>
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
