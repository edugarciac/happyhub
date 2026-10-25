import { GUIA_SALA_CATEGORIES, filterGuia, normalizeText } from '@/data/guiaSala';

describe('guía de la sala', () => {
  it('normaliza mayúsculas y acentos', () => {
    expect(normalizeText('MÚSICA Aire')).toBe('musica aire');
  });

  it('encuentra «música» buscando «musica»', () => {
    const res = filterGuia(GUIA_SALA_CATEGORIES, 'musica');
    expect(res.some((c) => c.title === 'Música y Bluetooth')).toBe(true);
  });

  it('exige todos los términos', () => {
    const res = filterGuia(GUIA_SALA_CATEGORIES, 'bluetooth movil');
    const all = res.flatMap((c) => c.faqs);
    expect(all.length).toBeGreaterThan(0);
    all.forEach((f) => {
      const t = normalizeText(`${f.question} ${f.answer}`);
      expect(t).toContain('bluetooth');
      expect(t).toContain('movil');
    });
  });

  it('filtra por categoría', () => {
    const res = filterGuia(GUIA_SALA_CATEGORIES, '', 'Luces');
    expect(res.map((c) => c.title)).toEqual(['Luces']);
  });

  it('sin resultados devuelve lista vacía', () => {
    expect(filterGuia(GUIA_SALA_CATEGORIES, 'zzzxqw')).toEqual([]);
  });

  it('incluye las normas compartidas con /como-funciona pero no la reserva', () => {
    const titles = GUIA_SALA_CATEGORIES.map((c) => c.title);
    expect(titles).toContain('Normas del espacio');
    expect(titles).not.toContain('La reserva');
  });
});
