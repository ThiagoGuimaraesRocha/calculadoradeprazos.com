import { describe, expect, it } from 'vitest';
import { calcularPrazo } from '../domain/calcularPrazo';
import { executarCalculoPrazo, isHandlerErro } from './handlerCalculoPrazo';
import { montarCalendario } from './montarCalendario';
import { recessoTribunalEstatico } from './dadosEstaticos';
import type { CalculoPrazoApiPayload } from '../services/dadosLocalidade';

const payloadValido: CalculoPrazoApiPayload = {
  dataPublicacao: '2025-03-10',
  prazoDias: 3,
  contagem: 'uteis',
  estadoSigla: 'GO',
  municipioId: 992,
  tribunalId: 31,
  materia: 'civel',
  processo: 'eletronico',
};

describe('executarCalculoPrazo (API)', () => {
  it('rejeita payload incompleto com 400', () => {
    const r = executarCalculoPrazo({ ...payloadValido, municipioId: 0 });
    expect(isHandlerErro(r)).toBe(true);
    if (isHandlerErro(r)) expect(r.mensagem).toMatch(/comarca/i);
  });

  it('rejeita UF fora do piloto', () => {
    const r = executarCalculoPrazo({ ...payloadValido, estadoSigla: 'SP' });
    expect(isHandlerErro(r)).toBe(true);
  });

  it('paridade com calcularPrazo no domínio (três úteis)', () => {
    const api = executarCalculoPrazo(payloadValido);
    expect(isHandlerErro(api)).toBe(false);
    if (isHandlerErro(api)) return;

    const contexto = montarCalendario('GO', 992);
    const local = calcularPrazo(
      {
        dataPublicacao: payloadValido.dataPublicacao,
        prazoDias: payloadValido.prazoDias,
        contagem: 'uteis',
        estadoSigla: 'GO',
        municipioId: 992,
        tribunalId: 31,
        materia: 'civel',
        processo: 'eletronico',
      },
      contexto,
      recessoTribunalEstatico(31),
    );

    expect(api.dias.map((d) => d.data)).toEqual(local.dias.map((d) => d.data));
  });

  it('paridade: feriado municipal de Goiânia (24/07)', () => {
    const p = { ...payloadValido, dataPublicacao: '2025-07-23', prazoDias: 2 };
    const api = executarCalculoPrazo(p);
    expect(isHandlerErro(api)).toBe(false);
    if (isHandlerErro(api)) return;

    const contexto = montarCalendario('GO', 992);
    const local = calcularPrazo(
      {
        dataPublicacao: p.dataPublicacao,
        prazoDias: 2,
        contagem: 'uteis',
        estadoSigla: 'GO',
        municipioId: 992,
        tribunalId: 31,
        materia: 'civel',
        processo: 'eletronico',
      },
      contexto,
      recessoTribunalEstatico(31),
    );
    expect(api.dias.map((d) => d.data)).toEqual(local.dias.map((d) => d.data));
  });

  it('paridade: início após sexta-feira', () => {
    const p = { ...payloadValido, dataPublicacao: '2025-03-07', prazoDias: 1, contagem: 'corridos' };
    const api = executarCalculoPrazo(p);
    expect(isHandlerErro(api)).toBe(false);
    if (isHandlerErro(api)) return;
    expect(api.dataInicioContagem).toBe('2025-03-10');
  });
});
