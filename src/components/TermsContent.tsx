import Link from 'next/link';

export const TERMS_LAST_UPDATED = '10 de octubre de 2026';

/** Texto completo de los términos y condiciones. Se usa en /terminos y en el paso 3 de la reserva. */
export default function TermsContent() {
  return (
    <>

      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Identificación del titular</h2>
        <p>
          El presente sitio web es propiedad de <strong>HappyHub</strong>, con domicilio en
          C/ Rovellat, 27, 08950 Esplugues de Llobregat, Barcelona, España.
          Correo electrónico de contacto: <a href="mailto:hola@happyhub.es" className="text-primary-600 hover:underline">hola@happyhub.es</a>.
        </p>
      </div>

      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Objeto</h2>
        <p>
          Estos términos y condiciones regulan el acceso y uso del sitio web de HappyHub,
          así como la contratación del servicio de alquiler de espacios para la celebración
          de eventos privados (cumpleaños, comuniones, reuniones familiares, etc.) y los
          servicios complementarios ofrecidos (catering, animación, decoración, fotografía).
        </p>
      </div>

      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Proceso de reserva</h2>
        <ol className="list-decimal list-inside space-y-2">
          <li>El cliente selecciona la fecha y franja horaria deseada y envía la solicitud de reserva a través de la web. En ese momento no se realiza ningún cargo.</li>
          <li>La solicitud queda <strong>pendiente de aprobación</strong>. HappyHub la revisa y la aprueba o rechaza.</li>
          <li>Si se aprueba, el cliente recibe un correo con el enlace para pagar un depósito del <strong>30% del precio total</strong> con tarjeta, o con las instrucciones para pagarlo por Bizum.</li>
          <li>El cliente dispone de <strong>24 horas</strong> desde la aprobación para pagar el depósito. Si no se recibe en ese plazo, la reserva se cancela automáticamente y la fecha queda libre.</li>
          <li>Una vez recibido el depósito, la reserva queda confirmada y HappyHub envía la confirmación por correo.</li>
          <li>El importe restante (70%) se abona antes de comenzar el evento.</li>
        </ol>
      </div>

      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Precios y forma de pago</h2>
        <p>
          Los precios del alquiler del espacio varían según el día de la semana y la franja horaria seleccionada.
          Los precios vigentes se muestran en la web en el momento de la reserva. Los servicios adicionales
          (catering, animación, decoración, fotografía, tarta personalizada) tienen precios a consultar
          que se comunican de forma individualizada.
        </p>
        <p className="mt-3">
          El pago se realiza con tarjeta de crédito/débito (pago seguro mediante Stripe) o por Bizum,
          indicando como concepto el número de reserva.
        </p>
      </div>

      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Política de cancelación</h2>
        <ul className="list-disc list-inside space-y-2">
          <li><strong>3 días o más antes del evento:</strong> cancelación sin coste. Se devuelve el 100% del depósito.</li>
          <li><strong>Menos de 3 días antes del evento:</strong> se retiene el depósito y no se realiza ninguna devolución.</li>
        </ul>
        <p className="mt-3">
          <strong>Cambio de fecha:</strong> gratuito hasta 30 días antes del evento, sujeto a disponibilidad.
        </p>
        <p className="mt-3">
          Las cancelaciones deben comunicarse por escrito a través de correo electrónico o WhatsApp.
          En caso de fuerza mayor debidamente justificada, HappyHub valorará cada caso de forma individual.
        </p>
      </div>

      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Obligaciones del cliente</h2>
        <p>El cliente se compromete a:</p>
        <ul className="list-disc list-inside space-y-2 mt-2">
          <li>Respetar el aforo máximo del espacio, que es de <strong>50 personas</strong>.</li>
          <li>Hacer un uso responsable de las instalaciones y equipamiento.</li>
          <li>Respetar los horarios contratados, incluyendo las horas de inicio y finalización del evento.</li>
          <li>No realizar actividades ilegales ni que atenten contra el orden público.</li>
          <li>Supervisar a los menores de edad que asistan al evento en todo momento.</li>
          <li>Comunicar cualquier incidencia o desperfecto durante el evento.</li>
          <li>Dejar el espacio completamente recogido y en las mismas condiciones en que fue entregado al finalizar el evento. Esto incluye recoger todos los residuos, devolver el mobiliario a su posición original y retirar cualquier decoración o material traído por el cliente.</li>
          <li>No traer ni utilizar equipos de audio o sistemas de sonido propios. El espacio dispone de su propio sistema de sonido. El uso de dispositivos de audio externos no está permitido bajo ninguna circunstancia.</li>
        </ul>
        <div className="mt-4 bg-amber-50 border-l-4 border-amber-400 p-4 rounded-r-lg">
          <p className="font-semibold text-amber-900">Incumplimiento de las obligaciones</p>
          <p className="mt-1 text-amber-900">
            El incumplimiento de cualquiera de estas obligaciones puede tener <strong>repercusiones económicas</strong> para
            el cliente. Por ejemplo, si el espacio no se deja completamente recogido y en las mismas condiciones en que fue
            entregado, se cobrará un importe de <strong>50 €</strong> en concepto de limpieza posterior. Esto es
            independiente de la responsabilidad por daños descrita en el apartado 7.
          </p>
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Responsabilidad por daños</h2>
        <p>
          El cliente será responsable de cualquier daño causado a las instalaciones, mobiliario o
          equipamiento durante el evento, ya sea por acción propia o de sus invitados. HappyHub se
          reserva el derecho de reclamar la reparación o reposición de los elementos dañados.
        </p>
        <p className="mt-3">
          HappyHub no se responsabiliza de los objetos personales de los asistentes al evento ni
          de los daños derivados de un uso indebido de las instalaciones.
        </p>
      </div>

      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Propiedad intelectual</h2>
        <p>
          Todos los contenidos del sitio web (textos, imágenes, logotipos, diseño) son propiedad
          de HappyHub o de sus respectivos autores y están protegidos por la legislación de propiedad
          intelectual. Queda prohibida su reproducción, distribución o transformación sin autorización
          expresa.
        </p>
      </div>

      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Protección de datos</h2>
        <p>
          HappyHub trata los datos personales de los clientes conforme al Reglamento General de
          Protección de Datos (RGPD) y la Ley Orgánica 3/2018 de Protección de Datos Personales.
          Los datos recogidos se utilizan exclusivamente para la gestión de reservas y la comunicación
          relacionada con los servicios contratados.
        </p>
        <p className="mt-3">
          Para más información, consulta nuestra{' '}
          <Link href="/politica-privacidad" className="text-primary-600 hover:underline">
            Política de Privacidad
          </Link>.
        </p>
      </div>

      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Modificaciones</h2>
        <p>
          HappyHub se reserva el derecho de modificar estos términos y condiciones en cualquier momento.
          Las modificaciones entrarán en vigor desde su publicación en el sitio web. Las reservas ya
          confirmadas se regirán por los términos vigentes en el momento de su formalización.
        </p>
      </div>

      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Legislación aplicable y jurisdicción</h2>
        <p>
          Estos términos y condiciones se rigen por la legislación española. Para la resolución de
          cualquier controversia, las partes se someten a los juzgados y tribunales de Barcelona,
          salvo que la normativa de consumidores establezca otra jurisdicción.
        </p>
      </div>

      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">12. Contacto</h2>
        <p>
          Para cualquier consulta sobre estos términos y condiciones, puedes contactarnos en:
        </p>
        <ul className="list-disc list-inside space-y-2 mt-2">
          <li>Email: <a href="mailto:hola@happyhub.es" className="text-primary-600 hover:underline">hola@happyhub.es</a></li>
          <li>WhatsApp: <a href="https://wa.me/34624645517" target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">+34 624 645 517</a></li>
          <li>Dirección: C/ Rovellat, 27, 08950 Esplugues de Llobregat, Barcelona</li>
        </ul>
      </div>

    </>
  );
}
