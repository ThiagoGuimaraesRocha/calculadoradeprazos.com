import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');

function readRoot(path: string): string {
  return readFileSync(join(root, path), 'utf8');
}

describe('CALC-21 — documentação e artefatos de comarcas', () => {
  it('docs/comarcas-fonte-go-to.md existe e cita fontes GO/TO', () => {
    const doc = readRoot('docs/comarcas-fonte-go-to.md');
    expect(doc).toContain('CALC-21');
    expect(doc).toContain('123');
    expect(doc).toMatch(/tjgo\.jus\.br/i);
    expect(doc).toMatch(/tjto\.jus\.br|corregedoria\.tjto/i);
    expect(doc).toContain('992');
    expect(doc).toContain('5535');
  });

  it('mapeamento legado preserva Goiânia e Palmas', () => {
    const data = JSON.parse(readRoot('public/data/comarcas-mapeamento-legado.json'));
    const ids = data.legado.map((r: { id: number }) => r.id);
    expect(ids).toContain(992);
    expect(ids).toContain(5535);
    expect(data.legado.length).toBeGreaterThanOrEqual(26);
  });

  it('GO.json reflete contagem oficial de 123 comarcas (CALC-22)', () => {
    const go = JSON.parse(readRoot('public/data/municipios/GO.json'));
    expect(go.length).toBe(123);
  });
});
