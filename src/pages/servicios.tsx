import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import { Check } from 'lucide-react';

interface Service {
  id: number;
  title: string;
  price: number | null;
  description: string;
  features: string[];
  image_url: string | null;
}

export default function Servicios() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/services-catalog')
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setServices(
            data.services.map((s: any) => ({
              ...s,
              features: typeof s.features === 'string' ? JSON.parse(s.features) : (s.features || []),
            }))
          );
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const formatPrice = (price: number | null) => {
    if (price === null || price === undefined) return 'Precio a consultar';
    return `${price.toFixed(2)} \u20AC`;
  };

  return (
    <>
      <Head>
        <title>Servicios - Happyhub</title>
        <meta name="description" content="Servicios y extras para tu celebracion. Catering, animacion, decoracion, fotografia y mas." />
      </Head>

      <section className="bg-gradient-to-br from-primary-50 to-secondary-50 pt-28 pb-16">
        <div className="container-custom text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Nuestros Servicios
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Todo lo que necesitas para hacer tu evento inolvidable. Elige los servicios que mejor se adapten a tus necesidades.
          </p>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="container-custom">
          <h2 className="section-title text-center mb-12">Servicios disponibles</h2>

          {loading ? (
            <div className="flex items-center justify-center h-40">
              <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : services.length === 0 ? (
            <div className="text-center py-12 text-gray-500">No hay servicios disponibles</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {services.map((service) => (
                <div key={service.id} className="card overflow-hidden">
                  {service.image_url ? (
                    <div className="relative h-48 -mx-6 -mt-6 mb-4 bg-gray-100">
                      <Image src={service.image_url} alt={service.title} fill className="object-cover" />
                    </div>
                  ) : (
                    <div className="h-48 -mx-6 -mt-6 mb-4 bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center">
                      <span className="text-5xl text-gray-300">📷</span>
                    </div>
                  )}
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{service.title}</h3>
                  <div className="text-primary-600 font-bold text-xl mb-3">{formatPrice(service.price)}</div>
                  <p className="text-gray-600 mb-6">{service.description}</p>

                  {service.features.length > 0 && (
                    <ul className="space-y-2">
                      {service.features.map((feature, index) => (
                        <li key={index} className="flex items-start text-sm">
                          <Check className="w-4 h-4 text-primary-600 mr-2 flex-shrink-0 mt-0.5" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="container-custom text-center">
          <h2 className="section-title mb-4">¿Necesitas algo personalizado?</h2>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Podemos adaptar nuestros servicios a tus necesidades especificas. Contactanos para un presupuesto a medida.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/reservas" className="btn-primary">
              Hacer una reserva
            </Link>
            <Link href="/contacto" className="btn-outline">
              Contactar
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
