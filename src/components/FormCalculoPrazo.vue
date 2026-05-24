<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import TomSelectCampo from './TomSelectCampo.vue';
import {
  calcularPrazo,
  CONTAGEM_OPCOES,
  MATERIA_OPCOES,
  materiaLegacyId,
  PROCESSO_OPCOES,
  processoLegacyId,
  validarEntrada,
} from '../domain/calcularPrazo';
import { calcularPrazoViaApi } from '../services/calculoPrazoApi';
import type { CalculoPrazoInput, CalculoPrazoResult, Estado, Municipio, Tribunal, Vara } from '../domain/types';
import { useCalendario } from '../composables/useCalendario';
import {
  carregarEstados,
  carregarMunicipios,
  carregarRecessoTribunal,
  carregarTribunais,
  carregarVaras,
} from '../services/dadosLocalidade';

const emit = defineEmits<{
  calculado: [resultado: CalculoPrazoResult];
  erro: [mensagem: string];
}>();

const estados = ref<Estado[]>([]);
const municipios = ref<Municipio[]>([]);
const tribunais = ref<Tribunal[]>([]);
const varas = ref<Vara[]>([]);

const estadoSigla = ref('');
const municipioId = ref('');
const tribunalId = ref('');
const varaId = ref('');
const materia = ref<CalculoPrazoInput['materia'] | ''>('');
const processo = ref<CalculoPrazoInput['processo'] | ''>('');
const dataPublicacao = ref('');
const prazoDias = ref<number | ''>('');
const contagem = ref<CalculoPrazoInput['contagem']>('uteis');

const carregandoMunicipios = ref(false);
const carregandoTribunais = ref(false);
const carregandoVaras = ref(false);
const erroFormulario = ref('');
const camposInvalidos = ref<Record<string, boolean>>({});

const { contexto, montarContexto, erro: erroCalendario } = useCalendario();

const mostrarVara = computed(() => varas.value.length > 0);

const opcoesMunicipios = computed(() =>
  municipios.value.map((m) => ({ value: String(m.id), label: m.nome })),
);
const opcoesTribunais = computed(() =>
  tribunais.value.map((t) => ({ value: String(t.id), label: t.nome })),
);
const opcoesVaras = computed(() =>
  varas.value.map((v) => ({ value: String(v.id), label: v.vara })),
);

async function init() {
  try {
    estados.value = await carregarEstados();
  } catch {
    emit('erro', 'Não foi possível carregar os estados do piloto (GO e TO).');
  }
}

init();

watch(estadoSigla, async (sigla) => {
  municipioId.value = '';
  tribunalId.value = '';
  varaId.value = '';
  municipios.value = [];
  tribunais.value = [];
  varas.value = [];

  if (!sigla) return;

  carregandoMunicipios.value = true;
  carregandoTribunais.value = true;
  try {
    const [m, t] = await Promise.all([carregarMunicipios(sigla), carregarTribunais(sigla)]);
    municipios.value = m;
    tribunais.value = t;
  } catch {
    emit('erro', 'Erro ao carregar municípios ou tribunais.');
  } finally {
    carregandoMunicipios.value = false;
    carregandoTribunais.value = false;
  }
});

watch(municipioId, async (id) => {
  tribunalId.value = '';
  varaId.value = '';
  varas.value = [];
  if (!id || !estadoSigla.value) return;
  await montarContexto(estadoSigla.value, Number(id));
});

watch([municipioId, tribunalId, materia, processo], async () => {
  varaId.value = '';
  varas.value = [];
  if (!municipioId.value || !tribunalId.value || !materia.value || !processo.value || !estadoSigla.value) {
    return;
  }
  carregandoVaras.value = true;
  try {
    varas.value = await carregarVaras({
      estadoSigla: estadoSigla.value,
      municipioId: Number(municipioId.value),
      tribunalId: Number(tribunalId.value),
      materiaLegacyId: materiaLegacyId(materia.value as CalculoPrazoInput['materia']),
      processoLegacyId: processoLegacyId(processo.value as CalculoPrazoInput['processo']),
    });
  } finally {
    carregandoVaras.value = false;
  }
});

function limparErro() {
  erroFormulario.value = '';
  camposInvalidos.value = {};
}

async function onCalcular() {
  limparErro();

  const input: Partial<CalculoPrazoInput> = {
    dataPublicacao: dataPublicacao.value,
    prazoDias: prazoDias.value === '' ? undefined : Number(prazoDias.value),
    contagem: contagem.value,
    estadoSigla: estadoSigla.value,
    municipioId: municipioId.value ? Number(municipioId.value) : undefined,
    tribunalId: tribunalId.value ? Number(tribunalId.value) : undefined,
    materia: materia.value || undefined,
    processo: processo.value || undefined,
    varaId: varaId.value ? Number(varaId.value) : undefined,
  };

  const erro = validarEntrada(input);
  if (erro) {
    erroFormulario.value = erro;
    camposInvalidos.value = {
      estado: !estadoSigla.value,
      municipio: !municipioId.value,
      tribunal: !tribunalId.value,
      materia: !materia.value,
      processo: !processo.value,
      data: !dataPublicacao.value,
      prazo: !input.prazoDias,
    };
    emit('erro', erro);
    return;
  }

  if (!contexto.value) {
    erroFormulario.value = erroCalendario.value ?? 'Calendário de feriados não carregado para o município.';
    emit('erro', erroFormulario.value);
    return;
  }

  if (mostrarVara.value && !varaId.value) {
    erroFormulario.value = 'Selecione a vara ou unidade judiciária.';
    camposInvalidos.value = { vara: true };
    emit('erro', erroFormulario.value);
    return;
  }

  const entrada = input as CalculoPrazoInput;

  try {
    const resultado = await calcularPrazoViaApi(entrada);
    emit('calculado', resultado);
    return;
  } catch {
    /* API indisponível (ex.: preview só Vite) — cálculo local com os mesmos dados */
  }

  const recesso = await carregarRecessoTribunal(Number(tribunalId.value));
  const resultado = calcularPrazo(entrada, contexto.value, recesso);
  emit('calculado', resultado);
}
</script>

<template>
  <form class="form-grid" @submit.prevent="onCalcular">
    <div class="campo" :class="{ 'campo--invalido': camposInvalidos.estado }">
      <label for="estado">Estado</label>
      <select
        id="estado"
        v-model="estadoSigla"
        required
        :aria-invalid="camposInvalidos.estado ? 'true' : undefined"
        @change="limparErro"
      >
        <option value="">Selecione...</option>
        <option v-for="e in estados" :key="e.sigla" :value="e.sigla">{{ e.nome }}</option>
      </select>
    </div>

    <TomSelectCampo
      id="municipio"
      label="Município"
      v-model="municipioId"
      :options="opcoesMunicipios"
      :disabled="!estadoSigla || carregandoMunicipios"
      :placeholder="carregandoMunicipios ? 'Carregando...' : 'Selecione...'"
      :invalid="!!camposInvalidos.municipio"
      required
      @update:model-value="limparErro"
    />

    <div class="campo" :class="{ 'campo--invalido': camposInvalidos.materia }">
      <label for="materia">Matéria</label>
      <select
        id="materia"
        v-model="materia"
        required
        :aria-invalid="camposInvalidos.materia ? 'true' : undefined"
        @change="limparErro"
      >
        <option value="">Selecione...</option>
        <option v-for="m in MATERIA_OPCOES" :key="m.value" :value="m.value">{{ m.label }}</option>
      </select>
    </div>

    <div class="campo" :class="{ 'campo--invalido': camposInvalidos.processo }">
      <label for="processo">Processo</label>
      <select
        id="processo"
        v-model="processo"
        required
        :aria-invalid="camposInvalidos.processo ? 'true' : undefined"
        @change="limparErro"
      >
        <option value="">Selecione...</option>
        <option v-for="p in PROCESSO_OPCOES" :key="p.value" :value="p.value">{{ p.label }}</option>
      </select>
    </div>

    <TomSelectCampo
      id="tribunal"
      class="span-full"
      label="Tribunal"
      v-model="tribunalId"
      :options="opcoesTribunais"
      :disabled="!municipioId || carregandoTribunais"
      :placeholder="carregandoTribunais ? 'Carregando...' : 'Selecione...'"
      :invalid="!!camposInvalidos.tribunal"
      required
      @update:model-value="limparErro"
    />

    <TomSelectCampo
      v-if="mostrarVara"
      id="vara"
      class="span-full"
      label="Vara / Unidade Judiciária"
      v-model="varaId"
      :options="opcoesVaras"
      :disabled="carregandoVaras"
      :placeholder="carregandoVaras ? 'Carregando...' : 'Selecione...'"
      :invalid="!!camposInvalidos.vara"
      required
      @update:model-value="limparErro"
    />

    <div class="campo span-full" :class="{ 'campo--invalido': camposInvalidos.data }">
      <label for="dataPublicacao">Data da publicação</label>
      <input
        id="dataPublicacao"
        v-model="dataPublicacao"
        type="date"
        required
        :aria-invalid="camposInvalidos.data ? 'true' : undefined"
        @input="limparErro"
      />
    </div>

    <div class="campo" :class="{ 'campo--invalido': camposInvalidos.prazo }">
      <label for="prazo">Prazo (dias)</label>
      <input
        id="prazo"
        v-model.number="prazoDias"
        type="number"
        min="1"
        max="365"
        placeholder="Ex. 15"
        required
        :aria-invalid="camposInvalidos.prazo ? 'true' : undefined"
        @input="limparErro"
      />
    </div>

    <div class="campo">
      <label for="contagem">Contagem</label>
      <select id="contagem" v-model="contagem">
        <option v-for="c in CONTAGEM_OPCOES" :key="c.value" :value="c.value">{{ c.label }}</option>
      </select>
    </div>

    <div class="span-full">
      <button type="submit" class="btn-submit">Calcular</button>
      <p class="observacao">
        A contagem do prazo inicia-se no primeiro dia útil após a data da publicação. Piloto: Goiás e
        Tocantins. Feriados nacionais, estaduais e municipais do município selecionado; recesso
        forense conforme o tribunal.
      </p>
      <p v-if="erroFormulario" class="form-error" role="alert">{{ erroFormulario }}</p>
    </div>
  </form>
</template>
