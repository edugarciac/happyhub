import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, ArrowLeft, Lock, Unlock, RefreshCw } from 'lucide-react';

interface BlockedDates {
  [date: string]: {
    morning?: boolean;
    afternoon?: boolean;
    night?: boolean;
  };
}

interface Reservation {
  reservationId: string;
  name: string;
  date: string;
  timeSlot: string;
  guests: number;
}

type TimeSlotType = 'morning' | 'afternoon' | 'night';

const TIME_SLOTS: { id: TimeSlotType; label: string; shortLabel: string }[] = [
  { id: 'morning', label: 'Mañana', shortLabel: 'M' },
  { id: 'afternoon', label: 'Tarde', shortLabel: 'T' },
  { id: 'night', label: 'Noche', shortLabel: 'N' },
];

export default function AdminCalendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [blockedDates, setBlockedDates] = useState<BlockedDates>({});
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch blocked dates
      const blockedRes = await fetch('/api/admin/block-dates');
      const blockedData = await blockedRes.json();
      setBlockedDates(blockedData.blockedDates || {});

      // Fetch reservations
      const reservationsRes = await fetch('/api/admin/reservations?status=paid&limit=100');
      const reservationsData = await reservationsRes.json();
      setReservations(reservationsData.reservations || []);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleBlockSlot = async (date: string, timeSlot: TimeSlotType | null) => {
    const isCurrentlyBlocked = timeSlot
      ? blockedDates[date]?.[timeSlot]
      : blockedDates[date] && Object.values(blockedDates[date]).every(v => v);

    try {
      const response = await fetch('/api/admin/block-dates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date,
          timeSlot,
          block: !isCurrentlyBlocked,
        }),
      });
      const data = await response.json();
      setBlockedDates(data.blockedDates);
    } catch (err) {
      console.error('Error toggling block:', err);
    }
  };

  const getDaysInMonth = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();

    let startDayOfWeek = firstDay.getDay();
    startDayOfWeek = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;

    const days: Date[] = [];

    // Add empty slots before first day
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(new Date(year, month, -startDayOfWeek + i + 1));
    }

    // Add days of month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  };

  const formatDateKey = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const getSlotStatus = (date: Date, slot: TimeSlotType): 'available' | 'blocked' | 'reserved' => {
    const dateKey = formatDateKey(date);

    // Check if reserved
    const hasReservation = reservations.some(
      r => r.date && formatDateKey(new Date(r.date)) === dateKey && r.timeSlot === slot
    );
    if (hasReservation) return 'reserved';

    // Check if blocked
    if (blockedDates[dateKey]?.[slot]) return 'blocked';

    return 'available';
  };

  const getReservationForSlot = (date: Date, slot: TimeSlotType): Reservation | undefined => {
    const dateKey = formatDateKey(date);
    return reservations.find(
      r => r.date && formatDateKey(new Date(r.date)) === dateKey && r.timeSlot === slot
    );
  };

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const days = getDaysInMonth();
  const weekDays = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
  const monthYear = currentMonth.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });

  return (
    <>
      <Head>
        <title>Calendario Admin - HappyHub</title>
      </Head>

      <div className="min-h-screen bg-gray-100">
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Link
                  href="/admin"
                  className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Calendario</h1>
                  <p className="text-gray-500 text-sm">Gestiona disponibilidad y bloqueos</p>
                </div>
              </div>
              <button
                onClick={fetchData}
                className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
              >
                <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Legend */}
          <div className="bg-white rounded-xl shadow p-4 mb-6">
            <div className="flex flex-wrap items-center justify-center gap-6">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-green-500 rounded"></div>
                <span className="text-sm text-gray-700">Disponible</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-blue-500 rounded"></div>
                <span className="text-sm text-gray-700">Reservado</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-gray-500 rounded"></div>
                <span className="text-sm text-gray-700">Bloqueado</span>
              </div>
              <div className="text-sm text-gray-500">
                Click en un slot para bloquear/desbloquear
              </div>
            </div>
          </div>

          {/* Calendar */}
          <div className="bg-white rounded-xl shadow p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={handlePrevMonth}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-6 h-6 text-gray-700" />
              </button>
              <h2 className="text-2xl font-bold text-gray-900 capitalize">{monthYear}</h2>
              <button
                onClick={handleNextMonth}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronRight className="w-6 h-6 text-gray-700" />
              </button>
            </div>

            {/* Week days */}
            <div className="grid grid-cols-7 gap-2 mb-4">
              {weekDays.map(day => (
                <div key={day} className="text-center font-semibold text-gray-600 text-sm py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <RefreshCw className="w-8 h-8 animate-spin text-primary-600" />
              </div>
            ) : (
              <div className="grid grid-cols-7 gap-2">
                {days.map((date, index) => {
                  const isCurrentMonth = date.getMonth() === currentMonth.getMonth();
                  const isToday = formatDateKey(date) === formatDateKey(new Date());
                  const isPast = date < new Date(new Date().setHours(0, 0, 0, 0));
                  const dateKey = formatDateKey(date);

                  return (
                    <div
                      key={index}
                      className={`border rounded-lg p-2 min-h-[100px] ${
                        isCurrentMonth ? 'bg-white' : 'bg-gray-50'
                      } ${isToday ? 'border-primary-600 border-2' : 'border-gray-200'}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span
                          className={`text-sm font-semibold ${
                            isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
                          }`}
                        >
                          {date.getDate()}
                        </span>
                        {isCurrentMonth && !isPast && (
                          <button
                            onClick={() => handleBlockSlot(dateKey, null)}
                            className="p-1 text-gray-400 hover:text-gray-600"
                            title="Bloquear/desbloquear día completo"
                          >
                            {blockedDates[dateKey] && Object.values(blockedDates[dateKey]).every(v => v) ? (
                              <Unlock className="w-3 h-3" />
                            ) : (
                              <Lock className="w-3 h-3" />
                            )}
                          </button>
                        )}
                      </div>

                      <div className="flex flex-col gap-1">
                        {TIME_SLOTS.map(slot => {
                          const status = getSlotStatus(date, slot.id);
                          const reservation = getReservationForSlot(date, slot.id);
                          const canInteract = isCurrentMonth && !isPast && status !== 'reserved';

                          return (
                            <button
                              key={slot.id}
                              onClick={() => canInteract && handleBlockSlot(dateKey, slot.id)}
                              disabled={!canInteract}
                              className={`text-[10px] font-semibold py-1 px-1 rounded transition-all ${
                                status === 'reserved'
                                  ? 'bg-blue-500 text-white cursor-default'
                                  : status === 'blocked'
                                  ? 'bg-gray-500 text-white hover:bg-gray-600'
                                  : isPast || !isCurrentMonth
                                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                  : 'bg-green-500 text-white hover:bg-green-600'
                              }`}
                              title={
                                reservation
                                  ? `${reservation.name} - ${reservation.guests} personas`
                                  : status === 'blocked'
                                  ? 'Click para desbloquear'
                                  : 'Click para bloquear'
                              }
                            >
                              {slot.shortLabel}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </main>
      </div>
    </>
  );
}
