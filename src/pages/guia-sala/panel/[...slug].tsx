import type { GetStaticPaths, GetStaticProps } from 'next';
import GuideDoc, { type GuideDocProps } from '@/components/guide/GuideDoc';
import { getGuideDocProps, getGuidePaths } from '@/lib/kb';

export const getStaticPaths: GetStaticPaths = async () => ({
  paths: getGuidePaths().map((slug) => ({ params: { slug } })),
  fallback: false,
});

export const getStaticProps: GetStaticProps<GuideDocProps> = async ({ params }) => {
  const props = getGuideDocProps((params?.slug as string[]).join('/'), '/guia-sala/panel');
  return props ? { props } : { notFound: true };
};

export default function GuiaSalaPanelDoc(props: GuideDocProps) {
  return <GuideDoc {...props} kiosk />;
}
