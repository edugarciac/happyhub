import { loadKb, parseKbFile, renderKbDoc, slugifyHeading, validateKb, getKbDocs } from '@/lib/kb';
import { CONTACT_INFO } from '@/config/contact';

const hub = `---
type: hub
title: Normas
pages: [como-funciona, guia-sala]
order: 4
---

## ¿Quién puede usar el Chiquipark?

Solo menores de 14. [Sala Kids](zonas/sala-kids.md#chiquipark)

## ¿Se puede fumar?

No.
`;

const detail = `---
type: detalle
title: Sala Kids
parent: normas
---

## ¿Qué hay?

El Chiquipark. [Volver](../normas.md)
`;

const operation = (omit?: string) => `---
type: operacion
title: Encender sala
when: Al entrar
---

${['Para qué sirve', 'Cuándo usarla', 'Pasos', 'Qué hace', 'Si algo falla']
  .filter((h) => h !== omit)
  .map((h) => `## ${h}\n\nTexto. [WhatsApp]({{whatsapp}})`)
  .join('\n\n')}
`;

describe('parseKbFile', () => {
  it('reads frontmatter and one section per ## heading', () => {
    const doc = parseKbFile('normas.md', hub);
    expect(doc).toMatchObject({ slug: 'normas', type: 'hub', title: 'Normas', pages: ['como-funciona', 'guia-sala'], parent: null, order: 4 });
    expect(doc.sections.map((s) => s.heading)).toEqual(['¿Quién puede usar el Chiquipark?', '¿Se puede fumar?']);
    expect(doc.sections[1].markdown).toBe('No.');
  });

  it('rejects an invalid type', () => {
    expect(() => parseKbFile('x.md', '---\ntype: otro\ntitle: X\n---\n')).toThrow(/frontmatter inválido/);
  });

  it('requires every operation section', () => {
    expect(() => parseKbFile('operaciones/x.md', operation())).not.toThrow();
    expect(() => parseKbFile('operaciones/x.md', operation('Pasos'))).toThrow(/## Pasos/);
  });

  it('requires "when" on operations', () => {
    expect(() => parseKbFile('operaciones/x.md', operation().replace('when: Al entrar\n', ''))).toThrow(/when/);
  });
});

describe('validateKb', () => {
  it('accepts links between existing documents', () => {
    expect(() => validateKb([parseKbFile('normas.md', hub), parseKbFile('zonas/sala-kids.md', detail)])).not.toThrow();
  });

  it('fails on a broken link', () => {
    expect(() => validateKb([parseKbFile('normas.md', hub)])).toThrow(/enlace roto "zonas\/sala-kids.md#chiquipark"/);
  });

  it('fails on an unknown parent', () => {
    expect(() => validateKb([parseKbFile('zonas/sala-kids.md', detail.replace('](../normas.md)', '](#)'))])).toThrow(/parent "normas"/);
  });

  it('fails on a reserved slug', () => {
    expect(() => validateKb([parseKbFile('panel.md', '---\ntype: hub\ntitle: X\n---\n')])).toThrow(/reservada/);
  });

  it('fails on an unknown {{variable}}', () => {
    expect(() => validateKb([parseKbFile('x.md', '---\ntype: hub\ntitle: X\n---\n\n## A\n\n{{telefono}}')])).toThrow(/telefono/);
  });
});

describe('renderKbDoc', () => {
  it('rewrites .md links to the base path, keeping the anchor', () => {
    const html = renderKbDoc(parseKbFile('normas.md', hub), '/guia-sala/panel').sections[0].html;
    expect(html).toContain('href="/guia-sala/panel/zonas/sala-kids#chiquipark"');
  });

  it('resolves links relative to the document folder', () => {
    const html = renderKbDoc(parseKbFile('zonas/sala-kids.md', detail), '/guia-sala').sections[0].html;
    expect(html).toContain('href="/guia-sala/normas"');
  });

  it('replaces {{whatsapp}} and opens external links in a new tab', () => {
    const html = renderKbDoc(parseKbFile('operaciones/x.md', operation()), '/guia-sala').sections[0].html;
    expect(html).toContain(`href="${CONTACT_INFO.whatsapp}" target="_blank" rel="noopener noreferrer"`);
  });

  it('gives each question an anchor id', () => {
    expect(slugifyHeading('¿Quién puede usar el Chiquipark?')).toBe('quien-puede-usar-el-chiquipark');
  });
});

describe('content/kb', () => {
  it('is valid and keeps the /como-funciona FAQ', () => {
    const docs = loadKb();
    const faq = getKbDocs({ page: 'como-funciona' }, docs);
    expect(faq.map((d) => d.slug)).toEqual(['reserva', 'dia-del-evento', 'decoracion-y-limpieza', 'normas']);
    expect(faq.flatMap((d) => d.sections)).toHaveLength(22) // 21 de la FAQ original + Chiquipark;
  });

  it('starts the room guide with the control panel', () => {
    expect(getKbDocs({ page: 'guia-sala' }, loadKb())[0].slug).toBe('panel-de-control');
  });
});

describe('content/interno (internal manual)', () => {
  it('is valid and links to /admin/manual', () => {
    const { getManualIndexProps } = require('@/lib/kb');
    const props = getManualIndexProps();
    expect(props.operations.length).toBeGreaterThan(0);
    expect(props.operations.every((d: { href: string }) => d.href.startsWith('/admin/manual/'))).toBe(true);
  });

  it('never ends up in the public knowledge base', () => {
    const publicSlugs = loadKb().map((d) => d.slug);
    const { MANUAL_DIR } = require('@/lib/kb');
    for (const doc of loadKb(MANUAL_DIR)) expect(publicSlugs).not.toContain(doc.slug);
    expect(publicSlugs).not.toContain('home-assistant');
  });
});
