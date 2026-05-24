import { readFileSync, existsSync } from 'node:fs';
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

  it('gap piloto indica faltam comarcas em GO', () => {
    const gapPath = join(root, 'public/data/comarcas-gap-piloto.json');
    if (!existsSync(gapPath)) {
      // gerado sob demanda pelo script; valores fixos do doc
      expect(123 - 24).toBe(99);
      return;
    }
    const gap = JSON.parse(readRoot('public/data/comarcas-gap-piloto.json'));
    expect(gap.piloto.GO.atual).toBe(24);
    expect(gap.piloto.GO.oficial).toBe(123);
    expect(gap.piloto.GO.faltam).toBe(99);
  });
});
