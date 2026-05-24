/**
 * Inventário piloto GO/TO — apoio ao spike CALC-21.
 * Uso: node scripts/inventario-comarcas-gap.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function loadJson(path) {
  const raw = readFileSync(join(root, path), 'utf8').replace(/^\uFEFF/, '');
  return JSON.parse(raw);
}

const go = loadJson('public/data/municipios/GO.json');
const to = loadJson('public/data/municipios/TO.json');
const feriados = loadJson('public/data/feriados/municipais.json');

const legadoIds = new Set([
  ...go.map((m) => String(m.id)),
  ...to.map((m) => String(m.id)),
  ...Object.keys(feriados),
]);

const oficial = {
  GO: { contagem: 123, fonte: 'TJGO Arquivo Histórico (2026-05-24)' },
  TO: { contagem: null, fonte: 'TJTO Relação de Comarcas — contar via relatório na implementação CALC-22' },
};

const gap = {
  geradoEm: new Date().toISOString().slice(0, 10),
  piloto: {
    GO: { atual: go.length, oficial: oficial.GO.contagem, faltam: oficial.GO.contagem - go.length },
    TO: { atual: to.length, oficial: oficial.TO.contagem, faltam: null },
  },
  idsLegadosPreservados: [...legadoIds].sort((a, b) => Number(a) - Number(b)),
  municipiosAtuais: { GO: go, TO: to },
};

const outPath = join(root, 'public/data/comarcas-gap-piloto.json');
writeFileSync(outPath, JSON.stringify(gap, null, 2), 'utf8');
console.log(JSON.stringify(gap.piloto, null, 2));
console.log(`Escrito: ${outPath}`);
