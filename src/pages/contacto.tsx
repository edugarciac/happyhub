import Head from 'next/head';
import { Mail, Phone, MapPin, Clock, MessageCircle, Send, Car } from 'lucide-react';
import { event as gaEvent } from '@/lib/analytics';

export default function Contacto() {
  const whatsappNumber = '34624645517';
  const whatsappMessage = encodeURIComponent('Hola HappyHub, me gustaría obtener más información sobre las reservas.');

  const trackContact = (method: string) => {
    gaEvent('contact_form_submit', { method });
  };

  return (
    <>
      <Head>
        <title>Contacto - HappyHub</title>
        <meta name="description" content="Contacta con HappyHub para resolver tus dudas sobre eventos y reservas" />
      </Head>

      <section className="bg-gradient-to-br from-primary-50 to-secondary-50 pt-28 pb-16">
        <div className="container-custom text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Contáctanos
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Estamos aquí para ayudarte a organizar tu evento perfecto
          </p>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="container-custom">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Escríbenos por WhatsApp</h2>
              <p className="text-gray-600 mb-8">
                Atendemos exclusivamente por WhatsApp para darte una respuesta rápida y personalizada. ¡Chatea con nosotros!
              </p>

              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="bg-primary-100 p-3 rounded-lg">
                    <Phone className="w-6 h-6 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">WhatsApp</h3>
                    <a href="https://wa.me/34624645517" target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">
                      624 645 517
                    </a>
                    <p className="text-sm text-gray-600 mt-1">Solo mensajes y llamadas por WhatsApp</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="bg-primary-100 p-3 rounded-lg">
                    <Mail className="w-6 h-6 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Email</h3>
                    <a href="mailto:happyhub.rovellat@gmail.com" className="text-primary-600 hover:underline">
                      happyhub.rovellat@gmail.com
                    </a>
                    <p className="text-sm text-gray-600 mt-1">Respuesta en 24h</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="bg-primary-100 p-3 rounded-lg">
                    <MapPin className="w-6 h-6 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Dirección</h3>
                    <p className="text-gray-600">
                      C/ Rovellat, 27<br />
                      08950 Esplugues de Llobregat<br />
                      Barcelona, España
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="bg-primary-100 p-3 rounded-lg">
                    <Clock className="w-6 h-6 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Horario de atención</h3>
                    <p className="text-gray-600">
                      Lunes - Viernes: 9:00 - 20:00<br />
                      Sábados: 10:00 - 14:00<br />
                      Domingos: Cerrado
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-8 p-6 bg-primary-50 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">Contáctanos por WhatsApp</h3>
                <p className="text-gray-600 mb-4">
                  Solo atendemos mensajes y llamadas a través de WhatsApp. Escríbenos y te responderemos al instante.
                </p>
                <a
                  href="https://wa.me/34624645517"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary inline-flex items-center"
                >
                  <Phone className="w-4 h-4 mr-2" />
                  Abrir WhatsApp
                </a>
              </div>
            </div>

            <div>
              <div className="card bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200">
                <div className="text-center mb-8">
                  <div className="inline-flex items-center justify-center w-20 h-20 bg-green-500 rounded-full mb-6 animate-pulse">
                    <MessageCircle className="w-10 h-10 text-white" />
                  </div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-4">
                    Contáctanos por WhatsApp
                  </h2>
                  <p className="text-lg text-gray-700 mb-2">
                    Es la forma más rápida de obtener respuesta
                  </p>
                  <p className="text-gray-600">
                    Respondemos en minutos durante horario de atención
                  </p>
                </div>

                <div className="space-y-6">
                  {/* WhatsApp Number Display */}
                  <div className="bg-white rounded-xl p-6 text-center shadow-lg">
                    <p className="text-sm text-gray-600 mb-2">Nuestro número de WhatsApp</p>
                    <a
                      href={`https://wa.me/${whatsappNumber}?text=${whatsappMessage}`}
                      className="text-4xl font-bold text-green-600 hover:text-green-700 transition-colors"
                    >
                      +34 624 645 517
                    </a>
                  </div>

                  {/* Primary CTA */}
                  <a
                    href={`https://wa.me/${whatsappNumber}?text=${whatsappMessage}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => trackContact('whatsapp')}
                    className="btn-primary w-full !bg-green-600 hover:!bg-green-700 !text-white flex items-center justify-center text-lg py-4 shadow-xl hover:shadow-2xl transition-all"
                  >
                    <MessageCircle className="w-6 h-6 mr-3" />
                    Abrir WhatsApp
                  </a>

                  {/* Quick Message Templates */}
                  <div className="bg-white rounded-xl p-6">
                    <h3 className="font-semibold text-gray-900 mb-4 text-center">
                      O usa un mensaje rápido:
                    </h3>
                    <div className="space-y-3">
                      <a
                        href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent('Hola, quiero consultar disponibilidad para una fecha')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block w-full text-left px-4 py-3 bg-gray-50 hover:bg-green-50 border border-gray-200 hover:border-green-300 rounded-lg transition-all group"
                      >
                        <span className="text-gray-700 group-hover:text-green-700">
                          💬 Consultar disponibilidad
                        </span>
                      </a>
                      <a
                        href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent('Hola, me gustaría información sobre precios y servicios')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block w-full text-left px-4 py-3 bg-gray-50 hover:bg-green-50 border border-gray-200 hover:border-green-300 rounded-lg transition-all group"
                      >
                        <span className="text-gray-700 group-hover:text-green-700">
                          💰 Preguntar sobre precios
                        </span>
                      </a>
                      <a
                        href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent('Hola, quiero agendar una visita al espacio')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block w-full text-left px-4 py-3 bg-gray-50 hover:bg-green-50 border border-gray-200 hover:border-green-300 rounded-lg transition-all group"
                      >
                        <span className="text-gray-700 group-hover:text-green-700">
                          🏢 Agendar visita
                        </span>
                      </a>
                    </div>
                  </div>

                  {/* Alternative Contact */}
                  <div className="text-center text-sm text-gray-600 pt-4 border-t border-gray-200">
                    <p>¿Prefieres email?</p>
                    <a
                      href="mailto:happyhub.rovellat@gmail.com"
                      onClick={() => trackContact('email')}
                      className="text-primary-600 hover:underline font-medium"
                    >
                      happyhub.rovellat@gmail.com
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="container-custom">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Como llegar y aparcar</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Tenemos un parking publico gratuito a solo 400 metros del local, en Carrer de Josep Anselm Clave, 114I.
            </p>
          </div>

          <div className="mb-8 rounded-xl overflow-hidden shadow-lg">
            <iframe
              src="https://maps.google.com/maps?saddr=Carrer+de+Josep+Anselm+Clav%C3%A9,+114I,+08950+Esplugues+de+Llobregat&daddr=Carrer+de+Rovellat,+27,+08950+Esplugues+de+Llobregat&dirflg=w&hl=es&output=embed"
              width="100%"
              height="400"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Ruta desde el parking gratuito hasta Happyhub"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            <div className="flex items-start space-x-4 bg-primary-50 rounded-lg p-5">
              <div className="bg-primary-100 p-3 rounded-lg shrink-0">
                <MapPin className="w-6 h-6 text-primary-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Happyhub</h3>
                <p className="text-gray-600 text-sm">
                  C/ Rovellat, 27<br />
                  08950 Esplugues de Llobregat
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4 bg-blue-50 rounded-lg p-5">
              <div className="bg-blue-100 p-3 rounded-lg shrink-0">
                <Car className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Parking gratuito</h3>
                <p className="text-gray-600 text-sm">
                  C/ Josep Anselm Clave, 114I<br />
                  A 400m — 4 minutos andando
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-gray-50">
        <div className="container-custom">
          <h2 className="section-title text-center mb-12">Preguntas frecuentes</h2>
          <div className="max-w-3xl mx-auto space-y-4">
            <details className="bg-white rounded-lg p-6 shadow-sm">
              <summary className="font-semibold text-gray-900 cursor-pointer">
                ¿Cuál es el proceso de reserva?
              </summary>
              <p className="mt-3 text-gray-600">
                1) Consulta disponibilidad, 2) Completa el formulario de reserva, 3) Realiza el depósito del 30%, 4) Recibe la confirmación. ¡Así de fácil!
              </p>
            </details>

            <details className="bg-white rounded-lg p-6 shadow-sm">
              <summary className="font-semibold text-gray-900 cursor-pointer">
                ¿Puedo visitar las instalaciones?
              </summary>
              <p className="mt-3 text-gray-600">
                Sí, puedes agendar una visita contactándonos por teléfono o email. Las visitas se realizan de lunes a viernes en horario de mañana.
              </p>
            </details>

            <details className="bg-white rounded-lg p-6 shadow-sm">
              <summary className="font-semibold text-gray-900 cursor-pointer">
                ¿Qué pasa si necesito cancelar?
              </summary>
              <p className="mt-3 text-gray-600">
                Puedes cancelar sin coste hasta 15 días antes del evento. Entre 15 y 7 días, se retiene el 50% del depósito. Menos de 7 días, no hay devolución.
              </p>
            </details>

            <details className="bg-white rounded-lg p-6 shadow-sm">
              <summary className="font-semibold text-gray-900 cursor-pointer">
                ¿Puedo traer mi propio catering?
              </summary>
              <p className="mt-3 text-gray-600">
                Sí, aunque recomendamos nuestros proveedores de confianza. Si traes catering externo, deberá cumplir con las normativas sanitarias.
              </p>
            </details>

            <details className="bg-white rounded-lg p-6 shadow-sm">
              <summary className="font-semibold text-gray-900 cursor-pointer">
                ¿Hay aparcamiento disponible?
              </summary>
              <p className="mt-3 text-gray-600">
                Si, hay un parking publico gratuito en Carrer de Josep Anselm Clave, 114I, a solo 400 metros del local (unos 4 minutos andando). Puedes ver la ubicacion exacta y el recorrido en el mapa de esta misma pagina.
              </p>
            </details>
          </div>
        </div>
      </section>
    </>
  );
}
