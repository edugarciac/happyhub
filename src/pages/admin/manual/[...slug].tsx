import Head from 'next/head';
import Link from 'next/link';
import type { GetServerSideProps } from 'next';
import { ChevronLeft } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import KbDocBody from '@/components/guide/KbDocBody';
import { adminOnlyRedirect } from '@/lib/adminPage';
import { getManualDocProps } from '@/lib/kbManual';
import { MANUAL_BASE_PATH, type KbDocLink, type KbRenderedDoc } from '@/lib/kbTypes';

interface Props {
  doc: KbRenderedDoc;
  parent: KbDocLink | null;
  children: KbDocLink[];
}

// Contenido privado: se comprueba la sesión en el servidor antes de leer content/interno
export const getServerSideProps: GetServerSideProps<Props> = async (ctx) => {
  const redirect = await adminOnlyRedirect(ctx);
  if (redirect) return redirect;
  const props = getManualDocProps((ctx.params?.slug as string[]).join('/'));
  return props ? { props } : { notFound: true };
};

export default function AdminManualDoc({ doc, parent, children }: Props) {
  const back = parent ?? { href: MANUAL_BASE_PATH, title: 'Manual interno' };

  return (
    <>
      <Head><title>{`${doc.title} — Manual interno`}</title></Head>
      <AdminLayout>
        <div className="max-w-4xl mx-auto p-6">
          <Link href={back.href} className="inline-flex items-center gap-1 text-primary-600 font-semibold hover:text-primary-700 mb-6">
            <ChevronLeft className="w-5 h-5" />
            {back.title}
          </Link>
          <KbDocBody doc={doc} related={children} />
        </div>
      </AdminLayout>
    </>
  );
}
