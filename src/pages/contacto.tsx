import { useState } from 'react';
import Head from 'next/head';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { contactSchema, ContactFormData } from '@/utils/validators';
import { Mail, Phone, MapPin, Clock, Send } from 'lucide-react';

export default function Contacto() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
  });

  const onSubmit = async (data: ContactFormData) => {
    setIsSubmitting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      console.log('Contact form submitted:', data);
      setSubmitSuccess(true);
      reset();
      setTimeout(() => setSubmitSuccess(false), 5000);
    } catch (error) {
      console.error('Error submitting contact form:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Head>
        <title>Contacto - HappyHub</title>
        <meta name="description" content="Contacta con HappyHub para resolver tus dudas sobre eventos y reservas" />
      </Head>

      <section className="bg-gradient-to-br from-primary-50 to-secondary-50 py-16">
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
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Información de contacto</h2>
              <p className="text-gray-600 mb-8">
                Puedes contactarnos por WhatsApp. Respondemos en menos de 24 horas.
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
                      C/ Rovellat, 25<br />
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
              <div className="card">
                <h2 className="text-3xl font-bold text-gray-900 mb-6">Envíanos un mensaje</h2>

                {submitSuccess && (
                  <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-800 rounded-lg">
                    ¡Mensaje enviado correctamente! Te responderemos pronto.
                  </div>
                )}

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  <div>
                    <label className="label">Nombre completo *</label>
                    <input
                      type="text"
                      {...register('name')}
                      className="input-field"
                      placeholder="Tu nombre"
                    />
                    {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
                  </div>

                  <div>
                    <label className="label">Email *</label>
                    <input
                      type="email"
                      {...register('email')}
                      className="input-field"
                      placeholder="tu@email.com"
                    />
                    {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
                  </div>

                  <div>
                    <label className="label">Asunto *</label>
                    <input
                      type="text"
                      {...register('subject')}
                      className="input-field"
                      placeholder="¿En qué podemos ayudarte?"
                    />
                    {errors.subject && <p className="text-red-500 text-sm mt-1">{errors.subject.message}</p>}
                  </div>

                  <div>
                    <label className="label">Mensaje *</label>
                    <textarea
                      {...register('message')}
                      className="input-field resize-none"
                      rows={6}
                      placeholder="Cuéntanos más sobre tu consulta..."
                    />
                    {errors.message && <p className="text-red-500 text-sm mt-1">{errors.message.message}</p>}
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="spinner mr-2" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Enviar mensaje
                      </>
                    )}
                  </button>
                </form>
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
                Sí, disponemos de aparcamiento gratuito para 30 vehículos. También hay buenas conexiones de transporte público.
              </p>
            </details>
          </div>
        </div>
      </section>
    </>
  );
}
