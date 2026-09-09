<script setup lang="ts">
/**
 * 문항 옆 ⓘ.
 *
 * 이 줄을 왜 묻는지 코치가 답한다. 화면 위 배너 하나로 몰면 어느 줄 얘기인지
 * 알 수 없어서, 묻는 자리마다 제 것을 붙인다(시안 1루 1~3 · 2루 1).
 */
defineEmits<{ click: [] }>();
</script>

<template>
  <button
    type="button"
    class="border-ink-chevron text-ink-label flex size-3.5 shrink-0 items-center justify-center rounded-full border"
    aria-label="이 질문을 왜 묻는지 보기"
    @click="$emit('click')"
  >
    <svg viewBox="0 0 24 24" class="size-2" aria-hidden="true">
      <circle cx="12" cy="6.5" r="2" fill="currentColor" />
      <path
        d="M12 11v7"
        fill="none"
        stroke="currentColor"
        stroke-width="2.5"
        stroke-linecap="round"
      />
    </svg>
  </button>
</template>
