<script setup lang="ts">
import type { PlanStage } from '~/api/dashboard';
import type { CoachSheet } from '~/components/coach/sheet';
import type { Base } from '~/components/common/StepIndicator.vue';

/**
 * 여정(1·2·3루·홈) 화면의 고정 껍데기.
 *
 * 위(StageBar: 마이·홈 + 진행바)와 아래(footer 슬롯: 이전·다음)를 고정하고 **가운데
 * 본문만 스크롤**한다. 높이는 뷰포트에 딱 맞춰(PhoneFrame `fill`) 화면마다 같다.
 *
 * 화면은 본문을 기본 슬롯에, 하단 버튼을 `#footer` 슬롯에 넣기만 하면 된다 — 스크롤·
 * 높이·헤더는 여기가 책임진다. 화면마다 베껴 두면 어느 한 곳만 어긋난다.
 */
defineProps<{
  title: string;
  base: Base;
  /** 경로로 알 수 없는 화면이 코치 FAB 에 넘기는 단계. */
  coachStage?: PlanStage;
  /** 화면이 준비해 둔 코치 TIME 문구. */
  coachSheets?: CoachSheet[];
}>();

defineEmits<{ back: [] }>();

const coachOpen = defineModel<boolean>('coachOpen', { default: false });
</script>

<template>
  <PhoneFrame
    fill
    :coach-stage="coachStage"
    :coach-sheets="coachSheets"
    v-model:coach-open="coachOpen"
  >
    <StageBar :title="title" :base="base" @back="$emit('back')" />

    <!-- 가운데만 스크롤한다. flex 자식이 넘칠 수 있게 min-h-0 이 필요하다. -->
    <main class="min-h-0 flex-1 overflow-y-auto">
      <slot />
    </main>

    <!-- 하단 버튼. 화면이 넘긴 footer(자체 padding·shrink-0)를 그대로 고정한다. -->
    <slot name="footer" />
  </PhoneFrame>
</template>
