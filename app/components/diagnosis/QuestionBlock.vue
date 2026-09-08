<script setup lang="ts">
/**
 * 문진 문항 한 칸(시안 1루 1~3 의 `Card`).
 *
 * 한 화면에 문항이 여럿이라 문항마다 제 카드를 갖는다. 제목 줄 오른쪽의 ⓘ 를
 * 누르면 그 문항을 왜 묻는지 코치가 답한다 — 예전처럼 화면 위 배너 하나로 몰면
 * 어느 문항 얘기인지 알 수 없다.
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

defineEmits<{ info: [] }>();
</script>

<template>
  <section
    class="rounded-field flex w-full flex-col gap-2 border p-3"
    :class="follow ? 'bg-surface-brand border-line-follow' : 'bg-surface border-line'"
  >
    <p v-if="hint" class="text-chip text-primary-strong font-medium">↳ {{ hint }}</p>

    <div class="flex w-full items-center gap-1.5">
      <h2 class="text-numeric text-ink-card flex-1">{{ question }}</h2>

      <InfoDot @click="$emit('info')" />
    </div>

    <slot />
  </section>
</template>
