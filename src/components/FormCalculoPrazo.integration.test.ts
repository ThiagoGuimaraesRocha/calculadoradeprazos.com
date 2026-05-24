import { flushPromises, mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import FormCalculoPrazo from './FormCalculoPrazo.vue';
import TomSelectCampo from './TomSelectCampo.vue';
import estados from '../../public/data/estados.json';
import municipiosGO from '../../public/data/municipios/GO.json';
import tribunaisGO from '../../public/data/tribunais/GO.json';
import feriadosNacionais from '../../public/data/feriados/nacionais.json';
import feriadosGO from '../../public/data/feriados/estaduais/GO.json';
import feriadosMunicipais from '../../public/data/feriados/municipais.json';
import tribunaisConfig from '../../public/data/tribunais-config.json';

const resultadoApi = {
  dataPublicacao: '2025-03-10',
  dataInicioContagem: '2025-03-11',
  dias: [{ indice: 1, data: '2025-03-11', rotulo: 'terça-feira, 11/03/2025' }],
  avisos: ['Premissa de teste.'],
};

function jsonResponse(data: unknown, ok = true) {
  return Promise.resolve({
    ok,
    json: async () => data,
  } as Response);
}

describe('FormCalculoPrazo (integração)', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn((input: RequestInfo) => {
        const url = String(input);

        if (url.includes('/api/calculo-prazo')) {
          return jsonResponse(resultadoApi);
        }
        if (url.endsWith('/data/estados.json')) return jsonResponse(estados);
        if (url.endsWith('/data/municipios/GO.json')) return jsonResponse(municipiosGO);
        if (url.endsWith('/data/tribunais/GO.json')) return jsonResponse(tribunaisGO);
        if (url.endsWith('/data/feriados/nacionais.json')) return jsonResponse(feriadosNacionais);
        if (url.endsWith('/data/feriados/estaduais/GO.json')) return jsonResponse(feriadosGO);
        if (url.endsWith('/data/feriados/municipais.json')) return jsonResponse(feriadosMunicipais);
        if (url.endsWith('/data/tribunais-config.json')) return jsonResponse(tribunaisConfig);
        if (url.includes('/data/varas/')) {
          return jsonResponse({
            entries: [
              {
                key: 'GO:992:31:0:0',
                varas: [{ id: 992311, vara: '1ª Vara Cível — Goiânia (TJ - GO)' }],
              },
            ],
          });
        }

        return jsonResponse({}, false);
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('lista Aruanã no combo de comarcas ao selecionar GO (CALC-22)', async () => {
    const wrapper = mount(FormCalculoPrazo);
    await flushPromises();
    await wrapper.find('#estado').setValue('GO');
    await flushPromises();

    const municipioCampo = wrapper
      .findAllComponents(TomSelectCampo)
      .find((c) => c.props('id') === 'municipio');
    expect(municipioCampo).toBeDefined();

    const opcoes = municipioCampo!.props('options') as { label: string }[];
    expect(opcoes.length).toBeGreaterThan(100);
    expect(opcoes.some((o) => o.label === 'Aruanã')).toBe(true);
  });

  it('exibe rótulo e ajuda de comarca no combo (CALC-23)', async () => {
    const wrapper = mount(FormCalculoPrazo);
    await flushPromises();
    expect(wrapper.find('label[for="municipio"]').text()).toBe('Comarca (município sede)');
    expect(wrapper.find('#municipio-ajuda').text()).toMatch(/comarca onde o processo tramita/i);
  });

  it('exibe erro de validação ao calcular sem preencher', async () => {
    const wrapper = mount(FormCalculoPrazo);
    await wrapper.find('form').trigger('submit.prevent');
    expect(wrapper.find('[role="alert"]').text()).toMatch(/estado|comarca|publicação/i);
  });

  it('emite calculado ao submeter formulário válido via API', async () => {
    const wrapper = mount(FormCalculoPrazo);
    await flushPromises();

    await wrapper.find('#estado').setValue('GO');
    await flushPromises();

    const tomSelects = () => wrapper.findAllComponents(TomSelectCampo);
    await tomSelects()[0].vm.$emit('update:modelValue', '992');
    await flushPromises();

    await wrapper.find('#materia').setValue('civel');
    await wrapper.find('#processo').setValue('eletronico');

    await tomSelects()[1].vm.$emit('update:modelValue', '31');
    await flushPromises();

    if (tomSelects().length > 2) {
      await tomSelects()[2].vm.$emit('update:modelValue', '992311');
      await flushPromises();
    }
    await wrapper.find('#dataPublicacao').setValue('2025-03-10');
    await wrapper.find('#prazo').setValue('1');

    await wrapper.find('form').trigger('submit.prevent');
    await flushPromises();

    expect(wrapper.emitted('calculado')).toBeTruthy();
    const payload = wrapper.emitted('calculado')?.[0]?.[0] as typeof resultadoApi;
    expect(payload.dataInicioContagem).toBe('2025-03-11');
  });
});
