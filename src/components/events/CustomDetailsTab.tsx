// src/components/events/CustomDetailsTab.tsx
import { Sparkles } from 'lucide-react';
import { CUSTOM_DETAIL_IDEAS } from '@/data/customDetailIdeas';
import { CONTACT_INFO } from '@/config/contact';

interface CustomDetailsTabProps {
  eventId: number;
  isOrganizer: boolean;
}

const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

export default function CustomDetailsTab({ eventId, isOrganizer }: CustomDetailsTabProps) {
  return (
    <div className="max-w-3xl">
      {/* Intro */}
      <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-xl p-4 flex items-start gap-3 mb-5">
        <Sparkles className="w-6 h-6 text-orange-500 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-bold text-orange-700 text-sm">¿Tienes una idea?</p>
          <p className="text-orange-600 text-xs mt-0.5">
            Cuéntanos qué te gustaría y te ayudamos a crear objetos personalizados para los asistentes,
            para que tu evento sea inolvidable.
          </p>
        </div>
      </div>

      {/* Idea gallery */}
      <div className="mb-5">
        <h3 className="font-bold text-gray-900 text-sm mb-3">💡 Algunas ideas para inspirarte</h3>
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
          {CUSTOM_DETAIL_IDEAS.map((idea) => {
            const Icon = idea.icon;
            return (
              <div
                key={idea.id}
                className="bg-white border border-gray-200 rounded-xl p-3 flex flex-col items-center justify-center gap-2 aspect-square"
              >
                {idea.photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={idea.photoUrl} alt={idea.label} className="w-full h-full object-cover rounded-lg" />
                ) : (
                  <span className="flex items-center justify-center w-10 h-10 rounded-full bg-orange-50">
                    <Icon className="w-5 h-5 text-orange-500" />
                  </span>
                )}
                <span className="text-xs font-medium text-gray-600 text-center leading-tight">{idea.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* WhatsApp CTA */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
        <div className="bg-gradient-to-br from-green-400 to-emerald-500 text-white p-2.5 rounded-xl flex-shrink-0">
          <WhatsAppIcon className="w-6 h-6" />
        </div>
        <div className="flex-1">
          <p className="font-bold text-gray-900 text-sm">Cuéntanos tu idea</p>
          <p className="text-gray-500 text-xs">
            Conocemos profesionales que pueden hacer realidad todas estas ideas por un precio muy razonable.
          </p>
        </div>
        <a
          href={CONTACT_INFO.whatsapp}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-green-700 flex-shrink-0"
        >
          Escríbenos →
        </a>
      </div>
    </div>
  );
}
