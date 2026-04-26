interface Category {
  value: string;
  label: string;
  icon: string;
}

const CATEGORIES: Category[] = [
  { value: 'fin-de-curso', label: 'Fin de curso', icon: '🎓' },
  { value: 'despedida', label: 'Despedida de soltero/a', icon: '💃' },
  { value: 'reunion-familiar', label: 'Reunión familiar', icon: '👨‍👩‍👧‍👦' },
  { value: 'aniversario-empresa', label: 'Aniversario de empresa', icon: '🏢' },
  { value: 'graduacion', label: 'Graduación universitaria', icon: '🏛️' },
  { value: 'team-building', label: 'Team building', icon: '🤝' },
  { value: 'cumpleanos', label: 'Cumpleaños', icon: '🎂' },
  { value: 'otro', label: 'Otro', icon: '🎉' },
];

interface Props {
  value: string;
  onChange: (value: string) => void;
}

export default function EventCategoryPicker({ value, onChange }: Props) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
      {CATEGORIES.map((cat) => (
        <button
          key={cat.value}
          type="button"
          onClick={() => onChange(cat.value)}
          className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 text-sm font-medium transition-colors ${
            value === cat.value
              ? 'border-purple-500 bg-purple-50 text-purple-700'
              : 'border-gray-200 hover:border-purple-300 text-gray-600'
          }`}
        >
          <span className="text-2xl">{cat.icon}</span>
          <span className="text-center leading-tight">{cat.label}</span>
        </button>
      ))}
    </div>
  );
}
