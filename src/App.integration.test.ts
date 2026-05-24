import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import App from './App.vue';
import { APP_VERSION } from './config/version';

describe('App (integração — rodapé CALC-25)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('exibe versão real no rodapé no formato vX.Y.Z', () => {
    const wrapper = mount(App, {
      global: {
        stubs: {
          FormCalculoPrazo: true,
          ResultadoPrazo: true,
        },
      },
    });

    const versao = wrapper.find('.app-version');
    expect(versao.exists()).toBe(true);
    expect(versao.text()).toBe(`Versão v${APP_VERSION}`);
  });

  it('mantém contador de acessos junto à versão no rodapé', () => {
    const wrapper = mount(App, {
      global: {
        stubs: {
          FormCalculoPrazo: true,
          ResultadoPrazo: true,
        },
      },
    });

    expect(wrapper.find('.site-footer-meta').exists()).toBe(true);
    expect(wrapper.find('.counter').text()).toMatch(/Acessos:\s*\d+/);
  });
});
