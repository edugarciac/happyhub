import { useState } from 'react';
import ReactCalendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';

interface CalendarProps {
  onDateSelect: (date: Date) => void;
  bookedDates?: Date[];
  minDate?: Date;
}

export default function Calendar({ onDateSelect, bookedDates = [], minDate }: CalendarProps) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const isDateBooked = (date: Date): boolean => {
    return bookedDates.some(
      (bookedDate) =>
        bookedDate.getDate() === date.getDate() &&
        bookedDate.getMonth() === date.getMonth() &&
        bookedDate.getFullYear() === date.getFullYear()
    );
  };

  const handleDateChange = (value: Date | Date[] | null) => {
    if (value && !Array.isArray(value)) {
      if (!isDateBooked(value)) {
        setSelectedDate(value);
        onDateSelect(value);
      }
    }
  };

  const tileClassName = ({ date, view }: { date: Date; view: string }) => {
    if (view === 'month') {
      if (isDateBooked(date)) {
        return 'react-calendar__tile--booked';
      }
      if (selectedDate && date.toDateString() === selectedDate.toDateString()) {
        return 'react-calendar__tile--selected';
      }
    }
    return null;
  };

  const tileDisabled = ({ date, view }: { date: Date; view: string }) => {
    if (view === 'month') {
      return isDateBooked(date);
    }
    return false;
  };

  return (
    <div className="w-full">
      <ReactCalendar
        onChange={handleDateChange as any}
        value={selectedDate}
        minDate={minDate || new Date()}
        locale="es"
        tileClassName={tileClassName}
        tileDisabled={tileDisabled}
        className="w-full"
      />

      <div className="mt-4 flex items-center justify-center space-x-6 text-sm">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-primary-600 rounded"></div>
          <span>Seleccionado</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-gray-200 rounded"></div>
          <span>No disponible</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 border-2 border-gray-300 rounded"></div>
          <span>Disponible</span>
        </div>
      </div>

      {selectedDate && (
        <div className="mt-4 p-4 bg-primary-50 rounded-lg text-center">
          <p className="text-primary-700 font-semibold">
            Fecha seleccionada:{' '}
            {selectedDate.toLocaleDateString('es-ES', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>
      )}
    </div>
  );
}
