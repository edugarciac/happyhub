import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Calendar from '@/components/Calendar';
import { formatDate } from '@/utils/formatters';
import { getAvailableTimeSlotsWithPricing, type TimeSlot } from '@/utils/pricing';

export default function Disponibilidad() {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot | null>(null);

  const bookedDates = [
    new Date(2025, 11, 15),
    new Date(2025, 11, 22),
    new Date(2025, 11, 25),
    new Date(2026, 0, 1),
  ];

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setSelectedTimeSlot(null); // Reset time slot when date changes
  };

  const handleReserve = () => {
    if (selectedDate && selectedTimeSlot) {
      const dateStr = selectedDate.toISOString().split('T')[0];
      window.location.href = `/reservas?date=${dateStr}&timeSlot=${selectedTimeSlot}`;
    }
  };

  // Get available time slots with pricing for selected date
  const availableTimeSlots = selectedDate ? getAvailableTimeSlotsWithPricing(selectedDate) : [];

  return (
    <>
      <Head>
        <title>Disponibilidad - HappyHub</title>
        <meta name="description" content="Consulta las fechas disponibles para tu evento en HappyHub" />
      </Head>

      <section className="bg-gradient-to-br from-primary-50 to-secondary-50 py-16">
        <div className="container-custom text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Consulta Disponibilidad
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Selecciona la fecha perfecta para tu celebración. Las fechas en gris no están disponibles.
          </p>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="container-custom max-w-7xl">
          {/* Calendario grande - ocupa todo el ancho inicialmente */}
          <div className="card mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">Selecciona una fecha</h2>
            <div className="flex justify-center">
              <div className="w-full max-w-4xl scale-110 md:scale-125 py-8">
                <Calendar
                  onDateSelect={handleDateSelect}
                  bookedDates={bookedDates}
                  minDate={new Date()}
                />
              </div>
            </div>
          </div>

          {/* Horarios y resumen - se muestran solo cuando hay fecha seleccionada */}
          {selectedDate && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <div className="card">
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">
                    Horarios disponibles para {formatDate(selectedDate, 'EEEE, d MMMM yyyy')}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {availableTimeSlots.map((slot) => (
                      <button
                        key={slot.id}
                        onClick={() => setSelectedTimeSlot(slot.id)}
                        className={`p-6 border-2 rounded-xl transition-all text-left ${
                          selectedTimeSlot === slot.id
                            ? 'border-primary-600 bg-primary-50 shadow-lg scale-105'
                            : 'border-gray-300 hover:border-primary-400 hover:bg-primary-25'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="text-xl font-bold text-gray-900">{slot.label}</div>
                          <div
                            className={`text-2xl font-bold ${
                              slot.price === 'consult' ? 'text-secondary-600' : 'text-primary-600'
                            }`}
                          >
                            {slot.priceLabel}
                          </div>
                        </div>
                        <div className="text-sm text-gray-600 mb-2">
                          {slot.startTime} - {slot.endTime}
                        </div>
                        <div className="text-xs text-gray-500">{slot.description}</div>
                        {slot.price === 'consult' && (
                          <div className="mt-2 text-xs text-secondary-600 font-semibold">
                            ℹ️ Contacta con nosotros para consultar disponibilidad y precio
                          </div>
                        )}
                      </button>
                    ))}
                  </div>

                  {/* Información adicional sobre tarifas */}
                  <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h4 className="font-semibold text-blue-900 mb-2">ℹ️ Información sobre tarifas</h4>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• Apertura anticipada sin coste adicional (ver horarios)</li>
                      <li>• Los precios NO incluyen servicios extras (catering, decoración, etc.)</li>
                      <li>• Se requiere depósito del 30% para confirmar la reserva</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-1">
                <div className="card sticky top-24">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Resumen</h2>

                  <div className="space-y-4 mb-6">
                    <div>
                      <label className="label">Fecha seleccionada</label>
                      <div className="text-lg font-semibold text-primary-600">
                        {formatDate(selectedDate, 'EEEE, d MMMM yyyy')}
                      </div>
                    </div>

                    {selectedTimeSlot && (
                      <>
                        <div>
                          <label className="label">Horario</label>
                          <div className="text-lg font-semibold text-gray-900">
                            {availableTimeSlots.find((s) => s.id === selectedTimeSlot)?.label}
                          </div>
                          <div className="text-sm text-gray-600">
                            {availableTimeSlots.find((s) => s.id === selectedTimeSlot)?.startTime} -{' '}
                            {availableTimeSlots.find((s) => s.id === selectedTimeSlot)?.endTime}
                          </div>
                        </div>

                        <div className="border-t pt-4">
                          <div className="flex justify-between items-center mb-4">
                            <span className="text-gray-600">Precio base del espacio:</span>
                            <span className="text-3xl font-bold text-primary-600">
                              {availableTimeSlots.find((s) => s.id === selectedTimeSlot)?.priceLabel}
                            </span>
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  {selectedTimeSlot && availableTimeSlots.find((s) => s.id === selectedTimeSlot)?.price !== 'consult' ? (
                    <>
                      <button onClick={handleReserve} className="btn-primary w-full">
                        Continuar con la reserva
                      </button>
                      <p className="text-sm text-gray-600 mt-4 text-center">
                        Podrás añadir servicios extras en el siguiente paso
                      </p>
                    </>
                  ) : selectedTimeSlot ? (
                    <div className="text-center">
                      <Link href="/contacto" className="btn-secondary w-full">
                        Consultar disponibilidad
                      </Link>
                      <p className="text-sm text-gray-600 mt-4">
                        El horario nocturno requiere consulta previa
                      </p>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="text-6xl mb-4">⏰</div>
                      <p className="text-gray-600">Selecciona un horario para continuar</p>
                    </div>
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
                  Se requiere un <strong>depósito del 30%</strong> para confirmar la reserva.
                </p>
                <p className="text-gray-600">
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
