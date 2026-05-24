<script setup lang="ts">
import { ref } from 'vue';
import FormCalculoPrazo from './components/FormCalculoPrazo.vue';
import ResultadoPrazo from './components/ResultadoPrazo.vue';
import { APP_VERSION } from './config/version';
import type { CalculoPrazoResult } from './domain/types';

const versaoExibida = `v${APP_VERSION}`;

const resultado = ref<CalculoPrazoResult | null>(null);

function onCalculado(value: CalculoPrazoResult) {
  resultado.value = value;
}

function atualizarContador() {
  const chave = 'visitas';
  const atual = Number(localStorage.getItem(chave) ?? '0');
  localStorage.setItem(chave, String(atual + 1));
  const el = document.getElementById('contador');
  if (el) el.textContent = String(atual + 1);
}

atualizarContador();
</script>

<template>
  <header>
    <h1>Calculadora de Prazos</h1>
  </header>

  <main class="container">
    <p class="intro">
      Calculadora de prazos processuais em fase piloto para <strong>Goiás</strong> e
      <strong>Tocantins</strong>. Considera feriados nacionais, estaduais e municipais da comarca
      selecionada (município sede),
      tipo de contagem (úteis ou corridos) e recesso forense do tribunal. Não substitui conferência
      por profissional habilitado.
    </p>

    <FormCalculoPrazo @calculado="onCalculado" />
    <ResultadoPrazo :resultado="resultado" />
  </main>

  <footer class="site-footer">
    <div class="site-footer-meta">
      <p class="app-version">Versão {{ versaoExibida }}</p>
      <p class="counter">Acessos: <span id="contador">0</span></p>
    </div>
  </footer>
</template>
