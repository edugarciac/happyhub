import Head from 'next/head';
import Link from 'next/link';

export default function PoliticaPrivacidad() {
  return (
    <>
      <Head>
        <title>Política de Privacidad - HappyHub</title>
        <meta name="description" content="Política de privacidad de HappyHub. Información sobre el tratamiento de datos personales." />
      </Head>

      <section className="bg-gradient-to-br from-primary-50 to-secondary-50 pt-28 pb-16">
        <div className="container-custom text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Política de Privacidad
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
              <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Responsable del tratamiento</h2>
              <ul className="list-disc list-inside space-y-2">
                <li><strong>Titular:</strong> HappyHub</li>
                <li><strong>Domicilio:</strong> C/ Rovellat, 27, 08950 Esplugues de Llobregat, Barcelona, España</li>
                <li><strong>Email:</strong> <a href="mailto:happyhub.rovellat@gmail.com" className="text-primary-600 hover:underline">happyhub.rovellat@gmail.com</a></li>
                <li><strong>Teléfono:</strong> <a href="https://wa.me/34624645517" target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">+34 624 645 517</a> (WhatsApp)</li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Datos que recogemos</h2>
              <p>En función de la interacción con nuestros servicios, podemos recoger los siguientes datos personales:</p>
              <ul className="list-disc list-inside space-y-2 mt-3">
                <li><strong>Datos de identificación:</strong> nombre, apellidos, DNI/NIE (cuando sea necesario para la facturación).</li>
                <li><strong>Datos de contacto:</strong> dirección de correo electrónico, número de teléfono.</li>
                <li><strong>Datos de la reserva:</strong> fecha del evento, tipo de celebración, número de asistentes, servicios contratados.</li>
                <li><strong>Datos de pago:</strong> los datos de tarjeta son procesados directamente por Stripe y HappyHub no almacena datos de tarjeta completos.</li>
                <li><strong>Datos de navegación:</strong> dirección IP, tipo de navegador, páginas visitadas, mediante cookies técnicas.</li>
                <li><strong>Datos de cuenta:</strong> email y contraseña cifrada, en caso de registro en la plataforma.</li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Finalidad del tratamiento</h2>
              <p>Tratamos tus datos personales para las siguientes finalidades:</p>
              <ul className="list-disc list-inside space-y-2 mt-3">
                <li>Gestionar las reservas de espacios y servicios complementarios.</li>
                <li>Procesar los pagos y emitir facturas.</li>
                <li>Comunicar información relevante sobre tu reserva (confirmaciones, recordatorios, cambios).</li>
                <li>Atender consultas realizadas por email, WhatsApp o formulario de contacto.</li>
                <li>Gestionar las reseñas y valoraciones publicadas en la plataforma.</li>
                <li>Mejorar nuestros servicios y la experiencia de usuario en la web.</li>
                <li>Cumplir con las obligaciones legales y fiscales aplicables.</li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Base legal del tratamiento</h2>
              <ul className="list-disc list-inside space-y-2">
                <li><strong>Ejecución de un contrato:</strong> el tratamiento es necesario para gestionar la reserva y prestar el servicio contratado (art. 6.1.b RGPD).</li>
                <li><strong>Consentimiento:</strong> para el envío de comunicaciones comerciales o la publicación de reseñas (art. 6.1.a RGPD).</li>
                <li><strong>Obligación legal:</strong> para el cumplimiento de obligaciones fiscales y contables (art. 6.1.c RGPD).</li>
                <li><strong>Interés legítimo:</strong> para la mejora del servicio y la seguridad de la plataforma (art. 6.1.f RGPD).</li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Conservación de los datos</h2>
              <p>
                Los datos personales se conservarán mientras sea necesario para la finalidad para la que fueron
                recogidos y, en todo caso, durante los plazos legalmente establecidos:
              </p>
              <ul className="list-disc list-inside space-y-2 mt-3">
                <li><strong>Datos de reservas y facturación:</strong> 5 años (obligación fiscal).</li>
                <li><strong>Datos de contacto:</strong> mientras exista relación comercial o hasta que se solicite la supresión.</li>
                <li><strong>Datos de cuenta:</strong> hasta que el usuario solicite la baja.</li>
                <li><strong>Datos de navegación:</strong> máximo 12 meses.</li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Destinatarios de los datos</h2>
              <p>Tus datos podrán ser comunicados a los siguientes destinatarios:</p>
              <ul className="list-disc list-inside space-y-2 mt-3">
                <li><strong>Stripe:</strong> procesamiento de pagos con tarjeta. Stripe actúa como encargado del tratamiento y cumple con el RGPD.</li>
                <li><strong>Google (Google Calendar):</strong> gestión de disponibilidad del espacio.</li>
                <li><strong>Proveedores de servicios:</strong> cuando el cliente contrate servicios adicionales (catering, animación, etc.), se compartirán los datos estrictamente necesarios para la prestación del servicio.</li>
                <li><strong>Administraciones públicas:</strong> cuando exista obligación legal (Agencia Tributaria, etc.).</li>
              </ul>
              <p className="mt-3">
                No se realizan transferencias internacionales de datos fuera del Espacio Económico Europeo,
                salvo las derivadas del uso de servicios de Stripe y Google, que cuentan con las garantías
                adecuadas (cláusulas contractuales tipo y/o decisión de adecuación).
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Derechos del usuario</h2>
              <p>Como titular de los datos, tienes derecho a:</p>
              <ul className="list-disc list-inside space-y-2 mt-3">
                <li><strong>Acceso:</strong> conocer qué datos personales tratamos sobre ti.</li>
                <li><strong>Rectificación:</strong> solicitar la corrección de datos inexactos o incompletos.</li>
                <li><strong>Supresión:</strong> solicitar la eliminación de tus datos cuando ya no sean necesarios.</li>
                <li><strong>Oposición:</strong> oponerte al tratamiento de tus datos en determinadas circunstancias.</li>
                <li><strong>Limitación:</strong> solicitar la limitación del tratamiento en los casos previstos por la ley.</li>
                <li><strong>Portabilidad:</strong> recibir tus datos en un formato estructurado y de uso común.</li>
              </ul>
              <p className="mt-3">
                Para ejercer estos derechos, envía un correo a{' '}
                <a href="mailto:happyhub.rovellat@gmail.com" className="text-primary-600 hover:underline">happyhub.rovellat@gmail.com</a>{' '}
                indicando tu nombre completo y el derecho que deseas ejercer. Responderemos en un plazo
                máximo de 30 días.
              </p>
              <p className="mt-3">
                Asimismo, tienes derecho a presentar una reclamación ante la{' '}
                <strong>Agencia Española de Protección de Datos (AEPD)</strong> si consideras que el
                tratamiento de tus datos no es conforme a la normativa vigente.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Cookies</h2>
              <p>
                Este sitio web utiliza cookies técnicas necesarias para el funcionamiento de la plataforma
                (gestión de sesión, autenticación, preferencias). No utilizamos cookies de terceros con
                fines publicitarios.
              </p>
              <p className="mt-3">
                Puedes configurar tu navegador para rechazar cookies, aunque esto podría afectar al
                funcionamiento de algunas funcionalidades de la web.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Seguridad</h2>
              <p>
                HappyHub adopta las medidas técnicas y organizativas adecuadas para garantizar la seguridad
                de los datos personales y evitar su alteración, pérdida, tratamiento o acceso no autorizado.
                Entre otras medidas: cifrado de contraseñas, conexiones HTTPS, acceso restringido a los
                datos y procesamiento de pagos a través de Stripe (certificado PCI DSS).
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Modificaciones</h2>
              <p>
                HappyHub se reserva el derecho de modificar esta política de privacidad para adaptarla a
                novedades legislativas o cambios en nuestros servicios. Cualquier cambio será publicado en
                esta página con la fecha de actualización.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Contacto</h2>
              <p>
                Para cualquier consulta relacionada con la protección de datos, puedes contactarnos en:
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
            Si tienes preguntas sobre cómo tratamos tus datos, no dudes en contactarnos.
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
