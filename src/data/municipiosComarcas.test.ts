import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');

function loadJson<T>(path: string): T {
  const raw = readFileSync(join(root, path), 'utf8').replace(/^\uFEFF/, '');
  return JSON.parse(raw) as T;
}

type Municipio = { id: number; nome: string; estados_id: number };

function normalizeNome(nome: string) {
  return nome
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .trim();
}

function assertMunicipios(path: string, ufId: number, minCount: number) {
  const list = loadJson<Municipio[]>(path);
  expect(list.length).toBeGreaterThanOrEqual(minCount);

  const ids = list.map((m) => m.id);
  expect(new Set(ids).size).toBe(ids.length);

  for (const m of list) {
    expect(m).toMatchObject({
      id: expect.any(Number),
      nome: expect.any(String),
      estados_id: ufId,
    });
    expect(m.nome.length).toBeGreaterThan(0);
  }

  const nomes = list.map((m) => m.nome);
  const sorted = [...nomes].sort((a, b) => a.localeCompare(b, 'pt-BR'));
  expect(nomes).toEqual(sorted);

  return list;
}

describe('datasets municípios-comarca (CALC-22)', () => {
  it('GO.json tem 123 comarcas, inclui Aruanã, ids únicos e ordenação alfabética', () => {
    const go = assertMunicipios('public/data/municipios/GO.json', 9, 123);
    expect(go.length).toBe(123);
    expect(go.some((m) => normalizeNome(m.nome) === normalizeNome('Aruanã'))).toBe(true);
  });

  it('TO.json tem lista completa TJTO (>2), ids únicos e estados_id 27', () => {
    const to = assertMunicipios('public/data/municipios/TO.json', 27, 35);
    expect(to.length).toBe(35);
    expect(to.some((m) => m.id === 5535 && m.nome === 'Palmas')).toBe(true);
    expect(to.some((m) => m.id === 5458 && m.nome === 'Araguaína')).toBe(true);
  });

  it('preserva ids legados em feriados municipais', () => {
    const feriados = loadJson<Record<string, unknown>>('public/data/feriados/municipais.json');
    const legadoComFeriado = ['992', '913', '5535', '5458'];
    for (const id of legadoComFeriado) {
      expect(feriados[id]).toBeDefined();
      const f = feriados[id] as { recorrentes: unknown[] };
      expect(Array.isArray(f.recorrentes)).toBe(true);
      expect(f.recorrentes.length).toBeGreaterThan(0);
    }
  });

  it('novos ids GO recebem feriado municipal vazio sem remover legado', () => {
    const go = loadJson<Municipio[]>('public/data/municipios/GO.json');
    const feriados = loadJson<Record<string, { recorrentes: unknown[]; datas: unknown[] }>>(
      'public/data/feriados/municipais.json',
    );
    const aruana = go.find((m) => normalizeNome(m.nome) === normalizeNome('Aruanã'));
    expect(aruana).toBeDefined();
    expect(feriados[String(aruana!.id)]).toEqual({ recorrentes: [], datas: [] });
    expect(feriados['992'].recorrentes.length).toBeGreaterThan(0);
  });
});
