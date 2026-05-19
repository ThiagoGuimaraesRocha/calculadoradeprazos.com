import type {
  ConjuntoFeriados,
  Estado,
  Municipio,
  RecessoForense,
  Tribunal,
  Vara,
} from '../domain/types';

const BASE = import.meta.env.VITE_DADOS_BASE_URL ?? '';

async function fetchJson<T>(path: string): Promise<T> {
  const response = await fetch(`${BASE}${path}`);
  if (!response.ok) {
    throw new Error(`Falha ao carregar ${path} (${response.status})`);
  }
  return response.json() as Promise<T>;
}

export async function carregarEstados(): Promise<Estado[]> {
  return fetchJson<Estado[]>('/data/estados.json');
}

export async function carregarMunicipios(sigla: string): Promise<Municipio[]> {
  return fetchJson<Municipio[]>(`/data/municipios/${sigla}.json`);
}

export async function carregarTribunais(sigla: string): Promise<Tribunal[]> {
  const raw = await fetchJson<Array<{ id: number | string; nome: string }>>(
    `/data/tribunais/${sigla}.json`,
  );
  return raw
    .filter((t) => String(t.id) !== '-1')
    .map((t) => ({ id: Number(t.id), nome: t.nome }));
}

type VarasIndex = {
  entries: Array<{
    key: string;
    varas: Vara[];
  }>;
};

let varasIndexCache: Map<string, Vara[]> | null = null;

async function carregarIndiceVaras(): Promise<Map<string, Vara[]>> {
  if (varasIndexCache) return varasIndexCache;
  const data = await fetchJson<VarasIndex>('/data/varas/piloto-go-to.json');
  varasIndexCache = new Map(data.entries.map((e) => [e.key, e.varas]));
  return varasIndexCache;
}

export async function carregarVaras(params: {
  estadoSigla: string;
  municipioId: number;
  tribunalId: number;
  materiaLegacyId: number;
  processoLegacyId: number;
}): Promise<Vara[]> {
  const key = `${params.estadoSigla}:${params.municipioId}:${params.tribunalId}:${params.materiaLegacyId}:${params.processoLegacyId}`;
  const index = await carregarIndiceVaras();
  return index.get(key) ?? [];
}

export async function carregarFeriadosNacionais(): Promise<ConjuntoFeriados> {
  return fetchJson<ConjuntoFeriados>('/data/feriados/nacionais.json');
}

export async function carregarFeriadosEstaduais(sigla: string): Promise<ConjuntoFeriados> {
  return fetchJson<ConjuntoFeriados>(`/data/feriados/estaduais/${sigla}.json`);
}

type MunicipaisMap = Record<string, ConjuntoFeriados>;

let municipaisCache: MunicipaisMap | null = null;

async function carregarMapaMunicipais(): Promise<MunicipaisMap> {
  if (municipaisCache) return municipaisCache;
  municipaisCache = await fetchJson<MunicipaisMap>('/data/feriados/municipais.json');
  return municipaisCache;
}

export async function carregarFeriadosMunicipais(municipioId: number): Promise<ConjuntoFeriados> {
  const mapa = await carregarMapaMunicipais();
  return (
    mapa[String(municipioId)] ?? {
      recorrentes: [],
      datas: [],
    }
  );
}

type TribunaisConfigMap = Record<
  string,
  {
    nome: string;
    recessoForense: RecessoForense;
  }
>;

let tribunaisConfigCache: TribunaisConfigMap | null = null;

export async function carregarRecessoTribunal(
  tribunalId: number,
): Promise<RecessoForense | null> {
  if (!tribunaisConfigCache) {
    tribunaisConfigCache = await fetchJson<TribunaisConfigMap>('/data/tribunais-config.json');
  }
  return tribunaisConfigCache[String(tribunalId)]?.recessoForense ?? null;
}

/** Contrato futuro para API — mesma forma de entrada/saída do domínio. */
export type CalculoPrazoApiPayload = {
  dataPublicacao: string;
  prazoDias: number;
  contagem: string;
  estadoSigla: string;
  municipioId: number;
  tribunalId: number;
  materia: string;
  processo: string;
  varaId?: number;
};

export function endpointCalculoPrazo(): string {
  return import.meta.env.VITE_API_CALCULO_URL ?? '/api/calculo-prazo';
}
