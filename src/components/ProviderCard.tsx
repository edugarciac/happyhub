import { Check, X } from 'lucide-react';

interface ProviderCardProps {
  id: string;
  name: string;
  service: string;
  eventDetails: {
    eventType: string;
    date: string;
    guests: number;
  };
  price?: number;
  status: 'pending' | 'accepted' | 'rejected';
  onAccept?: (id: string) => void;
  onReject?: (id: string) => void;
}

export default function ProviderCard({
  id,
  name,
  service,
  eventDetails,
  price,
  status,
  onAccept,
  onReject,
}: ProviderCardProps) {
  const getStatusBadge = () => {
    switch (status) {
      case 'accepted':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
            <Check className="w-4 h-4 mr-1" />
            Aceptado
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
            <X className="w-4 h-4 mr-1" />
            Rechazado
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
            Pendiente
          </span>
        );
    }
  };

  return (
    <div className="card">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-bold text-gray-900">{name}</h3>
          <p className="text-gray-600">{service}</p>
        </div>
        {getStatusBadge()}
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Tipo de evento:</span>
          <span className="font-medium">{eventDetails.eventType}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Fecha:</span>
          <span className="font-medium">{eventDetails.date}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Invitados:</span>
          <span className="font-medium">{eventDetails.guests}</span>
        </div>
        {price && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Precio:</span>
            <span className="font-bold text-primary-600">€{price}</span>
          </div>
        )}
      </div>

      {status === 'pending' && onAccept && onReject && (
        <div className="flex gap-3 mt-4">
          <button
            onClick={() => onAccept(id)}
            className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center justify-center"
          >
            <Check className="w-4 h-4 mr-2" />
            Aceptar
          </button>
          <button
            onClick={() => onReject(id)}
            className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-700 transition-colors flex items-center justify-center"
          >
            <X className="w-4 h-4 mr-2" />
            Rechazar
          </button>
        </div>
      )}

      {status === 'accepted' && (
        <div className="mt-4 p-3 bg-green-50 rounded-lg text-green-800 text-sm">
          Has aceptado este servicio. El cliente será notificado.
        </div>
      )}

      {status === 'rejected' && (
        <div className="mt-4 p-3 bg-red-50 rounded-lg text-red-800 text-sm">
          Has rechazado este servicio. El cliente será notificado.
        </div>
      )}
    </div>
  );
}
