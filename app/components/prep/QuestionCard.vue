<script setup lang="ts">
/**
 * 문진 질문 카드.
 *
 * 질문 하나와 그 아래 답할 것들. 세 단계가 같은 껍데기를 쓰고 안쪽만 다르다.
 */
defineProps<{ question: string }>();
</script>

<template>
  <div class="bg-surface border-line rounded-field flex flex-col gap-3 border p-4">
    <h2 class="text-question text-ink-title whitespace-pre-line">{{ question }}</h2>
    <slot />
  </div>
</template>
