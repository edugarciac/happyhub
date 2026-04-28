import { useBooking, EXTRAS } from './BookingContext';
import { Check, Calendar, Clock, Users, MessageSquare, Mail, Phone, Home, AlertTriangle } from 'lucide-react';
import { formatDate } from '@/utils/formatters';
import Link from 'next/link';

export default function Step4Confirmation() {
  const { state, calculateTotalPrice, calculateDepositAmount } = useBooking();

  const timeSlotLabels: Record<string, string> = {
    morning: 'Mañana (11:00 - 14:30h)',
    afternoon: 'Tarde (16:30 - 20:30h)',
    night: 'Noche (22:00 - 02:00h)',
  };

  const eventTypeLabels: Record<string, string> = {
    'cumpleaños': 'Cumpleaños',
    'celebracion-familiar': 'Celebración familiar',
    'eventos-amigos': 'Eventos con amigos',
    'eventos-colegio-trabajo': 'Eventos de colegio/trabajo',
    'taller': 'Taller',
    'otros': 'Otros',
  };

  const selectedExtrasDetails = state.selectedExtras
    .map(id => EXTRAS.find(e => e.id === id))
    .filter(Boolean);

  const totalPrice = calculateTotalPrice();
  const depositAmount = calculateDepositAmount();

  return (
    <div className="max-w-3xl mx-auto">
      {/* Success Icon */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
          <Check className="w-12 h-12 text-green-600" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          ¡Solicitud enviada!
        </h2>
        <p className="text-lg text-gray-600">
          Tu reserva ha sido recibida correctamente
        </p>
        {state.reservationId && (
          <p className="text-sm text-gray-500 mt-2">
            Número de reserva: <span className="font-mono font-semibold">{state.reservationId}</span>
          </p>
        )}
      </div>

      {/* Email Warning */}
      {state.emailWarning && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
          <div className="flex gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-amber-900">Aviso sobre el email</p>
              <p className="text-sm text-amber-800 mt-1">{state.emailWarning}</p>
            </div>
          </div>
        </div>
      )}

      {/* Info Card */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8">
        <div className="flex gap-3">
          <MessageSquare className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-blue-900 mb-2">
              ¿Qué sigue ahora?
            </h3>
            <ul className="space-y-2 text-sm text-blue-800">
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">•</span>
                <span>Recibirás un <strong>WhatsApp</strong> con los detalles de tu reserva</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">•</span>
                <span>Te enviaremos un <strong>email de confirmación</strong> a {state.email}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">•</span>
                <span>Incluiremos el <strong>enlace de pago</strong> para la señal del 30% ({depositAmount}€)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">•</span>
                <span>Nos pondremos en contacto contigo en las próximas <strong>24 horas</strong></span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Reservation Summary */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
        <h3 className="text-xl font-bold text-gray-900 mb-6">Resumen de tu reserva</h3>

        <div className="space-y-4">
          {/* Date */}
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Calendar className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Fecha</p>
              <p className="font-semibold text-gray-900">
                {state.date ? formatDate(state.date) : 'No seleccionada'}
              </p>
            </div>
          </div>

          {/* Time */}
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Clock className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Horario</p>
              <p className="font-semibold text-gray-900">
                {state.timeSlot ? timeSlotLabels[state.timeSlot] : 'No seleccionado'}
              </p>
            </div>
          </div>

          {/* Guests */}
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Users className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Invitados</p>
              <p className="font-semibold text-gray-900">{state.guests} personas</p>
            </div>
          </div>

          {/* Event Type */}
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <MessageSquare className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Tipo de evento</p>
              <p className="font-semibold text-gray-900">
                {state.eventType ? eventTypeLabels[state.eventType] : 'No especificado'}
              </p>
            </div>
          </div>

          {/* Extras */}
          {selectedExtrasDetails.length > 0 && (
            <div className="border-t pt-4">
              <p className="text-sm text-gray-500 mb-2">Servicios extras</p>
              <ul className="space-y-1">
                {selectedExtrasDetails.map(extra => (
                  <li key={extra!.id} className="text-sm text-gray-700 flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-600" />
                    {extra!.name}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Contact Info */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Datos de contacto</h3>
        <div className="space-y-3 text-sm">
          <div className="flex items-center gap-3">
            <Mail className="w-5 h-5 text-gray-400" />
            <span className="text-gray-600">{state.email}</span>
          </div>
          <div className="flex items-center gap-3">
            <Phone className="w-5 h-5 text-gray-400" />
            <span className="text-gray-600">{state.phone}</span>
          </div>
        </div>
      </div>

      {/* Pricing Summary */}
      <div className="bg-gradient-to-br from-primary-50 to-primary-100 rounded-xl p-6 mb-8">
        <div className="flex justify-between items-center mb-4">
          <span className="text-gray-700">Precio total</span>
          <span className="text-2xl font-bold text-gray-900">
            {totalPrice === 'consult' ? 'A consultar' : `${totalPrice}€`}
          </span>
        </div>
        <div className="flex justify-between items-center pt-4 border-t border-primary-200">
          <span className="text-gray-700">Señal (30%)</span>
          <span className="text-xl font-bold text-primary-600">
            {depositAmount}€
          </span>
        </div>
        <p className="text-xs text-gray-600 mt-4">
          * El resto ({totalPrice !== 'consult' ? totalPrice - depositAmount : 0}€) se abonará el día del evento
        </p>
      </div>

      {/* Back to Home Button */}
      <div className="text-center">
        <Link
          href="/"
          className="inline-flex items-center gap-2 btn-primary"
        >
          <Home className="w-5 h-5" />
          Volver al inicio
        </Link>
      </div>

      {/* Additional Help */}
      <div className="text-center mt-8 text-sm text-gray-500">
        <p>¿Necesitas ayuda? Escríbenos a <a href="mailto:hola@happyhub.es" className="text-primary-600 hover:underline">hola@happyhub.es</a></p>
        <p className="mt-1">o contáctanos por <a href="https://wa.me/34624645517" target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">WhatsApp: 624 645 517</a></p>
      </div>
    </div>
  );
}
