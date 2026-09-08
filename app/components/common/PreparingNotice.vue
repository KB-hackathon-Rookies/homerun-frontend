<script setup lang="ts">
/**
 * 준비 중 안내 카드(시안 벤치 4 · 1루 7).
 *
 * 아직 열지 못한 경로를 골랐을 때 흐름을 멈추고 한 가지만 말한다. 두 화면이 같은
 * 카드라 여기 한 번만 둔다 — 각자 베껴 두면 한쪽만 어긋난다. 치수는 1루 7 을
 * 따랐다(제목 22/30, 일러스트 130×122). 벤치 4 는 제목이 18 이었지만 같은
 * 물건에 두 규격을 두지 않는다. 130:122 는 호랑이 원본(390×366)과 같은 비율이라
 * 폭만 잡아도 높이가 122 로 떨어진다 — 잘리거나 늘어나지 않는다.
 *
 * 딤과 카드 껍데기는 부르는 쪽이 `DimOverlay placement="center"` 로 감싼다.
 *
 * `열리면 알림 받기` 는 신청을 받아 둘 API 가 아직 없다. 눌린 것을 이 화면
 * 안에서만 기억하고 새로고침하면 사라진다 — 엔드포인트가 생기면 `notified` 를
 * 걷어내고 여기서 부른다.
 */
defineProps<{
  title: string;
  body: string;
  /** 아래에 놓는 텍스트 링크. "전세로 진행하기" · "처음으로 돌아가기" 처럼 빠져나갈 길이다. */
  linkLabel: string;
}>();

defineEmits<{ link: [] }>();

const notified = ref(false);
</script>

<template>
  <!-- 루트를 하나로 묶고 세로 정렬도 여기서 잡는다. 부르는 쪽 레이아웃에 기대지 않는다. -->
  <div class="flex w-full flex-col items-center gap-2.5">
    <img src="/tiger/trouble.png" alt="" width="130" height="122" class="w-notice-art h-auto" />

    <h2 class="text-heading text-ink-card text-center">{{ title }}</h2>
    <p class="text-note-body text-ink-card-body text-center">{{ body }}</p>

    <AppButton variant="strong" :disabled="notified" @click="notified = true">
      {{ notified ? '알림을 신청했어요' : '열리면 알림 받기' }}
    </AppButton>

    <button type="button" class="text-label2 text-ink-label" @click="$emit('link')">
      {{ linkLabel }}
    </button>
  </div>
</template>
