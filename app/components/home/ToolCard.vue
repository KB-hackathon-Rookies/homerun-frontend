<script setup lang="ts">
/**
 * 독립 도구 카드.
 *
 * 단계와 상관없이 언제든 열어 보는 것들이다. 아직 화면이 없는 도구는
 * 자리만 두고 눌리지 않게 한다.
 */
defineProps<{ label: string; to: string | null }>();
</script>

<template>
  <button
    type="button"
    class="bg-surface border-line rounded-field border text-caption-tight text-ink-hero flex flex-1 items-center justify-center px-2.5 py-4 font-semibold disabled:opacity-40"
    :disabled="!to"
    @click="navigateTo(to!)"
  >
    {{ label }}
  </button>
</template>
