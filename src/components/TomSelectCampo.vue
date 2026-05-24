<script setup lang="ts">
defineOptions({ inheritAttrs: false });

import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
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
  }>(),
  {
    disabled: false,
    placeholder: 'Selecione...',
    required: false,
    invalid: false,
  },
);

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

onMounted(() => {
  if (!selectRef.value) return;
  tom = new TomSelect(selectRef.value, {  // Pass the element directly instead of selector string
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
  <div class="campo" :class="[$attrs.class, { 'campo--invalido': invalid }]">
    <label :for="id">{{ label }}</label>
    <select
      :id="id"
      ref="selectRef"
      :disabled="disabled"
      :required="required"
      :aria-invalid="invalid ? 'true' : undefined"
    >
      <option value="">{{ placeholder }}</option>
      <option v-for="opt in options" :key="opt.value" :value="opt.value">
        {{ opt.label }}
      </option>
    </select>
  </div>
</template>
