import type { CalculoPrazoInput, CalculoPrazoResult } from '../domain/types';
import { endpointCalculoPrazo, type CalculoPrazoApiPayload } from './dadosLocalidade';

export function inputParaPayload(input: CalculoPrazoInput): CalculoPrazoApiPayload {
  return {
    dataPublicacao: input.dataPublicacao,
    prazoDias: input.prazoDias,
    contagem: input.contagem,
    estadoSigla: input.estadoSigla,
    municipioId: input.municipioId,
    tribunalId: input.tribunalId,
    materia: input.materia,
    processo: input.processo,
    varaId: input.varaId,
  };
}

export async function calcularPrazoViaApi(
  input: CalculoPrazoInput,
): Promise<CalculoPrazoResult> {
  const response = await fetch(endpointCalculoPrazo(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(inputParaPayload(input)),
  });

  const data = (await response.json()) as CalculoPrazoResult | { erro: string };

  if (!response.ok) {
    const mensagem = 'erro' in data ? data.erro : 'Erro ao calcular o prazo.';
    throw new Error(mensagem);
  }

  return data as CalculoPrazoResult;
}
