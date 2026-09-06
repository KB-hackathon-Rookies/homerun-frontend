<script setup lang="ts">
/**
 * 알약 선택.
 *
 * 답이 둘뿐이라 목록 대신 나란히 놓는다. 고른 쪽만 채운다.
 */
export interface PillOption {
  value: string;
  label: string;
}

defineProps<{ options: PillOption[] }>();

const model = defineModel<string | null>({ default: null });
</script>

<template>
  <div class="flex flex-wrap items-center gap-x-2">
    <button
      v-for="option in options"
      :key="option.value"
      type="button"
      class="rounded-pill h-pill flex items-center px-5 transition-colors"
      :class="
        model === option.value
          ? 'bg-primary-strong text-numeric text-white'
          : 'bg-surface border-line text-numeric text-ink-hero border font-medium'
      "
      :aria-pressed="model === option.value"
      @click="model = option.value"
    >
      {{ option.label }}
    </button>
  </div>
</template>
