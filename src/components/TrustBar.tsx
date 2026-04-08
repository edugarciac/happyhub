import { PartyPopper, Star, Zap } from 'lucide-react';

const stats = [
  {
    icon: PartyPopper,
    value: '+500',
    label: 'fiestas celebradas',
  },
  {
    icon: Star,
    value: '4.9/5',
    label: 'valoración media',
  },
  {
    icon: Zap,
    value: '2 min',
    label: 'para reservar online',
  },
];

export default function TrustBar() {
  return (
    <div className="bg-primary-600 py-5">
      <div className="container-custom">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-0 sm:divide-x sm:divide-primary-500">
          {stats.map(({ icon: Icon, value, label }) => (
            <div key={label} className="flex items-center gap-3 sm:px-10">
              <div className="bg-white/15 p-2 rounded-xl">
                <Icon className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="text-white font-bold text-lg">{value}</span>
                <span className="text-primary-200 text-sm ml-2">{label}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
