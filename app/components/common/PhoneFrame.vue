<script setup lang="ts">
import type { PlanStage } from '~/api/dashboard';
import type { CoachSheet } from '~/components/coach/sheet';
import { coachStageFor } from '~/utils/stage';

/**
 * 화면 껍데기.
 *
 * 디자인이 390×812 모바일 고정이다. 실제 기기에서는 화면을 꽉 채워야 하므로
 * 폭은 최대값으로만 잡고, 높이는 뷰포트를 따른다.
 *
 * ## 코치 FAB 이 여기 있는 이유
 *
 * 시안은 여정 화면 66곳에 같은 자리로 `FAB/코치` 를 띄운다. 화면마다 붙이면
 * 같은 마크업이 예순 번 복사되고, 자리를 옮길 일이 생기면 예순 곳을 고쳐야
 * 한다. 껍데기가 한 번 세운다.
 *
 * 단계는 경로에서 읽는다(`coachStageFor`). 화면마다 손으로 넘기면 빠뜨린
 * 화면이 생기고, 잘못 적으면 코치가 엉뚱한 루의 자료를 뒤진다. 경로로 알 수
 * 없는 화면(홈·마이)만 `coach-stage` 로 직접 넘긴다.
 *
 * 로그인·회원가입·문진처럼 계획이 아직 없는 화면에는 뜨지 않는다 — 물어볼
 * 단계 자체가 없고, 시안에도 없다.
 */
const {
  // 단계를 모르는 화면(로그인·문진)에서는 FAB 자체가 뜨지 않아야 하므로,
  // 여기서 임의의 루로 채우지 않고 undefined 그대로 둔다.
  coachStage = undefined,
  coachSheets = [],
  fill = false,
  coachAboveFooter = false,
} = defineProps<{
  /** 경로로 알 수 없는 화면이 직접 넘기는 단계. */
  coachStage?: PlanStage;
  /** 화면이 준비해 둔 코치 TIME 문구. 있으면 FAB 이 이것부터 연다. */
  coachSheets?: CoachSheet[];
  /**
   * 높이를 뷰포트에 딱 고정한다(`h-dvh`). 헤더·푸터를 고정하고 가운데만 스크롤하는
   * 화면(StageShell)이 켠다. 기본값(false)은 기존처럼 `min-h-dvh` 라 내용만큼 늘어난다 —
   * 아직 내부 스크롤 영역이 없는 화면이 잘리지 않도록.
   */
  fill?: boolean;
  /** 고정 푸터가 있는 흐름 화면에서 코치 FAB을 CTA 위로 올린다. */
  coachAboveFooter?: boolean;
}>();

/** 화면 안의 다른 버튼(코치 팁 등)도 같은 시트를 열 수 있게 밖으로 뺀다. */
const coachOpen = defineModel<boolean>('coachOpen', { default: false });

const route = useRoute();
const stage = computed(() => coachStage ?? coachStageFor(route.path));
</script>

<template>
  <div
    class="bg-surface max-w-screen rounded-screen mx-auto flex w-full flex-col overflow-hidden"
    :class="fill ? 'h-dvh' : 'min-h-dvh'"
  >
    <slot />

    <CoachDock
      v-if="stage"
      v-model:open="coachOpen"
      :stage="stage"
      :sheets="coachSheets"
      :above-footer="coachAboveFooter"
    />
  </div>
</template>
