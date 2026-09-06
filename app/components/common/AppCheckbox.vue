<script setup lang="ts">
/**
 * 원형 체크.
 *
 * 약관 동의에서 전체 동의 하나와 개별 항목들이 같은 모양을 쓴다.
 * 체크되면 원이 통째로 브랜드색으로 차고 안쪽에 흰 체크가 남는다.
 */
const model = defineModel<boolean>({ default: false });
</script>

<template>
  <button
    type="button"
    class="flex w-full items-center gap-2.5 text-left"
    :aria-pressed="model"
    @click="model = !model"
  >
    <span
      class="grid size-6 shrink-0 place-items-center rounded-full border-2 transition-colors"
      :class="model ? 'bg-primary border-primary' : 'border-line'"
    >
      <svg
        v-if="model"
        viewBox="0 0 24 24"
        class="size-3.5 text-white"
        fill="none"
        stroke="currentColor"
        stroke-width="3"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <path d="m5 12 5 5L19 8" />
      </svg>
    </span>

    <span class="text-body-strong text-ink-strong flex-1">
      <slot />
    </span>

    <slot name="trailing" />
  </button>
</template>
