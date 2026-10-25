import type { GetStaticProps } from 'next';
import GuideIndex, { type GuideIndexProps } from '@/components/guide/GuideIndex';
import { getGuideIndexProps } from '@/lib/kb';

export const getStaticProps: GetStaticProps<GuideIndexProps> = async () => ({
  props: getGuideIndexProps('/guia-sala'),
});

export default function GuiaSala(props: GuideIndexProps) {
  return <GuideIndex {...props} kiosk={false} />;
}
