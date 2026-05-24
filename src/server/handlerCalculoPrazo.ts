import { calcularPrazo, validarEntrada } from '../domain/calcularPrazo';
import type { CalculoPrazoInput, CalculoPrazoResult, Materia, TipoContagem, TipoProcesso } from '../domain/types';
import type { CalculoPrazoApiPayload } from '../services/dadosLocalidade';
import { recessoTribunalEstatico } from './dadosEstaticos';
import { montarCalendario } from './montarCalendario';

const MATERIAS: Materia[] = ['civel', 'criminal', 'trabalhista'];
const PROCESSOS: TipoProcesso[] = ['eletronico', 'fisico'];
const CONTAGENS: TipoContagem[] = ['uteis', 'corridos'];

function parsePayload(body: CalculoPrazoApiPayload): Partial<CalculoPrazoInput> {
  return {
    dataPublicacao: body.dataPublicacao,
    prazoDias: body.prazoDias,
    contagem: body.contagem as TipoContagem,
    estadoSigla: body.estadoSigla,
    municipioId: body.municipioId,
    tribunalId: body.tribunalId,
    materia: body.materia as Materia,
    processo: body.processo as TipoProcesso,
    varaId: body.varaId,
  };
}

export type HandlerErro = {
  status: 400;
  mensagem: string;
};

export function executarCalculoPrazo(
  body: CalculoPrazoApiPayload,
): CalculoPrazoResult | HandlerErro {
  if (!body || typeof body !== 'object') {
    return { status: 400, mensagem: 'Corpo JSON inválido.' };
  }

  const input = parsePayload(body);

  if (input.estadoSigla && !['GO', 'TO'].includes(input.estadoSigla)) {
    return { status: 400, mensagem: 'Piloto disponível apenas para GO e TO.' };
  }

  if (input.materia && !MATERIAS.includes(input.materia)) {
    return { status: 400, mensagem: 'Matéria inválida.' };
  }

  if (input.processo && !PROCESSOS.includes(input.processo)) {
    return { status: 400, mensagem: 'Tipo de processo inválido.' };
  }

  if (input.contagem && !CONTAGENS.includes(input.contagem)) {
    return { status: 400, mensagem: 'Tipo de contagem inválido.' };
  }

  const erro = validarEntrada(input);
  if (erro) {
    return { status: 400, mensagem: erro };
  }

  const contexto = montarCalendario(input.estadoSigla!, input.municipioId!);
  const recesso = recessoTribunalEstatico(input.tribunalId!);

  return calcularPrazo(input as CalculoPrazoInput, contexto, recesso);
}

export function isHandlerErro(
  resultado: CalculoPrazoResult | HandlerErro,
): resultado is HandlerErro {
  return 'status' in resultado && resultado.status === 400;
}
