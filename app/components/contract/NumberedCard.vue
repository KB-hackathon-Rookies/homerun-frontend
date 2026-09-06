<script setup lang="ts">
/**
 * 번호가 붙은 설명 카드.
 *
 * 순서가 뜻을 갖는 자리에만 쓴다 — 임장은 이 순서로 봐야 빠뜨리지 않고,
 * 특약은 번호가 곧 계약서에 적는 조항 번호다.
 */
defineProps<{ index: number; title: string }>();
</script>

<template>
  <AppCard class="flex flex-col gap-2">
    <div class="flex items-center gap-2">
      <span
        class="bg-primary-strong text-micro grid size-5.5 shrink-0 place-items-center rounded-full font-bold text-white"
        aria-hidden="true"
      >
        {{ index }}
      </span>
      <span class="text-body3 text-ink-hero flex-1 font-semibold">{{ title }}</span>
    </div>
    <slot />
  </AppCard>
</template>
