// src/lib/kb.ts
// Base de conocimiento: lee content/kb/*.md (FAQ + guía de la sala) en build.
// Solo para servidor (getStaticProps); los componentes usan los tipos de kbTypes.ts.
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import MarkdownIt from 'markdown-it';
import { z } from 'zod';
import { CONTACT_INFO } from '@/config/contact';
import { MANUAL_BASE_PATH, type KbDocLink, type KbPage, type KbRenderedDoc, type KbType } from './kbTypes';

export const KB_DIR = path.join(process.cwd(), 'content', 'kb');

export const OPERATION_SECTIONS = ['Para qué sirve', 'Cuándo usarla', 'Pasos', 'Qué hace', 'Si algo falla'];

// Rutas de /guia-sala que no pueden usarse como slug de un documento
const RESERVED_SLUGS = ['panel'];

const TOKENS: Record<string, string> = {
  whatsapp: CONTACT_INFO.whatsapp,
};

const frontmatterSchema = z.object({
  type: z.enum(['hub', 'detalle', 'operacion']),
  title: z.string().min(1),
  pages: z.array(z.enum(['como-funciona', 'guia-sala'])).default([]),
  parent: z.string().nullable().default(null),
  order: z.number().default(100),
  emoji: z.string().nullable().default(null),
  tags: z.array(z.string()).default([]),
  when: z.string().nullable().default(null),
});

export interface KbSection {
  heading: string;
  markdown: string;
}

export interface KbDoc {
  slug: string;
  file: string;
  type: KbType;
  title: string;
  pages: KbPage[];
  parent: string | null;
  order: number;
  emoji: string | null;
  tags: string[];
  when: string | null;
  intro: string;
  sections: KbSection[];
}

const md = new MarkdownIt({ html: false, linkify: false });

/** Id de ancla a partir del texto de una pregunta */
export function slugifyHeading(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Divide el cuerpo en la introducción y una sección por cada `## ` */
function splitSections(body: string): { intro: string; sections: KbSection[] } {
  const intro: string[] = [];
  const sections: KbSection[] = [];
  for (const line of body.split('\n')) {
    const heading = line.match(/^## (.+)$/);
    if (heading) {
      sections.push({ heading: heading[1].trim(), markdown: '' });
    } else if (sections.length) {
      sections[sections.length - 1].markdown += `${line}\n`;
    } else {
      intro.push(line);
    }
  }
  return {
    intro: intro.join('\n').trim(),
    sections: sections.map((s) => ({ ...s, markdown: s.markdown.trim() })),
  };
}

/** Parsea un fichero de la KB. `relPath` es relativo a content/kb (p. ej. 'zonas/sala-kids.md') */
export function parseKbFile(relPath: string, source: string): KbDoc {
  const { data, content } = matter(source);
  const parsed = frontmatterSchema.safeParse(data);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
    throw new Error(`KB ${relPath}: frontmatter inválido (${issues})`);
  }
  const fm = parsed.data;
  const { intro, sections } = splitSections(content);

  if (fm.type === 'operacion') {
    if (!fm.when) throw new Error(`KB ${relPath}: a la operación le falta "when" en el frontmatter`);
    const headings = sections.map((s) => s.heading);
    for (const required of OPERATION_SECTIONS) {
      if (!headings.includes(required)) {
        throw new Error(`KB ${relPath}: a la operación le falta la sección "## ${required}"`);
      }
    }
  }

  return {
    slug: relPath.replace(/\.md$/, ''),
    file: relPath,
    type: fm.type,
    title: fm.title,
    pages: fm.pages,
    parent: fm.parent,
    order: fm.order,
    emoji: fm.emoji,
    tags: fm.tags,
    when: fm.when,
    intro,
    sections,
  };
}

/** Resuelve un enlace a otro .md de la KB al slug de destino; null si no es un enlace interno */
function resolveKbLink(fromSlug: string, href: string): { slug: string; hash: string } | null {
  if (/^[a-z]+:/i.test(href) || href.startsWith('/') || href.startsWith('#') || href.startsWith('{{')) {
    return null;
  }
  const [target, hash = ''] = href.split('#');
  if (!target.endsWith('.md')) return null;
  const slug = path.posix.normalize(path.posix.join(path.posix.dirname(fromSlug), target)).replace(/\.md$/, '');
  return { slug, hash: hash ? `#${hash}` : '' };
}

function replaceTokens(markdown: string, file: string): string {
  return markdown.replace(/\{\{(\w+)\}\}/g, (_, name: string) => {
    if (!(name in TOKENS)) throw new Error(`KB ${file}: variable desconocida {{${name}}}`);
    return TOKENS[name];
  });
}

function linkHrefs(markdown: string): string[] {
  const hrefs: string[] = [];
  for (const token of md.parse(markdown, {})) {
    for (const child of token.children ?? []) {
      if (child.type === 'link_open') hrefs.push(child.attrGet('href') ?? '');
    }
  }
  return hrefs;
}

/** Comprueba enlaces, padres, slugs reservados y variables. Lanza un error con todos los problemas */
export function validateKb(docs: KbDoc[]): void {
  const slugs = new Set(docs.map((d) => d.slug));
  const errors: string[] = [];

  for (const doc of docs) {
    if (RESERVED_SLUGS.includes(doc.slug.split('/')[0])) {
      errors.push(`KB ${doc.file}: "${doc.slug}" es una ruta reservada de /guia-sala`);
    }
    if (doc.parent && !slugs.has(doc.parent)) {
      errors.push(`KB ${doc.file}: parent "${doc.parent}" no existe`);
    }
    const bodies = [doc.intro, ...doc.sections.map((s) => s.markdown)];
    for (const body of bodies) {
      try {
        replaceTokens(body, doc.file);
      } catch (e) {
        errors.push((e as Error).message);
      }
      for (const href of linkHrefs(body)) {
        const link = resolveKbLink(doc.slug, href);
        if (link && !slugs.has(link.slug)) {
          errors.push(`KB ${doc.file}: enlace roto "${href}" (no existe ${link.slug}.md)`);
        }
      }
    }
  }

  if (errors.length) throw new Error(errors.join('\n'));
}

function listMarkdownFiles(dir: string, base = ''): string[] {
  return fs.readdirSync(path.join(dir, base), { withFileTypes: true }).flatMap((entry) => {
    const rel = base ? `${base}/${entry.name}` : entry.name;
    if (entry.isDirectory()) return listMarkdownFiles(dir, rel);
    return entry.name.endsWith('.md') && entry.name !== 'README.md' ? [rel] : [];
  });
}

let cache: KbDoc[] | null = null;

/** Lee y valida toda la KB (una vez por proceso de build) */
export function loadKb(dir: string = KB_DIR): KbDoc[] {
  if (dir === KB_DIR && cache) return cache;
  const docs = listMarkdownFiles(dir)
    .sort()
    .map((rel) => parseKbFile(rel, fs.readFileSync(path.join(dir, rel), 'utf8')));
  validateKb(docs);
  docs.sort((a, b) => a.order - b.order || a.title.localeCompare(b.title, 'es'));
  if (dir === KB_DIR) cache = docs;
  return docs;
}

export function getKbDocs(filter: { page?: KbPage; type?: KbType; parent?: string } = {}, docs = loadKb()): KbDoc[] {
  return docs.filter(
    (d) =>
      (!filter.page || d.pages.includes(filter.page)) &&
      (!filter.type || d.type === filter.type) &&
      (!filter.parent || d.parent === filter.parent)
  );
}

export function getKbDoc(slug: string, docs = loadKb()): KbDoc | null {
  return docs.find((d) => d.slug === slug) ?? null;
}

/** Markdown → HTML. Los enlaces a otros .md pasan a `${basePath}/<slug>` */
export function renderKbMarkdown(markdown: string, doc: Pick<KbDoc, 'slug' | 'file'>, basePath: string): string {
  const env = { slug: doc.slug, basePath };
  return md.render(replaceTokens(markdown, doc.file), env);
}

md.renderer.rules.link_open = (tokens, idx, options, env, self) => {
  const token = tokens[idx];
  const href = token.attrGet('href') ?? '';
  const link = env?.slug ? resolveKbLink(env.slug, href) : null;
  if (link) {
    token.attrSet('href', `${env.basePath}/${link.slug}${link.hash}`);
  } else if (/^https?:/i.test(href)) {
    token.attrSet('target', '_blank');
    token.attrSet('rel', 'noopener noreferrer');
  }
  return self.renderToken(tokens, idx, options);
};

export function renderKbDoc(doc: KbDoc, basePath: string): KbRenderedDoc {
  return {
    slug: doc.slug,
    type: doc.type,
    title: doc.title,
    emoji: doc.emoji,
    when: doc.when,
    parent: doc.parent,
    href: `${basePath}/${doc.slug}`,
    introHtml: doc.intro ? renderKbMarkdown(doc.intro, doc, basePath) : '',
    sections: doc.sections.map((s) => ({
      id: slugifyHeading(s.heading),
      heading: s.heading,
      html: renderKbMarkdown(s.markdown, doc, basePath),
    })),
  };
}

export function kbDocLink(doc: KbDoc, basePath: string): KbDocLink {
  return {
    slug: doc.slug,
    type: doc.type,
    title: doc.title,
    emoji: doc.emoji,
    when: doc.when,
    href: `${basePath}/${doc.slug}`,
    questions: doc.type === 'operacion' ? [] : doc.sections.map((s) => ({ id: slugifyHeading(s.heading), heading: s.heading })),
  };
}

// ───────── Guía de la sala (/guia-sala y /guia-sala/panel) ─────────

export const GUIDE_START_SLUG = 'panel-de-control';

export function getGuideIndexProps(basePath: string) {
  const docs = getKbDocs({ page: 'guia-sala' });
  const panel = getKbDoc(GUIDE_START_SLUG);
  if (!panel) throw new Error(`KB: falta ${GUIDE_START_SLUG}.md, el punto de partida de la guía`);
  return {
    basePath,
    panel: renderKbDoc(panel, basePath),
    operations: getKbDocs({ type: 'operacion' }).map((d) => kbDocLink(d, basePath)),
    zones: docs.filter((d) => d.type === 'detalle').map((d) => kbDocLink(d, basePath)),
    hubs: docs.filter((d) => d.type === 'hub' && d.slug !== GUIDE_START_SLUG).map((d) => kbDocLink(d, basePath)),
  };
}

export function getGuidePaths(): string[][] {
  return loadKb().map((d) => d.slug.split('/'));
}

function docProps(docs: KbDoc[], slug: string, basePath: string) {
  const doc = getKbDoc(slug, docs);
  if (!doc) return null;
  const parent = doc.parent ? getKbDoc(doc.parent, docs) : null;
  return {
    basePath,
    doc: renderKbDoc(doc, basePath),
    parent: parent ? kbDocLink(parent, basePath) : null,
    children: getKbDocs({ parent: doc.slug }, docs).map((d) => kbDocLink(d, basePath)),
  };
}

export function getGuideDocProps(slug: string, basePath: string) {
  return docProps(loadKb(), slug, basePath);
}

// ───────── Manual interno (/admin/manual, solo admins) ─────────
// Carpeta aparte: loadKb() sin argumentos nunca la lee, así no llega a la web pública ni al chatbot.

export const MANUAL_DIR = path.join(process.cwd(), 'content', 'interno');

export function getManualIndexProps() {
  const docs = loadKb(MANUAL_DIR);
  return {
    operations: getKbDocs({ type: 'operacion' }, docs).map((d) => kbDocLink(d, MANUAL_BASE_PATH)),
    docs: docs.filter((d) => d.type !== 'operacion').map((d) => kbDocLink(d, MANUAL_BASE_PATH)),
  };
}

export function getManualDocProps(slug: string) {
  return docProps(loadKb(MANUAL_DIR), slug, MANUAL_BASE_PATH);
}
