import Head from 'next/head';
import Link from 'next/link';
import type { GetServerSideProps } from 'next';
import { BookLock, ChevronRight } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import { adminOnlyRedirect } from '@/lib/adminPage';
import { getManualIndexProps } from '@/lib/kbManual';
import type { KbDocLink } from '@/lib/kbTypes';

interface Props {
  operations: KbDocLink[];
  docs: KbDocLink[];
}

// Contenido privado: se comprueba la sesión en el servidor antes de leer content/interno
export const getServerSideProps: GetServerSideProps<Props> = async (ctx) => {
  const redirect = await adminOnlyRedirect(ctx);
  if (redirect) return redirect;
  return { props: getManualIndexProps() };
};

function DocList({ items }: { items: KbDocLink[] }) {
  return (
    <div className="grid sm:grid-cols-2 gap-3">
      {items.map((d) => (
        <Link
          key={d.slug}
          href={d.href}
          className="flex items-center justify-between gap-3 bg-white rounded-xl border border-gray-200 hover:border-primary-400 p-4"
        >
          <span>
            <span className="block font-semibold text-gray-900">
              {d.emoji && <span className="mr-2">{d.emoji}</span>}
              {d.title}
            </span>
            {(d.when ?? d.summary) && <span className="block text-sm text-gray-500 mt-0.5">{d.when ?? d.summary}</span>}
          </span>
          <ChevronRight className="w-5 h-5 text-primary-600 flex-shrink-0" />
        </Link>
      ))}
    </div>
  );
}

export default function AdminManual({ operations, docs }: Props) {
  return (
    <>
      <Head><title>Manual interno — Admin HappyHub</title></Head>
      <AdminLayout>
        <div className="max-w-4xl mx-auto p-6">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <BookLock className="w-6 h-6 text-primary-600" />
              Manual interno
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Operaciones y explicaciones del negocio. Solo visible para administradores; se edita en <code>content/interno/</code> y nunca se muestra a los clientes.
            </p>
          </div>

          <section className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Operaciones</h2>
            <DocList items={operations} />
          </section>

          {docs.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Explicaciones por tema</h2>
              <DocList items={docs} />
            </section>
          )}
        </div>
      </AdminLayout>
    </>
  );
}
