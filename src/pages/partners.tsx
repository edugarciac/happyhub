import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import { GetServerSideProps } from 'next';
import { query } from '@/lib/db';
import { Users, ExternalLink, Phone, Building2 } from 'lucide-react';

interface Partner {
  id: number;
  name: string;
  service_type: string;
  description: string | null;
  logo_url: string | null;
  website: string | null;
  phone: string | null;
}

interface Props {
  partners: Partner[];
}

export const getServerSideProps: GetServerSideProps<Props> = async () => {
  const result = await query(
    'SELECT id, name, service_type, description, logo_url, website, phone FROM partners WHERE active = true ORDER BY name ASC'
  );
  return { props: { partners: result.rows } };
};

export default function PartnersPage({ partners }: Props) {
  return (
    <>
      <Head>
        <title>Partners - HappyHub</title>
        <meta name="description" content="Conoce las empresas que forman parte del hub de HappyHub. Profesionales seleccionados para hacer tu evento perfecto." />
      </Head>

      <section className="bg-gradient-to-br from-primary-50 to-secondary-50 pt-28 pb-16">
        <div className="container-custom text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Nuestros Partners
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            HappyHub es un hub de empresas que colaboran para hacer tus eventos inolvidables.
            Cada partner ha sido seleccionado por su profesionalidad, calidad y compromiso.
          </p>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="container-custom">
          {partners.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Building2 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>Proximamente: nuestros partners</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {partners.map((partner) => (
                <div key={partner.id} className="card">
                  <div className="flex items-center space-x-4 mb-4">
                    {partner.logo_url && (
                      <Image
                        src={partner.logo_url}
                        alt={partner.name}
                        width={56}
                        height={56}
                        className="rounded-xl object-cover w-14 h-14"
                      />
                    )}
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">{partner.name}</h3>
                      <span className="text-sm text-primary-600 font-medium">{partner.service_type}</span>
                    </div>
                  </div>

                  {partner.description && (
                    <p className="text-gray-600 mb-4">{partner.description}</p>
                  )}

                  <div className="flex items-center gap-4 mt-auto">
                    {partner.website && (
                      <a
                        href={partner.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors"
                      >
                        Visitar web
                        <ExternalLink className="w-3.5 h-3.5 ml-1" />
                      </a>
                    )}
                    {partner.phone && (
                      <a
                        href={`tel:${partner.phone}`}
                        className="inline-flex items-center text-sm text-gray-600 hover:text-gray-800 transition-colors"
                      >
                        <Phone className="w-3.5 h-3.5 mr-1" />
                        {partner.phone}
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="py-16 bg-gray-50">
        <div className="container-custom text-center">
          <div className="max-w-2xl mx-auto">
            <Users className="w-12 h-12 text-primary-600 mx-auto mb-4" />
            <h2 className="section-title mb-4">Unete al hub</h2>
            <p className="text-xl text-gray-600 mb-4">
              Eres una empresa de servicios para eventos y quieres formar parte de HappyHub?
              Estamos buscando profesionales comprometidos con la calidad.
            </p>
            <p className="text-gray-500 mb-8">
              Como partner tendras visibilidad ante nuestros clientes, acceso a reservas y un canal
              directo de comunicacion para coordinar cada evento.
            </p>
            <Link href="/contacto" className="btn-primary">
              Contacta con nosotros
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
