import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { SECURITY_DEPOSIT_AMOUNT } from '@/config/payments';

interface ReservationData {
  id: number;
  name: string;
  email: string;
  phone: string;
  event_type: string;
  event_date: string;
  time_slot: string;
  guests: number;
  extras: any[];
  base_price: string;
  total_price: string;
  deposit_amount: string;
  security_deposit: string | null;
  customer_message: string | null;
}

interface AcceptanceData {
  reservation_code: string | null;
  accepted_at: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  terms_version: string;
  terms_sha256: string;
  app_commit_sha: string | null;
  acceptance_method: string;
  scrolled_to_end: boolean;
  ip_address: string | null;
  user_agent: string | null;
  evidence_sha256: string;
  confirmation_email_sent_at: string | null;
}

function formatDateTime(value: string | null): string {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString('es-ES', { timeZone: 'Europe/Madrid' }) + ' (hora peninsular)';
}

const TIME_SLOT_HOURS: Record<string, { label: string; start: string; end: string }> = {
  morning: { label: 'Manana', start: '10:00', end: '14:00' },
  afternoon: { label: 'Tarde', start: '16:00', end: '20:00' },
};

const EVENT_TYPE_LABELS: Record<string, string> = {
  'cumpleaños': 'Cumpleanos',
  'celebracion-familiar': 'Celebracion familiar',
  'eventos-amigos': 'Eventos con amigos',
  'eventos-colegio-trabajo': 'Colegio/Trabajo',
  'taller': 'Taller',
  'otros': 'Otros',
};

function formatDateDDMMYYYY(dateStr: string): string {
  const d = new Date(dateStr);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

function formatToday(): string {
  return formatDateDDMMYYYY(new Date().toISOString());
}

export default function ContractPage() {
  const router = useRouter();
  const { id } = router.query;
  const [reservation, setReservation] = useState<ReservationData | null>(null);
  const [acceptance, setAcceptance] = useState<AcceptanceData | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    const token = localStorage.getItem('token') || '';
    fetch(`/api/admin/reservations/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error('No se pudo cargar la reserva');
        return res.json();
      })
      .then((data) => {
        setAcceptance(data.acceptance || null);
        setReservation(data.reservation);
      })
      .catch((err) => setError(err.message));
  }, [id]);

  useEffect(() => {
    if (reservation) {
      setTimeout(() => window.print(), 500);
    }
  }, [reservation]);

  if (error) {
    return <div className="p-8 text-red-600">{error}</div>;
  }
  if (!reservation) {
    return <div className="p-8 text-gray-500">Cargando contrato...</div>;
  }

  // reservations no guarda los datos del cliente sin cuenta: se usan los de la aceptación electrónica
  const r = {
    ...reservation,
    name: reservation.name || acceptance?.customer_name || '',
    email: reservation.email || acceptance?.customer_email || '',
    phone: reservation.phone || acceptance?.customer_phone || '',
  };
  const slot = TIME_SLOT_HOURS[r.time_slot] || { label: r.time_slot, start: '-', end: '-' };
  const eventLabel = EVENT_TYPE_LABELS[r.event_type] || r.event_type;
  const extras = Array.isArray(r.extras) && r.extras.length > 0 ? r.extras.join(', ') : 'Ninguno';
  const basePrice = parseFloat(r.base_price || '0');
  const totalPrice = parseFloat(r.total_price || '0');
  const extrasPrice = totalPrice - basePrice;
  const deposit = parseFloat(r.deposit_amount || '0');
  const fianza = SECURITY_DEPOSIT_AMOUNT;
  const remaining = totalPrice - deposit;

  return (
    <>
      <Head>
        <title>Contrato reserva #{r.id} - HappyHub</title>
      </Head>

      <style jsx global>{`
        @media print {
          @page { size: A4; margin: 20mm 15mm; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
        .contract { font-family: 'Segoe UI', Arial, sans-serif; max-width: 210mm; margin: 0 auto; padding: 20px; color: #1a1a1a; font-size: 13px; line-height: 1.6; }
        .contract h1 { font-size: 18px; text-align: center; margin-bottom: 4px; }
        .contract h2 { font-size: 14px; margin-top: 20px; margin-bottom: 8px; border-bottom: 1px solid #ccc; padding-bottom: 4px; }
        .contract table { width: 100%; border-collapse: collapse; margin: 8px 0; }
        .contract table th, .contract table td { border: 1px solid #ccc; padding: 6px 10px; text-align: left; font-size: 12px; }
        .contract table th { background: #f5f5f5; font-weight: 600; }
        .contract .parties { display: flex; gap: 40px; margin-bottom: 16px; }
        .contract .party { flex: 1; }
        .contract .party h3 { font-size: 13px; margin-bottom: 4px; font-weight: 700; }
        .contract .party p { margin: 2px 0; font-size: 12px; }
        .contract .signatures { display: flex; gap: 40px; margin-top: 40px; page-break-inside: avoid; }
        .contract .sig-block { flex: 1; text-align: center; padding-top: 60px; border-top: 1px solid #333; }
        .contract .clause { margin-bottom: 6px; }
        .contract .clause li { margin-bottom: 3px; }
        .contract .footer-note { font-size: 10px; color: #666; text-align: center; margin-top: 30px; border-top: 1px solid #ddd; padding-top: 8px; }
        @media print { .no-print { display: none !important; } }
      `}</style>

      <div className="contract">
        <h1>CONTRATO DE ARRENDAMIENTO TEMPORAL DE ESPACIO PARA EVENTOS PRIVADOS</h1>
        <hr />

        <div className="parties">
          <div className="party">
            <h3>ARRENDADOR</h3>
            <p><strong>HAPPYHUB CB</strong> (HappyHub)</p>
            <p>NIF: E26649814</p>
            <p>C/ Rovellat, 27, 08950 Esplugues de Llobregat, Barcelona</p>
            <p>Email: hola@happyhub.es</p>
            <p>Tel: +34 624 645 517</p>
          </div>
          <div className="party">
            <h3>ARRENDATARIO</h3>
            <p><strong>{r.name}</strong></p>
            <p>Email: {r.email}</p>
            <p>Tel: {r.phone}</p>
            <p>DNI/NIE: _________________</p>
          </div>
        </div>

        <h2>1. Objeto del contrato</h2>
        <p>HappyHub cede al Cliente el uso temporal y exclusivo del espacio de eventos para la celebracion del siguiente evento:</p>
        <table>
          <tbody>
            <tr><th>Tipo de evento</th><td>{eventLabel}</td></tr>
            <tr><th>Fecha</th><td>{formatDateDDMMYYYY(r.event_date)}</td></tr>
            <tr><th>Franja horaria</th><td>{slot.label}: {slot.start} - {slot.end}</td></tr>
            <tr><th>Numero de invitados</th><td>{r.guests} personas</td></tr>
            <tr><th>Servicios adicionales</th><td>{extras}</td></tr>
            <tr><th>Mensaje del cliente</th><td>{r.customer_message || '-'}</td></tr>
          </tbody>
        </table>

        <h2>2. Precio y forma de pago</h2>
        <table>
          <tbody>
            <tr><th>Alquiler del espacio</th><td>{basePrice.toFixed(2)} EUR</td></tr>
            <tr><th>Servicios adicionales</th><td>{extrasPrice > 0 ? extrasPrice.toFixed(2) : '0.00'} EUR</td></tr>
            <tr><th><strong>Precio total</strong></th><td><strong>{totalPrice.toFixed(2)} EUR</strong></td></tr>
            <tr><th>Senal (30% del total)</th><td>{deposit.toFixed(2)} EUR - al aprobar la reserva (tarjeta o Bizum)</td></tr>
            <tr><th>Resto a abonar</th><td>{remaining.toFixed(2)} EUR - el dia del evento, antes de empezar (solo tarjeta)</td></tr>
            <tr><th>Fianza (bloqueo en tarjeta)</th><td>{fianza.toFixed(2)} EUR - el dia del evento, antes de empezar</td></tr>
          </tbody>
        </table>

        <div className="clause">
          <p><strong>2.1. Senal (paga y senal)</strong></p>
          <p>El Cliente abona, en las 24 horas siguientes a la aprobacion de la reserva y con tarjeta o Bizum, la cantidad de <strong>{deposit.toFixed(2)} EUR</strong> en concepto de senal confirmatoria (arras confirmatorias, art. 1124 del Codigo Civil). Este importe se descontara del precio total.</p>
        </div>

        <div className="clause">
          <p><strong>2.2. Resto del pago</strong></p>
          <p>El importe restante de <strong>{remaining.toFixed(2)} EUR</strong> se abona el dia del evento, antes de su inicio, con tarjeta bancaria mediante enlace o codigo QR en el movil del Cliente o mediante datafono. <strong>No se admite Bizum para el resto.</strong></p>
        </div>

        <div className="clause">
          <p><strong>2.3. Fianza</strong></p>
          <p>El dia del evento, antes de su inicio y junto con el resto del pago, se bloquean <strong>{fianza.toFixed(2)} EUR</strong> en una tarjeta de credito o debito del Cliente (preautorizacion). No es un cobro:</p>
          <ul>
            <li>Con tarjeta de credito, el importe reduce el credito disponible; con tarjeta de debito, queda retenido del saldo hasta su liberacion. Algunas tarjetas prepago o virtuales no admiten bloqueos. No se admite Bizum ni efectivo para la fianza.</li>
            <li>HappyHub libera el bloqueo tras revisar el espacio, como maximo en 7 dias si se realizo mediante enlace o QR (con datafono el bloqueo dura menos: unos 2 dias, hasta 5 con Visa). La entidad del Cliente puede tardar unos dias mas en reflejar la liberacion.</li>
            <li>Si se aprecian desperfectos o proceden los cargos de las clausulas 3.1 o 4.2, HappyHub lo comunicara por escrito (email o WhatsApp) con fotografias y cobrara de la fianza solo el importe justificado, liberando el resto. Si el coste supera la fianza, HappyHub podra reclamar la diferencia.</li>
          </ul>
        </div>

        <div className="clause">
          <p><strong>2.4. Sin pago del resto y bloqueo de la fianza no puede comenzar el evento.</strong> El tiempo empleado en completarlos cuenta dentro de la franja contratada.</p>
        </div>

        <div className="clause">
          <p><strong>2.5. Metodos de pago:</strong> senal con tarjeta o Bizum; resto y fianza solo con tarjeta (credito o debito).</p>
        </div>

        <h2>3. Condiciones de uso del espacio</h2>
        <p>3.1. El espacio se entrega al Cliente en perfecto estado de uso. El Cliente se compromete a devolver el espacio completamente recogido y en las mismas condiciones en que le fue entregado. En caso contrario, se cobrara un importe de <strong>50 EUR</strong> en concepto de limpieza posterior, que podra cobrarse de la fianza.</p>
        <p>3.2. El aforo maximo del espacio es de <strong>50 personas</strong>.</p>
        <p>3.3. El Cliente es responsable de la supervision de todos los asistentes al evento, especialmente de los menores de edad.</p>
        <p>3.4. Esta prohibido fumar cigarrillos y usar vapers o cigarrillos electronicos en el interior del espacio.</p>
        <p>3.5. El Cliente firmante es el responsable de la reserva: debe ser mayor de edad, estar presente durante todo el evento y responde del comportamiento de todos los asistentes.</p>
        <p>3.6. Esta prohibido servir o permitir el consumo de bebidas alcoholicas a menores de 18 anos. Las bebidas alcoholicas que aporte el Cliente son solo para consumo privado; esta prohibida su venta.</p>
        <p>3.7. No se permite el uso de confeti, purpurina, bengalas, pirotecnia ni velas de chispa, ni fijar elementos en paredes o techos con clavos, tornillos, celo, cinta americana o pegamento. No se admiten mascotas, salvo animales de asistencia acreditados. No se permite conectar equipos de sonido propios.</p>
        <p>3.8. Los proveedores externos que contrate el Cliente (catering, animacion, hinchables, etc.) son responsabilidad del Cliente y deberan cumplir la normativa aplicable y disponer de su propio seguro de responsabilidad civil.</p>

        <h2>4. Horarios</h2>
        <p>4.1. Acceso 30 minutos antes del inicio del evento para preparacion (sin coste adicional). Si se necesita mas tiempo, se puede contratar 1 hora adicional de acceso anticipado por 30 EUR.</p>
        <p>4.2. El evento debera finalizar a la hora contratada. Prolongacion no autorizada: 50 EUR por hora o fraccion.</p>
        <p>4.3. 30 minutos despues de la hora de finalizacion para recoger pertenencias.</p>
        <p>4.4. HappyHub no ofrece franja de noche. La franja de tarde solo puede ampliarse, como maximo hasta las 23:00, si se acuerda expresamente por escrito y se abona la tarifa adicional correspondiente.</p>

        <h2>5. Derecho de admision y finalizacion del evento</h2>
        <p>5.1. HappyHub se reserva el derecho de admision y podra negar el acceso o pedir que abandone el espacio a cualquier persona con signos evidentes de embriaguez o consumo de drogas, comportamiento violento o que moleste a los vecinos, que ponga en riesgo la seguridad, o cuya entrada supere el aforo.</p>
        <p>5.2. Ante un incumplimiento grave de este contrato (aforo, horario, ruido, alcohol a menores, tabaco o vapeo, o comportamientos de riesgo) no corregido tras aviso al Cliente, HappyHub podra dar por finalizado el evento sin derecho a devolucion del importe pagado.</p>

        <h2>6. Politica de cancelacion</h2>
        <table>
          <thead><tr><th>Plazo</th><th>Consecuencia</th></tr></thead>
          <tbody>
            <tr><td>15 dias o mas antes</td><td>Devolucion del 100% de la senal</td></tr>
            <tr><td>Entre 14 y 3 dias antes</td><td>No se devuelve la senal; se puede cambiar la fecha del evento, sujeto a disponibilidad</td></tr>
            <tr><td>Menos de 3 dias</td><td>Se retiene la senal, sin cambio de fecha</td></tr>
          </tbody>
        </table>
        <p>Si la reserva se cancela, no se bloquea ninguna fianza.</p>
        <p>Al tratarse de un servicio de ocio para una fecha determinada, no es aplicable el derecho de desistimiento de 14 dias (art. 103.l del Real Decreto Legislativo 1/2007).</p>

        <h2>7. Proteccion de datos</h2>
        <p>Los datos personales seran tratados conforme al RGPD y la LOPDGDD. Finalidad: gestion de la reserva. El Cliente puede ejercer sus derechos en hola@happyhub.es. HappyHub no publicara imagenes de los asistentes sin su consentimiento expreso (o el de sus padres o tutores, en el caso de menores).</p>

        <h2>8. Legislacion aplicable</h2>
        <p>Este contrato se rige por la legislacion espanola. Para cualquier controversia, las partes se someten a los juzgados de Barcelona, salvo que la normativa de consumidores establezca otro fuero.</p>
        <p>El Cliente declara haber leido y aceptado los terminos y condiciones publicados en www.happyhub.es/terminos, que forman parte de este contrato.</p>

        <h2>9. Aceptacion electronica</h2>
        {acceptance ? (
          <>
            <p>El Cliente acepto electronicamente estos terminos y condiciones en la web de HappyHub al solicitar la reserva. Datos de la aceptacion:</p>
            <table>
              <tbody>
                <tr><th>Fecha y hora</th><td>{formatDateTime(acceptance.accepted_at)}</td></tr>
                <tr><th>Aceptado por</th><td>{acceptance.customer_name} - {acceptance.customer_email}{acceptance.customer_phone ? ` - ${acceptance.customer_phone}` : ''}</td></tr>
                <tr><th>Version de los terminos</th><td>{acceptance.terms_version}</td></tr>
                <tr><th>Metodo</th><td>Casilla &quot;He leido y acepto&quot; tras leer el texto completo{acceptance.scrolled_to_end ? ' (lectura hasta el final verificada)' : ''}</td></tr>
                <tr><th>Direccion IP</th><td>{acceptance.ip_address || '-'}</td></tr>
                <tr><th>Navegador</th><td style={{ fontSize: 10 }}>{acceptance.user_agent || '-'}</td></tr>
                <tr><th>Huella del texto aceptado (SHA-256)</th><td style={{ fontSize: 10, wordBreak: 'break-all' }}>{acceptance.terms_sha256}</td></tr>
                <tr><th>Huella de la prueba (SHA-256)</th><td style={{ fontSize: 10, wordBreak: 'break-all' }}>{acceptance.evidence_sha256}</td></tr>
                <tr><th>Version de la web</th><td style={{ fontSize: 10 }}>{acceptance.app_commit_sha || '-'}</td></tr>
                <tr><th>Email de confirmacion enviado</th><td>{formatDateTime(acceptance.confirmation_email_sent_at)}</td></tr>
              </tbody>
            </table>
          </>
        ) : (
          <p>No consta aceptacion electronica para esta reserva (reserva anterior al registro de pruebas o creada desde el panel). Se requiere la firma manuscrita de este contrato.</p>
        )}

        <div className="signatures">
          <div className="sig-block">
            <p><strong>ARRENDADOR (HAPPYHUB CB)</strong></p>
            <p>Fecha: {formatToday()}</p>
          </div>
          <div className="sig-block">
            <p><strong>ARRENDATARIO ({r.name})</strong></p>
            <p>Fecha: {formatToday()}</p>
          </div>
        </div>

        <div className="footer-note">
          Contrato generado automaticamente por el sistema de reservas de HappyHub. Numero de reserva: #{r.id}
        </div>
      </div>
    </>
  );
}
