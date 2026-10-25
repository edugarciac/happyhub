// Guía en la tablet de la sala: la abre el botón "Ayuda" del panel de Home Assistant en un iframe
import type { GetStaticProps } from 'next';
import GuideIndex, { type GuideIndexProps } from '@/components/guide/GuideIndex';
import { getGuideIndexProps } from '@/lib/kb';

export const getStaticProps: GetStaticProps<GuideIndexProps> = async () => ({
  props: getGuideIndexProps('/guia-sala/panel'),
});

export default function GuiaSalaPanel(props: GuideIndexProps) {
  return <GuideIndex {...props} kiosk />;
}
