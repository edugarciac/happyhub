import fs from 'fs';
import path from 'path';

// Un componente definido dentro de otro y usado como <Componente /> se recrea en cada render:
// los campos de formulario pierden el foco a cada tecla (bug de festivos/tarifas, 2026-10-10).
// Estos trozos de JSX deben llamarse como función: {renderAlgo()}.
function listTsx(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) return e.name === '__tests__' ? [] : listTsx(p);
    return p.endsWith('.tsx') ? [p] : [];
  });
}

describe('no nested components rendered as JSX', () => {
  it('finds no PascalCase component declared inside another and used as <Name />', () => {
    const offenders: string[] = [];
    for (const file of listTsx(path.join(__dirname, '..'))) {
      const src = fs.readFileSync(file, 'utf8');
      const re = /^(\s{2,})(?:const|function)\s+([A-Z]\w*)\s*(?:=\s*(?:\([^)]*\)|\w+)\s*=>|\()/gm;
      let m: RegExpExecArray | null;
      while ((m = re.exec(src))) {
        if (new RegExp(`<${m[2]}[\\s/>]`).test(src)) offenders.push(`${path.relative(process.cwd(), file)}: ${m[2]}`);
      }
    }
    expect(offenders).toEqual([]);
  });
});
