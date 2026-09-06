<script setup lang="ts">
/**
 * 네모 체크 한 줄.
 *
 * 3루 곳곳의 체크리스트가 같은 모양이다. **저장하지 않는다** — 창구에서
 * 물어봤는지 스스로 짚어 보라고 두는 것이지 서버로 갈 값이 아니다.
 *
 * 배경이 둘이다. 본 화면에서는 카드 위에 홀로 놓여 테두리로 서고(`outlined`),
 * 상세 화면에서는 카드 **안에** 여럿이 들어가 옅은 면으로 구분한다(`filled`).
 *
 * 부제는 `note` 슬롯으로 붙인다 — "근로복지공단에서 본인 발급 가능" 처럼
 * 누가 떼 주는지를 적는 자리다.
 */
const { tone = 'outlined' } = defineProps<{ tone?: 'outlined' | 'filled' }>();

const model = defineModel<boolean>({ default: false });

const slots = useSlots();
</script>

<template>
  <button
    type="button"
    class="rounded-chip flex items-center gap-2.5 text-left"
    :class="
      tone === 'filled' ? 'bg-surface-info p-2.5' : 'bg-surface border-line border px-3.5 py-3'
    "
    :aria-pressed="model"
    @click="model = !model"
  >
    <span
      class="grid size-5 shrink-0 place-items-center rounded border transition-colors"
      :class="model ? 'bg-primary border-primary' : 'border-line'"
    >
      <AppIcon v-if="model" name="check" class="size-3 text-white" />
    </span>

    <span class="flex-1">
      <span
        class="block"
        :class="tone === 'filled' ? 'text-caption2 font-semibold' : 'text-label2'"
      >
        <slot />
      </span>
      <span v-if="slots.note" class="text-micro text-ink-muted block"><slot name="note" /></span>
    </span>
  </button>
</template>
