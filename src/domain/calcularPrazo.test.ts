import { describe, expect, it } from 'vitest';
import { calcularPrazo, validarEntrada } from './calcularPrazo';
import type { CalendarioContext, CalculoPrazoInput } from './types';

const contextoVazio: CalendarioContext = {
  feriadosNacionais: { recorrentes: [], datas: [] },
  feriadosEstaduais: { recorrentes: [], datas: [] },
  feriadosMunicipais: { recorrentes: [], datas: [] },
};

const base: CalculoPrazoInput = {
  dataPublicacao: '2025-03-10',
  prazoDias: 3,
  contagem: 'uteis',
  estadoSigla: 'GO',
  municipioId: 992,
  tribunalId: 31,
  materia: 'civel',
  processo: 'eletronico',
};

describe('validarEntrada', () => {
  it('exige comarca com mensagem orientada ao usuário (CALC-23)', () => {
    const erro = validarEntrada({ ...base, municipioId: undefined });
    expect(erro).toBe('Selecione a comarca.');
  });
});

describe('calcularPrazo', () => {
  it('inicia no primeiro dia útil após a publicação (segunda após sexta)', () => {
    const result = calcularPrazo(
      { ...base, dataPublicacao: '2025-03-07', prazoDias: 1, contagem: 'corridos' },
      contextoVazio,
      null,
    );
    expect(result.dataInicioContagem).toBe('2025-03-10');
    expect(result.dias).toHaveLength(1);
  });

  it('conta três dias úteis sem feriados', () => {
    const result = calcularPrazo(base, contextoVazio, null);
    expect(result.dias.map((d) => d.data)).toEqual([
      '2025-03-11',
      '2025-03-12',
      '2025-03-13',
    ]);
  });

  it('pula feriado nacional na contagem útil', () => {
    const contexto: CalendarioContext = {
      ...contextoVazio,
      feriadosNacionais: {
        recorrentes: [],
        datas: [{ data: '2025-03-12', nome: 'Teste' }],
      },
    };
    const result = calcularPrazo(base, contexto, null);
    expect(result.dias.map((d) => d.data)).toEqual([
      '2025-03-11',
      '2025-03-13',
      '2025-03-14',
    ]);
  });
});
