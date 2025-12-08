import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Calendar from '@/components/Calendar';
import { formatDate } from '@/utils/formatters';

export default function Disponibilidad() {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedDuration, setSelectedDuration] = useState<string>('3h');

  const bookedDates = [
    new Date(2025, 11, 15),
    new Date(2025, 11, 22),
    new Date(2025, 11, 25),
    new Date(2026, 0, 1),
  ];

  const durations = [
    { value: '2h', label: '2 horas', price: 200 },
    { value: '3h', label: '3 horas', price: 300 },
    { value: '4h', label: '4 horas', price: 400 },
    { value: '5h', label: '5 horas', price: 500 },
  ];

  const timeSlots = [
    { value: '10:00', label: '10:00 - Mañana' },
    { value: '12:00', label: '12:00 - Mediodía' },
    { value: '16:00', label: '16:00 - Tarde' },
    { value: '18:00', label: '18:00 - Tarde/Noche' },
  ];

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
  };

  const handleReserve = () => {
    if (selectedDate) {
      const dateStr = selectedDate.toISOString().split('T')[0];
      window.location.href = `/reservas?date=${dateStr}&duration=${selectedDuration}`;
    }
  };

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
        <div className="container-custom">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="card">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Selecciona una fecha</h2>
                <Calendar
                  onDateSelect={handleDateSelect}
                  bookedDates={bookedDates}
                  minDate={new Date()}
                />
              </div>

              {selectedDate && (
                <div className="card mt-8">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Horarios disponibles</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {timeSlots.map((slot) => (
                      <button
                        key={slot.value}
                        className="p-4 border-2 border-gray-300 rounded-lg hover:border-primary-600 hover:bg-primary-50 transition-colors text-center"
                      >
                        <div className="font-semibold">{slot.value}</div>
                        <div className="text-sm text-gray-600">{slot.label.split(' - ')[1]}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="lg:col-span-1">
              <div className="card sticky top-24">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Resumen</h2>

                {selectedDate ? (
                  <>
                    <div className="space-y-4 mb-6">
                      <div>
                        <label className="label">Fecha seleccionada</label>
                        <div className="text-lg font-semibold text-primary-600">
                          {formatDate(selectedDate, 'EEEE, d MMMM yyyy')}
                        </div>
                      </div>

                      <div>
                        <label className="label">Duración del evento</label>
                        <select
                          value={selectedDuration}
                          onChange={(e) => setSelectedDuration(e.target.value)}
                          className="input-field"
                        >
                          {durations.map((duration) => (
                            <option key={duration.value} value={duration.value}>
                              {duration.label} - €{duration.price}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="border-t pt-4">
                        <div className="flex justify-between items-center mb-4">
                          <span className="text-gray-600">Precio base:</span>
                          <span className="text-2xl font-bold text-primary-600">
                            €{durations.find((d) => d.value === selectedDuration)?.price}
                          </span>
                        </div>
                      </div>
                    </div>

                    <button onClick={handleReserve} className="btn-primary w-full">
                      Continuar con la reserva
                    </button>

                    <p className="text-sm text-gray-600 mt-4 text-center">
                      Podrás añadir servicios extras en el siguiente paso
                    </p>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <div className="text-6xl mb-4">📅</div>
                    <p className="text-gray-600">
                      Selecciona una fecha en el calendario para ver los detalles
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-gray-50">
        <div className="container-custom">
          <div className="bg-white rounded-2xl p-8 shadow-lg">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Información importante</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">⏰ Horarios</h3>
                <p className="text-gray-600">
                  Disponemos de franjas horarias de mañana (10:00-14:00), tarde (16:00-20:00) y noche (20:00-00:00).
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">💳 Reserva</h3>
                <p className="text-gray-600">
                  Se requiere un depósito del 30% para confirmar la reserva. El resto se abona el día del evento.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">🔄 Cancelaciones</h3>
                <p className="text-gray-600">
                  Cancelación gratuita hasta 15 días antes del evento. Consulta nuestra política completa.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">👥 Capacidad</h3>
                <p className="text-gray-600">
                  Nuestro espacio tiene capacidad para hasta 150 personas cómodamente.
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
