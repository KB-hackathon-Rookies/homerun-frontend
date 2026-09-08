<script setup lang="ts">
import type { Base } from '~/components/common/StepIndicator.vue';

/**
 * 야구 단계 띠.
 *
 * 1루·2루·3루·홈을 폭 전체로 깐 줄. `StageBar` 가 상단 바 아래에 달고 쓰다가,
 * 시안 1루 1~3 이 상단 바를 워드마크(`BrandBar`)로 바꾸면서 이 줄만 따로 필요해져
 * 떼어 냈다. 두 곳이 같은 줄을 그리게 두면 한쪽만 어긋난다.
 */
defineProps<{ base: Base }>();
</script>

<template>
  <div class="px-gutter-tight border-line bg-surface flex shrink-0 items-center border-b py-2">
    <StepIndicator :current="base" spread />
  </div>
</template>
