import {
  formatarDiaLongo,
  isDiaUtil,
  isRecessoForense,
  parseIsoDate,
  primeiroDiaUtilApos,
  toIsoDate,
  type CalendarioContext,
  type RecessoForenseConfig,
} from './feriados';
import type { CalculoPrazoInput, CalculoPrazoResult, DiaPrazo } from './types';

function avancarUmDia(date: Date): void {
  date.setDate(date.getDate() + 1);
}

function deveSuspenderPorRecesso(date: Date, recesso: RecessoForenseConfig | null): boolean {
  return isRecessoForense(date, recesso);
}

function contarDiasUteis(
  inicio: Date,
  quantidade: number,
  context: CalendarioContext,
  recesso: RecessoForenseConfig | null,
): DiaPrazo[] {
  const dias: DiaPrazo[] = [];
  const cursor = new Date(inicio);
  let contados = 0;

  while (contados < quantidade) {
    if (deveSuspenderPorRecesso(cursor, recesso)) {
      avancarUmDia(cursor);
      continue;
    }

    if (isDiaUtil(cursor, context)) {
      contados += 1;
      dias.push({
        indice: contados,
        data: toIsoDate(cursor),
        rotulo: formatarDiaLongo(cursor),
      });
    }

    if (contados < quantidade) {
      avancarUmDia(cursor);
    }
  }

  return dias;
}

function contarDiasCorridos(
  inicio: Date,
  quantidade: number,
  recesso: RecessoForenseConfig | null,
): DiaPrazo[] {
  const dias: DiaPrazo[] = [];
  const cursor = new Date(inicio);
  let contados = 0;

  while (contados < quantidade) {
    if (deveSuspenderPorRecesso(cursor, recesso)) {
      avancarUmDia(cursor);
      continue;
    }

    contados += 1;
    dias.push({
      indice: contados,
      data: toIsoDate(cursor),
      rotulo: formatarDiaLongo(cursor),
    });

    if (contados < quantidade) {
      avancarUmDia(cursor);
    }
  }

  return dias;
}

export function calcularPrazo(
  input: CalculoPrazoInput,
  context: CalendarioContext,
  recessoTribunal: RecessoForenseConfig | null,
): CalculoPrazoResult {
  const publicacao = parseIsoDate(input.dataPublicacao);
  const inicioContagem = primeiroDiaUtilApos(publicacao, context);
  const avisos: string[] = [];

  avisos.push(
    'Premissa: o prazo começa no primeiro dia útil após a data da publicação (feriados nacionais, estaduais e municipais do local selecionado).',
  );

  if (recessoTribunal) {
    avisos.push(
      'Durante o recesso forense do tribunal selecionado, os dias não entram na contagem (suspensão).',
    );
  }

  const dias =
    input.contagem === 'uteis'
      ? contarDiasUteis(inicioContagem, input.prazoDias, context, recessoTribunal)
      : contarDiasCorridos(inicioContagem, input.prazoDias, recessoTribunal);

  return {
    dataPublicacao: input.dataPublicacao,
    dataInicioContagem: toIsoDate(inicioContagem),
    dias,
    avisos,
  };
}

export function validarEntrada(input: Partial<CalculoPrazoInput>): string | null {
  if (!input.dataPublicacao) return 'Informe a data da publicação.';
  if (!input.estadoSigla) return 'Selecione o estado.';
  if (!input.municipioId) return 'Selecione a comarca.';
  if (!input.tribunalId) return 'Selecione o tribunal.';
  if (!input.materia) return 'Selecione a matéria.';
  if (!input.processo) return 'Informe se o processo é eletrônico ou físico.';
  if (!input.contagem) return 'Selecione o tipo de contagem.';

  const prazo = input.prazoDias ?? 0;
  if (!Number.isFinite(prazo) || prazo < 1) return 'Informe um prazo válido (mínimo 1 dia).';
  if (prazo > 365) return 'O prazo não pode ser superior a 365 dias.';

  const ano = parseIsoDate(input.dataPublicacao).getFullYear();
  if (ano < 2000 || ano > 2100) return 'Data da publicação fora do intervalo suportado.';

  return null;
}

export const MATERIA_OPCOES = [
  { value: 'civel' as const, label: 'Cível', legacyId: 0 },
  { value: 'criminal' as const, label: 'Criminal', legacyId: 1 },
  { value: 'trabalhista' as const, label: 'Trabalhista', legacyId: 2 },
];

export const PROCESSO_OPCOES = [
  { value: 'eletronico' as const, label: 'Eletrônico', legacyId: 0 },
  { value: 'fisico' as const, label: 'Físico', legacyId: 1 },
];

export const CONTAGEM_OPCOES = [
  { value: 'uteis' as const, label: 'Úteis' },
  { value: 'corridos' as const, label: 'Corridos' },
];

export function materiaLegacyId(materia: CalculoPrazoInput['materia']): number {
  return MATERIA_OPCOES.find((m) => m.value === materia)?.legacyId ?? 0;
}

export function processoLegacyId(processo: CalculoPrazoInput['processo']): number {
  return PROCESSO_OPCOES.find((p) => p.value === processo)?.legacyId ?? 0;
}
