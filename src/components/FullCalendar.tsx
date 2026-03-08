import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface TimeSlotStatus {
  id: 'morning' | 'afternoon' | 'night';
  label: string;
  shortLabel: string;
  time: string;
  available: boolean;
}

interface DaySlots {
  date: Date;
  slots: TimeSlotStatus[];
  isPast: boolean;
}

interface FullCalendarProps {
  onSlotSelect: (date: Date, timeSlot: 'morning' | 'afternoon' | 'night') => void;
  bookedSlots?: { date: Date; timeSlot: 'morning' | 'afternoon' | 'night' }[];
  selectedDate?: Date | null;
  selectedTimeSlot?: 'morning' | 'afternoon' | 'night' | null;
}

export default function FullCalendar({ onSlotSelect, bookedSlots = [], selectedDate, selectedTimeSlot }: FullCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Get days in month
  const getDaysInMonth = (date: Date): DaySlots[] => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();

    // Get the day of the week for the first day (0 = Sunday, 1 = Monday, etc.)
    let startDayOfWeek = firstDay.getDay();
    // Convert to Monday = 0, Sunday = 6
    startDayOfWeek = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;

    const days: DaySlots[] = [];

    // Add empty slots for days before the first day of the month
    for (let i = 0; i < startDayOfWeek; i++) {
      const emptyDate = new Date(year, month, -startDayOfWeek + i + 1);
      days.push({
        date: emptyDate,
        isPast: true,
        slots: [
          { id: 'morning', label: 'Mañana', shortLabel: 'M', time: '11:00-14:30', available: false },
          { id: 'afternoon', label: 'Tarde', shortLabel: 'T', time: '16:30-20:30', available: false },
          { id: 'night', label: 'Noche', shortLabel: 'N', time: '22:00-02:00', available: false },
        ],
      });
    }

    // Add days of the current month
    for (let day = 1; day <= daysInMonth; day++) {
      const currentDate = new Date(year, month, day);
      const isPast = currentDate < new Date(new Date().setHours(0, 0, 0, 0));

      days.push({
        date: currentDate,
        isPast,
        slots: [
          {
            id: 'morning',
            label: 'Mañana',
            shortLabel: 'M',
            time: '11:00-14:30',
            available: !isPast && !isSlotBooked(currentDate, 'morning'),
          },
          {
            id: 'afternoon',
            label: 'Tarde',
            shortLabel: 'T',
            time: '16:30-20:30',
            available: !isPast && !isSlotBooked(currentDate, 'afternoon'),
          },
          {
            id: 'night',
            label: 'Noche',
            shortLabel: 'N',
            time: '22:00-02:00',
            available: !isPast && !isSlotBooked(currentDate, 'night'),
          },
        ],
      });
    }

    return days;
  };

  const isSlotSelected = (date: Date, timeSlot: 'morning' | 'afternoon' | 'night'): boolean => {
    if (!selectedDate || !selectedTimeSlot) return false;
    return (
      selectedDate.getDate() === date.getDate() &&
      selectedDate.getMonth() === date.getMonth() &&
      selectedDate.getFullYear() === date.getFullYear() &&
      selectedTimeSlot === timeSlot
    );
  };

  const isSlotBooked = (date: Date, timeSlot: 'morning' | 'afternoon' | 'night'): boolean => {
    return bookedSlots.some(
      (booked) =>
        booked.date.getDate() === date.getDate() &&
        booked.date.getMonth() === date.getMonth() &&
        booked.date.getFullYear() === date.getFullYear() &&
        booked.timeSlot === timeSlot
    );
  };

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const monthYear = currentMonth.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
  const days = getDaysInMonth(currentMonth);
  const weekDays = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  return (
    <div className="w-full bg-white rounded-2xl shadow-2xl p-4 md:p-8">
      {/* Header with month navigation */}
      <div className="flex items-center justify-between mb-8">
        <button
          onClick={handlePrevMonth}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="Mes anterior"
        >
          <ChevronLeft className="w-6 h-6 text-gray-700" />
        </button>

        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 capitalize">
          {monthYear}
        </h2>

        <button
          onClick={handleNextMonth}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="Mes siguiente"
        >
          <ChevronRight className="w-6 h-6 text-gray-700" />
        </button>
      </div>

      {/* Week day headers */}
      <div className="grid grid-cols-7 gap-2 mb-4">
        {weekDays.map((day) => (
          <div
            key={day}
            className="text-center font-semibold text-gray-600 text-sm md:text-base py-2"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-2">
        {days.map((daySlot, index) => {
          const isCurrentMonth = daySlot.date.getMonth() === currentMonth.getMonth();
          const isToday =
            daySlot.date.getDate() === new Date().getDate() &&
            daySlot.date.getMonth() === new Date().getMonth() &&
            daySlot.date.getFullYear() === new Date().getFullYear();
          const isPastDay = daySlot.isPast && isCurrentMonth;

          return (
            <div
              key={index}
              className={`border rounded-lg p-1 md:p-2 min-h-[80px] md:min-h-[100px] ${
                isCurrentMonth ? 'bg-white' : 'bg-gray-50'
              } ${isToday ? 'border-2' : 'border-gray-200'}`}
              style={isToday ? { borderColor: '#00BCD4' } : {}}
            >
              {/* Day number */}
              <div
                className={`text-center text-xs md:text-sm font-semibold mb-1 ${
                  isCurrentMonth && !isPastDay ? 'text-gray-900' : 'text-gray-200'
                }`}
              >
                {daySlot.date.getDate()}
              </div>

              {/* Time slots — hide for past/out-of-month days */}
              {!isPastDay && isCurrentMonth && (
                <div className="flex flex-col gap-1">
                  {daySlot.slots.map((slot) => (
                    <button
                      key={slot.id}
                      onClick={() => {
                        if (slot.available && isCurrentMonth) {
                          onSlotSelect(daySlot.date, slot.id);
                        }
                      }}
                      disabled={!slot.available || !isCurrentMonth}
                      className={`text-[10px] md:text-xs font-semibold py-1 px-1 rounded transition-all ${
                        slot.available && isCurrentMonth && isSlotSelected(daySlot.date, slot.id)
                          ? 'text-white scale-105 cursor-pointer shadow-md ring-2'
                          : slot.available && isCurrentMonth
                          ? 'text-white hover:scale-105 cursor-pointer shadow-sm hover:opacity-90'
                          : 'text-white cursor-not-allowed opacity-70'
                      }`}
                      style={
                        slot.available && isCurrentMonth && isSlotSelected(daySlot.date, slot.id)
                          ? { backgroundColor: '#007a8c', ringColor: '#005f6b' }
                          : slot.available && isCurrentMonth
                          ? { backgroundColor: '#00BCD4' }
                          : { backgroundColor: '#FF6B35' }
                      }
                      title={`${slot.label} (${slot.time})`}
                    >
                      {slot.available || !isCurrentMonth ? slot.shortLabel : '😊'}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-8 flex flex-wrap items-center justify-center gap-4 md:gap-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-6 rounded" style={{ backgroundColor: '#00BCD4' }} />
          <span className="text-gray-700">Disponible</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-6 rounded" style={{ backgroundColor: '#007a8c' }} />
          <span className="text-gray-700">Seleccionado</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-6 rounded text-white text-xs font-bold flex items-center justify-center" style={{ backgroundColor: '#FF6B35' }}>
            😊
          </div>
          <span className="text-gray-700">Reservado</span>
        </div>
        <div className="hidden md:flex items-center gap-2 text-gray-500">
          <span className="font-semibold">M</span> = Mañana (11:00-14:30)
        </div>
        <div className="hidden md:flex items-center gap-2 text-gray-500">
          <span className="font-semibold">T</span> = Tarde (16:30-20:30)
        </div>
        <div className="hidden md:flex items-center gap-2 text-gray-500">
          <span className="font-semibold">N</span> = Noche (22:00-02:00)
        </div>
      </div>
    </div>
  );
}
