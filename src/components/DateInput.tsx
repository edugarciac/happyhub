import { useEffect, useRef, useState } from 'react';
import { CalendarDays } from 'lucide-react';
import { displayToIso, formatTyping, isoToDisplay } from '@/utils/dateInput';

interface DateInputProps {
  /** Valor en formato 'YYYY-MM-DD' (igual que <input type="date">) */
  value: string;
  onChange: (e: { target: { name?: string; value: string } }) => void;
  name?: string;
  min?: string;
  max?: string;
  required?: boolean;
  className?: string;
  id?: string;
}

/**
 * Sustituto de <input type="date"> que siempre muestra dd/mm/aaaa,
 * independientemente de la región del dispositivo. El icono abre el selector nativo.
 */
export default function DateInput({ value, onChange, name, min, max, required, className = '', id }: DateInputProps) {
  const [text, setText] = useState(isoToDisplay(value));
  const [invalid, setInvalid] = useState(false);
  const pickerRef = useRef<HTMLInputElement>(null);

  // Sincronizar cuando el valor cambia desde fuera (reset del formulario, selector nativo…)
  useEffect(() => {
    if (displayToIso(text) !== value) {
      setText(isoToDisplay(value));
      setInvalid(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const emit = (iso: string) => onChange({ target: { name, value: iso } });

  const handleText = (raw: string) => {
    const formatted = formatTyping(raw);
    setText(formatted);

    if (formatted === '') {
      setInvalid(false);
      emit('');
      return;
    }

    const iso = displayToIso(formatted);
    if (iso && (!min || iso >= min) && (!max || iso <= max)) {
      setInvalid(false);
      emit(iso);
    } else {
      // Fecha incompleta: no avisamos hasta que tenga los 8 dígitos
      setInvalid(formatted.length === 10);
    }
  };

  return (
    <div className="relative">
      <input
        id={id}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        placeholder="dd/mm/aaaa"
        value={text}
        required={required}
        aria-invalid={invalid}
        onChange={(e) => handleText(e.target.value)}
        className={`${className} pr-10 ${invalid ? '!border-red-400 !ring-red-300' : ''}`}
      />
      <span className="absolute inset-y-0 right-0 w-10 flex items-center justify-center text-gray-400 pointer-events-none">
        <CalendarDays className="w-4 h-4" />
      </span>
      {/* Selector nativo invisible encima del icono: al tocarlo se abre el calendario del dispositivo */}
      <input
        ref={pickerRef}
        type="date"
        tabIndex={-1}
        aria-label="Abrir calendario"
        value={value || ''}
        min={min}
        max={max}
        onClick={() => {
          try {
            pickerRef.current?.showPicker?.();
          } catch {
            /* navegadores sin showPicker: el toque abre el selector igualmente */
          }
        }}
        onChange={(e) => emit(e.target.value)}
        className="absolute inset-y-0 right-0 w-10 opacity-0 cursor-pointer"
      />
      {invalid && <p className="mt-1 text-xs text-red-500">Fecha no válida</p>}
    </div>
  );
}
