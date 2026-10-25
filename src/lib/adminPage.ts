import type { GetServerSidePropsContext, Redirect } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

/**
 * Comprobación de admin en el servidor para páginas con contenido privado.
 * Devuelve la redirección a /login si la sesión no es de admin; null si puede pasar.
 */
export async function adminOnlyRedirect(ctx: GetServerSidePropsContext): Promise<{ redirect: Redirect } | null> {
  const session = await getServerSession(ctx.req, ctx.res, authOptions);
  if ((session?.user as any)?.role === 'admin') return null;
  return { redirect: { destination: '/login', permanent: false } };
}
