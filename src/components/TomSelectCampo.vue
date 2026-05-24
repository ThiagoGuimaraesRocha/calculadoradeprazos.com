<script setup lang="ts">
defineOptions({ inheritAttrs: false });

import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import TomSelect from 'tom-select';
import 'tom-select/dist/css/tom-select.css';

export type OpcaoSelect = {
  value: string;
  label: string;
};

const props = withDefaults(
  defineProps<{
    id: string;
    label: string;
    modelValue: string;
    options: OpcaoSelect[];
    disabled?: boolean;
    placeholder?: string;
    required?: boolean;
    invalid?: boolean;
    hint?: string;
  }>(),
  {
    disabled: false,
    placeholder: 'Selecione...',
    required: false,
    invalid: false,
    hint: '',
  },
);

const hintId = computed(() => (props.hint ? `${props.id}-ajuda` : undefined));

const emit = defineEmits<{
  'update:modelValue': [value: string];
}>();

const selectRef = ref<HTMLSelectElement | null>(null);
let tom: TomSelect | null = null;

function syncOptions() {
  if (!tom) return;
  tom.clearOptions();
  tom.addOption({ value: '', text: props.placeholder });
  for (const opt of props.options) {
    tom.addOption({ value: opt.value, text: opt.label });
  }
  tom.refreshOptions(false);
  if (props.modelValue) {
    tom.setValue(props.modelValue, true);
  } else {
    tom.clear(true);
  }
}

onMounted(async () => {
  await nextTick();
  if (!selectRef.value) return;
  // Tom-select types divergem do HTMLSelectElement do DOM; runtime aceita o elemento.
  tom = new TomSelect(selectRef.value as unknown as string, {
    allowEmptyOption: true,
    placeholder: props.placeholder,
    onChange(value: string) {
      emit('update:modelValue', value ?? '');
    },
  });
  syncOptions();
  if (props.disabled) tom.disable();
});

watch(
  () => props.options,
  () => syncOptions(),
  { deep: true },
);

watch(
  () => props.modelValue,
  (value) => {
    if (tom && tom.getValue() !== value) {
      tom.setValue(value, true);
    }
  },
);

watch(
  () => props.disabled,
  (disabled) => {
    if (!tom) return;
    if (disabled) tom.disable();
    else tom.enable();
  },
);

onBeforeUnmount(() => {
  tom?.destroy();
  tom = null;
});
</script>

<template>
  <div class="campo campo-tomselect" :class="[$attrs.class, { 'campo--invalido': invalid }]">
    <label :for="id">{{ label }}</label>
    <select
      :id="id"
      ref="selectRef"
      :disabled="disabled"
      :required="required"
      :aria-invalid="invalid ? 'true' : undefined"
      :aria-describedby="hintId"
    >
      <option value="">{{ placeholder }}</option>
      <option v-for="opt in options" :key="opt.value" :value="opt.value">
        {{ opt.label }}
      </option>
    </select>
    <p v-if="hint" :id="hintId" class="campo-ajuda">{{ hint }}</p>
  </div>
</template>
