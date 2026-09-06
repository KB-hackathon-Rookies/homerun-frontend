<script setup lang="ts">
/**
 * OB-1 오픈뱅킹 안내.
 *
 * 무엇을 가져가는지 먼저 밝히고 동의를 받는다. 자산과 소득 두 가지뿐이고,
 * 조회 목적으로만 쓴다는 것을 화면에서 말한다.
 */
definePageMeta({ middleware: 'auth' });

interface Info {
  title: string;
  lines: string[];
}

const INFOS: Info[] = [
  { title: '자산 자동 조회', lines: ['은행별 예금·적금 잔액', '순자산 자동 계산'] },
  {
    title: '월 소득 자동 판정',
    lines: ['최근 3개월 급여성 입금 내역 분석', '판정 결과 사용자 확인 후 저장'],
  },
];

const NOTICES = ['개인정보는 조회 목적으로만 사용해요', '언제든 마이페이지에서 연동 해제할 수 있어요'];
</script>

<template>
  <PhoneFrame>
    <div class="h-statusbar shrink-0" />
    <PageBar title="오픈뱅킹 연동" />

    <div class="px-gutter-tight flex flex-1 flex-col gap-5 py-6">
      <div class="flex flex-col gap-2">
        <h2 class="text-title2 text-ink-hero whitespace-pre-line">
          {{ '자산·소득을\n자동으로 채워드릴게요' }}
        </h2>
        <p class="text-body3 text-ink-hero-body">입력 시간이 3분 → 30초로 줄어들어요</p>
      </div>

      <AppCard v-for="info in INFOS" :key="info.title" class="flex flex-col gap-2 p-3.5">
        <span class="text-numeric text-ink-hero">{{ info.title }}</span>
        <ul class="text-caption2 text-ink-hero-body">
          <li v-for="line in info.lines" :key="line">· {{ line }}</li>
        </ul>
      </AppCard>

      <div class="bg-canvas rounded-field p-3.5">
        <ul class="text-micro text-ink-hero-body">
          <li v-for="notice in NOTICES" :key="notice">· {{ notice }}</li>
        </ul>
      </div>
    </div>

    <footer class="px-gutter-tight flex shrink-0 py-2.5">
      <AppButton variant="deep" @click="navigateTo('/openbanking/terms')">
        약관 동의하고 시작하기
      </AppButton>
    </footer>
  </PhoneFrame>
</template>
