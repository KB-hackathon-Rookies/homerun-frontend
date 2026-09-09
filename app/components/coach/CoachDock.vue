<script setup lang="ts">
import type { PlanStage } from '~/api/dashboard';
import type { CoachSheet } from '~/components/coach/sheet';

/**
 * 코치 자리.
 *
 * FAB 하나와 그 위로 올라오는 두 시트(준비된 코치 TIME · 직접 묻기)를 묶는다.
 * `PhoneFrame` 이 이것 하나만 세우면 화면마다 같은 자리에 같은 버튼이 뜬다.
 *
 * 화면이 준비해 둔 코치 문구가 있으면 그것부터 연다. 없는 화면에서는 바로
 * 채팅으로 간다 — 누른 사람에게 아무 말도 없이 빈 시트를 보이지 않는다.
 *
 * 여는 상태를 밖에서도 잡을 수 있게 열어 둔다(`v-model:open`). 1루 화면들은
 * 위쪽 코치 팁을 눌러도 같은 시트가 열려야 하는데, 시트가 둘로 갈리면 문구를
 * 고칠 자리가 둘이 된다.
 */
const {
  stage,
  sheets = [],
  aboveFooter = false,
} = defineProps<{
  stage: PlanStage;
  sheets?: CoachSheet[];
  /** 고정 CTA와 겹치지 않도록 FAB을 푸터 위로 올린다. */
  aboveFooter?: boolean | 'compact';
}>();

const open = defineModel<boolean>('open', { default: false });

/** 열 때마다 처음 화면으로 되돌린다. 지난번에 채팅에서 닫았다고 채팅부터 열지 않는다. */
const view = ref<'sheet' | 'chat'>('sheet');

watch(open, (opened) => {
  if (opened) view.value = sheets.length ? 'sheet' : 'chat';
});
</script>

<template>
  <CoachFab :above-footer="aboveFooter" @open="open = true" />

  <CoachTimeSheet
    v-if="open && view === 'sheet'"
    :sheets="sheets"
    @chat="view = 'chat'"
    @close="open = false"
  />

  <CoachChat v-else-if="open" :stage="stage" @close="open = false" />
</template>
