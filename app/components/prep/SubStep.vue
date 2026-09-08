<script setup lang="ts">
/**
 * 문진 진행 표시.
 *
 * 상단 바 아래에 단계 이름을 폭 전체로 나눠 깐다. 1루·2루 진행 표시(`StepIndicator`)와
 * 다른 물건이다 — 저건 서비스 전체의 야구 단계고, 이건 한 화면 안에서 몇 번째 질문인지다.
 * 이음선 없이 원과 이름만 있고, 지나온 단계는 번호 대신 체크로 바뀐다.
 *
 * | 상태 | 원 | 글자 |
 * |---|---|---|
 * | 지나온 단계 | 회색 채움 + 회색 테두리 | ✓, 진한 회색 |
 * | 지금 단계 | 흰 바탕 + 파란 테두리 | 번호, 파랑 |
 * | 남은 단계 | 흰 바탕 + 옅은 테두리 | 번호, 흐린 회색 |
 *
 * 단계 수는 화면이 정한다. 독립 준비는 처음 독립하는 사람에게 보증금을 묻지 않아
 * 답에 따라 셋이 둘로 줄어든다.
 */
defineProps<{
  /** 단계 이름. 순서대로. */
  steps: readonly string[];
  /** 지금 몇 번째인가. 0 부터. */
  current: number;
}>();
</script>

<template>
  <ol class="flex w-full items-start">
    <li
      v-for="(label, index) in steps"
      :key="label"
      class="flex flex-1 flex-col items-center gap-1"
      :aria-current="index === current ? 'step' : undefined"
    >
      <span
        class="text-substep flex size-5.5 items-center justify-center rounded-full border-hairline"
        :class="
          index < current
            ? 'bg-track border-line-step text-ink-card-body'
            : index === current
              ? 'bg-surface border-primary-strong text-primary-strong'
              : 'bg-surface border-track text-ink-chevron'
        "
      >
        {{ index < current ? '✓' : index + 1 }}
      </span>
      <span
        class="text-substep text-center"
        :class="
          index < current
            ? 'text-ink-card-body'
            : index === current
              ? 'text-primary-strong'
              : 'text-ink-chevron'
        "
      >
        {{ label }}
      </span>
    </li>
  </ol>
</template>
