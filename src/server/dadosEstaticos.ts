import type { ConjuntoFeriados, RecessoForense } from '../domain/types';
import feriadosNacionais from '../../public/data/feriados/nacionais.json';
import feriadosGO from '../../public/data/feriados/estaduais/GO.json';
import feriadosTO from '../../public/data/feriados/estaduais/TO.json';
import feriadosMunicipais from '../../public/data/feriados/municipais.json';
import tribunaisConfig from '../../public/data/tribunais-config.json';

const estaduaisPorSigla: Record<string, ConjuntoFeriados> = {
  GO: feriadosGO as ConjuntoFeriados,
  TO: feriadosTO as ConjuntoFeriados,
};

export function feriadosNacionaisEstaticos(): ConjuntoFeriados {
  return feriadosNacionais as ConjuntoFeriados;
}

export function feriadosEstaduaisEstaticos(sigla: string): ConjuntoFeriados {
  return estaduaisPorSigla[sigla] ?? { recorrentes: [], datas: [] };
}

export function feriadosMunicipaisEstaticos(municipioId: number): ConjuntoFeriados {
  const mapa = feriadosMunicipais as Record<string, ConjuntoFeriados>;
  return mapa[String(municipioId)] ?? { recorrentes: [], datas: [] };
}

export function recessoTribunalEstatico(tribunalId: number): RecessoForense | null {
  const cfg = tribunaisConfig as Record<string, { recessoForense: RecessoForense }>;
  return cfg[String(tribunalId)]?.recessoForense ?? null;
}
