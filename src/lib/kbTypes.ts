// Tipos de la base de conocimiento (content/kb), sin dependencias de servidor
// para poder importarlos desde componentes

/** Ruta base del manual interno (solo admins) */
export const MANUAL_BASE_PATH = '/admin/manual';

export type KbType = 'hub' | 'detalle' | 'operacion';
export type KbPage = 'como-funciona' | 'guia-sala';

/** Sección de un documento ya convertida a HTML */
export interface KbRenderedSection {
  id: string;
  heading: string;
  html: string;
}

/** Documento listo para pintar (serializable para getStaticProps) */
export interface KbRenderedDoc {
  slug: string;
  type: KbType;
  title: string;
  emoji: string | null;
  when: string | null;
  parent: string | null;
  href: string;
  introHtml: string;
  sections: KbRenderedSection[];
}

/** Enlace a un documento, para listados */
export interface KbDocLink {
  slug: string;
  type: KbType;
  title: string;
  emoji: string | null;
  when: string | null;
  href: string;
  questions: { id: string; heading: string }[];
}
