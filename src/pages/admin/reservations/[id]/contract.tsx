import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

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

const TIME_SLOT_HOURS: Record<string, { label: string; start: string; end: string }> = {
  morning: { label: 'Manana', start: '10:00', end: '14:00' },
  afternoon: { label: 'Tarde', start: '16:00', end: '20:00' },
  night: { label: 'Noche', start: '22:00', end: '02:00' },
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
      .then((data) => setReservation(data.reservation))
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

  const r = reservation;
  const slot = TIME_SLOT_HOURS[r.time_slot] || { label: r.time_slot, start: '-', end: '-' };
  const eventLabel = EVENT_TYPE_LABELS[r.event_type] || r.event_type;
  const extras = Array.isArray(r.extras) && r.extras.length > 0 ? r.extras.join(', ') : 'Ninguno';
  const basePrice = parseFloat(r.base_price || '0');
  const totalPrice = parseFloat(r.total_price || '0');
  const extrasPrice = totalPrice - basePrice;
  const deposit = parseFloat(r.deposit_amount || '0');
  const fianza = r.security_deposit ? parseFloat(r.security_deposit) : 200;
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
            <p><strong>HappyHub</strong></p>
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
            <tr><th>Senal (30% del total)</th><td>{deposit.toFixed(2)} EUR</td></tr>
            <tr><th>Fianza por desperfectos</th><td>{fianza.toFixed(2)} EUR</td></tr>
            <tr><th>Resto a abonar</th><td>{remaining.toFixed(2)} EUR</td></tr>
          </tbody>
        </table>

        <div className="clause">
          <p><strong>2.1. Senal (paga y senal)</strong></p>
          <p>El Cliente abona en el momento de la firma del presente contrato la cantidad de <strong>{deposit.toFixed(2)} EUR</strong> en concepto de senal confirmatoria (arras confirmatorias, art. 1124 del Codigo Civil). Este importe se descontara del precio total.</p>
        </div>

        <div className="clause">
          <p><strong>2.2. Fianza por desperfectos</strong></p>
          <p>El Cliente deposita adicionalmente la cantidad de <strong>{fianza.toFixed(2)} EUR</strong> en concepto de fianza para cubrir posibles desperfectos en las instalaciones, mobiliario o equipamiento. Esta fianza:</p>
          <ul>
            <li>Se retendra hasta un maximo de <strong>15 dias naturales</strong> despues de la celebracion del evento.</li>
            <li>Si no se aprecian desperfectos ni incidencias, se devolvera integramente al Cliente mediante el mismo medio de pago utilizado.</li>
            <li>Si se aprecian desperfectos, HappyHub comunicara al Cliente por escrito (email o WhatsApp) la descripcion de los danos y el coste estimado de reparacion o reposicion, acompanado de fotografias. Se descontara dicho importe de la fianza y se devolvera el resto, si lo hubiera.</li>
            <li>Si el coste de los danos supera el importe de la fianza, HappyHub se reserva el derecho de reclamar la diferencia al Cliente.</li>
          </ul>
        </div>

        <div className="clause">
          <p><strong>2.3. Resto del pago</strong></p>
          <p>El importe restante de <strong>{remaining.toFixed(2)} EUR</strong> debera abonarse antes del dia del evento o, a mas tardar, al inicio del mismo.</p>
        </div>

        <div className="clause">
          <p><strong>2.4. Metodos de pago aceptados:</strong> Tarjeta bancaria, Bizum o efectivo.</p>
        </div>

        <h2>3. Condiciones de uso del espacio</h2>
        <p>3.1. El espacio se entrega al Cliente en perfecto estado de uso. El Cliente se compromete a devolver el espacio en condiciones razonables de orden y limpieza.</p>
        <p>3.2. El aforo maximo del espacio es de <strong>150 personas</strong>.</p>
        <p>3.3. El Cliente es responsable de la supervision de todos los asistentes al evento, especialmente de los menores de edad.</p>

        <h2>4. Horarios</h2>
        <p>4.1. Acceso 1 hora antes del inicio del evento para preparacion (sin coste adicional).</p>
        <p>4.2. El evento debera finalizar a la hora contratada. Prolongacion no autorizada: 50 EUR por hora o fraccion.</p>
        <p>4.3. 30 minutos despues de la hora de finalizacion para recoger pertenencias.</p>

        <h2>5. Politica de cancelacion</h2>
        <table>
          <thead><tr><th>Plazo</th><th>Consecuencia</th></tr></thead>
          <tbody>
            <tr><td>Mas de 15 dias antes</td><td>Devolucion del 100% de la senal</td></tr>
            <tr><td>Entre 15 y 7 dias</td><td>Se retiene el 50% de la senal</td></tr>
            <tr><td>Menos de 7 dias</td><td>No se devuelve la senal</td></tr>
          </tbody>
        </table>
        <p>La fianza se devuelve integramente en caso de cancelacion.</p>

        <h2>6. Proteccion de datos</h2>
        <p>Los datos personales seran tratados conforme al RGPD y la LOPDGDD. Finalidad: gestion de la reserva. El Cliente puede ejercer sus derechos en hola@happyhub.es.</p>

        <h2>7. Legislacion aplicable</h2>
        <p>Este contrato se rige por la legislacion espanola. Para cualquier controversia, las partes se someten a los juzgados de Barcelona.</p>

        <div className="signatures">
          <div className="sig-block">
            <p><strong>ARRENDADOR (HappyHub)</strong></p>
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
