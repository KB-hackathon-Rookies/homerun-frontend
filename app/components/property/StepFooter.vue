<script setup lang="ts">
/**
 * 2루 화면의 하단 CTA 줄.
 *
 * 시안은 2루 본 화면마다 하단을 `이전` + 다음 두 칸으로 둔다(116px : 232px,
 * 그래서 1 : 2 로 나눈다). 코드에는 상단 셰브론뿐이었는데, 셰브론은 손가락이
 * 닿는 자리가 아니다 — 다음으로 가는 버튼 옆에 되돌아갈 버튼이 있어야 한 손으로
 * 오간다.
 *
 * `이전` 은 화면이 정한다. 브라우저 기록을 되감으면 방금 저장한 단계로 돌아가
 * 버리는 자리가 있어서, StageBar 와 같은 곳을 가리키게 화면이 넘긴다.
 */
const { disabled = false } = defineProps<{ disabled?: boolean }>();

defineEmits<{ back: []; next: [] }>();
</script>

<template>
  <footer class="px-gutter-tight flex shrink-0 flex-col gap-2 pt-2.5 pb-cta-pad">
    <!-- 버튼 위에 붙는 안내·오류. 없으면 자리도 안 잡는다. -->
    <slot name="notice" />

    <div class="grid grid-cols-3 gap-2">
      <AppButton variant="white" @click="$emit('back')">이전</AppButton>

      <div class="col-span-2">
        <AppButton variant="strong" :disabled="disabled" @click="$emit('next')">
          <slot />
        </AppButton>
      </div>
    </div>
  </footer>
</template>
