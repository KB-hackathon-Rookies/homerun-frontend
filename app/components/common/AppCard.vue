<script setup lang="ts">
/**
 * 테두리 카드.
 *
 * 온보딩의 판정 목록, 완료 화면의 안내 상자가 같은 모양이다. 피그마에 반경이
 * 12 와 14 두 가지로 나온다.
 */
const { radius = 'field' } = defineProps<{
  radius?: 'field' | 'button';
}>();
</script>

<template>
  <div
    class="bg-surface border-line border p-4"
    :class="radius === 'button' ? 'rounded-button' : 'rounded-field'"
  >
    <slot />
  </div>
</template>
