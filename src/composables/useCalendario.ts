import { ref } from 'vue';
import type { CalendarioContext, ConjuntoFeriados } from '../domain/types';
import {
  carregarFeriadosEstaduais,
  carregarFeriadosMunicipais,
  carregarFeriadosNacionais,
} from '../services/dadosLocalidade';

const vazio: ConjuntoFeriados = { recorrentes: [], datas: [] };

export function useCalendario() {
  const contexto = ref<CalendarioContext | null>(null);
  const carregando = ref(false);
  const erro = ref<string | null>(null);

  async function montarContexto(estadoSigla: string, municipioId: number) {
    carregando.value = true;
    erro.value = null;
    try {
      const [nacionais, estaduais, municipais] = await Promise.all([
        carregarFeriadosNacionais(),
        carregarFeriadosEstaduais(estadoSigla),
        carregarFeriadosMunicipais(municipioId),
      ]);
      contexto.value = {
        feriadosNacionais: nacionais,
        feriadosEstaduais: estaduais,
        feriadosMunicipais: municipais,
      };
    } catch (e) {
      contexto.value = null;
      erro.value =
        e instanceof Error ? e.message : 'Não foi possível carregar o calendário de feriados.';
    } finally {
      carregando.value = false;
    }
  }

  function limpar() {
    contexto.value = null;
    erro.value = null;
  }

  return { contexto, carregando, erro, montarContexto, limpar, vazio };
}
