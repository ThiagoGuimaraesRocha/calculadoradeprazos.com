/**
 * CALC-22 — Gera public/data/municipios/GO.json e TO.json a partir de fontes oficiais.
 * Uso: node scripts/gerar-municipios-comarcas.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function loadJson(path) {
  const raw = readFileSync(join(root, path), 'utf8').replace(/^\uFEFF/, '');
  return JSON.parse(raw);
}

function normalizeNome(nome) {
  return nome
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

function extrairSede(rest) {
  const words = rest.split(/\s+/).filter(Boolean);
  for (let k = 1; k <= Math.floor(words.length / 2); k++) {
    const a = words.slice(0, k).join(' ');
    const b = words.slice(k, 2 * k).join(' ');
    if (a === b) return a;
  }
  return words[0] ?? rest;
}

/** Extrai sedes de comarca do Anexo I (legisla.casacivil.go.gov.br arquivo 18606). */
function parseSedesGoLegisla(text) {
  const lines = text.split(/\r?\n/);
  const sedes = [];
  let pending = null;
  const stopMarkers = /^0[1-9] Registro|^MUNICÍPIO DE |^DISTRITO DE |^ENTRÂNCIA INICIAL$/;

  const flush = () => {
    if (!pending) return;
    const sede = extrairSede(pending.rest);
    if (sede && sede.length > 2) sedes.push(sede);
    pending = null;
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || stopMarkers.test(trimmed)) {
      if (stopMarkers.test(trimmed)) flush();
      continue;
    }

    const numbered = trimmed.match(/^(\d{1,3})\s+(.+)$/);
    if (numbered) {
      const num = Number(numbered[1]);
      if (num >= 1 && num <= 130) {
        flush();
        pending = { num, rest: numbered[2].trim() };
        continue;
      }
    }

    if (pending && !/^\d{1,3}\s+/.test(trimmed)) {
      pending.rest += ` ${trimmed}`;
    }
  }
  flush();

  // Ponte Alta do Araguaia aparece sem numeração no anexo (após item 95).
  if (text.includes('Ponte Alta do Araguaia')) {
    sedes.push('Ponte Alta do Araguaia');
  }

  return sedes;
}

function mergeSedesGo() {
  const legislaPath = 'scripts/data/fonte/comarcas-go-legisla-anexo.txt';
  const texto = readFileSync(join(root, legislaPath), 'utf8').replace(/^\uFEFF/, '');
  const suplemento = loadJson('scripts/data/comarcas-go-suplemento.json');
  const fromLegisla = parseSedesGoLegisla(texto);
  const excluir = new Set((suplemento.excluidas ?? []).map((e) => normalizeNome(e.nome)));
  const extras = suplemento.sedesAdicionais ?? [];

  const byNorm = new Map();
  for (const nome of [...fromLegisla, ...extras]) {
    const norm = normalizeNome(nome);
    if (excluir.has(norm)) continue;
    if (!byNorm.has(norm)) byNorm.set(norm, nome);
  }

  return [...byNorm.values()].sort((a, b) => a.localeCompare(b, 'pt-BR'));
}

function buildMunicipios(sedes, estadoSigla, estadosId, legadoList) {
  const legadoByNorm = new Map(
    legadoList
      .filter((r) => r.estadoSigla === estadoSigla)
      .map((r) => [normalizeNome(r.nome), r.id]),
  );

  let nextId = 60000;
  const usedIds = new Set();
  const out = [];

  for (const nome of sedes) {
    const norm = normalizeNome(nome);
    let id = legadoByNorm.get(norm);
    if (id == null) {
      while (usedIds.has(nextId)) nextId++;
      id = nextId;
      nextId++;
    }
    usedIds.add(id);
    out.push({ id, nome, estados_id: estadosId });
  }

  return out.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
}

function atualizarFeriadosMunicipais(municipiosGo, municipiosTo) {
  const feriadosPath = join(root, 'public/data/feriados/municipais.json');
  const feriados = loadJson('public/data/feriados/municipais.json');
  const vazio = { recorrentes: [], datas: [] };

  for (const m of [...municipiosGo, ...municipiosTo]) {
    const key = String(m.id);
    if (!feriados[key]) feriados[key] = vazio;
  }

  writeFileSync(feriadosPath, JSON.stringify(feriados, null, 2) + '\n', 'utf8');
}

const mapeamento = loadJson('public/data/comarcas-mapeamento-legado.json');
const sedesGo = mergeSedesGo();
const sedesTo = loadJson('scripts/data/comarcas-sedes-to.json').sedes.sort((a, b) =>
  a.localeCompare(b, 'pt-BR'),
);

const municipiosGo = buildMunicipios(sedesGo, 'GO', 9, mapeamento.legado);
const municipiosTo = buildMunicipios(sedesTo, 'TO', 27, mapeamento.legado);

writeFileSync(
  join(root, 'public/data/municipios/GO.json'),
  JSON.stringify(municipiosGo, null, 4) + '\n',
  'utf8',
);
writeFileSync(
  join(root, 'public/data/municipios/TO.json'),
  JSON.stringify(municipiosTo, null, 4) + '\n',
  'utf8',
);

atualizarFeriadosMunicipais(municipiosGo, municipiosTo);

const meta = {
  geradoEm: new Date().toISOString().slice(0, 10),
  GO: { total: municipiosGo.length, temAruana: municipiosGo.some((m) => normalizeNome(m.nome) === 'aruana') },
  TO: { total: municipiosTo.length },
};
console.log(JSON.stringify(meta, null, 2));
