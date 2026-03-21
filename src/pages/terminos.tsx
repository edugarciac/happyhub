import Head from 'next/head';
import Link from 'next/link';

export default function Terminos() {
  return (
    <>
      <Head>
        <title>Términos y Condiciones - HappyHub</title>
        <meta name="description" content="Términos y condiciones de uso del servicio de alquiler de espacios para eventos de HappyHub." />
      </Head>

      <section className="bg-gradient-to-br from-primary-50 to-secondary-50 pt-28 pb-16">
        <div className="container-custom text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Términos y Condiciones
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Última actualización: 9 de marzo de 2026
          </p>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="container-custom max-w-4xl">
          <div className="prose prose-lg max-w-none text-gray-700 space-y-8">

            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Identificación del titular</h2>
              <p>
                El presente sitio web es propiedad de <strong>HappyHub</strong>, con domicilio en
                C/ Rovellat, 27, 08950 Esplugues de Llobregat, Barcelona, España.
                Correo electrónico de contacto: <a href="mailto:happyhub.rovellat@gmail.com" className="text-primary-600 hover:underline">happyhub.rovellat@gmail.com</a>.
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
                <li>El cliente selecciona la fecha y franja horaria deseada a través de la web o contactando por WhatsApp.</li>
                <li>HappyHub confirma la disponibilidad de la fecha solicitada.</li>
                <li>El cliente completa el formulario de reserva con sus datos y los detalles del evento.</li>
                <li>Para formalizar la reserva, el cliente abona un depósito del <strong>30% del precio total</strong>.</li>
                <li>Una vez recibido el depósito, HappyHub envía la confirmación de reserva.</li>
                <li>El importe restante (70%) se abona antes o el día del evento.</li>
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
                El pago se realiza a través de los medios habilitados en la plataforma (tarjeta de crédito/débito
                mediante Stripe) o por transferencia bancaria previa coordinación.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Política de cancelación</h2>
              <ul className="list-disc list-inside space-y-2">
                <li><strong>Más de 15 días antes del evento:</strong> cancelación sin coste. Se devuelve el 100% del depósito.</li>
                <li><strong>Entre 15 y 7 días antes del evento:</strong> se retiene el 50% del depósito.</li>
                <li><strong>Menos de 7 días antes del evento:</strong> no se realizan devoluciones del depósito.</li>
              </ul>
              <p className="mt-3">
                Las cancelaciones deben comunicarse por escrito a través de correo electrónico o WhatsApp.
                En caso de fuerza mayor debidamente justificada, HappyHub valorará cada caso de forma individual.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Obligaciones del cliente</h2>
              <p>El cliente se compromete a:</p>
              <ul className="list-disc list-inside space-y-2 mt-2">
                <li>Respetar el aforo máximo del espacio comunicado en el momento de la reserva.</li>
                <li>Hacer un uso responsable de las instalaciones y equipamiento.</li>
                <li>Respetar los horarios contratados, incluyendo las horas de inicio y finalización del evento.</li>
                <li>No realizar actividades ilegales ni que atenten contra el orden público.</li>
                <li>Supervisar a los menores de edad que asistan al evento en todo momento.</li>
                <li>Comunicar cualquier incidencia o desperfecto durante el evento.</li>
                <li>Dejar el espacio en condiciones razonables de orden al finalizar el evento.</li>
              </ul>
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
                <li>Email: <a href="mailto:happyhub.rovellat@gmail.com" className="text-primary-600 hover:underline">happyhub.rovellat@gmail.com</a></li>
                <li>WhatsApp: <a href="https://wa.me/34624645517" target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">+34 624 645 517</a></li>
                <li>Dirección: C/ Rovellat, 27, 08950 Esplugues de Llobregat, Barcelona</li>
              </ul>
            </div>

          </div>
        </div>
      </section>

      <section className="py-16 bg-gray-50">
        <div className="container-custom text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">¿Tienes alguna duda?</h2>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Si tienes preguntas sobre nuestros términos, no dudes en contactarnos.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/contacto" className="btn-primary">
              Contactar
            </Link>
            <Link href="/" className="btn-outline">
              Volver al inicio
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
