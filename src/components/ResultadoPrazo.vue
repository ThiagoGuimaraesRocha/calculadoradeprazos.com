<script setup lang="ts">
import type { CalculoPrazoResult } from '../domain/types';

defineProps<{
  resultado: CalculoPrazoResult | null;
}>();
</script>

<template>
  <section class="result" aria-labelledby="resultado-titulo">
    <h2 id="resultado-titulo">Resultado</h2>

    <p v-if="!resultado" class="result-empty">
      Nenhum cálculo realizado ainda. Preencha os campos e clique em Calcular.
    </p>

    <template v-else>
      <p class="result-meta">
        <strong>Início da contagem:</strong>
        {{ resultado.dataInicioContagem.split('-').reverse().join('/') }}
        (primeiro dia útil após a publicação)
      </p>

      <ul class="result-list" aria-live="polite">
        <li v-for="dia in resultado.dias" :key="dia.data">
          Dia {{ dia.indice }}: {{ dia.rotulo }}
        </li>
      </ul>

      <ul class="result-avisos" aria-label="Premissas do cálculo">
        <li v-for="(aviso, i) in resultado.avisos" :key="i">{{ aviso }}</li>
      </ul>
    </template>
  </section>
</template>
