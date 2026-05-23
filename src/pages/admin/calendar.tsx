import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, ArrowLeft, Lock, RefreshCw } from 'lucide-react';

type TimeSlotType = 'morning' | 'afternoon' | 'night';

interface Slot {
  date: string; // ISO string noon UTC
  timeSlot: TimeSlotType;
  type: 'reservation' | 'blocked';
  reason?: string;
}

const TIME_SLOTS: { id: TimeSlotType; label: string; shortLabel: string }[] = [
  { id: 'morning', label: 'Mañana', shortLabel: 'M' },
  { id: 'afternoon', label: 'Tarde', shortLabel: 'T' },
  { id: 'night', label: 'Noche', shortLabel: 'N' },
];

export default function AdminCalendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/booked-slots');
      const data = await res.json();
      setSlots(data.slots || []);
    } catch (err) {
      console.error('Error fetching calendar data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const formatDateKey = (date: Date) => date.toISOString().split('T')[0];

  const getSlotInfo = (date: Date, slotId: TimeSlotType): Slot | undefined => {
    const dateKey = formatDateKey(date);
    return slots.find(
      (s) => s.date.startsWith(dateKey) && s.timeSlot === slotId
    );
  };

  const getDaysInMonth = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    let startDayOfWeek = firstDay.getDay();
    startDayOfWeek = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;

    const days: Date[] = [];
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(new Date(year, month, -startDayOfWeek + i + 1));
    }
    for (let day = 1; day <= lastDay.getDate(); day++) {
      days.push(new Date(year, month, day));
    }
    return days;
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
                <Link href="/admin" className="p-2 text-gray-500 hover:text-gray-700 transition-colors">
                  <ArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Calendario</h1>
                  <p className="text-gray-500 text-sm">Vista de disponibilidad</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Link
                  href="/admin/reservations/blocked-dates"
                  className="flex items-center gap-2 px-3 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors text-sm font-medium"
                >
                  <Lock className="w-4 h-4" /> Gestionar bloqueos
                </Link>
                <button
                  onClick={fetchData}
                  className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Legend */}
          <div className="bg-white rounded-xl shadow p-4 mb-6">
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-green-500 rounded"></div>
                <span className="text-gray-700">Disponible</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-blue-500 rounded"></div>
                <span className="text-gray-700">Reservado</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-amber-400 rounded flex items-center justify-center">
                  <Lock className="w-3 h-3 text-white" />
                </div>
                <span className="text-gray-700">Bloqueado (admin)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-gray-200 rounded"></div>
                <span className="text-gray-500">Pasado / fuera de mes</span>
              </div>
            </div>
          </div>

          {/* Calendar */}
          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-6 h-6 text-gray-700" />
              </button>
              <h2 className="text-2xl font-bold text-gray-900 capitalize">{monthYear}</h2>
              <button
                onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronRight className="w-6 h-6 text-gray-700" />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-2 mb-4">
              {weekDays.map((day) => (
                <div key={day} className="text-center font-semibold text-gray-600 text-sm py-2">
                  {day}
                </div>
              ))}
            </div>

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

                  return (
                    <div
                      key={index}
                      className={`border rounded-lg p-2 min-h-[100px] ${
                        isCurrentMonth ? 'bg-white' : 'bg-gray-50'
                      } ${isToday ? 'border-primary-600 border-2' : 'border-gray-200'}`}
                    >
                      <div className="mb-2">
                        <span className={`text-sm font-semibold ${isCurrentMonth ? 'text-gray-900' : 'text-gray-400'}`}>
                          {date.getDate()}
                        </span>
                      </div>

                      <div className="flex flex-col gap-1">
                        {TIME_SLOTS.map((slot) => {
                          const slotInfo = isCurrentMonth ? getSlotInfo(date, slot.id) : undefined;
                          const isReserved = slotInfo?.type === 'reservation';
                          const isBlocked = slotInfo?.type === 'blocked';

                          return (
                            <div
                              key={slot.id}
                              className={`text-[10px] font-semibold py-1 px-1 rounded flex items-center justify-center gap-0.5 ${
                                isReserved
                                  ? 'bg-blue-500 text-white'
                                  : isBlocked
                                  ? 'bg-amber-400 text-white'
                                  : isPast || !isCurrentMonth
                                  ? 'bg-gray-200 text-gray-400'
                                  : 'bg-green-500 text-white'
                              }`}
                              title={
                                isReserved
                                  ? 'Reservado'
                                  : isBlocked
                                  ? slotInfo?.reason ? `Bloqueado: ${slotInfo.reason}` : 'Bloqueado (admin)'
                                  : isPast
                                  ? 'Pasado'
                                  : 'Disponible'
                              }
                            >
                              {isBlocked && <Lock className="w-2 h-2" />}
                              {slot.shortLabel}
                            </div>
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
