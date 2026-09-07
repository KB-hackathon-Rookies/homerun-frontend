<script setup lang="ts">
/**
 * 3루 1 · 임장.
 *
 * 집을 보러 가기 전에 여는 화면이다. 체크는 저장하지 않는다 — 현장에서
 * 스스로 짚어 보라고 두는 것이다.
 *
 * 중개사에게 전할 세 가지를 위에 두는 이유가 있다. **집을 보고 나서
 * 말하면 늦다** — 전세대출 협조가 안 되는 집이면 아무리 마음에 들어도
 * 못 간다.
 */
definePageMeta({ middleware: 'auth' });

const route = useRoute();
const planId = Number(route.params.planId);

const CHECKS = [
  '수압·배수 (샤워/싱크대/변기 동시 테스트)',
  '곰팡이·누수 (창가·현관 도배흔적 확인)',
  '단열·방음 (이중창 여부·실리콘 상태)',
  '채광·환기 (남향, 앞건물 가림)',
  '관리비 (인터넷/수도/전기 별도 여부)',
  '옵션 상태 (에어컨 곰팡이·목록 특약 반영)',
  '안전 (CCTV·방범창·도어락)',
];

const checked = ref<Record<string, boolean>>({});
</script>

<template>
  <PhoneFrame>
    <StageBar title="부동산 방문" base="3루" @back="navigateTo(`/property/${planId}`)" />

    <div class="px-gutter-tight flex flex-1 flex-col gap-3 py-4">
      <CoachTip>
        부동산 방문 전 임장 리스트를 꼭 확인해. 공인중개사에게 원하는 정보를 모두 전달해야 해
      </CoachTip>

      <h2 class="text-body3 text-ink-hero font-bold">공인중개사에게 전달할 것</h2>

      <div class="bg-surface-brand rounded-chip flex flex-col gap-1 p-3">
        <p class="text-caption2 text-ink-hero-body">· 받고자 하는 대출상품 (청년 버팀목대출)</p>
        <p class="text-caption2 text-ink-hero-body">· 예산 (보증금 한도)</p>
        <p class="text-caption2 text-ink-hero-body">· 전세대출 협조 여부 (질권설정/채권양도)</p>
      </div>

      <h2 class="text-body3 text-ink-hero font-bold">임장 체크리스트</h2>

      <CheckItem v-for="item in CHECKS" :key="item" v-model="checked[item]">{{ item }}</CheckItem>

      <DetailLink @open="navigateTo(`/contract/${planId}/visit-detail`)">
        공인중개사 대본·체크 7가지 상세보기
      </DetailLink>
    </div>

    <footer class="px-gutter-tight flex shrink-0 pt-2.5 pb-cta-pad">
      <AppButton variant="strong" @click="navigateTo(`/contract/${planId}/sign`)">
        계약 단계로
      </AppButton>
    </footer>
  </PhoneFrame>
</template>
