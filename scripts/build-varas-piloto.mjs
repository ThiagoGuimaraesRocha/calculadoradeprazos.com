import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function loadJson(path) {
  const raw = readFileSync(join(root, path), 'utf8').replace(/^\uFEFF/, '');
  return JSON.parse(raw);
}

const varasPorMateria = {
  0: [
    { id: 1, vara: '1ª Vara Cível' },
    { id: 2, vara: '2ª Vara Cível' },
    { id: 3, vara: 'Vara de Família' },
  ],
  1: [
    { id: 11, vara: '1ª Vara Criminal' },
    { id: 12, vara: '2ª Vara Criminal' },
  ],
  2: [{ id: 21, vara: 'Vara de Fazenda Pública e Registros Públicos' }],
};

const varasTrt = {
  0: [{ id: 31, vara: 'Vara do Trabalho' }],
  1: [{ id: 32, vara: 'Vara do Trabalho' }],
  2: [{ id: 33, vara: 'Vara do Trabalho' }],
};

const varasTrf = {
  0: [{ id: 41, vara: '1ª Vara Federal' }],
  1: [{ id: 42, vara: '2ª Vara Federal' }],
  2: [{ id: 43, vara: 'Juizado Especial Federal' }],
};

const tribunaisVaras = {
  31: varasPorMateria,
  32: varasTrf,
  33: varasTrt,
  90: varasPorMateria,
  91: varasTrf,
  92: varasTrt,
};

const entries = [];

for (const { sigla, municipios, tribunais } of [
  {
    sigla: 'GO',
    municipios: loadJson('public/data/municipios/GO.json'),
    tribunais: loadJson('public/data/tribunais/GO.json').filter((t) => String(t.id) !== '-1'),
  },
  {
    sigla: 'TO',
    municipios: loadJson('public/data/municipios/TO.json'),
    tribunais: loadJson('public/data/tribunais/TO.json').filter((t) => String(t.id) !== '-1'),
  },
]) {
  for (const m of municipios) {
    for (const t of tribunais) {
      const tid = Number(t.id);
      const mapa = tribunaisVaras[tid];
      if (!mapa) continue;
      for (const mat of [0, 1, 2]) {
        for (const proc of [0, 1]) {
          const base = mapa[mat] ?? mapa[0];
          const varas = base.map((v, i) => ({
            id: m.id * 100 + tid * 10 + mat * 2 + proc + i,
            vara: `${v.vara} — ${m.nome} (${t.nome})`,
          }));
          entries.push({
            key: `${sigla}:${m.id}:${tid}:${mat}:${proc}`,
            varas,
          });
        }
      }
    }
  }
}

writeFileSync(
  join(root, 'public/data/varas/piloto-go-to.json'),
  JSON.stringify({ entries }, null, 2),
  'utf8',
);

console.log(`Geradas ${entries.length} combinações de varas.`);
