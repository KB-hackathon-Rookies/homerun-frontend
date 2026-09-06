<script setup lang="ts">
/**
 * 네모 체크 한 줄.
 *
 * 3루 곳곳의 체크리스트가 같은 모양이다. **저장하지 않는다** — 창구에서
 * 물어봤는지 스스로 짚어 보라고 두는 것이지 서버로 갈 값이 아니다.
 */
const model = defineModel<boolean>({ default: false });
</script>

<template>
  <button
    type="button"
    class="bg-surface border-line rounded-chip flex items-center gap-2.5 border px-3.5 py-3 text-left"
    :aria-pressed="model"
    @click="model = !model"
  >
    <span
      class="grid size-5 shrink-0 place-items-center rounded border transition-colors"
      :class="model ? 'bg-primary border-primary' : 'border-line'"
    >
      <AppIcon v-if="model" name="check" class="size-3 text-white" />
    </span>
    <span class="text-label2 text-ink-hero flex-1"><slot /></span>
  </button>
</template>
