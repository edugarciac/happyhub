import { X, ArrowDown, MousePointerClick, Zap, Ban, Lock, Receipt } from 'lucide-react';
import { DISPLAY_STATUS_COLORS, DISPLAY_STATUS_LABELS, type DisplayStatus } from '@/utils/reservationStatus';
import { PAYMENT_GRACE_HOURS, PAYMENT_WINDOW_HOURS, REMAINING_REMINDER_DAYS_BEFORE, SECURITY_DEPOSIT_AMOUNT } from '@/config/payments';

/** Paso del flujo: estado + cómo se llega al siguiente (botón del admin o automático) */
interface Step {
  status: DisplayStatus;
  meaning: string;
  next?: { admin: string[]; auto: string[] };
}

const STEPS: Step[] = [
  {
    status: 'pending',
    meaning: 'Solicitud web o reserva manual. La fecha queda bloqueada mientras se revisa.',
    next: {
      admin: ['Aprobar'],
      auto: [`Al aprobar, el cliente recibe el enlace para pagar la señal (30%) en ${PAYMENT_WINDOW_HOURS} h`],
    },
  },
  {
    status: 'approved',
    meaning: 'Aprobada, esperando la señal.',
    next: {
      admin: ['Señal recibida (Bizum)'],
      auto: [
        'Pago con tarjeta por Stripe',
        `Sin pago a las ${PAYMENT_WINDOW_HOURS} h: correo recordatorio`,
        `Sin pago ${PAYMENT_GRACE_HOURS} h después: se cancela sola`,
      ],
    },
  },
  {
    status: 'deposit_paid',
    meaning: 'Señal cobrada. Queda el resto del precio.',
    next: {
      admin: ['Marcar pago total (datáfono, efectivo o transferencia)', 'Cobro del día: QR o enviar por email'],
      auto: [
        `${REMAINING_REMINDER_DAYS_BEFORE} días antes: correo con enlace para pagar el resto`,
        'Pago del resto con tarjeta por Stripe',
      ],
    },
  },
  {
    status: 'fully_paid',
    meaning: 'Todo cobrado. Listo para el evento.',
    next: {
      admin: ['Marcar Realizado (tras el evento)'],
      auto: [],
    },
  },
  {
    status: 'completed',
    meaning: 'Evento cerrado. No admite más cambios de estado.',
  },
];

function Pill({ status }: { status: DisplayStatus }) {
  const c = DISPLAY_STATUS_COLORS[status];
  return <span className={`px-3 py-1 rounded-full text-sm font-semibold ${c.bg} ${c.text}`}>{DISPLAY_STATUS_LABELS[status]}</span>;
}

/** Esquema de estados y acciones de las reservas, para que todos los admins entiendan el flujo */
export default function ReservationFlowGuide({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-bold text-gray-900">Flujo de una reserva</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg" aria-label="Cerrar"><X className="w-5 h-5" /></button>
        </div>

        {/* Leyenda */}
        <div className="flex flex-wrap gap-4 text-xs text-gray-600 mb-5">
          <span className="flex items-center gap-1"><MousePointerClick className="w-4 h-4 text-primary-600" /> Botón del admin</span>
          <span className="flex items-center gap-1"><Zap className="w-4 h-4 text-amber-500" /> Automático (Stripe o aviso diario de las 07:00)</span>
        </div>

        <div className="grid md:grid-cols-[1fr_15rem] gap-6">
          {/* Camino principal */}
          <ol>
            {STEPS.map((step) => (
              <li key={step.status}>
                <div className="border border-gray-200 rounded-xl p-3">
                  <Pill status={step.status} />
                  <p className="text-sm text-gray-600 mt-2">{step.meaning}</p>
                </div>
                {step.next && (
                  <div className="flex gap-3 py-2 pl-4">
                    <ArrowDown className="w-5 h-5 text-gray-300 shrink-0 mt-1" />
                    <ul className="text-xs space-y-1">
                      {step.next.admin.map((a) => (
                        <li key={a} className="flex items-start gap-1 text-primary-700">
                          <MousePointerClick className="w-3.5 h-3.5 shrink-0 mt-0.5" /> <strong>{a}</strong>
                        </li>
                      ))}
                      {step.next.auto.map((a) => (
                        <li key={a} className="flex items-start gap-1 text-amber-800">
                          <Zap className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-500" /> {a}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </li>
            ))}
          </ol>

          {/* Fuera del camino principal */}
          <div className="space-y-4">
            <div className="border border-gray-200 rounded-xl p-3">
              <Pill status="cancelled" />
              <ul className="text-xs text-gray-600 space-y-1 mt-2">
                <li className="flex items-start gap-1 text-primary-700">
                  <Ban className="w-3.5 h-3.5 shrink-0 mt-0.5" /> <span><strong>Cancelar</strong> desde Pendiente, Aprobada, Señal pagada o Pagado (con motivo; avisa al cliente y libera la fecha)</span>
                </li>
                <li className="flex items-start gap-1 text-amber-800">
                  <Zap className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-500" /> Automático si no paga la señal a tiempo
                </li>
                <li className="flex items-start gap-1 text-primary-700">
                  <MousePointerClick className="w-3.5 h-3.5 shrink-0 mt-0.5" /> <span><strong>Reabrir</strong>: vuelve a Pendiente</span>
                </li>
              </ul>
            </div>

            <div className="border border-gray-200 rounded-xl p-3">
              <p className="text-sm font-semibold text-gray-900 flex items-center gap-1"><Lock className="w-4 h-4" /> Fianza de {SECURITY_DEPOSIT_AMOUNT} €</p>
              <ul className="text-xs text-gray-600 space-y-1 mt-2 list-disc list-inside">
                <li>Se bloquea el día del evento en «Cobro del día» (QR, email o datáfono). No es un cobro.</li>
                <li>Después del evento: <strong>liberar</strong> o <strong>cobrar daños</strong>.</li>
              </ul>
            </div>

            <div className="border border-gray-200 rounded-xl p-3">
              <p className="text-sm font-semibold text-gray-900 flex items-center gap-1"><Receipt className="w-4 h-4" /> Cobros adicionales</p>
              <p className="text-xs text-gray-600 mt-2">
                Horas extra, servicios, día completo u otros. Se envían por email en cualquier reserva activa y no cambian el estado ni el total.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
