<script setup lang="ts">
/**
 * 문진 문항 한 칸(시안 1루 1~3 의 `Card`).
 *
 * 한 화면에 문항이 여럿이다. 문항마다 ⓘ 를 따로 달아 코치 시트를 열던 자리였는데,
 * 오른쪽 아래 FAB 가 같은 화면의 코치 TIME 을 이미 열어 준다 — 문항마다 하나씩
 * 붙이면 같은 문을 여섯 번 그리는 셈이라 걷어냈다.
 *
 * 앞 답에 따라 이어지는 문항은 `follow` 로 둔다. 파란 바탕과 `↳` 한 줄로 "앞의
 * 답 때문에 나타났다"는 것을 보인다. 안 그러면 없던 질문이 갑자기 생긴 것처럼 보인다.
 */
defineProps<{
  question: string;
  /** 이어지는 문항인가. 파란 카드로 그린다. */
  follow?: boolean;
  /** `follow` 일 때 맨 윗줄에 붙는 `↳` 안내. */
  hint?: string;
}>();
</script>

<template>
  <section
    class="rounded-field flex w-full flex-col gap-2 border p-3"
    :class="follow ? 'bg-surface-brand border-line-follow' : 'bg-surface border-line'"
  >
    <p v-if="hint" class="text-chip text-primary-strong font-medium">↳ {{ hint }}</p>

    <h2 class="text-numeric text-ink-card">{{ question }}</h2>

    <slot />
  </section>
</template>
