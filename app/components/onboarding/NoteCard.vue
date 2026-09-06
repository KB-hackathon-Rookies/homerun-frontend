<script setup lang="ts">
/**
 * 온보딩 하단의 한 줄 안내.
 *
 * 앞 세 단계는 "무엇을 근거로 판단하는지"를 밝히는 문장이라 브랜드색이고,
 * 마지막 단계만 응원 문구라 초록이다. 근거를 밝히는 자리라 톤을 구분한다.
 */
const { tone = 'primary' } = defineProps<{ tone?: 'primary' | 'success' }>();
</script>

<template>
  <div class="border-line-card rounded-button flex items-center gap-4 border px-5 py-3">
    <span class="grid size-avatar shrink-0 place-items-center">
      <AppIcon
        :name="tone === 'success' ? 'bell' : 'shield'"
        class="size-6"
        :class="tone === 'success' ? 'text-warning-soft' : 'text-primary-strong'"
      />
    </span>
    <p class="text-caption1" :class="tone === 'success' ? 'text-success' : 'text-primary'">
      <slot />
    </p>
  </div>
</template>
