// src/lib/kbManual.ts
// Manual interno (/admin/manual, solo admins). Módulo aparte de kb.ts para que content/interno
// solo se empaquete con las páginas de admin, nunca con las públicas ni con el chatbot.
import path from 'path';
import { docProps, getKbDocs, kbDocLink, loadKb } from './kb';
import { MANUAL_BASE_PATH } from './kbTypes';

export const MANUAL_DIR = path.join(process.cwd(), 'content', 'interno');

export function getManualIndexProps() {
  const docs = loadKb(MANUAL_DIR);
  return {
    operations: getKbDocs({ type: 'operacion' }, docs).map((d) => kbDocLink(d, MANUAL_BASE_PATH)),
    // Temas: documentos de referencia sin padre; sus subpáginas se ven dentro de cada tema
    docs: docs.filter((d) => d.type !== 'operacion' && !d.parent).map((d) => kbDocLink(d, MANUAL_BASE_PATH)),
  };
}

export function getManualDocProps(slug: string) {
  return docProps(loadKb(MANUAL_DIR), slug, MANUAL_BASE_PATH);
}
